#!/usr/bin/env node

/**
 * Standalone Lighthouse Audit Script
 * Reads URLs from CSV and runs Lighthouse audits for both mobile and desktop
 */

const { readUrlsFromCSV, getDefaultCSVPath } = require('./utils/csv-reader');
const { runLighthouseAudit } = require('./utils/lighthouse-runner');
const path = require('path');
const fs = require('fs-extra');

async function main() {
  console.log('🚀 Starting Lighthouse E2E Audit...\n');

  try {
    // Read URLs from CSV file
    const csvPath = getDefaultCSVPath();
    console.log(`📖 Reading URLs from: ${csvPath}`);
    
    const urls = await readUrlsFromCSV(csvPath);
    console.log(`✅ Found ${urls.length} URLs to test\n`);
    
    // Create output directory
    const outputDir = path.join(__dirname, 'reports');
    await fs.ensureDir(outputDir);
    
    const results = [];

    // Process each URL
    for (const urlData of urls) {
      const { url, description } = urlData;
      console.log(`\n🌐 Testing: ${description}`);
      console.log(`🔗 URL: ${url}`);
      console.log('─'.repeat(50));

      // Test on Desktop
      console.log('\n🖥️  Running Desktop Audit...');
      try {
        const desktopResult = await runLighthouseAudit(url, 'desktop', outputDir);
        results.push({
          url,
          description,
          device: 'desktop',
          ...desktopResult
        });
        
        console.log('📊 Desktop Scores:', desktopResult.scores);
      } catch (error) {
        console.error(`❌ Desktop audit failed: ${error.message}`);
        results.push({
          url,
          description,
          device: 'desktop',
          error: error.message
        });
      }

      // Test on Mobile
      console.log('\n📱 Running Mobile Audit...');
      try {
        const mobileResult = await runLighthouseAudit(url, 'mobile', outputDir);
        results.push({
          url,
          description,
          device: 'mobile',
          ...mobileResult
        });
        
        console.log('📊 Mobile Scores:', mobileResult.scores);
      } catch (error) {
        console.error(`❌ Mobile audit failed: ${error.message}`);
        results.push({
          url,
          description,
          device: 'mobile',
          error: error.message
        });
      }

      console.log('\n' + '─'.repeat(50));
    }

    // Save summary report
    const summaryPath = path.join(outputDir, 'audit-summary.json');
    await fs.writeJson(summaryPath, results, { spaces: 2 });
    console.log(`\n📄 Audit summary saved to: ${summaryPath}`);

    // Generate HTML summary
    await generateHTMLSummary(results, outputDir);

    // Print final summary
    console.log('\n🎯 FINAL AUDIT SUMMARY');
    console.log('='.repeat(50));
    
    const successfulAudits = results.filter(r => !r.error);
    const failedAudits = results.filter(r => r.error);
    
    console.log(`✅ Successful audits: ${successfulAudits.length}`);
    console.log(`❌ Failed audits: ${failedAudits.length}`);
    
    if (successfulAudits.length > 0) {
      console.log('\n📊 Average Scores:');
      const avgScores = {
        performance: Math.round(successfulAudits.reduce((sum, r) => sum + r.scores.performance, 0) / successfulAudits.length),
        accessibility: Math.round(successfulAudits.reduce((sum, r) => sum + r.scores.accessibility, 0) / successfulAudits.length),
        bestPractices: Math.round(successfulAudits.reduce((sum, r) => sum + r.scores.bestPractices, 0) / successfulAudits.length),
        seo: Math.round(successfulAudits.reduce((sum, r) => sum + r.scores.seo, 0) / successfulAudits.length)
      };
      
      console.log(`   Performance: ${avgScores.performance}/100`);
      console.log(`   Accessibility: ${avgScores.accessibility}/100`);
      console.log(`   Best Practices: ${avgScores.bestPractices}/100`);
      console.log(`   SEO: ${avgScores.seo}/100`);
    }

    console.log(`\n📁 All reports saved in: ${outputDir}`);
    console.log('🎉 Lighthouse E2E Audit completed successfully!');

  } catch (error) {
    console.error('💥 Error during audit:', error);
    process.exit(1);
  }
}

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
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            overflow: hidden; 
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .stat-card { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center; 
            border-left: 4px solid #667eea; 
        }
        .stat-number { font-size: 2em; font-weight: bold; color: #667eea; }
        .stat-label { color: #666; margin-top: 5px; }
        .result { 
            border: 1px solid #e9ecef; 
            margin: 15px 0; 
            border-radius: 8px; 
            overflow: hidden; 
        }
        .result-header { 
            padding: 15px 20px; 
            background: #f8f9fa; 
            border-bottom: 1px solid #e9ecef; 
        }
        .result-content { padding: 20px; }
        .success { border-left: 4px solid #28a745; }
        .error { border-left: 4px solid #dc3545; }
        .scores { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); 
            gap: 10px; 
            margin: 15px 0; 
        }
        .score { 
            padding: 10px; 
            border-radius: 6px; 
            color: white; 
            text-align: center; 
            font-weight: bold; 
        }
        .performance { background: linear-gradient(135deg, #2196F3, #1976D2); }
        .accessibility { background: linear-gradient(135deg, #4CAF50, #388E3C); }
        .best-practices { background: linear-gradient(135deg, #FF9800, #F57C00); }
        .seo { background: linear-gradient(135deg, #9C27B0, #7B1FA2); }
        .links { margin-top: 15px; }
        .links a { 
            display: inline-block; 
            margin-right: 15px; 
            color: #667eea; 
            text-decoration: none; 
            padding: 8px 16px; 
            border: 1px solid #667eea; 
            border-radius: 4px; 
            transition: all 0.3s; 
        }
        .links a:hover { 
            background: #667eea; 
            color: white; 
            text-decoration: none; 
        }
        .error-message { 
            color: #dc3545; 
            background: #f8d7da; 
            padding: 10px; 
            border-radius: 4px; 
            border: 1px solid #f5c6cb; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Lighthouse Audit Summary</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="content">
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number">${results.length / 2}</div>
                    <div class="stat-label">URLs Tested</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${results.filter(r => !r.error).length}</div>
                    <div class="stat-label">Successful Audits</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${results.filter(r => r.error).length}</div>
                    <div class="stat-label">Failed Audits</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${results.filter(r => !r.error).length > 0 ? 
                        Math.round(results.filter(r => !r.error).reduce((sum, r) => sum + r.scores.performance, 0) / results.filter(r => !r.error).length) : 0}</div>
                    <div class="stat-label">Avg Performance</div>
                </div>
            </div>
            
            ${results.map(result => `
                <div class="result ${result.error ? 'error' : 'success'}">
                    <div class="result-header">
                        <h3>${result.description} (${result.device})</h3>
                        <p><strong>URL:</strong> <a href="${result.url}" target="_blank">${result.url}</a></p>
                    </div>
                    <div class="result-content">
                        ${result.error ? 
                            `<div class="error-message">
                                <strong>Error:</strong> ${result.error}
                            </div>` :
                            `<div class="scores">
                                <div class="score performance">Performance<br>${result.scores.performance}</div>
                                <div class="score accessibility">Accessibility<br>${result.scores.accessibility}</div>
                                <div class="score best-practices">Best Practices<br>${result.scores.bestPractices}</div>
                                <div class="score seo">SEO<br>${result.scores.seo}</div>
                            </div>
                            <div class="links">
                                <a href="file://${result.report}" target="_blank">📄 View Report</a>
                                <a href="file://${result.screenshot}" target="_blank">📸 View Screenshot</a>
                            </div>`
                        }
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

  const summaryHTMLPath = path.join(outputDir, 'audit-summary.html');
  await fs.writeFile(summaryHTMLPath, html);
  console.log(`📄 HTML summary saved to: ${summaryHTMLPath}`);
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
} 