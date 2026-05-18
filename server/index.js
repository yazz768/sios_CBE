import express from 'express'
import cors from 'cors'
import { join } from 'path'
import { initDb } from './db/database.js'
import siswaRoutes from './routes/siswa.js'
import guruRoutes from './routes/guru.js'
import { setupCsp } from './csp.js'

export { serverEvents } from './events.js'

const PORT = 3000
let serverInstance = null

export function startServer (userDataPath) {
  if (serverInstance) return serverInstance

  // Inisialisasi database dengan path dari Electron
  initDb(userDataPath)

  const app = express()

  app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }))
  app.use(express.json())

  // Serve gambar soal yang diupload guru
  app.use('/images', express.static(join(userDataPath, 'images')))

  // Routes siswa — dapat diakses dari jaringan LAN
  app.use('/', siswaRoutes)

  // Routes guru — dilindungi middleware localhostOnly di dalam guruRoutes
  app.use('/guru', guruRoutes)

  serverInstance = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CBE Server] Berjalan di port ${PORT}`)
  })

  serverInstance.on('error', (err) => {
    console.error('[CBE Server] Error:', err.message)
  })

  // CSP: WebSocket server pada HTTP server yang sama (port 3000)
  setupCsp(serverInstance)

  return serverInstance
}

export function stopServer () {
  if (serverInstance) {
    serverInstance.close()
    serverInstance = null
    console.log('[CBE Server] Dihentikan')
  }
}
