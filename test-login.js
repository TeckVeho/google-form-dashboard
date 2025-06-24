const { chromium } = require('playwright');

async function testLogin() {
  console.log('Starting login test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  try {
    // ログインページに移動
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // ページタイトルを確認
    const title = await page.title();
    console.log('Page title:', title);
    
    // ログインフォームを確認
    const emailInput = await page.locator('input[type="email"]');
    const passwordInput = await page.locator('input[type="password"]');
    const loginButton = await page.locator('button[type="submit"]');
    
    console.log('Login form elements found');
    
    // フォームに入力
    console.log('Filling login form...');
    await emailInput.fill('admin@test.com');
    await passwordInput.fill('testpassword123');
    
    // ログインボタンをクリック
    console.log('Clicking login button...');
    await loginButton.click();
    
    // ローディング状態を待機
    await page.waitForTimeout(2000);
    
    // 現在のURLを確認
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // メインページに遷移したかチェック
    if (currentUrl === 'http://localhost:3000/') {
      console.log('✅ Login successful - redirected to main page');
    } else {
      console.log('❌ Login failed - still on:', currentUrl);
      
      // エラーメッセージをチェック
      const errorAlert = await page.locator('[role="alert"]').first();
      if (await errorAlert.isVisible()) {
        const errorText = await errorAlert.textContent();
        console.log('Error message:', errorText);
      }
    }
    
    // コンソールログを確認
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
    });
    
    // 追加で5秒待機してページの変化を確認
    await page.waitForTimeout(5000);
    
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testLogin();