// เทสต์หน้าจองของแขก (index.html)
const { test, expect } = require('@playwright/test');
const { preparePage, expectNoPageErrors } = require('./helpers');

test.describe('index.html (หน้าจองห้องพัก)', () => {
  test('โหมด preview แสดงชื่อโรงแรมและรายการห้องพัก', async ({ page }) => {
    const errors = await preparePage(page);
    await page.goto('/index.html?preview=1');

    await expect(page).toHaveTitle(/Sai Lan Hotel/);
    await expect(page.locator('#hotel-name')).toBeVisible();
    await expect(page.locator('#search-form')).toBeVisible();
    await expect(page.locator('#preview-badge')).toBeVisible();
    // ข้อมูลห้องในโหมด preview มาจาก previewHotelApi() ในหน้าเอง
    await expect(page.locator('#room-list article.room').first()).toBeVisible();
    await expect(page.locator('#room-list')).toHaveAttribute('aria-busy', 'false');

    expectNoPageErrors(errors);
  });

  test('รูปตัวอย่าง (demo-images.js) แสดงในแกลเลอรีและการ์ดห้องพักทุกห้อง', async ({ page }) => {
    const errors = await preparePage(page);
    // ไม่โหลดรูปจริงจาก Unsplash ในเทสต์ ตอบเป็น PNG 1x1 แทน
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    await page.route('https://images.unsplash.com/**', (route) => route.fulfill({ contentType: 'image/png', body: png }));
    await page.goto('/index.html?preview=1');

    await expect(page.locator('#room-list')).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('#gallery .g-item img')).toHaveCount(5);
    await expect(page.locator('#gallery .ph')).toHaveCount(0);
    const rooms = page.locator('#room-list article.room');
    const n = await rooms.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      await expect(rooms.nth(i).locator('.room-media img').first()).toHaveAttribute('src', /images\.unsplash\.com/);
    }

    expectNoPageErrors(errors);
  });

  test('โหมด preview: เลือกห้องแล้วใส่โค้ดส่วนลดที่หน้า checkout ได้', async ({ page }) => {
    const errors = await preparePage(page);
    await page.goto('/index.html?preview=1');

    const selectBtn = page.locator('#room-list [data-select]:not([disabled])').first();
    await selectBtn.click();
    await expect(page.locator('#booking-form')).toBeVisible();

    // WELCOME10 เป็นโค้ดตัวอย่างใน previewHotelApi()
    await page.locator('#co-promo').fill('welcome10');
    await page.locator('#co-promo-btn').click();
    await expect(page.locator('#co-promo-status')).toBeVisible();
    await expect(page.locator('#co-promo-status')).toContainText('WELCOME10');

    expectNoPageErrors(errors);
  });

  test('ถ้าระบบหลังบ้าน (n8n) ล่ม หน้าเว็บแจ้งข้อผิดพลาดแทนที่จะพัง', async ({ page }) => {
    const errors = await preparePage(page); // API ตอบ 503 เป็นค่าเริ่มต้น
    await page.goto('/index.html');

    await expect(page.locator('#hotel-name')).toBeVisible();
    await expect(page.locator('#room-list')).toContainText(/ไม่สำเร็จ|เชื่อมต่อระบบจองไม่ได้|ไม่พบระบบ/);

    expectNoPageErrors(errors);
  });

  test('แชทบอท "ถามน้องใส": ส่งคำถามไปที่ /chat และแสดงคำตอบ', async ({ page }) => {
    let asked = null;
    const errors = await preparePage(page, {
      api: (route) => {
        if (/\/webhook\/chat/.test(route.request().url())) {
          asked = route.request().postDataJSON();
          return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ answer: 'เช็กอินได้ตั้งแต่ 14:00 น. ค่ะ', handoff: false }) });
        }
        return route.fulfill({ status: 503, contentType: 'application/json', body: '{"success":false}' });
      },
    });
    await page.goto('/index.html');

    await page.locator('#chat-fab').click();
    await expect(page.locator('#chat-panel')).toBeVisible();
    await page.locator('#chat-input').fill('เช็กอินกี่โมง');
    await page.locator('#chat-send').click();

    await expect(page.locator('#chat-log')).toContainText('เช็กอินได้ตั้งแต่ 14:00 น. ค่ะ');
    expect(JSON.stringify(asked)).toContain('เช็กอินกี่โมง');

    expectNoPageErrors(errors);
  });
});
