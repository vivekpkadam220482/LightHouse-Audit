/**
 * Disclaimer Handler Utility
 * Handles consent and cookie disclaimers that appear when accessing URLs
 * 
 * This utility automatically detects and handles common disclaimer popups:
 * 1. Consent disclaimers - clicks "I am a Healthcare Professional" or similar
 * 2. Cookie disclaimers - clicks "Ok", "Accept", "Accept All", etc.
 * 
 * To add custom selectors for specific websites, add them to the respective arrays:
 * - consentSelectors: for healthcare/consent related buttons
 * - cookieSelectors: for cookie/consent related buttons
 * 
 * Example custom selectors:
 * - 'button:has-text("Custom Button Text")'
 * - '[data-testid="custom-button"]'
 * - '.custom-class button'
 * - '#custom-id'
 */

/**
 * Handle consent and cookie disclaimers on a page
 * @param {import('playwright').Page} page - Playwright page object
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 */
async function handleDisclaimers(page, timeout = 10000) {
  console.log('🔍 Checking for disclaimers...');
  
  try {
    // Wait for page to load and check for disclaimers
    await page.waitForLoadState('networkidle', { timeout });
    
    // Handle Consent Disclaimer - click "I am a Healthcare Professional"
    await handleConsentDisclaimer(page);
    
    // Handle Cookie Disclaimer - click "Ok"
    await handleCookieDisclaimer(page);
    
    console.log('✅ Disclaimers handled successfully');
  } catch (error) {
    console.log('ℹ️ No disclaimers found or already handled');
  }
}

/**
 * Handle Consent Disclaimer by clicking "I am a Healthcare Professional"
 * @param {import('playwright').Page} page - Playwright page object
 */
async function handleConsentDisclaimer(page) {
  try {
    // Common selectors for consent disclaimer buttons
    const consentSelectors = [
      'text="I am a Healthcare Professional"',
      'text="I am a Healthcare Professional" >> button',
      'text="I am a Healthcare Professional" >> a',
      'button:has-text("I am a Healthcare Professional")',
      'button:has-text("Healthcare Professional")',
      'button:has-text("Healthcare")',
      'a:has-text("I am a Healthcare Professional")',
      'a:has-text("Healthcare Professional")',
      'a:has-text("Healthcare")',
      '[data-testid*="consent"] button:has-text("Healthcare Professional")',
      '[data-testid*="consent"] button:has-text("Healthcare")',
      '[data-testid*="healthcare"] button',
      '.consent-button:has-text("Healthcare Professional")',
      '.consent-button:has-text("Healthcare")',
      '.healthcare-button',
      '#consent-button:has-text("Healthcare Professional")',
      '#consent-button:has-text("Healthcare")',
      '#healthcare-button',
      '[role="button"]:has-text("Healthcare Professional")',
      '[role="button"]:has-text("Healthcare")',
      '[class*="consent"] button:has-text("Healthcare")',
      '[class*="healthcare"] button',
      '[id*="consent"] button:has-text("Healthcare")',
      '[id*="healthcare"] button'
    ];

    for (const selector of consentSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log('🏥 Found consent disclaimer, clicking "I am a Healthcare Professional"');
          await element.click();
          await page.waitForTimeout(1000); // Wait for dialog to close
          return;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
  } catch (error) {
    console.log('ℹ️ No consent disclaimer found');
  }
}

/**
 * Handle Cookie Disclaimer by clicking "Ok"
 * @param {import('playwright').Page} page - Playwright page object
 */
async function handleCookieDisclaimer(page) {
  try {
    // Common selectors for cookie disclaimer buttons
    const cookieSelectors = [
      'text="Ok"',
      'text="OK"',
      'text="Accept"',
      'text="Accept All"',
      'text="Accept All Cookies"',
      'text="Accept Cookies"',
      'text="I Accept"',
      'text="Got it"',
      'text="Close"',
      'text="Continue"',
      'text="Proceed"',
      'text="Agree"',
      'text="I Agree"',
      'text="Allow"',
      'text="Allow All"',
      'button:has-text("Ok")',
      'button:has-text("OK")',
      'button:has-text("Accept")',
      'button:has-text("Accept All")',
      'button:has-text("Accept All Cookies")',
      'button:has-text("Accept Cookies")',
      'button:has-text("I Accept")',
      'button:has-text("Got it")',
      'button:has-text("Close")',
      'button:has-text("Continue")',
      'button:has-text("Proceed")',
      'button:has-text("Agree")',
      'button:has-text("I Agree")',
      'button:has-text("Allow")',
      'button:has-text("Allow All")',
      'a:has-text("Ok")',
      'a:has-text("OK")',
      'a:has-text("Accept")',
      'a:has-text("Accept All")',
      'a:has-text("Accept All Cookies")',
      'a:has-text("Accept Cookies")',
      'a:has-text("I Accept")',
      'a:has-text("Got it")',
      'a:has-text("Close")',
      'a:has-text("Continue")',
      'a:has-text("Proceed")',
      'a:has-text("Agree")',
      'a:has-text("I Agree")',
      'a:has-text("Allow")',
      'a:has-text("Allow All")',
      '[data-testid*="cookie"] button:has-text("Ok")',
      '[data-testid*="cookie"] button:has-text("Accept")',
      '[data-testid*="cookie"] button:has-text("Accept All Cookies")',
      '[data-testid*="cookie"] button:has-text("Allow")',
      '[data-testid*="consent"] button:has-text("Ok")',
      '[data-testid*="consent"] button:has-text("Accept")',
      '[data-testid*="consent"] button:has-text("Accept All Cookies")',
      '[data-testid*="consent"] button:has-text("Allow")',
      '.cookie-button:has-text("Ok")',
      '.cookie-button:has-text("Accept")',
      '.cookie-button:has-text("Accept All Cookies")',
      '.cookie-button:has-text("Allow")',
      '.consent-button:has-text("Ok")',
      '.consent-button:has-text("Accept")',
      '.consent-button:has-text("Accept All Cookies")',
      '.consent-button:has-text("Allow")',
      '#cookie-accept:has-text("Ok")',
      '#cookie-accept:has-text("Accept")',
      '#cookie-accept:has-text("Accept All Cookies")',
      '#cookie-accept:has-text("Allow")',
      '#consent-accept:has-text("Ok")',
      '#consent-accept:has-text("Accept")',
      '#consent-accept:has-text("Accept All Cookies")',
      '#consent-accept:has-text("Allow")',
      '[role="button"]:has-text("Ok")',
      '[role="button"]:has-text("Accept")',
      '[role="button"]:has-text("Accept All Cookies")',
      '[role="button"]:has-text("Allow")',
      '[class*="cookie"] button:has-text("Ok")',
      '[class*="cookie"] button:has-text("Accept")',
      '[class*="cookie"] button:has-text("Accept All Cookies")',
      '[class*="cookie"] button:has-text("Allow")',
      '[class*="consent"] button:has-text("Ok")',
      '[class*="consent"] button:has-text("Accept")',
      '[class*="consent"] button:has-text("Accept All Cookies")',
      '[class*="consent"] button:has-text("Allow")',
      '[id*="cookie"] button:has-text("Ok")',
      '[id*="cookie"] button:has-text("Accept")',
      '[id*="cookie"] button:has-text("Accept All Cookies")',
      '[id*="cookie"] button:has-text("Allow")',
      '[id*="consent"] button:has-text("Ok")',
      '[id*="consent"] button:has-text("Accept")',
      '[id*="consent"] button:has-text("Accept All Cookies")',
      '[id*="consent"] button:has-text("Allow")'
    ];

    for (const selector of cookieSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log('🍪 Found cookie disclaimer, clicking "Ok"');
          await element.click();
          await page.waitForTimeout(1000); // Wait for dialog to close
          return;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
  } catch (error) {
    console.log('ℹ️ No cookie disclaimer found');
  }
}

/**
 * Check if any disclaimers are visible on the page
 * @param {import('playwright').Page} page - Playwright page object
 * @returns {Promise<boolean>} - True if disclaimers are found
 */
async function hasDisclaimers(page) {
  try {
    // Check for common disclaimer indicators
    const disclaimerIndicators = [
      'text="I am a Healthcare Professional"',
      'text="Ok"',
      'text="Accept"',
      'text="Accept All"',
      'text="Accept Cookies"',
      'text="Got it"',
      'text="Close"',
      '[data-testid*="consent"]',
      '[data-testid*="cookie"]',
      '.consent-dialog',
      '.cookie-banner',
      '.disclaimer',
      '.modal'
    ];

    for (const selector of disclaimerIndicators) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          return true;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

module.exports = {
  handleDisclaimers,
  handleConsentDisclaimer,
  handleCookieDisclaimer,
  hasDisclaimers
};
