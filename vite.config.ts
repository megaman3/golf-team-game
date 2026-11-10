import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/golf-team-game/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Golf-poängräknare',
        short_name: 'Golfpoäng',
        description: 'Räkna poäng för bästboll/sämstboll och Köpenhamare på golfbanan.',
        lang: 'sv',
        start_url: '/golf-team-game/',
        scope: '/golf-team-game/',
        display: 'standalone',
        background_color: '#1f6f43',
        theme_color: '#1f6f43',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json}'],
      },
    }),
  ],
})
