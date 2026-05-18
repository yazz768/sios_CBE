import { configure } from 'quasar/wrappers'

export default configure(function (/* ctx */) {
  const appMode = process.env.APP_MODE || 'guru'
  const isSiswa = appMode === 'siswa'

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
      // Teruskan APP_MODE dari environment ke kode renderer (Vue)
      env: {
        APP_MODE: process.env.APP_MODE || 'guru'
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

      // Compile electron-main sebagai CJS agar require('electron') diintersepsi Electron runtime
      extendElectronMainConf (config) {
        config.format = 'cjs'
        config.platform = 'node'
      },

      builder: {
        appId: isSiswa ? 'com.cbe.siswa' : 'com.cbe.guru',
        productName: isSiswa ? 'Sios CBE Siswa' : 'Sios CBE Guru',
        copyright: 'Copyright 2025 Sios CBE',

        linux: {
          target: [{ target: 'AppImage', arch: ['x64'] }],
          artifactName: isSiswa ? 'SiosCBE-Siswa-Linux.${ext}' : 'SiosCBE-Guru-Linux.${ext}',
          category: 'Education'
        },
        win: {
          target: [{ target: 'nsis', arch: ['x64'] }],
          artifactName: isSiswa ? 'SiosCBE-Siswa-Windows.${ext}' : 'SiosCBE-Guru-Windows.${ext}'
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: true,
          shortcutName: isSiswa ? 'Sios CBE Siswa' : 'Sios CBE Guru'
        },

        // Native .node files harus di luar asar
        asarUnpack: ['**/*.node'],
        publish: null
      }
    }
  }
})
