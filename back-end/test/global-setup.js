/**
 * Jest global setup — re-seeds the data directory before each E2E test run.
 * This ensures all users have plain-text passwords so auth.service.ts can
 * authenticate them. (auth.service upgrades plain → hash on first login,
 * so without a reseed the second run would fail with 401.)
 */
const path = require('path');

module.exports = async function () {
  // Re-run the comprehensive seed so all passwords are plain-text 'Password123'
  require(path.join(__dirname, '../scripts/generate-comprehensive-seed.js'));
};
