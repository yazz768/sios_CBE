<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" :to="`/monitor/${route.params.token}`" class="q-mr-sm" />
      <div class="text-h5 text-primary col">Monitor Layar Siswa</div>
      <q-chip
        :color="wsConnected ? 'positive' : 'grey'"
        text-color="white"
        :icon="wsConnected ? 'wifi' : 'wifi_off'"
        dense
        class="q-mr-sm"
      >
        {{ wsConnected ? 'Terhubung' : 'Menghubungkan...' }}
      </q-chip>
      <q-chip color="primary" text-color="white" icon="vpn_key" dense>
        {{ route.params.token }}
      </q-chip>
    </div>

    <!-- Info bar -->
    <div class="row items-center q-mb-md q-gutter-sm">
      <q-badge color="positive" :label="`${onlineCount} Online`" />
      <q-badge color="grey" :label="`${offlineCount} Offline`" />
      <q-badge color="blue" :label="`Total: ${Object.keys(screens).length}`" />
      <q-space />
      <div class="text-caption text-grey-6">
        <q-icon name="refresh" size="14px" class="q-mr-xs" />Update otomatis setiap 1 detik
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="Object.keys(screens).length === 0" class="text-center q-py-xl">
      <q-icon name="monitor" size="64px" color="grey-4" />
      <div class="text-h6 text-grey-6 q-mt-md">Menunggu siswa memulai ujian...</div>
      <div class="text-caption text-grey-5">Layar siswa akan muncul di sini secara otomatis</div>
    </div>

    <!-- Grid screenshots -->
    <div class="row q-col-gutter-sm">
      <div
        v-for="(screen, pid) in screens"
        :key="pid"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card
          flat
          bordered
          class="cursor-pointer csp-card"
          :class="{ 'csp-card-offline': !screen.online }"
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
                <q-icon name="monitor" size="32px" color="grey-5" />
                <div class="text-caption text-grey-5 q-mt-xs">Menunggu frame...</div>
              </div>
            </div>

            <!-- Offline overlay -->
            <div v-if="!screen.online" class="csp-offline-overlay flex flex-center">
              <div class="text-center text-white">
                <q-icon name="wifi_off" size="28px" />
                <div class="text-caption q-mt-xs">Tidak Terhubung</div>
              </div>
            </div>

            <!-- Expand icon on hover -->
            <div class="csp-expand-icon">
              <q-icon name="open_in_full" size="18px" color="white" />
            </div>
          </div>

          <!-- Student info -->
          <q-card-section class="q-py-xs q-px-sm">
            <div class="row items-center no-wrap">
              <div class="col text-body2 text-weight-medium text-truncate" :title="screen.nama">
                {{ screen.nama }}
              </div>
              <q-badge
                :color="screen.online ? 'positive' : 'grey-5'"
                :label="screen.online ? 'Live' : 'Offline'"
                dense
                class="q-ml-xs"
              />
            </div>
            <div class="text-caption text-grey-5">{{ screen.lastSeenText }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialog full-size view -->
    <q-dialog v-model="fullDialog" maximized transition-show="fade" transition-hide="fade">
      <q-card class="bg-black">
        <q-bar class="bg-grey-10 text-white">
          <q-icon name="monitor" class="q-mr-sm" />
          <div class="text-weight-bold">{{ fullScreen?.nama }}</div>
          <q-badge
            :color="fullScreen?.online ? 'positive' : 'grey'"
            :label="fullScreen?.online ? 'Live' : 'Offline'"
            dense
            class="q-ml-sm"
          />
          <q-space />
          <div class="text-caption text-grey-4 q-mr-md">{{ fullScreen?.lastSeenText }}</div>
          <q-btn dense flat round icon="close" v-close-popup />
        </q-bar>
        <div class="flex flex-center" style="height: calc(100vh - 50px); background: #111">
          <img
            v-if="fullScreen?.data"
            :src="`data:image/jpeg;base64,${fullScreen.data}`"
            style="max-width: 100%; max-height: 100%; object-fit: contain"
          />
          <div v-else class="text-center text-grey-6">
            <q-icon name="monitor" size="64px" />
            <div class="q-mt-sm">Belum ada frame</div>
          </div>
        </div>
      </q-card>
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

function formatLastSeen (ts) {
  if (!ts) return ''
  const diff = Math.round((Date.now() - ts) / 1000)
  if (diff < 3) return 'Baru saja'
  if (diff < 60) return `${diff} detik lalu`
  return `${Math.round(diff / 60)} menit lalu`
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
        screens[pid].online = false
        screens[pid].lastSeenText = formatLastSeen(screens[pid].lastSeen)
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

  // Update timestamp teks setiap 5 detik
  tickInterval = setInterval(() => {
    for (const pid of Object.keys(screens)) {
      if (!screens[pid].online) {
        screens[pid].lastSeenText = formatLastSeen(screens[pid].lastSeen)
      }
    }
  }, 5000)
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
.csp-card {
  transition: transform 0.15s, box-shadow 0.15s;
}
.csp-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.csp-card-offline {
  opacity: 0.65;
}

.csp-thumb-wrap {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #1a1a2e;
  overflow: hidden;
}
.csp-thumb {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.csp-thumb-placeholder {
  width: 100%;
  height: 100%;
}
.csp-offline-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.55);
}
.csp-expand-icon {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0,0,0,0.45);
  border-radius: 4px;
  padding: 2px 4px;
  opacity: 0;
  transition: opacity 0.15s;
}
.csp-card:hover .csp-expand-icon {
  opacity: 1;
}
</style>
