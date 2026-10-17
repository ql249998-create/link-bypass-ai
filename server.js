// LINK BYPASS AI API — Node.js 20+
// Chạy: npm install express
//       node server.js
// API: POST /resolve  body: {"url":"https://short.example/abc"}
// Trả về: {"url":"https://destination.example/"} 
// Lưu ý: dùng HTTPS khi deploy; giới hạn tốc độ trước khi đưa lên public.
const express = require('express');
const dns = require('node:dns/promises');
const net = require('node:net');

const app = express();
app.use(express.json({limit: '4kb'}));

function isPrivateIp(ip) {
  // Reject loopback, private, link-local, unspecified, multicast and common metadata ranges.
  if (net.isIPv4(ip)) {
    const p = ip.split('.').map(Number);
    return p[0] === 0 || p[0] === 10 || p[0] === 127 ||
      (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168) || p[0] >= 224;
  }
  if (net.isIPv6(ip)) {
    const x = ip.toLowerCase();
    return x === '::' || x === '::1' || x.startsWith('fc') || x.startsWith('fd') ||
      x.startsWith('fe8') || x.startsWith('fe9') || x.startsWith('fea') ||
      x.startsWith('feb') || x.startsWith('::ffff:127.') || x.startsWith('::ffff:10.');
  }
  return true;
}
async function assertPublicHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    throw new Error('Địa chỉ nội bộ không được phép.');
  }
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error('IP nội bộ không được phép.');
    return;
  }
  const records = await dns.lookup(host, {all: true, verbatim: true});
  if (!records.length || records.some(r => isPrivateIp(r.address))) {
    throw new Error('Tên miền trỏ tới IP không công khai hoặc không hợp lệ.');
  }
}
function checkUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { throw new Error('URL không hợp lệ.'); }
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Chỉ chấp nhận HTTP/HTTPS.');
  if (u.username || u.password) throw new Error('URL chứa thông tin đăng nhập không được phép.');
  return u;
}
app.post('/resolve', async (req, res) => {
  try {
    let current = checkUrl(String(req.body?.url || ''));
    for (let hop = 0; hop < 8; hop++) {
      await assertPublicHost(current.hostname);
      // Manual redirect handling lets us validate every next destination.
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      let response;
      try {
        response = await fetch(current.href, {
          method: 'HEAD', redirect: 'manual', signal: controller.signal,
          headers: {'user-agent': 'LinkBypassAI/1.0'}
        });
      } finally { clearTimeout(timeout); }
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) break;
        current = checkUrl(new URL(location, current).href);
        continue;
      }
      // Some hosts reject HEAD; do not download arbitrary page bodies.
      return res.json({url: current.href, hops: hop, note: 'Resolved as far as HEAD redirects allow.'});
    }
    return res.json({url: current.href, note: 'Redirect limit reached or no further redirect.'});
  } catch (err) {
    return res.status(400).json({error: err.name === 'AbortError' ? 'Website phản hồi quá lâu.' : (err.message || 'Không xử lý được link.')});
  }
});
app.get('/', (_req, res) => res.type('text').send('LINK BYPASS AI API is running.'));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Resolver API listening on ${port}`));
