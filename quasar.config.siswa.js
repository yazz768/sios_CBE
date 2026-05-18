import { configure } from 'quasar/wrappers'

export default configure(function (/* ctx */) {
  return {
    boot: ['pinia'],

    css: ['app.scss'],

    extras: ['material-icons'],

    build: {
      target: {
        browser: ['es2022'],
        node: 'node22'
      },
      vueRouterMode: 'hash',
      vitePlugins: [],
      env: {
        APP_MODE: 'siswa'
      }
    },

    devServer: {
      open: false
    },

    framework: {
      config: {
        brand: {
          primary: '#1a3a5c',
          secondary: '#26A69A',
          accent: '#9C27B0',
          dark: '#1d1d1d',
          positive: '#21BA45',
          negative: '#C10015',
          info: '#31CCEC',
          warning: '#F2C037'
        }
      },
      plugins: ['Dark', 'Notify', 'Dialog', 'Loading']
    },

    animations: [],

    electron: {
      inspectPort: 5859,
      bundler: 'builder',

      preloadScripts: ['electron-preload'],

      extendElectronMainConf (config) {
        config.format = 'cjs'
        config.platform = 'node'
      },

      builder: {
        appId: 'com.cbe.siswa',
        productName: 'CBE Siswa',
        copyright: 'Copyright 2025 Sios CBE',

        linux: {
          target: [{ target: 'AppImage', arch: ['x64'] }],
          artifactName: 'CBE-Siswa-Linux.${ext}',
          category: 'Education'
        },
        win: {
          target: [{ target: 'nsis', arch: ['x64'] }],
          artifactName: 'CBE-Siswa-Windows.${ext}'
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: true,
          shortcutName: 'CBE Siswa'
        },

        asarUnpack: ['**/*.node']
      }
    }
  }
})
