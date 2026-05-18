<template>
  <q-layout view="hHh lpR fFf" class="exam-no-select">
    <!-- Header Exam -->
    <q-header class="bg-primary">
      <q-toolbar>
        <q-toolbar-title class="text-weight-bold" style="font-size: 15px">
          {{ examStore.ujianInfo?.judul }}
        </q-toolbar-title>

        <q-space />

        <div class="text-caption opacity-80 q-mr-md">{{ examStore.namaSiswa }}</div>

        <!-- Progress jawaban -->
        <q-chip
          dense
          color="white"
          text-color="primary"
          icon="quiz"
          class="q-mr-sm"
        >
          {{ examStore.answeredCount }}/{{ examStore.soalList.length }}
        </q-chip>

        <!-- Timer -->
        <div
          class="text-h6 text-weight-bold q-px-md q-py-xs rounded-borders"
          :class="examStore.timerIsRed ? 'bg-negative timer-blink' : 'bg-white-2'"
        >
          <q-icon name="timer" class="q-mr-xs" />
          {{ examStore.timerDisplay }}
        </div>
      </q-toolbar>

      <!-- Status bar: auto-save & koneksi -->
      <div class="row items-center q-px-md q-pb-xs" style="font-size: 11px; min-height: 20px">
        <span v-if="!isConnected" class="text-negative text-weight-bold">
          <q-icon name="wifi_off" size="12px" class="q-mr-xs" />Koneksi terputus — jawaban tidak tersimpan
        </span>
        <span v-else-if="examStore.isAutoSaving" class="text-white opacity-60">
          <q-icon name="sync" size="12px" class="q-mr-xs" />Menyimpan...
        </span>
        <span v-else-if="examStore.lastAutoSaved" class="text-white opacity-60">
          <q-icon name="cloud_done" size="12px" class="q-mr-xs" />Tersimpan {{ formatSaveTime(examStore.lastAutoSaved) }}
        </span>
      </div>

      <!-- Progress bar -->
      <q-linear-progress
        :value="examStore.progress / 100"
        color="positive"
        track-color="blue-9"
        size="4px"
      />
    </q-header>

    <!-- Sidebar: Navigator Soal -->
    <q-drawer
      :model-value="true"
      side="left"
      :width="200"
      bordered
      :style="{ background: 'var(--c-nav-bg)' }"
      :overlay="false"
      persistent
    >
      <q-scroll-area class="fit">
        <div class="q-pa-sm">
          <div class="text-caption text-grey-7 q-mb-sm text-uppercase">Navigasi Soal</div>

          <div class="row q-gutter-xs">
            <q-btn
              v-for="(soal, idx) in examStore.soalList"
              :key="soal.id"
              :label="String(idx + 1)"
              :color="getSoalBtnColor(idx)"
              :flat="examStore.currentIndex !== idx"
              :unelevated="examStore.currentIndex === idx"
              dense
              class="soal-nav-btn"
              @click="examStore.currentIndex = idx"
            />
          </div>

          <q-separator class="q-my-sm" />

          <div class="text-caption text-grey-6">
            <q-badge color="positive" />
            Dijawab ({{ examStore.answeredCount }}/{{ examStore.soalList.length }})
          </div>
        </div>
      </q-scroll-area>
    </q-drawer>

    <!-- Area Konten Soal -->
    <q-page-container>
      <q-page padding class="q-pb-xl">
        <!-- Banner koneksi terputus -->
        <q-banner
          v-if="!isConnected"
          class="bg-negative text-white q-mb-md"
          dense
          rounded
        >
          <template #avatar><q-icon name="wifi_off" /></template>
          Koneksi ke server guru terputus. Jawaban tidak akan tersimpan sampai koneksi pulih. Tetap kerjakan ujian.
        </q-banner>

        <template v-if="examStore.currentSoal">
          <!-- Nomor & Tipe Soal -->
          <div class="row items-center q-mb-md">
            <div class="text-h6 col">
              Soal {{ examStore.currentIndex + 1 }}
              <q-badge
                :color="examStore.currentSoal.tipe === 'PG' ? 'blue' : 'orange'"
                :label="examStore.currentSoal.tipe"
                class="q-ml-sm"
              />
            </div>
          </div>

          <!-- Teks Pertanyaan -->
          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-body1">
                <MathText :text="examStore.currentSoal.pertanyaan" />
              </div>
            </q-card-section>
          </q-card>

          <!-- Gambar Soal (jika ada) -->
          <div v-if="examStore.currentSoal.gambar_url" class="text-center q-mb-lg">
            <img
              :src="`${examStore.baseUrl}${examStore.currentSoal.gambar_url}`"
              style="max-width: 100%; max-height: 400px; border-radius: 8px; pointer-events: none"
              draggable="false"
            />
          </div>

          <!-- Pilihan Ganda -->
          <template v-if="examStore.currentSoal.tipe === 'PG'">
            <q-option-group
              :model-value="examStore.jawaban[examStore.currentSoal.id]"
              :options="pgOptions"
              color="primary"
              keep-color
              @update:model-value="v => examStore.setJawaban(examStore.currentSoal.id, v)"
            >
              <template #label="opt">
                <div class="text-body1 q-py-xs"><MathText :text="opt.label" /></div>
              </template>
            </q-option-group>
          </template>

          <!-- Essay -->
          <template v-else>
            <q-input
              :model-value="examStore.jawaban[examStore.currentSoal.id] || ''"
              type="textarea"
              outlined
              label="Tulis jawaban Anda di sini..."
              :rows="6"
              autogrow
              @update:model-value="v => examStore.setJawaban(examStore.currentSoal.id, v)"
            />
          </template>
        </template>

        <!-- Navigasi Prev/Next -->
        <div class="row justify-between q-mt-lg">
          <q-btn
            unelevated
            color="grey-4"
            text-color="dark"
            icon="chevron_left"
            label="Sebelumnya"
            :disable="examStore.currentIndex === 0"
            @click="examStore.currentIndex--"
          />

          <q-btn
            v-if="examStore.currentIndex < examStore.soalList.length - 1"
            unelevated
            color="primary"
            icon-right="chevron_right"
            label="Berikutnya"
            @click="examStore.currentIndex++"
          />
          <q-btn
            v-else
            unelevated
            color="positive"
            icon="check_circle"
            label="Submit Ujian"
            @click="confirmSubmit"
          />
        </div>
      </q-page>
    </q-page-container>

    <!-- Floating Submit Button -->
    <q-footer bordered :style="{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }">
      <q-toolbar>
        <q-space />
        <q-btn
          unelevated
          color="positive"
          icon="send"
          label="Submit Ujian"
          @click="confirmSubmit"
          :loading="submitting"
        />
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useExamStore } from 'stores/exam'
import MathText from 'components/MathText.vue'

const router = useRouter()
const $q = useQuasar()
const examStore = useExamStore()

const submitting = ref(false)
const isConnected = ref(true)
let pingInterval = null

// ─── CSP (Computer Screen Preview) ───────────────────────────
// Pendekatan stream persisten:
//   1. Minta source ID SEKALI via IPC → Wayland/KDE hanya tampilkan dialog portal SEKALI
//   2. Buat MediaStream via getUserMedia dengan source ID tersebut
//   3. Capture frame dari stream via canvas setiap detik — TANPA dialog lagi
//   4. Kirim frame via WebSocket ke server guru

let cspWs = null
let cspStream = null      // MediaStream — hidup selama ujian
let cspVideo = null       // Hidden video element
let cspCanvas = null      // Canvas untuk capture frame
let cspCtx = null         // Canvas 2D context
let cspSendInterval = null

async function startCsp () {
  if (!examStore.guruIP || !examStore.pesertaId) return

  // ── 1. Inisialisasi screen capture ──
  // Menggunakan getDisplayMedia() yang diintercept oleh setDisplayMediaRequestHandler
  // di electron-main.js — layar pertama dipilih otomatis, TANPA dialog apapun.
  // Kompatibel: Windows (silent), Linux X11 (silent), Linux Wayland/KDE (no portal).
  try {
    cspStream = await navigator.mediaDevices.getDisplayMedia({
      video: { width: 960, height: 540 },
      audio: false
    })

    cspVideo = document.createElement('video')
    cspVideo.srcObject = cspStream
    cspVideo.muted = true
    await cspVideo.play()

    cspCanvas = document.createElement('canvas')
    cspCanvas.width = 960
    cspCanvas.height = 540
    cspCtx = cspCanvas.getContext('2d')
  } catch (_) {
    // Capture gagal — WS tetap jalan untuk status online/offline siswa
  }

  // ── 2. Hubungkan WebSocket ke server guru ──
  try {
    cspWs = new WebSocket(`ws://${examStore.guruIP}:3000`)

    cspWs.onopen = () => {
      cspWs.send(JSON.stringify({
        type: 'csp:register',
        peserta_id: examStore.pesertaId,
        nama: examStore.namaSiswa,
        token: examStore.tokenInput
      }))

      // ── 3. Kirim frame setiap detik — canvas capture, TIDAK ada IPC ──
      cspSendInterval = setInterval(() => {
        if (!cspWs || cspWs.readyState !== WebSocket.OPEN) return
        if (!cspCtx || !cspVideo || cspVideo.readyState < 2) return
        cspCtx.drawImage(cspVideo, 0, 0, 960, 540)
        const data = cspCanvas.toDataURL('image/jpeg', 0.4).split(',')[1]
        cspWs.send(JSON.stringify({
          type: 'csp:frame',
          peserta_id: examStore.pesertaId,
          token: examStore.tokenInput,
          data
        }))
      }, 1000)
    }

    cspWs.onerror = () => {}
    cspWs.onclose = () => { clearInterval(cspSendInterval) }
  } catch (_) {}
}

function stopCsp () {
  // Hentikan interval pengiriman frame
  clearInterval(cspSendInterval)
  cspSendInterval = null

  // Hentikan media stream (lepas akses kamera/layar di OS)
  if (cspStream) {
    cspStream.getTracks().forEach(t => t.stop())
    cspStream = null
  }
  cspVideo = null
  cspCanvas = null
  cspCtx = null

  // Kirim csp:end dan tutup WebSocket
  if (cspWs) {
    if (cspWs.readyState === WebSocket.OPEN) {
      cspWs.send(JSON.stringify({
        type: 'csp:end',
        peserta_id: examStore.pesertaId,
        token: examStore.tokenInput
      }))
    }
    cspWs.onclose = null
    cspWs.close()
    cspWs = null
  }
}

// ─── Koneksi ──────────────────────────────────────────────────

async function checkConnection () {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`${examStore.baseUrl}/status`, { signal: controller.signal })
    clearTimeout(timeoutId)
    isConnected.value = res.ok
  } catch (_) {
    isConnected.value = false
  }
}

function formatSaveTime (date) {
  if (!date) return ''
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ─── Computed ─────────────────────────────────────────────────

const pgOptions = computed(() => {
  const s = examStore.currentSoal
  if (!s) return []
  return [
    { label: `A. ${s.opsi_a}`, value: 'A' },
    { label: `B. ${s.opsi_b}`, value: 'B' },
    { label: `C. ${s.opsi_c}`, value: 'C' },
    { label: `D. ${s.opsi_d}`, value: 'D' }
  ].filter(o => o.label.split('. ')[1])
})

function getSoalBtnColor (idx) {
  const soalId = examStore.soalList[idx]?.id
  if (idx === examStore.currentIndex) return 'primary'
  if (examStore.isAnswered(soalId)) return 'positive'
  return 'grey-4'
}

// ─── Submit ───────────────────────────────────────────────────

function confirmSubmit () {
  const unanswered = examStore.soalList.length - examStore.answeredCount
  const msg = unanswered > 0
    ? `Masih ada ${unanswered} soal yang belum dijawab. Yakin ingin submit?`
    : 'Semua soal sudah dijawab. Yakin ingin submit ujian?'

  $q.dialog({
    title: 'Konfirmasi Submit',
    message: msg,
    ok: { label: 'Ya, Submit', color: 'positive', unelevated: true },
    cancel: { label: 'Batal', flat: true },
    persistent: true
  }).onOk(doSubmit)
}

async function doSubmit () {
  submitting.value = true
  try {
    await examStore.submitExam()
    await finishExam('Ujian berhasil dikumpulkan!')
  } catch (err) {
    $q.notify({ type: 'negative', message: `Gagal submit: ${err.message}` })
    submitting.value = false
  }
}

// Urutan: submit → navigate → endExam → reset
async function finishExam (message) {
  stopCsp()
  $q.notify({ type: 'positive', message, timeout: 3000 })
  router.push('/')
  // endExam dipanggil SETELAH router.push — kiosk dilepas setelah navigasi
  if (typeof window !== 'undefined' && window.electronAPI) {
    await window.electronAPI.endExam()
  }
  examStore.$reset()
}

// Watch isSubmitted untuk handle auto-submit dari timer
watch(() => examStore.isSubmitted, async (submitted) => {
  if (!submitted || submitting.value) return
  await finishExam('Waktu habis! Ujian otomatis dikumpulkan.')
})

// ─── Lockdown Renderer ────────────────────────────────────────

function blockContextMenu (e) {
  e.preventDefault()
}

function blockShortcuts (e) {
  const blocked = (
    // Semua F-key
    e.key === 'F1' || e.key === 'F2' || e.key === 'F3' ||
    e.key === 'F4' || e.key === 'F5' || e.key === 'F6' ||
    e.key === 'F7' || e.key === 'F8' || e.key === 'F9' ||
    e.key === 'F10' || e.key === 'F11' || e.key === 'F12' ||
    // DevTools & inspect
    (e.ctrlKey && e.shiftKey && ['i','I','j','J','c','C','k','K','delete','Delete'].includes(e.key)) ||
    // Tab, window, clipboard Ctrl combos
    (e.ctrlKey && ['r','R','u','U','w','W','n','N','t','T','a','A','s','S','p','P','c','C','v','V','x','X','z','Z','y','Y'].includes(e.key)) ||
    // Alt combinations
    (e.altKey && ['F4','Tab','Escape',' '].includes(e.key)) ||
    // Meta/Super key
    e.metaKey ||
    // Escape & PrintScreen
    e.key === 'Escape' ||
    e.key === 'PrintScreen'
  )
  if (blocked) {
    e.preventDefault()
    e.stopPropagation()
    return false
  }
}

function forceFocus () {
  if (typeof window !== 'undefined' && window.electronAPI) {
    window.electronAPI.focusWindow()
  }
}

const blockDrag = (e) => e.preventDefault()
const blockSelect = (e) => e.preventDefault()
const blockCopyPaste = (e) => { e.preventDefault(); e.stopPropagation() }

onMounted(async () => {
  if (typeof window !== 'undefined' && window.electronAPI) {
    await window.electronAPI.startExam()
  }

  examStore.startTimer()
  examStore.startAutoSave()
  startCsp()
  checkConnection()
  pingInterval = setInterval(checkConnection, 10000)

  // Blokir klik kanan
  document.addEventListener('contextmenu', blockContextMenu, { capture: true })

  // Blokir shortcut — terapkan di document DAN window agar tidak ada celah
  document.addEventListener('keydown', blockShortcuts, { capture: true })
  window.addEventListener('keydown', blockShortcuts, { capture: true })

  // Blokir drag & drop file dari luar
  document.addEventListener('dragover', blockDrag, { capture: true })
  document.addEventListener('drop', blockDrag, { capture: true })

  // Blokir seleksi teks
  document.addEventListener('selectstart', blockSelect, { capture: true })

  // Blokir copy, cut, paste via DOM event (menangkap klik kanan & semua metode lain)
  document.addEventListener('copy', blockCopyPaste, { capture: true })
  document.addEventListener('cut', blockCopyPaste, { capture: true })
  document.addEventListener('paste', blockCopyPaste, { capture: true })

  // Refocus paksa saat window kehilangan fokus
  window.addEventListener('blur', forceFocus)
})

onUnmounted(() => {
  clearInterval(pingInterval)
  examStore.stopAutoSave()
  stopCsp()
  document.removeEventListener('contextmenu', blockContextMenu, { capture: true })
  document.removeEventListener('keydown', blockShortcuts, { capture: true })
  window.removeEventListener('keydown', blockShortcuts, { capture: true })
  document.removeEventListener('dragover', blockDrag, { capture: true })
  document.removeEventListener('drop', blockDrag, { capture: true })
  document.removeEventListener('selectstart', blockSelect, { capture: true })
  document.removeEventListener('copy', blockCopyPaste, { capture: true })
  document.removeEventListener('cut', blockCopyPaste, { capture: true })
  document.removeEventListener('paste', blockCopyPaste, { capture: true })
  window.removeEventListener('blur', forceFocus)

  // Safety net — pastikan kiosk dilepas kalau komponen unmount tanpa submit
  if (typeof window !== 'undefined' && window.electronAPI) {
    window.electronAPI.endExam()
  }
})
</script>

<style scoped>
.timer-blink {
  animation: blink 1s step-start infinite;
}
@keyframes blink {
  50% { opacity: 0.4; }
}

/* Izinkan cursor di textarea essay agar siswa bisa mengetik,
   tapi copy/paste tetap diblok via event listener */
:deep(.q-textarea textarea) {
  user-select: text !important;
  -webkit-user-select: text !important;
}
</style>
