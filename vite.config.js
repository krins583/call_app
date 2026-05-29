import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // YAHAN APNE REPO KA NAAM DAALEIN
  base: '/call_app/', 
})