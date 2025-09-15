#!/usr/bin/env node

/**
 * Test script for disclaimer handler 
 * This script tests the disclaimer handling functionality
 */

const { chromium } = require('playwright');
const { handleDisclaimers } = require('./utils/disclaimer-handler');

async function testDisclaimerHandler() {
  console.log('🧪 Testing Disclaimer Handler...\n');

  const browser = await chromium.launch({ headless: false }); // Use headed mode for testing
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Test URLs that might have disclaimers
    const testUrls = [
      {
        url: 'https://www.google.com',
        description: 'Google (should have no disclaimers)'
      },
      {
        url: 'https://www.github.com', 
        description: 'GitHub (should have no disclaimers)'
      }
      // Add more test URLs here as needed
    ];

    for (const testUrl of testUrls) {
      console.log(`\n🌐 Testing: ${testUrl.description}`);
      console.log(`🔗 URL: ${testUrl.url}`);
      
      try {
        // Navigate to the URL
        await page.goto(testUrl.url, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });

        console.log('📄 Page loaded, checking for disclaimers...');
        
        // Handle any disclaimers that appear
        await handleDisclaimers(page);
        
        console.log('✅ Disclaimer check completed');
        
        // Wait a moment to see the result
        await page.waitForTimeout(2000);
        
      } catch (error) {
        console.error(`❌ Error testing ${testUrl.url}: ${error.message}`);
      }
    }

    console.log('\n🎉 Disclaimer handler test completed!');
    console.log('Check the browser to see if disclaimers were handled correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser will remain open for 30 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    await browser.close();
  }
}

// Run the test
testDisclaimerHandler().catch(console.error);
