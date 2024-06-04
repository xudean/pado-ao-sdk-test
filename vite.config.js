import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'

// https://vitejs.dev/config/
export default defineConfig((mode) => {
  const env = loadEnv(mode, process.cwd())
  const processEnvValues = {
    'process.browser': true,
    'process.env': Object.entries(env).reduce((prev, [key, val]) => {
      return {
        ...prev,
        [key]: val
      }
    }, {})
  }
  if (mode.mode === 'development') {
    return {
      define: Object.assign(processEnvValues, { global: {} }),
      plugins: [
        react(),
      ],
      optimizeDeps: {
      exclude: ['@xudean/pado-ao-sdk'],
  }
    }
  }

  return {
    define: Object.assign(processEnvValues, { global: {} }),
   
    optimizeDeps: {
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          // can't use this
          // https://github.com/intlify/vue-i18n-next/issues/970
          // global: "globalThis",
        },
        // Enable esbuild polyfill plugins
        plugins: [
          NodeGlobalsPolyfillPlugin({
            process: true,
            buffer: true
          }),
          NodeModulesPolyfillPlugin()
        ]
      },
      exclude: ['@xudean/pado-ao-sdk'],
    },
    plugins: [
      react(),
    ],
   
  }
})

