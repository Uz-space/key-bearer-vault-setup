// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import httpProxy from "http-proxy";

// TEMPORARY: forwards the whole dev preview to the externally running
// key-bearer-vault (Telegram Web K) dev server on port 8081.
// Remove this plugin to get the normal Lovable app back.
const KBV_TARGET = "http://127.0.0.1:8081";

const kbvPreviewProxy = () => {
  const proxy = httpProxy.createProxyServer({
    target: KBV_TARGET,
    ws: false,
    changeOrigin: true,
  });
  proxy.on("error", (_err, _req, res: any) => {
    try {
      res?.writeHead?.(502, { "content-type": "text/plain" });
      res?.end?.("Upstream app not ready");
    } catch {
      /* ignore */
    }
  });
  return {
    name: "kbv-preview-proxy",
    apply: "serve" as const,
    configureServer(server: any) {
      // Note: websocket upgrades are intentionally NOT proxied (HMR only).
      server.middlewares.use((req: any, res: any) => {
        proxy.web(req, res);
      });
    },
  };
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [kbvPreviewProxy()],
  },
});
