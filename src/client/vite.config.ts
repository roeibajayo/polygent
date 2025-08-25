import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import mkcert from 'vite-plugin-mkcert';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    https: true,
    proxy: {
      '/api/': {
        target: 'https://localhost:6457',
        changeOrigin: true,
        secure: false
      },
      '/hub': {
        target: 'https://localhost:6457',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  plugins: [react(), tailwindcss(), tsconfigPaths(), mkcert()],
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        compact: true,
        minifyInternalExports: true,
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
});
