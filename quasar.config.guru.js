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
        APP_MODE: 'guru'
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
      inspectPort: 5858,
      bundler: 'builder',

      preloadScripts: ['electron-preload'],

      extendElectronMainConf (config) {
        config.format = 'cjs'
        config.platform = 'node'
      },

      builder: {
        appId: 'com.cbe.guru',
        productName: 'CBE Guru',
        copyright: 'Copyright 2025 Sios CBE',

        linux: {
          target: [{ target: 'AppImage', arch: ['x64'] }],
          artifactName: 'CBE-Guru-Linux.${ext}',
          category: 'Education'
        },
        win: {
          target: [{ target: 'nsis', arch: ['x64'] }],
          artifactName: 'CBE-Guru-Windows.${ext}'
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: true,
          shortcutName: 'CBE Guru'
        },

        asarUnpack: ['**/*.node']
      }
    }
  }
})
