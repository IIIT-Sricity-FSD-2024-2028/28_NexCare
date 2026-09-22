import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The backend runs on :3001 and reflects any CORS origin, so the React dev
// server talks to it directly — no proxy needed. `host: true` lets the app be
// opened from another machine on the LAN (the API client mirrors the hostname).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Each portal is React.lazy'd from its own `index.jsx` (App.jsx), so
        // the default chunk name would be "index-<hash>" seven times over.
        // Name those chunks after the portal folder instead.
        chunkFileNames(chunk) {
          const match = (chunk.facadeModuleId || '').match(/\/portals\/([^/]+)\/index\.jsx$/);
          return match ? `assets/${match[1]}-[hash].js` : 'assets/[name]-[hash].js';
        },
      },
    },
  },
});
