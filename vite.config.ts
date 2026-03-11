import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Fair Factory Friends',
        short_name: '공정공장',
        description: '사회정서학습과 경제 원리를 결합한 공정무역 에듀테크 플랫폼',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        globIgnores: ['**/*.mp3', '**/sages/**', '**/bgm/**'],
      },
    }),
  ],
  resolve: {
    alias: { '@': '/src' },
  },
  // 프로덕션 빌드에서 console.log, debugger 제거 → F12 정보 노출 방지
  esbuild: {
    drop: mode === 'production' ? (['console', 'debugger'] as const) : [],
  },
}))
