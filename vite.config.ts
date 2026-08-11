import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // 不自动清空 outDir：public/news-html 随日报增长已超过 50 个文件，
    // vite 的 emptyDir 批量删除会触发 WorkBuddy 安全删除护栏（阈值 50）导致构建失败。
    // 关闭后构建零批量删除，护栏不再拦截。dist 不参与线上部署（EdgeOne 从源码构建），
    // 旧构建产物为未引用孤儿，无功能影响。
    emptyOutDir: false,
  },
});
