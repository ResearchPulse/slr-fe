import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = 'C:/Users/LENOVO/.gemini/antigravity-ide/brain/635da3f9-8907-42d3-b660-1a48d4ec0a69/screenshots';

async function runStep1() {
  console.log('🚀 Starting Step 1: Admin Login Test (Unhappy & Happy)...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
  };

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Browser Console Error:', msg.text());
      logs.consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('💥 Page Uncaught Error:', err.message);
    logs.pageErrors.push(err.message);
  });

  page.on('response', res => {
    if (res.status() >= 400) {
      console.log(`⚠️ Network ${res.status()} on ${res.url()}`);
      logs.failedRequests.push({ url: res.url(), status: res.status() });
    }
  });

  try {
    // 1. Navigate to Signin
    console.log(`Navigating to ${BASE_URL}/auth/signin...`);
    await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01_signin_page.png` });
    console.log('📸 Captured 01_signin_page.png');

    // 2. Unhappy Case 1: Empty submit
    console.log('Testing Unhappy Case 1: Submit empty form...');
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await page.waitForTimeout(500);
    const keyLoginError = await page.locator('text=Username or email is required').isVisible();
    const passwordError = await page.locator('text=Password is required').isVisible();
    console.log(`Validation checks visible -> KeyLogin: ${keyLoginError}, Password: ${passwordError}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02_empty_submit_validation.png` });

    // 3. Unhappy Case 2: Invalid credentials
    console.log('Testing Unhappy Case 2: Invalid credentials...');
    const keyInput = page.locator('input').first();
    const passInput = page.locator('input[type="password"]');
    
    await keyInput.fill('invalid_user_999@test.local');
    await passInput.fill('WrongPassword123!');
    await submitBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03_invalid_login.png` });
    console.log('📸 Captured 03_invalid_login.png');

    // 4. Happy Case: Valid Admin login
    console.log('Testing Happy Case: Admin login (admin@slr.local)...');
    await keyInput.fill('admin@slr.local');
    await passInput.fill('SLR-Admin-Local-2026!');
    await submitBtn.click();

    // Wait for URL change
    await page.waitForURL('**/admin**', { timeout: 10000 });
    console.log('✅ Successfully redirected to Admin area! Current URL:', page.url());
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04_admin_dashboard.png` });
    console.log('📸 Captured 04_admin_dashboard.png');

    // Verify Admin elements
    const pageText = await page.textContent('body');
    console.log('Page content contains "Admin":', pageText.includes('Admin') || pageText.includes('admin'));

    // Check errors so far
    console.log('\n--- Summary Logs for Step 1 ---');
    console.log('Console Errors:', logs.consoleErrors.length);
    console.log('Page Errors:', logs.pageErrors.length);
    console.log('Failed Requests:', logs.failedRequests);

    if (logs.pageErrors.length > 0) {
      throw new Error(`Step 1 encountered page errors: ${logs.pageErrors.join(', ')}`);
    }

    console.log('🎉 Step 1 PASSED without uncaught errors!');
    return { success: true, url: page.url(), logs };
  } catch (err) {
    console.error('❌ Step 1 FAILED:', err.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01_error.png` });
    return { success: false, error: err.message, logs };
  } finally {
    await browser.close();
  }
}

runStep1().then(res => {
  if (!res.success) {
    process.exit(1);
  }
});
