const fs = require('node:fs');
const https = require('node:https');

const env = fs.readFileSync('.env', 'utf8');
const key = env.match(/^GEMINI_API_KEY=(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '');
const model = env.match(/^GEMINI_MODEL=(.*)$/m)?.[1]?.trim() || 'gemini-3.8-flash';

if (!key) {
  console.log('Missing API key in .env');
  process.exit(1);
}

const body = JSON.stringify({
  contents: [{ role: 'user', parts: [{ text: 'Reply with OK' }] }]
});

const req = https.request({
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
  method: 'POST',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  },
  ALPNProtocols: ['http/1.1']
}, res => {
  let data = '';
  res.setEncoding('utf8');
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTTP status:', res.statusCode);
    console.log('Response:', data.slice(0, 1000));
  });
});

req.on('timeout', () => req.destroy(new Error('Request timed out')));
req.on('error', err => console.log('Request failed:', err.message));
req.end(body);
