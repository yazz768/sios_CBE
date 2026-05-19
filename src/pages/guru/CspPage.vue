<template>
  <q-page padding class="csp-page">

    <!-- ── HEADER ─────────────────────────────────────────────── -->
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" :to="`/monitor/${route.params.token}`" class="csp-back-btn q-mr-sm" />
      <div class="csp-title">Monitor Layar Siswa</div>
      <q-space />
      <div class="row items-center q-gutter-sm">
        <div class="csp-stat-pill csp-pill-online">
          <span class="csp-dot-green" />
          {{ onlineCount }} Online
        </div>
        <div class="csp-stat-pill csp-pill-offline">
          <span class="csp-dot-red" />
          {{ offlineCount }} Offline
        </div>
        <div class="csp-stat-pill csp-pill-total">
          Total: {{ Object.keys(screens).length }}
        </div>
        <div class="csp-ws-chip" :class="wsConnected ? 'csp-ws-connected' : 'csp-ws-disconnected'">
          <q-icon :name="wsConnected ? 'wifi' : 'wifi_off'" size="13px" class="q-mr-xs" />
          {{ wsConnected ? 'Terhubung' : 'Menghubungkan...' }}
        </div>
        <div class="csp-token-chip">
          <q-icon name="vpn_key" size="13px" class="q-mr-xs" />
          {{ route.params.token }}
        </div>
      </div>
    </div>

    <!-- Refresh hint -->
    <div class="csp-refresh-row q-mb-lg">
      <q-icon name="refresh" size="13px" class="csp-spin q-mr-xs" />
      Update otomatis setiap 1 detik
    </div>

    <!-- ── EMPTY STATE ─────────────────────────────────────────── -->
    <div v-if="Object.keys(screens).length === 0" class="csp-empty">
      <div class="csp-empty-icon-wrap">
        <q-icon name="monitor" size="56px" class="csp-empty-icon" />
      </div>
      <div class="csp-empty-title">Menunggu siswa memulai ujian...</div>
      <div class="csp-empty-sub">Layar siswa akan muncul di sini secara otomatis</div>
      <div class="csp-loading-dots">
        <span /><span /><span />
      </div>
    </div>

    <!-- ── GRID SCREENSHOTS ────────────────────────────────────── -->
    <div class="row q-col-gutter-md">
      <div
        v-for="(screen, pid) in screens"
        :key="pid"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <div
          class="csp-card cursor-pointer"
          :class="screen.online ? 'csp-card-online' : 'csp-card-offline'"
          @click="openFull(pid, screen)"
        >
          <!-- Screenshot area -->
          <div class="csp-thumb-wrap">
            <img
              v-if="screen.data"
              :src="`data:image/jpeg;base64,${screen.data}`"
              class="csp-thumb"
            />
            <div v-else class="csp-thumb-placeholder flex flex-center">
              <div class="text-center">
                <q-icon name="monitor" size="28px" class="csp-placeholder-icon" />
                <div class="csp-placeholder-text q-mt-xs">Menunggu frame...</div>
              </div>
            </div>

            <!-- Offline overlay -->
            <div v-if="!screen.online" class="csp-offline-overlay flex flex-center">
              <div class="text-center text-white">
                <q-icon name="wifi_off" size="24px" />
                <div class="csp-offline-text q-mt-xs">Tidak Terhubung</div>
              </div>
            </div>

            <!-- Bottom overlay: name + status -->
            <div class="csp-bottom-overlay">
              <div class="csp-screen-name text-truncate">{{ screen.nama }}</div>
              <div class="csp-screen-badge" :class="screen.online ? 'csp-live' : 'csp-offl'">
                {{ screen.online ? 'Live' : 'Offline' }}
              </div>
            </div>

            <!-- Expand hint -->
            <div class="csp-expand-hint">
              <q-icon name="open_in_full" size="16px" color="white" />
            </div>
          </div>

          <!-- Timestamp -->
          <div class="csp-card-footer">
            <q-icon name="access_time" size="12px" class="q-mr-xs" />
            {{ screen.lastSeenText || 'Baru saja' }}
          </div>
        </div>
      </div>
    </div>

    <!-- ── DIALOG FULL-SIZE ────────────────────────────────────── -->
    <q-dialog v-model="fullDialog" maximized transition-show="fade" transition-hide="fade">
      <div class="csp-full-dialog">
        <div class="csp-full-bar">
          <q-icon name="monitor" size="18px" class="q-mr-sm" />
          <span class="csp-full-name">{{ fullScreen?.nama }}</span>
          <div class="csp-screen-badge q-ml-sm" :class="fullScreen?.online ? 'csp-live' : 'csp-offl'">
            {{ fullScreen?.online ? 'Live' : 'Offline' }}
          </div>
          <span class="csp-full-ts q-ml-md">{{ fullScreen?.lastSeenText }}</span>
          <q-space />
          <q-btn dense flat round icon="close" color="white" v-close-popup />
        </div>
        <div class="csp-full-body flex flex-center">
          <img
            v-if="fullScreen?.data"
            :src="`data:image/jpeg;base64,${fullScreen.data}`"
            class="csp-full-img"
          />
          <div v-else class="text-center csp-full-empty">
            <q-icon name="monitor" size="64px" />
            <div class="q-mt-sm">Belum ada frame</div>
          </div>
        </div>
      </div>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useGuruStore } from 'stores/guru'

const route = useRoute()
const guruStore = useGuruStore()

// { [peserta_id]: { nama, data, online, lastSeen, lastSeenText } }
const screens = reactive({})
const wsConnected = ref(false)
const fullDialog = ref(false)
const fullPid = ref(null)
const fullScreen = computed(() => fullPid.value ? screens[fullPid.value] : null)

const onlineCount = computed(() => Object.values(screens).filter(s => s.online).length)
const offlineCount = computed(() => Object.values(screens).filter(s => !s.online).length)

let ws = null
let tickInterval = null
let reconnectTimer = null
let destroyed = false

function openFull (pid, _screen) {
  fullPid.value = pid
  fullDialog.value = true
}


function connectWs () {
  if (destroyed) return
  const port = guruStore.serverInfo.port || 3000
  ws = new WebSocket(`ws://127.0.0.1:${port}`)

  ws.onopen = () => {
    wsConnected.value = true
    ws.send(JSON.stringify({ type: 'csp:subscribe', token: route.params.token }))
  }

  ws.onmessage = (event) => {
    let msg
    try { msg = JSON.parse(event.data) } catch { return }

    if (msg.type === 'csp:update') {
      const pid = msg.peserta_id
      if (!screens[pid]) {
        screens[pid] = { nama: msg.nama || `Siswa ${pid}`, data: null, online: true, lastSeen: null, lastSeenText: '' }
      }
      screens[pid].data = msg.data
      screens[pid].online = true
      screens[pid].lastSeen = msg.timestamp
      screens[pid].lastSeenText = 'Baru saja'
      if (msg.nama) screens[pid].nama = msg.nama
    } else if (msg.type === 'csp:offline') {
      const pid = msg.peserta_id
      if (screens[pid]) {
        // Hapus kartu murid setelah 1.5 detik — murid sudah selesai/disconnect
        setTimeout(() => { delete screens[pid] }, 1500)
      }
    }
  }

  ws.onclose = () => {
    wsConnected.value = false
    if (!destroyed) {
      reconnectTimer = setTimeout(connectWs, 2000)
    }
  }

  ws.onerror = () => {}
}

onMounted(async () => {
  await guruStore.fetchServerInfo()
  connectWs()

  // interval tidak diperlukan lagi — screen offline langsung dihapus
})

onUnmounted(() => {
  destroyed = true
  clearInterval(tickInterval)
  clearTimeout(reconnectTimer)
  if (ws) {
    ws.onclose = null
    ws.close()
    ws = null
  }
})
</script>

<style scoped>
/* ── TITLE & BACK ─────────────────────────────────────────── */
.csp-title {
  font-size: 20px; font-weight: 700; letter-spacing: -0.3px;
  background: linear-gradient(90deg, #1a5fa8, #0095C8);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.csp-back-btn {
  color: var(--c-text-2) !important;
  background: var(--c-surface-2) !important;
  border: 1px solid var(--c-border) !important;
}
.csp-back-btn:hover { background: var(--c-accent-soft) !important; color: var(--c-accent) !important; }

/* ── HEADER PILLS — M3 Assist Chip ───────────────────────── */
.csp-stat-pill {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600;
}
.csp-pill-online  { background: var(--c-success-bg); border: 1px solid var(--c-success); color: var(--c-success); }
.csp-pill-offline { background: var(--c-danger-bg); border: 1px solid var(--c-danger); color: var(--c-danger); }
.csp-pill-total   {
  font-size: 12px; font-weight: 600;
  background: var(--c-surface-2); border: 1px solid var(--c-border); color: var(--c-text-2);
}
.csp-dot-green { width: 6px; height: 6px; border-radius: 50%; background: var(--c-success); flex-shrink: 0; }
.csp-dot-red   { width: 6px; height: 6px; border-radius: 50%; background: var(--c-danger); flex-shrink: 0; }

.csp-ws-chip {
  display: flex; align-items: center;
  padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600;
}
.csp-ws-connected    { background: var(--c-success-bg); border: 1px solid var(--c-success); color: var(--c-success); }
.csp-ws-disconnected { background: var(--c-surface-2); border: 1px solid var(--c-border); color: var(--c-text-3); }

.csp-token-chip {
  display: flex; align-items: center;
  padding: 4px 12px; border-radius: 999px;
  font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600;
  background: var(--c-accent-soft); border: 1px solid var(--c-border); color: var(--c-accent);
}

/* ── REFRESH HINT ─────────────────────────────────────────── */
.csp-refresh-row { display: flex; align-items: center; font-size: 12px; color: var(--c-text-3); }
@keyframes cspSpin { to { transform: rotate(360deg); } }
.csp-spin { animation: cspSpin 3s linear infinite; display: inline-block; }

/* ── EMPTY STATE ──────────────────────────────────────────── */
.csp-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 20px;
}
.csp-empty-icon-wrap {
  width: 100px; height: 100px; border-radius: var(--radius-xl);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24px;
  background: var(--c-accent-soft); border: 1px solid var(--c-border);
}
.csp-empty-icon { color: var(--c-accent); }
.csp-empty-title {
  font-size: 18px; font-weight: 700; margin-bottom: 8px; color: var(--c-text);
}
.csp-empty-sub { font-size: 13px; margin-bottom: 24px; color: var(--c-text-3); }

.csp-loading-dots { display: flex; gap: 6px; }
.csp-loading-dots span {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--c-accent);
  animation: cspDot 1.4s ease-in-out infinite;
}
.csp-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.csp-loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes cspDot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* ── GRID CARDS — M3 Surface ──────────────────────────────── */
.csp-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform 0.15s, box-shadow 0.15s;
  background: var(--c-surface);
}
.csp-card:hover { transform: scale(1.02); box-shadow: var(--m3-elev-3) !important; }
.csp-card-online  { border: 2px solid var(--c-success); box-shadow: var(--m3-elev-1); }
.csp-card-offline { border: 2px solid var(--c-danger); opacity: 0.7; box-shadow: var(--m3-elev-1); }

/* ── THUMB ────────────────────────────────────────────────── */
.csp-thumb-wrap { position: relative; aspect-ratio: 16/9; background: #0d1117; overflow: hidden; }
.csp-thumb { width: 100%; height: 100%; object-fit: contain; display: block; }
.csp-thumb-placeholder { width: 100%; height: 100%; }
.csp-placeholder-icon { color: var(--c-accent); opacity: 0.4; }
.csp-placeholder-text { font-size: 11px; color: var(--c-text-3); }

.csp-offline-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.6);
}
.csp-offline-text { font-size: 11px; margin-top: 4px; }

.csp-bottom-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 20px 10px 8px;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  display: flex; align-items: center; justify-content: space-between;
}
.csp-screen-name { font-size: 12px; font-weight: 600; color: white; flex: 1; margin-right: 6px; }
.csp-screen-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px; flex-shrink: 0; }
.csp-live { background: rgba(16,185,129,0.85); color: white; }
.csp-offl { background: rgba(148,163,184,0.7); color: white; }

.csp-expand-hint {
  position: absolute; top: 6px; right: 6px;
  background: rgba(0,0,0,0.4); border-radius: var(--radius-sm); padding: 3px 5px;
  opacity: 0; transition: opacity 0.15s;
}
.csp-card:hover .csp-expand-hint { opacity: 1; }

/* ── CARD FOOTER ──────────────────────────────────────────── */
.csp-card-footer {
  display: flex; align-items: center; padding: 7px 10px; font-size: 11px;
  color: var(--c-text-3); background: var(--c-surface);
}

/* ── FULL-SIZE DIALOG ─────────────────────────────────────── */
.csp-full-dialog { display: flex; flex-direction: column; height: 100vh; background: #0a0a0f; }
.csp-full-bar {
  display: flex; align-items: center; padding: 0 16px;
  height: 48px; flex-shrink: 0;
  background: #1A1C20; border-bottom: 1px solid #383C44;
}
.csp-full-name { font-weight: 600; font-size: 14px; color: #E2E5EF; }
.csp-full-ts   { font-size: 12px; color: #677082; }
.csp-full-body { flex: 1; background: #111; overflow: hidden; }
.csp-full-img  { max-width: 100%; max-height: 100%; object-fit: contain; }
.csp-full-empty { color: #677082; }
</style>
