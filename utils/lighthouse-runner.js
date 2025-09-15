const lighthouse = require('lighthouse/core/index.cjs');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs-extra');
const path = require('path');
const { handleDisclaimers } = require('./disclaimer-handler');

/**8888888
 * Run Lighthouse audit for a URL
 * @param {string} url - URL to audit
 * @param {string} device - 'desktop' or 'mobile'
 * @param {string} outputDir - Directory to save reports
 * @returns {Promise<{report: string, screenshot: string}>}
 */
async function runLighthouseAudit(url, device, outputDir) {
  console.log(`Running Lighthouse audit for ${url} on ${device}...`);
  
  // Launch Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
  });

  try {
    // Lighthouse configuration
    const config = {
      extends: 'lighthouse:default',
      settings: {
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        formFactor: device === 'mobile' ? 'mobile' : 'desktop',
        throttling: device === 'mobile' ? 
          { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } :
          { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
        screenEmulation: device === 'mobile' ? 
          { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false } :
          { mobile: false, width: 1920, height: 1080, deviceScaleFactor: 1, disabled: false },
        emulatedUserAgent: device === 'mobile' ?
          'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36' :
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };

    // Run Lighthouse
    const runnerResult = await lighthouse(url, {
      port: chrome.port,
      output: 'html',
      logLevel: 'info'
    }, config);

    // Create output directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const urlSlug = url.replace(/[^a-zA-Z0-9]/g, '_');
    const deviceDir = path.join(outputDir, device, urlSlug, timestamp);
    await fs.ensureDir(deviceDir);

    // Save HTML report
    const reportPath = path.join(deviceDir, 'lighthouse-report.html');
    await fs.writeFile(reportPath, runnerResult.report);

    // Save JSON report
    const jsonPath = path.join(deviceDir, 'lighthouse-report.json');
    await fs.writeJson(jsonPath, runnerResult.lhr, { spaces: 2 });

    // Take screenshot of the page
    const screenshotPath = path.join(deviceDir, 'page-screenshot.png');
    
    // Use Playwright to take screenshot
    const { chromium } = require('playwright');
    const browser = await chromium.launch({ 
      headless: true,
      args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({
      viewport: device === 'mobile' ? { width: 375, height: 667 } : { width: 1350, height: 940 },
      userAgent: config.settings.emulatedUserAgent
    });
    const page = await context.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Handle any disclaimers that appear
      await handleDisclaimers(page);
      
      await page.screenshot({ path: screenshotPath, fullPage: true });
    } catch (error) {
      console.warn(`Failed to take screenshot for ${url}: ${error.message}`);
    } finally {
      // Properly close all resources
      await page.close();
      await context.close();
      await browser.close();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }

    console.log(`Lighthouse audit completed for ${url} on ${device}`);
    console.log(`Report saved to: ${reportPath}`);
    console.log(`Screenshot saved to: ${screenshotPath}`);

    return {
      report: reportPath,
      screenshot: screenshotPath,
      scores: {
        performance: Math.round(runnerResult.lhr.categories.performance.score * 100),
        accessibility: Math.round(runnerResult.lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(runnerResult.lhr.categories['best-practices'].score * 100),
        seo: Math.round(runnerResult.lhr.categories.seo.score * 100)
      }
    };

  } finally {
    await chrome.kill();
  }
}

module.exports = {
  runLighthouseAudit
}; 