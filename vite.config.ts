import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    // Vite doesn't read PORT on its own, so an assigned port would be ignored
    // and it would grab 5173 anyway. Fall back to 5174, one clear of the
    // almanac beside it, so both can run at once.
    port: Number(process.env.PORT) || 5174,
    // Listen on the network rather than only on loopback, so a phone on the
    // same Wi-Fi can open the dev server. Development only; the built app is
    // static files and never runs this.
    host: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Calculator',
        short_name: 'Calculator',
        description: 'A calculator that works the whole expression out, with no ads and nothing sent anywhere.',
        // The mark's own ground, so the splash and the status bar match the
        // icon that was tapped rather than the palette that happens to be on.
        theme_color: '#241C13',
        background_color: '#241C13',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait-primary',
        // 'any' and 'maskable' are separate entries on purpose. A maskable
        // icon is cropped to whatever shape the launcher uses, so the rounded
        // corners of the plain mark would be shaved off. The maskable pair are
        // square to the edge and let Android cut its own shape.
        icons: [
          { src: 'pwa-64.png', sizes: '64x64', type: 'image/png', purpose: 'any' },
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
})
