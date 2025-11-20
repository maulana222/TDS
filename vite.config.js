import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    port: 8888,
    open: true,
    proxy: {
      // Proxy untuk backend Express (authentication)
      '/api/auth': {
        target: 'http://localhost:3737',
        changeOrigin: true,
        secure: false
      },
      // Proxy untuk external transaction API
      '/api/v1': {
        target: 'https://digiprosb.api.digiswitch.id',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '') // Remove /api prefix, keep /v1/...
      }
    }
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://202.155.94.175:3737')
  },
  optimizeDeps: {
    force: true
  },
  clearScreen: false
});
