import { test, expect } from '@playwright/test';

test.describe('하나투어 계정 페이지 테스트', () => {
  test('정상 로그인 테스트', async ({ page }) => {
    // 하나투어 계정 페이지에 접속한다.
    await page.goto('https://accounts.hanatour.com');

    // Remove readonly attribute to enter text in the field
    await page.locator('#input01').evaluate((el) => el.removeAttribute('readonly'));

    // '아이디(이메일계정)' 필드에 'llda@naver.com'을 입력한다.
    await page.getByRole('textbox', { name: '아이디(이메일계정)' }).fill('llda@naver.com');

    // 비밀번호 필드에 'suho1004!@'를 입력한다.
    await page.getByRole('textbox', { name: '비밀번호' }).fill('suho1004!@');

    // '로그인' 버튼을 클릭한다.
    const loginButton = await page.getByRole('button', { name: '로그인' });
    await loginButton.scrollIntoViewIfNeeded();
    await loginButton.click();

    // Verify successful login by checking for the presence of a logout button or user dashboard
    await expect(page.locator('#logout-button')).toBeVisible();
  });
});
