// เทสต์หน้าหลังบ้านของพนักงาน (admin.html)
const { test, expect } = require('@playwright/test');
const { preparePage, expectNoPageErrors } = require('./helpers');

test.describe('admin.html (ระบบหลังบ้าน)', () => {
  test('แสดงฟอร์มเข้าสู่ระบบ', async ({ page }) => {
    const errors = await preparePage(page);
    await page.goto('/admin.html');

    await expect(page).toHaveTitle(/Sai Lan Hotel/);
    await expect(page.locator('#login-form')).toBeVisible();
    await expect(page.locator('#staff-name')).toBeVisible();
    await expect(page.locator('#staff-key')).toBeVisible();
    await expect(page.locator('#app-view')).toBeHidden();

    expectNoPageErrors(errors);
  });

  test('กดเข้าสู่ระบบโดยไม่กรอกข้อมูล จะเตือนให้กรอก', async ({ page }) => {
    const errors = await preparePage(page);
    await page.goto('/admin.html');
    await page.locator('#login-btn').click();

    await expect(page.locator('#login-error')).toContainText('กรอกชื่อพนักงานและรหัสพนักงาน');
    expectNoPageErrors(errors);
  });

  test('รหัสพนักงานผิด (API ตอบ 403) จะแจ้งและไม่เข้าระบบ', async ({ page }) => {
    let staffKeyHeader;
    const errors = await preparePage(page, {
      api: (route) => {
        staffKeyHeader = route.request().headers()['x-staff-key'];
        return route.fulfill({ status: 403, contentType: 'application/json', body: '{"success":false}' });
      },
    });
    await page.goto('/admin.html');
    await page.locator('#staff-name').fill('ทดสอบ');
    await page.locator('#staff-key').fill('wrong-key');
    await page.locator('#login-btn').click();

    await expect(page.locator('#login-error')).toContainText('รหัสพนักงานไม่ถูกต้อง');
    await expect(page.locator('#app-view')).toBeHidden();
    expect(staffKeyHeader).toBe('wrong-key'); // ส่งรหัสไปทาง header X-Staff-Key
    expectNoPageErrors(errors);
  });
});
