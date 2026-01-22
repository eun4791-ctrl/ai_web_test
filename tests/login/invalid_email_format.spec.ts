import { test, expect } from '@playwright/test';

test.describe('하나투어 계정 페이지 테스트', () => {
  test('잘못된 형식의 아이디 입력 테스트', async ({ page }) => {
    // 하나투어 계정 페이지에 접속한다.
    await page.goto('https://accounts.hanatour.com');

    // '아이디(이메일계정)' 필드에 'invalid-email'을 입력한다.
    await page.getByText('아이디(이메일계정)').click();
    await page.getByRole('textbox', { name: '아이디를 입력해 주세요' }).fill('invalid-email');

    // 비밀번호 필드에 'examplepassword'를 입력한다.
    await page.getByRole('textbox', { name: '비밀번호' }).fill('examplepassword');

    // '로그인' 버튼을 클릭한다.
    await page.getByRole('button', { name: '로그인' }).click();

    // 사용자는 이메일 형식 오류 메시지를 받는다.
    await expect(page.getByText('아이디를 이메일 형식에 맞게 입력해 주세요.(ex. hana@hanatour.com)')).toBeVisible();
  });
});
