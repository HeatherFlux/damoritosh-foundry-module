import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      formats: ['es'],
      fileName: () => 'module.js'
    },
    outDir: 'scripts',
    emptyDirBeforeWrite: true,
    sourcemap: true,
    minify: false,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return '../styles/module.css';
          }
          return assetInfo.name || 'asset';
        }
      }
    }
  }
});
