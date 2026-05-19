import { app, BrowserWindow, ipcMain, globalShortcut, nativeTheme, dialog, desktopCapturer, session } from 'electron'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { startServer, stopServer, serverEvents } from '../server/index.js'

const platform = process.platform || os.platform()

// Linux/Wayland: matikan PipeWire WebRTC capturer agar desktopCapturer
// tidak melalui xdg-desktop-portal dan tidak memunculkan dialog picker.
// Electron akan fallback ke X11 screen capture via XWayland (silent).
if (platform === 'linux') {
  app.commandLine.appendSwitch('disable-features', 'WebRtcPipeWireCapturer')
}
const currentDir = __dirname

let mainWindow = null
let isExamActive = false

function getLocalIP () {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return '127.0.0.1'
}

async function createWindow () {
  nativeTheme.themeSource = 'light'

  mainWindow = new BrowserWindow({
    icon: path.resolve(currentDir, 'icons/icon.png'),
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    fullscreen: false,
    maximizable: true,
    useContentSize: true,
    title: 'Sios CBE',
    backgroundColor: '#F5F8FF',  // cegah flash putih/warna default Electron
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.resolve(
        currentDir,
        path.join(
          process.env.QUASAR_ELECTRON_PRELOAD_FOLDER,
          'electron-preload' + process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION
        )
      )
    }
  })

  mainWindow.maximize()

  if (process.env.DEV) {
    await mainWindow.loadURL(process.env.APP_URL)
  } else {
    await mainWindow.loadFile('index.html')
  }

  // Jangan pernah buka DevTools — baik dev maupun production
  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow.webContents.closeDevTools()
  })

  // Blokir navigasi ke URL eksternal saat exam aktif
  mainWindow.webContents.on('will-navigate', (event) => {
    if (isExamActive) event.preventDefault()
  })

  // Blokir shortcut di level renderer — fallback utama untuk Wayland
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (!isExamActive) return
    const blocked = (
      // Semua F-key
      ['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'].includes(input.key) ||
      // DevTools & inspect
      (input.control && input.shift && ['i','I','j','J','c','C','k','K','p','P'].includes(input.key)) ||
      // Tab/window management
      (input.control && ['r','R','u','U','w','W','n','N','t','T','a','A','s','S','p','P'].includes(input.key)) ||
      // Alt combinations
      (input.alt && ['F4','Tab','Escape',' '].includes(input.key)) ||
      // Escape, PrintScreen
      input.key === 'Escape' ||
      input.key === 'PrintScreen' ||
      // Meta/Super
      input.meta
    )
    if (blocked) event.preventDefault()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ─── IPC: Exam Lockdown ───────────────────────────────────────

ipcMain.handle('exam:start', () => {
  if (!mainWindow) return
  isExamActive = true

  // Kiosk mode — paling efektif blokir Alt+Tab di level OS
  mainWindow.setKiosk(true)
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1)
  mainWindow.setFullScreen(true)
  mainWindow.setSkipTaskbar(true)
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  mainWindow.focus()
  mainWindow.moveTop()

  // Interval paksa fokus setiap 500ms selama ujian aktif
  if (global.focusInterval) clearInterval(global.focusInterval)
  global.focusInterval = setInterval(() => {
    if (isExamActive && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.focus()
      mainWindow.moveTop()
    }
  }, 500)

  const shortcuts = [
    'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
    'Ctrl+Escape', 'Ctrl+Tab', 'Ctrl+Shift+Tab',
    'Ctrl+W', 'Ctrl+T', 'Ctrl+N', 'Ctrl+Shift+N',
    'Ctrl+R', 'Ctrl+Shift+R', 'Ctrl+U',
    'Ctrl+Shift+I', 'Ctrl+Shift+J', 'Ctrl+Shift+C',
    'Ctrl+A', 'Ctrl+S', 'Ctrl+P',
    'PrintScreen', 'Alt+PrintScreen',
    'Super', 'Super+D', 'Super+L', 'Super+Tab',
    'Super+Left', 'Super+Right', 'Super+Up', 'Super+Down',
    'Meta+D', 'Meta+L', 'Meta+Tab',
  ]

  // Shortcut tambahan khusus macOS
  if (platform === 'darwin') {
    shortcuts.push(
      'Command+Q',           // Quit
      'Command+H',           // Hide
      'Command+M',           // Minimize
      'Command+W',           // Close window
      'Command+Tab',         // App switcher
      'Command+Shift+Tab',
      'Command+Space',       // Spotlight
      'Command+Option+Escape', // Force quit dialog
      'Command+Control+Q',   // Lock screen
      'Command+Control+F',   // Fullscreen toggle
      'Command+Option+D',    // Show/hide Dock
    )
  }

  for (const s of shortcuts) {
    try { globalShortcut.register(s, () => {}) } catch (_) {}
  }
})

ipcMain.handle('exam:end', () => {
  if (!mainWindow) return

  if (global.focusInterval) {
    clearInterval(global.focusInterval)
    global.focusInterval = null
  }

  isExamActive = false

  mainWindow.setKiosk(false)
  mainWindow.setAlwaysOnTop(false)
  mainWindow.setFullScreen(false)
  mainWindow.setSkipTaskbar(false)
  mainWindow.setVisibleOnAllWorkspaces(false)
  globalShortcut.unregisterAll()
})

ipcMain.handle('app:closeWindow', () => {
  if (mainWindow) mainWindow.close()
})

// IPC: Paksa fokus ke window (dipanggil saat renderer kehilangan fokus saat exam)
ipcMain.handle('app:focusWindow', () => {
  if (!mainWindow || !isExamActive) return
  mainWindow.focus()
  mainWindow.moveTop()
})

// IPC: Info server (IP lokal + port)
ipcMain.handle('app:getServerInfo', () => ({
  ip: getLocalIP(),
  port: 3000
}))

// IPC: Backup database SQLite
ipcMain.handle('db:backup', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Simpan Backup Database',
    defaultPath: `backup-cbe-${Date.now()}.db`,
    filters: [{ name: 'SQLite Database', extensions: ['db'] }]
  })
  if (result.canceled) return { success: false }
  const src = path.join(app.getPath('userData'), 'cbe_system.db')
  fs.copyFileSync(src, result.filePath)
  return { success: true, filePath: result.filePath }
})

// IPC: Export PDF laporan hasil ujian
ipcMain.handle('app:exportPDF', async (_event, { html, filename }) => {
  const tmpFile = path.join(app.getPath('temp'), `report-${Date.now()}.html`)
  fs.writeFileSync(tmpFile, html, 'utf-8')

  const win = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  })
  await win.loadFile(tmpFile)

  const pdfBuffer = await win.webContents.printToPDF({
    pageSize: 'A4',
    printBackground: true,
    landscape: false,
    margins: { top: 1, bottom: 1, left: 1, right: 1 }
  })
  win.destroy()
  try { fs.unlinkSync(tmpFile) } catch (_) {}

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: filename || 'laporan-ujian.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })
  if (result.canceled) return { success: false }
  fs.writeFileSync(result.filePath, pdfBuffer)
  return { success: true }
})


// IPC: Pilih gambar untuk soal
ipcMain.handle('soal:selectImage', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Gambar', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }]
  })
  if (result.canceled) return null
  const srcPath = result.filePaths[0]
  const ext = path.extname(srcPath)
  const filename = `${Date.now()}${ext}`
  const destDir = path.join(app.getPath('userData'), 'images')
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
  fs.copyFileSync(srcPath, path.join(destDir, filename))
  return `/images/${filename}`
})

// ─── App Lifecycle ────────────────────────────────────────────

const isGuruMode = process.env.APP_MODE !== 'siswa'

app.whenReady().then(() => {
  const userDataPath = app.getPath('userData')

  // Intercept getDisplayMedia() di renderer — pilih layar pertama otomatis, tanpa dialog
  session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] })
      .then(sources => { callback({ video: sources[0] || null }) })
      .catch(() => callback({}))
  })

  // Server hanya dijalankan di mode guru
  if (isGuruMode) {
    startServer(userDataPath)

    // Forward event submit siswa ke renderer (guru app)
    serverEvents.on('student:submitted', ({ nama }) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('student:submitted', { nama })
      }
    })
  }

  createWindow()
})

// Paksa kembali fokus ke window saat blur selama exam aktif
app.on('browser-window-blur', () => {
  if (isExamActive && mainWindow && !mainWindow.isDestroyed()) {
    setTimeout(() => {
      if (isExamActive) {
        mainWindow.focus()
        mainWindow.moveTop()
      }
    }, 100)
  }
})

app.on('window-all-closed', () => {
  if (global.focusInterval) clearInterval(global.focusInterval)
  globalShortcut.unregisterAll()
  if (isGuruMode) stopServer()
  if (platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

// Cegah pembukaan window baru
app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
})
