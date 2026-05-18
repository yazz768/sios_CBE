import { WebSocketServer } from 'ws'

// Map<token, Map<peserta_id, { nama, data, lastSeen }>>
const screenStore = new Map()

// Map<token, Set<WebSocket>> — guru clients yang subscribe
const guruClients = new Map()

export function setupCsp (httpServer) {
  const wss = new WebSocketServer({ server: httpServer })

  wss.on('connection', (ws) => {
    let clientType = null  // 'siswa' | 'guru'
    let clientPesertaId = null
    let clientToken = null

    ws.on('message', (raw) => {
      let msg
      try { msg = JSON.parse(raw) } catch { return }

      switch (msg.type) {
        case 'csp:register': {
          clientType = 'siswa'
          clientPesertaId = msg.peserta_id
          clientToken = msg.token
          if (!screenStore.has(clientToken)) screenStore.set(clientToken, new Map())
          screenStore.get(clientToken).set(clientPesertaId, {
            nama: msg.nama || `Siswa ${clientPesertaId}`,
            data: null,
            lastSeen: Date.now()
          })
          break
        }

        case 'csp:frame': {
          const { peserta_id, token, data } = msg
          if (!screenStore.has(token)) break
          const entry = screenStore.get(token).get(peserta_id)
          if (entry) {
            entry.data = data
            entry.lastSeen = Date.now()
          }
          // Broadcast ke semua guru yang subscribe token ini
          const payload = JSON.stringify({
            type: 'csp:update',
            peserta_id,
            nama: entry?.nama,
            data,
            timestamp: Date.now()
          })
          broadcastToGuru(token, payload)
          break
        }

        case 'csp:end': {
          const { peserta_id, token } = msg
          if (screenStore.has(token)) {
            screenStore.get(token).delete(peserta_id)
            if (screenStore.get(token).size === 0) screenStore.delete(token)
          }
          broadcastToGuru(token, JSON.stringify({ type: 'csp:offline', peserta_id }))
          break
        }

        case 'csp:subscribe': {
          clientType = 'guru'
          clientToken = msg.token
          if (!guruClients.has(clientToken)) guruClients.set(clientToken, new Set())
          guruClients.get(clientToken).add(ws)

          // Kirim snapshot semua frame saat ini
          const students = screenStore.get(clientToken)
          if (students) {
            for (const [pid, entry] of students) {
              if (entry.data) {
                ws.send(JSON.stringify({
                  type: 'csp:update',
                  peserta_id: pid,
                  nama: entry.nama,
                  data: entry.data,
                  timestamp: entry.lastSeen
                }))
              }
            }
          }
          break
        }
      }
    })

    ws.on('close', () => {
      if (clientType === 'guru' && clientToken) {
        const clients = guruClients.get(clientToken)
        if (clients) {
          clients.delete(ws)
          if (clients.size === 0) guruClients.delete(clientToken)
        }
      }

      // Jika siswa disconnect tanpa csp:end, tandai offline
      if (clientType === 'siswa' && clientToken && clientPesertaId) {
        if (screenStore.has(clientToken)) {
          screenStore.get(clientToken).delete(clientPesertaId)
        }
        broadcastToGuru(clientToken, JSON.stringify({
          type: 'csp:offline',
          peserta_id: clientPesertaId
        }))
      }
    })

    ws.on('error', () => {})
  })

  return wss
}

function broadcastToGuru (token, payload) {
  const clients = guruClients.get(token)
  if (!clients) return
  for (const guruWs of clients) {
    if (guruWs.readyState === 1) { // WebSocket.OPEN = 1
      try { guruWs.send(payload) } catch (_) {}
    }
  }
}
