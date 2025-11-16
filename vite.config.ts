import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@api': path.resolve(__dirname, './src/api'),
      '@templates': path.resolve(__dirname, './src/templates'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },

  build: {
    outDir: 'dist',

    // Inline all assets into HTML for standalone widget
    assetsInlineLimit: 100000000, // 100MB - everything inline

    rollupOptions: {
      output: {
        // Single JS file
        manualChunks: undefined,

        // Inline CSS in JS
        inlineDynamicImports: true,

        // File names
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    },

    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging
        drop_debugger: true,
      },
    },
  },

  // Dev server configuration
  server: {
    port: 3000,
    open: true,
    host: true,
  },

  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
  },
});
