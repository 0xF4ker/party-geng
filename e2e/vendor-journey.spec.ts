import { test, expect } from "@playwright/test";

test.describe("Vendor Journey E2E Test Suite", () => {
  
  test("Vendor Onboarding & KYB Verification Wizard", async ({ page }) => {
    // 1. Login with a newly registered (un-onboarded) vendor account
    await page.goto("/login");
    await page.fill('input[placeholder="Enter email or username"]', "new-vendor@partygeng.com");
    await page.fill('input[placeholder="Enter your password"]', "password123");
    await page.click("button#login-submit-btn");
    
    // Welcome back toast
    await expect(page.locator("text=Welcome back!")).toBeVisible();
    
    // 2. Redirected to /onboarding because isOnboarded = false
    await page.waitForURL("**/onboarding");
    await expect(page.locator("text=Welcome to PartyGeng!")).toBeVisible();
    
    // Confirm Username and select role (if not auto-selected, click Vendor card)
    await page.click("text=Vendor");
    await page.click("button:has-text('Complete Setup')");
    
    // Account setup complete toast and redirect to /dashboard
    await expect(page.locator("text=Account setup complete!")).toBeVisible();
    
    // Wait for redirect to dashboard
    await page.waitForURL("**/dashboard");
    
    // 3. Render KYB wizard because kybStatus = PENDING
    await expect(page.locator("text=Setup Profile")).toBeVisible();
    
    // Fill Step 1 profile details
    await page.fill('input[placeholder="e.g. Ace Catering Services"]', "Playwright Test Catering");
    await page.fill('textarea[placeholder="Enter your full office address..."]', "123 Test Street, Lagos Nigeria");
    await page.fill('textarea[placeholder="Tell us briefly about what you do..."]', "Providing high quality food services for weddings and corporate gatherings.");
    await page.click("button:has-text('Next Step')");
    
    // Progression to Step 2
    await expect(page.locator("text=Business Verification")).toBeVisible();
    
    // Fill Step 2 KYB verification details
    await page.fill('input[placeholder="RC-123456"]', "RC-998877");
    await page.fill('input[placeholder="Your legal name"]', "Onboarding Tester");
    await page.click("button:has-text('Submit Verification')");
    
    // Successful submission toast and clock screen redirect
    await expect(page.locator("text=Verification in Progress")).toBeVisible();
    await expect(page.locator("text=We are currently verifying your business details")).toBeVisible();
  });

  test("Active Vendor Dashboard & Settings Management", async ({ page }) => {
    // 1. Login with an onboarded, verified (APPROVED kybStatus) vendor account
    await page.goto("/login");
    await page.fill('input[placeholder="Enter email or username"]', "active-vendor@partygeng.com");
    await page.fill('input[placeholder="Enter your password"]', "password123");
    await page.click("button#login-submit-btn");
    
    // Welcome back toast
    await expect(page.locator("text=Welcome back!")).toBeVisible();
    
    // Redirect to dashboard
    await page.waitForURL("**/dashboard");
    await expect(page.locator("text=Welcome back!")).toBeVisible();
    
    // 2. Dashboard metrics visibility
    await expect(page.locator("text=Total Earnings")).toBeVisible();
    await expect(page.locator("text=Pending Quotes")).toBeVisible();
    await expect(page.locator("text=Active Orders")).toBeVisible();
    
    // 3. Settings updates: Public Profile
    await page.goto("/settings");
    await expect(page.locator("text=Public Profile")).toBeVisible();
    
    // Change Professional Title
    await page.fill('input[placeholder="Professional Wedding & Event DJ"]', "Supreme Gastronomy Expert");
    await page.click("button:has-text('Save Profile')");
    await expect(page.locator("text=Profile updated")).toBeVisible();
    
    // 4. Settings updates: Services
    await page.click('button:has-text("My Services")');
    await expect(page.locator("text=Select the services you offer to clients.")).toBeVisible();
    
    // Check if service boxes exist and check first checkbox
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    if (await firstCheckbox.count() > 0) {
      await firstCheckbox.check();
      await page.click('button:has-text("Save Services")');
      await expect(page.locator("text=Services updated successfully!")).toBeVisible();
    }
  });
  
});
