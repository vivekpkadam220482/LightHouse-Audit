const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

/**
 * Read URLs from CSV file
 * @param {string} csvFilePath - Path to the CSV file
 * @returns {Promise<Array<{url: string, description: string}>>}
 */
async function readUrlsFromCSV(csvFilePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        if (data.url && data.url.trim()) {
          results.push({
            url: data.url.trim(),
            description: data.description || 'No description'
          });
        }
      })
      .on('end', () => {
        console.log(`Read ${results.length} URLs from CSV file`);
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Get the default CSV file path
 * @returns {string}
 */
function getDefaultCSVPath() {
  return path.join(__dirname, '..', 'data', 'urls.csv');
}

module.exports = {
  readUrlsFromCSV,
  getDefaultCSVPath
}; 