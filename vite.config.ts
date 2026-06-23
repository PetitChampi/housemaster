import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // three.js makes the lazily loaded house backdrop chunk large on purpose
    // it's code split out of the main bundle and only fetched once a signed-in user reaches the house
    chunkSizeWarningLimit: 600,
  },
})
