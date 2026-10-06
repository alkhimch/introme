import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base works on both github.io/introme/ and a custom domain.
export default defineConfig({
  base: './',
  plugins: [react()],
})
