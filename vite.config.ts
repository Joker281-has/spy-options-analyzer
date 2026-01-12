import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SPY Trading Assistant',
        short_name: 'SPY Trader',
        description: 'Real-time SPY options analysis with trade signals, alerts, and portfolio tracking',
        theme_color: '#1f77b4',
        background_color: '#ffffff',
        icons: [
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%231f77b4" width="192" height="192"/><text x="50%" y="50%" font-size="100" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">SPY</text></svg>',
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: '/.netlify/functions/fetchData',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'spy-api',
              expiration: { maxEntries: 5, maxAgeSeconds: 300 }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: 'localhost'
  }
})
