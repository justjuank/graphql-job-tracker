import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, '.', '')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/graphql': {
          target: environment.API_PROXY_TARGET ?? 'http://localhost:4000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/graphql/, '/'),
        },
      },
    },
  }
})
