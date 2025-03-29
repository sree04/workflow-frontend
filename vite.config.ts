import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    
      port: 5174, // ✅ Change Vite frontend port to 5174
  
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Your backend URL
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
