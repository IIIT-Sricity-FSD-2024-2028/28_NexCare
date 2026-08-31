/**
 * Jest global teardown for the E2E suite.
 *
 * Restores the data directory snapshot taken in global-setup.js, discarding
 * everything the seed and the tests wrote. See global-setup.js for why.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BACKUP_DIR = path.join(__dirname, '..', '.e2e-data-backup');

module.exports = async function () {
  if (!fs.existsSync(BACKUP_DIR)) return;

  fs.rmSync(DATA_DIR, { recursive: true, force: true });
  fs.cpSync(BACKUP_DIR, DATA_DIR, { recursive: true });
  fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
  console.log(`[e2e] Restored ${DATA_DIR} from snapshot.`);
};
