import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Set VITE_BASE (e.g. "/curriculum/") when deploying to a GitHub Pages project site.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react(), tailwindcss()],
  assetsInclude: ["**/*.md"],
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          markdown: ["react-markdown", "remark-gfm", "remark-math", "rehype-raw", "rehype-katex"],
          katex: ["katex"],
        },
      },
    },
  },
});
