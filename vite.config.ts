import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages のプロジェクトサイトはサブパス配信になるため base を合わせる
export default defineConfig({
  base: '/roba-trainer/',
  plugins: [react()],
})
