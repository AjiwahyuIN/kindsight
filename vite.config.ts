import { defineConfig, type Plugin, type ProxyOptions, type ViteDevServer } from 'vite';
import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import react from '@vitejs/plugin-react';

// Historical HTML URLs enter the SPA; the Pug application has its own config.
function spaBoundaries(): Plugin {
  const configure = (server: Pick<ViteDevServer, 'middlewares'>, root: string) => {
    server.middlewares.use((request, response, next) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      if (/^\/api(?:\/|$)/.test(url.pathname)) return next();
      const sourceOrAsset = /^\/(?:src|assets|node_modules|@vite|@id|@fs|@react-refresh)(?:\/|$)/.test(url.pathname);
      const assetFile = /\.(?:js|mjs|css|map|png|jpe?g|webp|svg|ico|woff2?|ttf)$/i.test(url.pathname);
      if ((url.pathname.startsWith('/assets/') || assetFile) && !/^\/(?:src|node_modules|@)/.test(url.pathname)) {
        let decoded: string;
        try { decoded = decodeURIComponent(url.pathname); } catch { response.writeHead(404).end(); return; }
        const file = resolve(root, `.${decoded}`);
        if (!file.startsWith(root + sep) || !existsSync(file)) { response.writeHead(404).end(); return; }
      }
      if (request.headers.accept?.includes('text/html') && !sourceOrAsset && !assetFile) request.url = `/index.html${url.search}`;
      next();
    });
  };
  return { name: 'kindsight-spa-boundaries', configureServer: server => configure(server, server.config.root), configurePreviewServer: server => configure(server, resolve(server.config.root, server.config.build.outDir)) };
}

const apiProxy:ProxyOptions={target:'http://127.0.0.1:3101',changeOrigin:false,configure(proxy){
  proxy.on('error',(_error,_request,response)=>{if('writeHead' in response&&!response.headersSent){response.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});response.end(JSON.stringify({error:{code:'API_UNAVAILABLE',message:'The local API is unavailable. Start npm run dev:api and retry.'}}));}});
}};
export default defineConfig({
  plugins: [react(), spaBoundaries()],
  server: { host: '127.0.0.1', port: 5176, strictPort: true, proxy: { '/api': apiProxy } },
  preview: { host: '127.0.0.1', port: 5180, strictPort: true, proxy: { '/api': apiProxy } },
  build: { assetsInlineLimit: 0 },
});
