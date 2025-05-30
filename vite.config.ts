/// <reference types="vitest" />

import { type ConfigEnv, type UserConfigExport, loadEnv } from "vite"
import path, { resolve } from "path"
import vue from "@vitejs/plugin-vue"
import vueJsx from "@vitejs/plugin-vue-jsx"
import { createSvgIconsPlugin } from "vite-plugin-svg-icons"
import svgLoader from "vite-svg-loader"
import UnoCSS from "unocss/vite"
import fs from "fs" // Keep fs import

// Read package.json - Keep this outside the export function
const packageJsonPath = resolve(__dirname, `package.json`) // Use resolve for robustness
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, `utf-8`));

/** 配置项文档：https://cn.vitejs.dev/config */
export default ({ mode }: ConfigEnv): UserConfigExport => {
  const viteEnv = loadEnv(mode, process.cwd()) as ImportMetaEnv
  const { VITE_PUBLIC_PATH } = viteEnv
  return {
    /** 打包时根据实际情况修改 base */
    base: VITE_PUBLIC_PATH,
    resolve: {
      alias: {
        /** @ 符号指向 src 目录 */
        "@": resolve(__dirname, "./src")
      }
    },
    server: {
      /** 设置 host: true 才可以使用 Network 的形式，以 IP 访问项目 */
      host: true, // host: "0.0.0.0"
      /** 端口号 */
      port: 8888,
      /** 是否自动打开浏览器 */
      open: false,
      /** 跨域设置允许 */
      cors: true,
      /** 端口被占用时，是否直接退出 */
      strictPort: false,
      /** 接口代理 */
      proxy: {
        // Keep your existing proxy, but ensure the target is correct for development
        // If your backend runs on 8080 locally:
        "/api/v1": {
          // target: "https://mock.mengxuegu.com/mock/66be0c9755057713835fe7c0", // Keep mock if needed for other things
          target: "http://localhost:8080", // <<< Point to your LOCAL backend for fetching dependencies
          ws: true,
          /** 是否允许跨域 */
          changeOrigin: true
          // Optional: Remove the /api/v1 prefix if your backend doesn't expect it
          // rewrite: (path) => path.replace(/^\/api\/v1/, '')
        }
      },
      /** 预热常用文件，提高初始页面加载速度 */
      warmup: {
        clientFiles: ["./src/layouts/**/*.vue"]
      }
    },
    build: {
      /** 单个 chunk 文件的大小超过 2048KB 时发出警告 */
      chunkSizeWarningLimit: 2048,
      /** 禁用 gzip 压缩大小报告 */
      reportCompressedSize: false,
      /** 打包后静态资源目录 */
      assetsDir: "static",
      rollupOptions: {
        output: {
          /**
           * 分块策略
           * 1. 注意这些包名必须存在，否则打包会报错
           * 2. 如果你不想自定义 chunk 分割策略，可以直接移除这段配置
           */
          manualChunks: {
            vue: ["vue", "vue-router", "pinia"],
            element: ["element-plus", "@element-plus/icons-vue"],
            // vxe: ["vxe-table", "vxe-table-plugin-element", "xe-utils"] // Only include if you use vxe-table
            // Add other large dependencies if needed
            lodash: ["lodash-es"],
            echarts: ["echarts", "vue-echarts"],
            yaml: ["js-yaml"]
          }
        }
      }
    },
    /** 混淆器 */
    esbuild:
      mode === "development"
        ? undefined
        : {
            /** 打包时移除 console.log */
            pure: ["console.log"],
            /** 打包时移除 debugger */
            drop: ["debugger"],
            /** 打包时移除所有注释 */
            legalComments: "none"
          },

    // --- ADD THE DEFINE SECTION HERE ---
    define: {
      // Make dependencies available (consider if devDeps are needed)
      '__APP_DEPENDENCIES__': JSON.stringify(packageJson.dependencies || {}),
      '__APP_DEV_DEPENDENCIES__': JSON.stringify(packageJson.devDependencies || {}),
      '__APP_VERSION__': JSON.stringify(packageJson.version || 'unknown'),
    },
    // ------------------------------------

    /** Vite 插件 */
    plugins: [
      vue(),
      vueJsx(),
      /** 将 SVG 静态图转化为 Vue 组件 */
      svgLoader({ defaultImport: "url" }), // Keep 'url' if that's what you need, or change as necessary
      /** SVG */
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), "src/icons/svg")],
        symbolId: "icon-[dir]-[name]"
      }),
      /** UnoCSS */
      UnoCSS() // Keep if you are using UnoCSS
    ],
    /** Vitest 单元测试配置：https://cn.vitest.dev/config */
    test: {
      include: ["tests/**/*.test.ts"],
      environment: "jsdom"
    }
  }
}