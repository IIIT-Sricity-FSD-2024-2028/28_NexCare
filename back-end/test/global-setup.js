/**
 * Jest global setup for the E2E suite.
 *
 * The suite needs a freshly seeded data directory: the seed writes plain-text
 * passwords, and auth.service.ts upgrades plain -> scrypt on first login, so
 * without a reseed a second run would fail with 401.
 *
 * Re-seeding overwrites all 11 files in back-end/data/, which would otherwise
 * destroy every hospital registration, appointment, bill, leave request and
 * ambulance record created since the last seed. So we snapshot the whole data
 * directory first and restore it in global-teardown.js.
 *
 * If a previous run crashed before teardown, the snapshot is still on disk —
 * restore it before seeding rather than overwriting it, so the real data is
 * never lost across repeated runs.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BACKUP_DIR = path.join(__dirname, '..', '.e2e-data-backup');

module.exports = async function () {
  if (fs.existsSync(BACKUP_DIR)) {
    // A previous run died before teardown — put the real data back first.
    console.warn(
      '[e2e] Found a leftover data snapshot from an interrupted run — restoring it before reseeding.',
    );
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
    fs.cpSync(BACKUP_DIR, DATA_DIR, { recursive: true });
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
  }

  if (fs.existsSync(DATA_DIR)) {
    fs.cpSync(DATA_DIR, BACKUP_DIR, { recursive: true });
    console.log(`[e2e] Snapshotted ${DATA_DIR} -> ${BACKUP_DIR}`);
  }

  // Re-run the comprehensive seed so all passwords are plain-text 'Password123'
  require(path.join(__dirname, '../scripts/generate-comprehensive-seed.js'));
};
