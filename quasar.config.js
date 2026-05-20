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
          primary: '#1a5fa8',
          secondary: '#0095C8',
          accent: '#6750A4',
          dark: '#1A1C20',
          'dark-page': '#101418',
          positive: '#1B6B3A',
          negative: '#BA1A1A',
          info: '#1a5fa8',
          warning: '#875200'
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

        mac: {
          target: [{ target: 'dmg', arch: ['arm64'] }],
          artifactName: isSiswa ? 'SiosCBE-Siswa-Mac.${ext}' : 'SiosCBE-Guru-Mac.${ext}',
          category: 'public.app-category.education',
          icon: 'src-electron/icons/linux-512x512.png',
          // Unsigned — tidak perlu Apple Developer certificate
          identity: null,
          hardenedRuntime: false
        },
        dmg: {
          title: isSiswa ? 'Sios CBE Siswa' : 'Sios CBE Guru',
          window: { width: 540, height: 380 }
        },

        // Native .node files harus di luar asar
        asarUnpack: ['**/*.node'],
        publish: null
      }
    }
  }
})
