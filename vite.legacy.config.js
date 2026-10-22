import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import pugPlugin from 'vite-plugin-pug';
import { dashboardShell } from './src/scripts/data/dashboard-shell.js';
import { adminEntities } from './src/scripts/data/admin.js';
import { heroContent } from './src/scripts/data/hero.js';
import { partners, getPartnerGeometry } from './src/scripts/data/partners.js';
import { differenceContent } from './src/scripts/data/difference.js';
import { aboutContent } from './src/scripts/data/about.js';
import { solutionsContent } from './src/scripts/data/solutions.js';
import { landingEndContent } from './src/scripts/data/landing-end.js';
import { testimonialContent } from './src/scripts/data/testimonial.js';

// The same centralized examples supply initial Pug content and the runtime service.
const pug = pugPlugin({}, { hero: heroContent, partners, getPartnerGeometry, difference: differenceContent, about: aboutContent, solutions: solutionsContent, testimonial: testimonialContent, ending: landingEndContent, adminEntities, dashboardShell });

function useLegacyEntry(server) {
  server.middlewares.use((request, response, next) => {
    const url = new URL(request.url || '/', 'http://localhost');
    if (url.pathname === '/' || url.pathname === '/index.html') request.url = '/legacy.html' + url.search;
    next();
  });
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      proxy: { '/api': { target: `http://127.0.0.1:${env.API_PORT || 3101}`, changeOrigin: true } },
    },
    plugins: [{
      name: 'legacy-landing-entry',
      configureServer: useLegacyEntry,
      configurePreviewServer: useLegacyEntry,
    }, {
      ...pug,
      // Compile Pug before Vite discovers scripts, styles, and assets in the HTML.
      transformIndexHtml: { order: 'pre', handler: pug.transformIndexHtml },
    }],
    build: {
      outDir: 'dist-legacy',
      assetsInlineLimit: 0,
      rolldownOptions: {
        input: {
          main: fileURLToPath(new URL('./legacy.html', import.meta.url)),
          foundation: fileURLToPath(new URL('./foundation.html', import.meta.url)),
          login: fileURLToPath(new URL('./login.html', import.meta.url)),
          admin: fileURLToPath(new URL('./admin.html', import.meta.url)),
          dashboard: fileURLToPath(new URL('./dashboard.html', import.meta.url)),
          content: fileURLToPath(new URL('./content.html', import.meta.url)),
        },
      },
    },
  };
});
