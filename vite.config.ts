import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';

function githubPagesMultiRoutePlugin() {
  return {
    name: 'github-pages-multi-route',
    closeBundle() {
      const distDir = path.resolve(import.meta.dirname, 'dist');
      const indexHtmlPath = path.join(distDir, 'index.html');
      if (!fs.existsSync(indexHtmlPath)) return;

      const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

      // 1. Create dist/remote/index.html with adjusted relative asset paths
      const remoteDir = path.join(distDir, 'remote');
      if (!fs.existsSync(remoteDir)) {
        fs.mkdirSync(remoteDir, { recursive: true });
      }
      const remoteHtml = indexHtml
        .replace(/src="\.\/assets\//g, 'src="../assets/')
        .replace(/href="\.\/assets\//g, 'href="../assets/')
        .replace(/href="\.\/favicon/g, 'href="../favicon')
        .replace(/href="\.\/assets\/bee-logo/g, 'href="../assets/bee-logo');
      fs.writeFileSync(path.join(remoteDir, 'index.html'), remoteHtml, 'utf-8');

      // 2. Create dist/remote.html for direct file matching
      fs.writeFileSync(path.join(distDir, 'remote.html'), indexHtml, 'utf-8');

      // 3. Create dist/404.html as a full SPA fallback
      fs.writeFileSync(path.join(distDir, '404.html'), indexHtml, 'utf-8');
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), githubPagesMultiRoutePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
