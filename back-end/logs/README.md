# Runtime logs

Written by `src/common/logging/file-logger.ts`. Entries are buffered and
flushed to disk every 5 seconds (`LOG_FLUSH_INTERVAL_MS`), immediately for
errors, and on shutdown.

| File | Contents |
|---|---|
| `access-YYYY-MM-DD.log` | one entry per HTTP request: method, path, status, duration, user, ip |
| `error-YYYY-MM-DD.log`  | every 4xx/5xx response and every thrown exception, with stack traces |
| `app-YYYY-MM-DD.log`    | lifecycle and business events (startup, uploads, shutdown) |

Format is JSON lines — one JSON object per line:

```bash
tail -f logs/access-$(date +%F).log | jq .
```

Files rotate daily by name and whenever one passes 5 MB. Administrators can
read them from the API (`GET /api/logs?stream=error`) or in the admin portal
at *System Logs*.

The `.log` files are gitignored; this folder is tracked so the app always has
somewhere to write.
