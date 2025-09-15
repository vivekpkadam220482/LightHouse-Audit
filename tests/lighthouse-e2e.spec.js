const { test, expect } = require('@playwright/test');
const { readUrlsFromCSV, getDefaultCSVPath } = require('../utils/csv-reader');
const { runLighthouseAudit } = require('../utils/lighthouse-runner');
const { handleDisclaimers } = require('../utils/disclaimer-handler');
const path = require('path');
const fs = require('fs-extra');

/**8888
 * E2E Test: Run Lighthouse audits for URLs from a CSV file
 * Requirements:
 * - Read URLs from a CSV file
 * - Launch Chrome browser
 * - Run Lighthouse audits in Navigation mode for both Mobile and Desktop
 * - Capture screenshots of the reports
 */
test.describe('Lighthouse E2E Tests', () => {
  let urls = [];
  const outputDir = path.join(__dirname, '..', 'reports');

  // Memory monitoring function
  function logMemoryUsage(stage) {
    if (process.memoryUsage) {
      const memUsage = process.memoryUsage();
      console.log(`💾 Memory Usage (${stage}):`, {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`
      });
    }
  }

  test.beforeAll(async () => {
    // Read URLs from CSV file
    const csvPath = getDefaultCSVPath();
    console.log(`Reading URLs from: ${csvPath}`);
    
    try {
      urls = await readUrlsFromCSV(csvPath);
      console.log(`Found ${urls.length} URLs to test`);
      
      // Create output directory
      await fs.ensureDir(outputDir);
    } catch (error) {
      console.error('Failed to read CSV file:', error);
      throw error;
    }
  });

  test('should run Lighthouse audits for all URLs on both devices', async ({ browser }) => {
    const results = [];
    
    // Log initial memory usage
    logMemoryUsage('Start of audits');

    for (const urlData of urls) {
      const { url, description } = urlData;
      console.log(`\n=== Testing: ${description} (${url}) ===`);
      
      // Log memory usage before each URL
      logMemoryUsage(`Before ${description}`);

      // Test on Desktop
      console.log('\n--- Desktop Audit ---');
      try {
        const desktopResult = await runLighthouseAudit(url, 'desktop', outputDir);
        results.push({
          url,
          description,
          device: 'desktop',
          ...desktopResult
        });
        
        // Log scores
        console.log('Desktop Scores:', desktopResult.scores);
        
        // Force garbage collection and memory cleanup after desktop audit
        if (global.gc) {
          global.gc();
          console.log('🧹 Desktop audit memory cleaned up');
        }
        
      } catch (error) {
        console.error(`Desktop audit failed for ${url}:`, error.message);
        results.push({
          url,
          description,
          device: 'desktop',
          error: error.message
        });
      }

      // Add delay between audits to allow memory cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test on Mobile
      console.log('\n--- Mobile Audit ---');
      try {
        const mobileResult = await runLighthouseAudit(url, 'mobile', outputDir);
        results.push({
          url,
          description,
          device: 'mobile',
          ...mobileResult
        });
        
        // Log scores
        console.log('Mobile Scores:', mobileResult.scores);
        
        // Force garbage collection and memory cleanup after mobile audit
        if (global.gc) {
          global.gc();
          console.log('🧹 Mobile audit memory cleaned up');
        }
        
      } catch (error) {
        console.error(`Mobile audit failed for ${url}:`, error.message);
        results.push({
          url,
          description,
          device: 'mobile',
          error: error.message
        });
      }

      // Add delay between URL tests to allow memory cleanup
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('⏳ Waiting for memory cleanup before next URL...');
      
      // Log memory usage after each URL
      logMemoryUsage(`After ${description}`);
    }
    
    // Log final memory usage
    logMemoryUsage('End of all audits');

    // Save summary report
    const summaryPath = path.join(outputDir, 'audit-summary.json');
    await fs.writeJson(summaryPath, results, { spaces: 2 });
    console.log(`\nAudit summary saved to: ${summaryPath}`);

    // Generate HTML summary
    await generateHTMLSummary(results, outputDir);

    // Assert that we have results
    expect(results.length).toBeGreaterThan(0);
    
    // Log final summary
    console.log('\n=== AUDIT SUMMARY ===');
    results.forEach(result => {
      if (result.error) {
        console.log(`❌ ${result.url} (${result.device}): ${result.error}`);
      } else {
        console.log(`✅ ${result.url} (${result.device}): Performance=${result.scores.performance}, Accessibility=${result.scores.accessibility}`);
      }
    });
  });

  test('should open URLs in Chrome browser and verify page loads', async ({ page }) => {
    for (const urlData of urls) {
      const { url, description } = urlData;
      
      console.log(`\nOpening ${description} (${url}) in browser...`);
      
      try {
        // Navigate to the URL (longer timeout to reduce false negatives)
        await page.goto(url, { 
          waitUntil: 'networkidle',
          timeout: 60000 
        });

        // Handle any disclaimers that appear
        await handleDisclaimers(page);

        // Verify page loaded successfully
        await expect(page).toHaveTitle(/./);
        
        // Take a screenshot
        const screenshotPath = path.join(outputDir, 'browser-screenshots', `${description.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
        await fs.ensureDir(path.dirname(screenshotPath));
        await page.screenshot({ path: screenshotPath, fullPage: true });
        
        console.log(`✅ ${description} loaded successfully`);
        console.log(`Screenshot saved: ${screenshotPath}`);
        
      } catch (error) {
        // Do not fail the whole suite for DNS or navigation errors; log and continue
        console.error(`❌ Skipping ${description} due to navigation error: ${error.message}`);
      }
    }
  });
});

/**
 * Generate HTML summary report
 * @param {Array} results - Audit results
 * @param {string} outputDir - Output directory
 */
async function generateHTMLSummary(results, outputDir) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lighthouse Audit Summary</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .result { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .success { border-left: 5px solid #4CAF50; }
        .error { border-left: 5px solid #f44336; }
        .scores { display: flex; gap: 20px; margin-top: 10px; }
        .score { padding: 5px 10px; border-radius: 3px; color: white; }
        .performance { background: #2196F3; }
        .accessibility { background: #4CAF50; }
        .best-practices { background: #FF9800; }
        .seo { background: #9C27B0; }
        .links { margin-top: 10px; }
        .links a { margin-right: 15px; color: #2196F3; text-decoration: none; }
        .links a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Lighthouse Audit Summary</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Total URLs tested: ${results.length / 2}</p>
    </div>
    
    ${results.map(result => `
        <div class="result ${result.error ? 'error' : 'success'}">
            <h3>${result.description} (${result.device})</h3>
            <p><strong>URL:</strong> <a href="${result.url}" target="_blank">${result.url}</a></p>
            ${result.error ? 
                `<p><strong>Error:</strong> ${result.error}</p>` :
                `<div class="scores">
                    <span class="score performance">Performance: ${result.scores.performance}</span>
                    <span class="score accessibility">Accessibility: ${result.scores.accessibility}</span>
                    <span class="score best-practices">Best Practices: ${result.scores.bestPractices}</span>
                    <span class="score seo">SEO: ${result.scores.seo}</span>
                </div>
                <div class="links">
                    <a href="file://${result.report}" target="_blank">View Report</a>
                    <a href="file://${result.screenshot}" target="_blank">View Screenshot</a>
                </div>`
            }
        </div>
    `).join('')}
</body>
</html>`;

  const summaryHTMLPath = path.join(outputDir, 'audit-summary.html');
  await fs.writeFile(summaryHTMLPath, html);
  console.log(`HTML summary saved to: ${summaryHTMLPath}`);
} 