import { System } from '../../api';

/**
 * NexCareStore.logActivity() from shared/db.js: POST /system/activity,
 * best-effort. The staff and superuser pages both loaded db.js and wrote an
 * audit row after each change.
 *
 * Fixed on port: db.js sent { action, module, details, date, createdAt }, and
 * CreateActivityDto declares { userId, action, details, module, severity } —
 * `date` / `createdAt` are refused by the ValidationPipe (forbidNonWhitelisted)
 * and `userId` / `severity` are required, so every audit write from the HTML
 * pages was a silent 400 (db.js swallowed it and fell back to a localStorage
 * list nobody reads). The actor is the signed-in user; the backend stamps the
 * timestamp itself.
 */
export default async function logActivity(action, module, details, severity = 'INFO') {
  try {
    await System.logActivity({ userId: currentUserId(), action, module, details, severity });
  } catch (error) {
    console.warn('Activity log API failed:', error.message);
  }
}

function currentUserId() {
  try {
    const u = JSON.parse(sessionStorage.getItem('nexcare_user_data') || 'null');
    if (u && u.id) return String(u.id);
  } catch { /* fall through */ }
  return sessionStorage.getItem('nexcare_user_email') || 'System';
}
