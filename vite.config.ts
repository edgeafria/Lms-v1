import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables from .env files
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    
    // The 'server' object contains all server-related config
    server: {
      
      // The 'proxy' object MUST be inside 'server'
      proxy: {
        '/v1': {
          target: env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true, // Needed for virtual hosted sites
          secure: false,      // Set to true if your backend is HTTPS
        },
        
        // You can add other proxy rules here if needed
        // '/api': { 
        //   target: 'http://another-api.com',
        //   changeOrigin: true,
        // }
      },
    },
  };
});