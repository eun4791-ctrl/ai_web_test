import { test, expect } from '@playwright/test';

test.describe('하나투어 계정 페이지 테스트', () => {
  test('정상 로그인 테스트', async ({ page }) => {
    // 하나투어 계정 페이지에 접속한다.
    await page.goto('https://accounts.hanatour.com');

    // 아이디(이메일계정) 필드를 활성화한다.
    await page.getByRole('textbox', { name: '아이디(이메일계정)' }).click();

    // '아이디(이메일계정)' 필드에 'hana@hanatour.com'을 입력한다.
    await page.getByRole('textbox', { name: '아이디를 입력해 주세요' }).fill('hana@hanatour.com');

    // 비밀번호 필드에 'examplepassword'를 입력한다.
    await page.getByRole('textbox', { name: '비밀번호' }).fill('examplepassword');

    // '로그인' 버튼을 클릭한다.
    await page.getByRole('button', { name: '로그인' }).click();

    // 사용자는 성공적으로 시스템에 로그인한다.
    // Expect statement should be added here for verifying successful login
  });
});
