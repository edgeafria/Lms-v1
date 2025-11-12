import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    
    // Server configuration
    server: {
      // Your new settings:
      host: "0.0.0.0",
      port: 3000,
      allowedHosts: [
        "dashboard.edgesafrica.org",
        "www.dashboard.edgesafrica.org",
      ],
      
      // Proxy configuration
      proxy: {
        '/v1': {
          target: env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          
          // --- THIS IS THE FIX FOR THE 'split' ERROR ---
          /**
           * Intercepts the proxy request to fix null cookie headers.
           * This prevents the 'Cannot read properties of null (reading 'split')'
           * error in the vite/http-proxy.
           */
          onProxyReq(proxyReq, req, res) {
            const cookie = proxyReq.getHeader('cookie');
            if (cookie === null) {
              // If the cookie header is null, set it to an empty string
              // to prevent the proxy from crashing.
              proxyReq.setHeader('cookie', '');
            }
          },
          // ----------------------------------------------
          
        },
      },
    },
  };
});