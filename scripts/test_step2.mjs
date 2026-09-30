import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = 'C:/Users/LENOVO/.gemini/antigravity-ide/brain/635da3f9-8907-42d3-b660-1a48d4ec0a69/screenshots';

async function runStep2() {
  console.log('🚀 Starting Step 2: Project Creation Test (Unhappy & Happy)...');
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
    // 1. Login as Admin
    console.log(`Navigating to ${BASE_URL}/auth/signin...`);
    await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'networkidle' });

    const keyInput = page.locator('input').first();
    const passInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await keyInput.fill('admin@slr.local');
    await passInput.fill('SLR-Admin-Local-2026!');
    await submitBtn.click();
    await page.waitForURL('**/admin**', { timeout: 10000 });
    console.log('✅ Admin logged in successfully.');

    // 2. Navigate to /admin/projects
    console.log('Navigating to /admin/projects...');
    await page.goto(`${BASE_URL}/admin/projects`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05_admin_projects_list.png` });
    console.log('📸 Captured 05_admin_projects_list.png');

    // 3. Open Create Project Modal
    console.log('Clicking "Create New Project"...');
    const createBtn = page.locator('button:has-text("Create New Project")');
    await createBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06_create_project_modal.png` });
    console.log('📸 Captured 06_create_project_modal.png');

    // 4. Unhappy Case: Submit Empty Form
    console.log('Testing Unhappy Case: Submit empty project modal...');
    const saveBtn = page.locator('button:has-text("Tạo dự án"), button:has-text("Save"), button:has-text("Lưu"), button:has-text("Create")').last();
    await saveBtn.click();
    await page.waitForTimeout(500);

    const titleErrorVisible = await page.locator('text=Vui lòng nhập tiêu đề').isVisible();
    const domainErrorVisible = await page.locator('text=Vui lòng nhập lĩnh vực').isVisible();
    console.log(`Validation errors visible -> Title Error: ${titleErrorVisible}, Domain Error: ${domainErrorVisible}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07_project_validation_errors.png` });

    // 5. Happy Case: Fill valid project data
    console.log('Testing Happy Case: Filling valid project details...');
    const titleInput = page.locator('input[name="title"]');
    const domainInput = page.locator('input[name="domain"]');
    const descTextarea = page.locator('textarea[name="description"]');

    const testProjectTitle = `Automated SLR Test ${Date.now().toString().slice(-4)}`;
    await titleInput.fill(testProjectTitle);
    await domainInput.fill('Computer Science / Software Engineering');
    await descTextarea.fill('An automated end-to-end SLR review project for code testing and verification.');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/08_project_form_filled.png` });
    await saveBtn.click();

    // Wait for project modal to close and list to reload
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/09_project_created_list.png` });
    console.log('📸 Captured 09_project_created_list.png');

    // Check if the created project appears in the table
    const projectRow = page.locator(`text=${testProjectTitle}`).first();
    const isProjectInList = await projectRow.isVisible();
    console.log(`✅ Project "${testProjectTitle}" visible in list: ${isProjectInList}`);

    // Check errors so far
    console.log('\n--- Summary Logs for Step 2 ---');
    console.log('Console Errors:', logs.consoleErrors.length);
    console.log('Page Errors:', logs.pageErrors.length);
    console.log('Failed Requests:', logs.failedRequests);

    if (logs.pageErrors.length > 0) {
      throw new Error(`Step 2 encountered page errors: ${logs.pageErrors.join(', ')}`);
    }

    console.log('🎉 Step 2 PASSED!');
    return { success: true, projectTitle: testProjectTitle, logs };
  } catch (err) {
    console.error('❌ Step 2 FAILED:', err.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02_error.png` });
    return { success: false, error: err.message, logs };
  } finally {
    await browser.close();
  }
}

runStep2().then(res => {
  if (!res.success) {
    process.exit(1);
  }
});
