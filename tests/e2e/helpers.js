// ตัวช่วยกลางของเทสต์หน้าเว็บ: ตัดการเชื่อมต่อภายนอกที่ไม่จำเป็น และเก็บ error ของหน้า
const { expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const NODE_MODULES = path.join(__dirname, '..', '..', 'node_modules');

/**
 * ไลบรารีจาก cdn.jsdelivr.net (three, @tailwindcss/browser) ให้เสิร์ฟจาก node_modules แทน
 * เพื่อให้เทสต์ไม่พังเพราะ CDN ช้า/ล่ม เวอร์ชันใน package.json ต้องตรงกับใน HTML
 * ถ้าเวอร์ชันไม่ตรงหรือไม่มีไฟล์ จะโหลดจาก CDN จริงตามปกติ
 */
async function serveCdnFromNodeModules(route) {
  const m = new URL(route.request().url()).pathname.match(/^\/npm\/((?:@[^/]+\/)?[^@/]+)@([^/]+)(\/.*)?$/);
  if (m) {
    const [, pkg, version, subpath] = m;
    try {
      const pkgDir = path.join(NODE_MODULES, pkg);
      const meta = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
      if (meta.version === version) {
        const file = path.join(pkgDir, subpath && subpath !== '/' ? subpath : (meta.main || 'index.js'));
        return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(file) });
      }
    } catch { /* ไม่มีใน node_modules → ใช้ CDN จริง */ }
  }
  return route.continue();
}

// LIFF SDK ปลอม: จำลองว่าเปิดในเบราว์เซอร์ทั่วไปและยังไม่ได้ล็อกอิน LINE (สถานะ guest)
const FAKE_LIFF = `window.liff = {
  init: () => Promise.resolve(),
  isInClient: () => false,
  isLoggedIn: () => false,
  login: () => {}, logout: () => {}, closeWindow: () => {},
  getProfile: () => Promise.reject(new Error('not logged in')),
  getFriendship: () => Promise.resolve({ friendFlag: false }),
  getIDToken: () => null, getDecodedIDToken: () => null,
};`;

/**
 * เตรียมหน้า: ปลอม LIFF, ตัดฟอนต์ภายนอก, และให้ n8n API (ngrok) ตอบตาม handler ที่ส่งมา
 * คืนค่า array ของ error ที่เกิดในหน้า เพื่อใช้ตรวจตอนจบเทสต์
 */
async function preparePage(page, { api } = {}) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}\n${err.stack}`));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    // error จากการที่เราตั้งใจตัด network ไม่นับเป็นบั๊ก
    if (/Failed to load resource|net::ERR_/.test(text)) return;
    errors.push(`console.error: ${text}`);
  });

  await page.route('https://static.line-scdn.net/**', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: FAKE_LIFF }));
  await page.route('https://cdn.jsdelivr.net/npm/**', serveCdnFromNodeModules);
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, (route) => route.abort());
  await page.route(/\/webhook\//, (route) =>
    api ? api(route) : route.fulfill({ status: 503, contentType: 'application/json', body: '{"success":false}' }));
  return errors;
}

function expectNoPageErrors(errors) {
  expect(errors, 'หน้าเว็บมี JavaScript error').toEqual([]);
}

module.exports = { preparePage, expectNoPageErrors };
