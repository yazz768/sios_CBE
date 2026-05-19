<template>
  <q-layout view="hHh lpR fFf" class="exam-layout exam-no-select">

    <!-- ── TOPBAR ─────────────────────────────────────────────── -->
    <q-header class="exam-header" :elevation="0">
      <q-toolbar class="exam-toolbar">
        <div class="exam-judul col text-truncate">{{ examStore.ujianInfo?.judul }}</div>

        <q-space />

        <div class="exam-nama q-mr-md">{{ examStore.namaSiswa }}</div>

        <!-- Soal counter -->
        <div class="exam-chip exam-chip-soal q-mr-sm">
          <q-icon name="assignment" size="14px" class="q-mr-xs" />
          {{ examStore.answeredCount }}/{{ examStore.soalList.length }}
        </div>

        <!-- Auto-save indicator -->
        <div class="exam-save-indicator q-mr-sm">
          <q-icon
            v-if="!isConnected" name="wifi_off" size="14px" class="exam-icon-offline"
          />
          <q-icon
            v-else-if="examStore.isAutoSaving" name="sync" size="14px" class="exam-icon-sync exam-spin"
          />
          <q-icon
            v-else-if="examStore.lastAutoSaved" name="cloud_done" size="14px" class="exam-icon-saved"
          />
        </div>

        <!-- Timer -->
        <div class="exam-timer" :class="{
          'exam-timer-urgent': examStore.timerIsRed,
          'exam-timer-warn': !examStore.timerIsRed && examStore.timerDisplay.split(':')[0] === '00' && parseInt(examStore.timerDisplay.split(':')[1]) < 10
        }">
          <q-icon name="timer" size="15px" class="q-mr-xs" />
          {{ examStore.timerDisplay }}
        </div>
      </q-toolbar>

      <!-- Progress bar -->
      <div class="exam-progress-wrap">
        <div class="exam-progress-bar" :style="{ width: `${navProgress}%` }" />
      </div>

      <!-- Koneksi banner (compact) -->
      <div v-if="!isConnected" class="exam-offline-bar">
        <q-icon name="wifi_off" size="13px" class="q-mr-xs" />
        Koneksi terputus — jawaban tidak tersimpan
      </div>
    </q-header>

    <!-- ── SIDEBAR NAVIGASI ────────────────────────────────────── -->
    <q-drawer
      :model-value="true"
      side="left"
      :width="110"
      class="exam-drawer"
      :overlay="false"
      persistent
    >
      <q-scroll-area class="fit">
        <div class="q-pa-sm">
          <div class="exam-nav-label">NAVIGASI</div>

          <div class="exam-nav-grid">
            <div
              v-for="(soal, idx) in examStore.soalList"
              :key="soal.id"
              class="exam-nav-btn"
              :class="{
                'exam-nav-current': idx === examStore.currentIndex,
                'exam-nav-answered': examStore.isAnswered(soal.id) && idx !== examStore.currentIndex
              }"
              @click="examStore.currentIndex = idx"
            >
              {{ idx + 1 }}
            </div>
          </div>

          <div class="exam-nav-counter">
            <span class="exam-nav-counter-dot" />
            {{ examStore.answeredCount }}/{{ examStore.soalList.length }}
          </div>
        </div>
      </q-scroll-area>
    </q-drawer>

    <!-- ── AREA SOAL ───────────────────────────────────────────── -->
    <q-page-container>
      <q-page padding class="exam-page q-pb-xl">

        <template v-if="examStore.currentSoal">
          <!-- Nomor & Tipe -->
          <div class="row items-center q-mb-md">
            <div class="exam-soal-num col">
              Soal {{ examStore.currentIndex + 1 }}
              <span class="exam-tipe-badge q-ml-sm"
                :class="examStore.currentSoal.tipe === 'PG' ? 'exam-badge-pg' : 'exam-badge-essay'">
                {{ examStore.currentSoal.tipe }}
              </span>
            </div>
          </div>

          <!-- Pertanyaan -->
          <div class="exam-question-box q-mb-md">
            <div class="exam-question-text">
              <MathText :text="examStore.currentSoal.pertanyaan" />
            </div>
          </div>

          <!-- Gambar Soal -->
          <div v-if="examStore.currentSoal.gambar_url" class="text-center q-mb-lg">
            <img
              :src="`${examStore.baseUrl}${examStore.currentSoal.gambar_url}`"
              class="exam-soal-img"
              draggable="false"
            />
          </div>

          <!-- PG Options -->
          <template v-if="examStore.currentSoal.tipe === 'PG'">
            <div class="exam-pg-options">
              <div
                v-for="opt in pgOptions"
                :key="opt.value"
                class="exam-pg-option"
                :class="{ 'exam-pg-selected': examStore.jawaban[examStore.currentSoal.id] === opt.value }"
                @click="examStore.setJawaban(examStore.currentSoal.id, opt.value)"
              >
                <div class="exam-pg-badge">{{ opt.value }}</div>
                <div class="exam-pg-label"><MathText :text="opt.rawLabel" /></div>
                <q-icon
                  v-if="examStore.jawaban[examStore.currentSoal.id] === opt.value"
                  name="check_circle"
                  size="18px"
                  class="exam-pg-check"
                />
              </div>
            </div>
          </template>

          <!-- Essay -->
          <template v-else>
            <div class="exam-essay-wrap">
              <q-input
                :model-value="examStore.jawaban[examStore.currentSoal.id] || ''"
                type="textarea"
                outlined
                label="Tulis jawaban Anda di sini..."
                :rows="6"
                autogrow
                class="exam-essay-input"
                @update:model-value="v => examStore.setJawaban(examStore.currentSoal.id, v)"
              />
            </div>
          </template>

          <!-- Navigasi Prev/Next -->
          <div class="row justify-between q-mt-lg">
            <q-btn
              unelevated icon="chevron_left" label="Sebelumnya"
              class="exam-btn-prev"
              :disable="examStore.currentIndex === 0"
              @click="examStore.currentIndex--"
            />
            <q-btn
              v-if="examStore.currentIndex < examStore.soalList.length - 1"
              unelevated icon-right="chevron_right" label="Berikutnya"
              class="exam-btn-next"
              @click="examStore.currentIndex++"
            />
            <q-btn
              v-else
              unelevated icon="check_circle" label="Submit Ujian"
              class="exam-btn-submit"
              @click="confirmSubmit"
            />
          </div>
        </template>

      </q-page>
    </q-page-container>

    <!-- ── BOTTOM BAR ──────────────────────────────────────────── -->
    <q-footer class="exam-footer" :elevation="0">
      <q-toolbar class="exam-footer-toolbar">
        <div class="exam-progress-label">
          <span class="exam-progress-answered">{{ examStore.answeredCount }}</span>
          <span class="exam-progress-total">/{{ examStore.soalList.length }} soal dijawab</span>
          <div class="exam-mini-bar-wrap">
            <div class="exam-mini-bar" :style="{ width: `${navProgress}%` }" />
          </div>
        </div>
        <q-space />
        <q-btn
          unelevated icon="send" label="SUBMIT UJIAN"
          class="exam-submit-btn"
          :loading="submitting"
          @click="confirmSubmit"
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

// Progress berbasis posisi navigasi (currentIndex), bukan jumlah jawaban
const navProgress = computed(() =>
  examStore.soalList.length
    ? Math.round((examStore.currentIndex / examStore.soalList.length) * 100)
    : 0
)
const $q = useQuasar()
const examStore = useExamStore()

const submitting = ref(false)
const isConnected = ref(true)
let pingInterval = null

// ─── CSP ─────────────────────────────────────────────────────
let cspWs = null
let cspStream = null
let cspVideo = null
let cspCanvas = null
let cspCtx = null
let cspSendInterval = null

async function startCsp () {
  if (!examStore.guruIP || !examStore.pesertaId) return
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
  } catch (_) {}

  try {
    cspWs = new WebSocket(`ws://${examStore.guruIP}:3000`)
    cspWs.onopen = () => {
      cspWs.send(JSON.stringify({
        type: 'csp:register',
        peserta_id: examStore.pesertaId,
        nama: examStore.namaSiswa,
        token: examStore.tokenInput
      }))
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
  clearInterval(cspSendInterval)
  cspSendInterval = null
  if (cspStream) {
    cspStream.getTracks().forEach(t => t.stop())
    cspStream = null
  }
  cspVideo = null
  cspCanvas = null
  cspCtx = null
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

// ─── Koneksi ─────────────────────────────────────────────────
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
    { value: 'A', rawLabel: s.opsi_a || '' },
    { value: 'B', rawLabel: s.opsi_b || '' },
    { value: 'C', rawLabel: s.opsi_c || '' },
    { value: 'D', rawLabel: s.opsi_d || '' }
  ].filter(o => o.rawLabel)
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
    await finishExam(false)
  } catch (err) {
    $q.notify({ type: 'negative', message: `Gagal submit: ${err.message}` })
    submitting.value = false
    return
  }
}

async function finishExam (isTimeout = false) {
  stopCsp()

  // Simpan data sebelum reset agar bisa ditampilkan di halaman selesai
  examStore.setCompletionData({
    nama: examStore.namaSiswa,
    judulUjian: examStore.ujianInfo?.judul || '',
    mataPelajaran: examStore.ujianInfo?.mata_pelajaran || '',
    totalSoal: examStore.soalList.length,
    dijawab: examStore.answeredCount,
    waktuSelesai: new Date().toISOString(),
    isTimeout
  })

  examStore.$reset()
  router.push('/selesai')

  if (typeof window !== 'undefined' && window.electronAPI) {
    await window.electronAPI.endExam()
  }
}

watch(() => examStore.isSubmitted, async (submitted) => {
  if (!submitted || submitting.value) return
  await finishExam(true)
})

// ─── Lockdown ─────────────────────────────────────────────────
function blockContextMenu (e) { e.preventDefault() }
function blockShortcuts (e) {
  const blocked = (
    e.key === 'F1' || e.key === 'F2' || e.key === 'F3' || e.key === 'F4' ||
    e.key === 'F5' || e.key === 'F6' || e.key === 'F7' || e.key === 'F8' ||
    e.key === 'F9' || e.key === 'F10' || e.key === 'F11' || e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && ['i','I','j','J','c','C','k','K','delete','Delete'].includes(e.key)) ||
    (e.ctrlKey && ['r','R','u','U','w','W','n','N','t','T','a','A','s','S','p','P','c','C','v','V','x','X','z','Z','y','Y'].includes(e.key)) ||
    (e.altKey && ['F4','Tab','Escape',' '].includes(e.key)) ||
    e.metaKey || e.key === 'Escape' || e.key === 'PrintScreen'
  )
  if (blocked) { e.preventDefault(); e.stopPropagation(); return false }
}
function forceFocus () {
  if (typeof window !== 'undefined' && window.electronAPI) window.electronAPI.focusWindow()
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
  document.addEventListener('contextmenu', blockContextMenu, { capture: true })
  document.addEventListener('keydown', blockShortcuts, { capture: true })
  window.addEventListener('keydown', blockShortcuts, { capture: true })
  document.addEventListener('dragover', blockDrag, { capture: true })
  document.addEventListener('drop', blockDrag, { capture: true })
  document.addEventListener('selectstart', blockSelect, { capture: true })
  document.addEventListener('copy', blockCopyPaste, { capture: true })
  document.addEventListener('cut', blockCopyPaste, { capture: true })
  document.addEventListener('paste', blockCopyPaste, { capture: true })
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
  if (typeof window !== 'undefined' && window.electronAPI) {
    window.electronAPI.endExam()
  }
})
</script>

<style scoped>
/* ── TOPBAR — M3 Surface ──────────────────────────────────── */
:global(.body--dark) :deep(.exam-header) {
  background: #1A1C20 !important;
  border-bottom: 1px solid #383C44 !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4) !important;
}
:global(.body--light) :deep(.exam-header) {
  background: #FFFFFF !important;
  border-bottom: 1px solid #C3CAD9 !important;
  box-shadow: 0 1px 3px rgba(26,28,74,0.08) !important;
}

.exam-toolbar { height: 54px; min-height: 54px !important; padding: 0 16px; }
.exam-judul   { font-size: 14px; font-weight: 700; color: var(--c-text); }
.exam-nama    { font-size: 12px; color: var(--c-text-2); }

/* Chips */
.exam-chip {
  display: flex; align-items: center;
  padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
}
.exam-chip-soal {
  background: var(--c-accent-soft); border: 1px solid var(--c-border); color: var(--c-accent);
}

/* Save indicator */
.exam-save-indicator { display: flex; align-items: center; }
.exam-icon-offline { color: var(--c-danger) !important; }
.exam-icon-sync    { color: var(--c-warning) !important; }
.exam-icon-saved   { color: var(--c-success) !important; }
@keyframes examSpin { to { transform: rotate(360deg); } }
.exam-spin { animation: examSpin 1s linear infinite; display: inline-block; }

/* Timer */
.exam-timer {
  font-family: 'JetBrains Mono', monospace;
  font-size: 16px; font-weight: 700; letter-spacing: 1px;
  padding: 4px 12px; border-radius: var(--radius-md);
  display: flex; align-items: center; transition: all 0.3s;
  background: var(--c-surface-2); color: var(--c-text);
}
.exam-timer-warn    { color: var(--c-warning) !important; background: var(--c-warning-bg) !important; }
.exam-timer-urgent  {
  color: var(--c-danger) !important; background: var(--c-danger-bg) !important;
  animation: timerUrgent 1s ease-in-out infinite;
}
@keyframes timerUrgent { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

/* Progress bar */
.exam-progress-wrap { height: 3px; background: var(--c-border); width: 100%; }
.exam-progress-bar  { height: 100%; background: var(--c-accent); transition: width 0.4s ease; }

/* Offline bar */
.exam-offline-bar {
  display: flex; align-items: center;
  padding: 4px 16px; font-size: 11.5px; font-weight: 600;
  background: var(--c-danger); color: white;
}

/* ── DRAWER — M3 Surface ──────────────────────────────────── */
:global(.body--dark) :deep(.exam-drawer) {
  background: #1A1C20 !important;
  border-right: 1px solid #383C44 !important;
}
:global(.body--light) :deep(.exam-drawer) {
  background: #FFFFFF !important;
  border-right: 1px solid #C3CAD9 !important;
}

.exam-nav-label {
  font-size: 9px; font-weight: 700; letter-spacing: 0.8px;
  margin-bottom: 10px; padding: 0 2px; color: var(--c-text-3);
}
.exam-nav-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }

.exam-nav-btn {
  aspect-ratio: 1; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; cursor: pointer;
  transition: all 0.15s; user-select: none;
  background: var(--c-surface-2); border: 1px solid var(--c-border); color: var(--c-text-3);
}
.exam-nav-btn:hover {
  background: var(--c-accent-soft); border-color: var(--c-accent); color: var(--c-accent);
}

.exam-nav-answered {
  background: var(--c-accent) !important;
  border-color: var(--c-accent) !important;
  color: white !important;
}
.exam-nav-current {
  background: var(--c-accent) !important;
  border: 2px solid white !important;
  color: white !important;
  transform: scale(1.1);
  box-shadow: var(--m3-elev-2);
}

.exam-nav-counter {
  display: flex; align-items: center; gap: 6px;
  margin-top: 12px; font-size: 11px; font-weight: 600; padding: 5px 6px;
  border-radius: var(--radius-sm);
  background: var(--c-success-bg); color: var(--c-success);
}
.exam-nav-counter-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--c-success); flex-shrink: 0; }

/* ── PAGE ─────────────────────────────────────────────────── */
.exam-page { background: transparent !important; }

/* ── SOAL HEADER ──────────────────────────────────────────── */
.exam-soal-num { font-size: 16px; font-weight: 700; color: var(--c-text); }

.exam-tipe-badge {
  display: inline-flex; align-items: center;
  padding: 2px 9px; border-radius: 999px; font-size: 11px; font-weight: 700;
}
.exam-badge-pg    { background: var(--c-accent-soft); color: var(--c-accent); }
.exam-badge-essay { background: var(--c-warning-bg);  color: var(--c-warning); }

/* ── QUESTION BOX — M3 Surface ───────────────────────────── */
.exam-question-box {
  padding: 18px 20px; border-radius: var(--radius-md);
  background: var(--c-surface); border: 1px solid var(--c-border);
  border-left: 3px solid var(--c-accent);
  box-shadow: var(--m3-elev-1);
}
.exam-question-text { font-size: 15px; line-height: 1.7; color: var(--c-text); }

/* ── GAMBAR SOAL ──────────────────────────────────────────── */
.exam-soal-img {
  max-width: 100%; max-height: 380px; border-radius: var(--radius-md);
  pointer-events: none; border: 1px solid var(--c-border);
}

/* ── PG OPTIONS — M3 Surface ─────────────────────────────── */
.exam-pg-options { display: flex; flex-direction: column; gap: 8px; }
.exam-pg-option {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 16px; border-radius: var(--radius-md); cursor: pointer;
  transition: all 0.15s; position: relative;
  background: var(--c-surface); border: 1px solid var(--c-border);
}
.exam-pg-option:hover {
  background: var(--c-surface-2); border-color: var(--c-border-2);
  transform: translateX(3px);
}
.exam-pg-selected {
  background: var(--c-accent-soft) !important;
  border-color: var(--c-accent) !important;
}

.exam-pg-badge {
  width: 32px; height: 32px; border-radius: var(--radius-sm); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; transition: all 0.15s;
  background: var(--c-surface-2); color: var(--c-text-3);
}
.exam-pg-selected .exam-pg-badge { background: var(--c-accent); color: white; }

.exam-pg-label { flex: 1; font-size: 14px; line-height: 1.5; color: var(--c-text); }
.exam-pg-check { position: absolute; right: 14px; color: var(--c-success) !important; }

/* ── ESSAY — M3 Outlined ─────────────────────────────────── */
:deep(.exam-essay-input .q-field__control) {
  background: var(--c-surface-2) !important;
  border-radius: var(--radius-md) !important;
}
:deep(.exam-essay-input .q-field__control:before) { border-color: var(--c-border) !important; }
:deep(.exam-essay-input.q-field--focused .q-field__control:after) { border-color: var(--c-accent) !important; }
:deep(.exam-essay-input .q-field__native),
:deep(.exam-essay-input textarea) {
  color: var(--c-text) !important;
  user-select: text !important; -webkit-user-select: text !important;
}

:deep(.q-textarea textarea) {
  user-select: text !important; -webkit-user-select: text !important;
}

/* ── NAV BUTTONS — M3 Filled / Tonal ────────────────────── */
.exam-btn-prev {
  border-radius: 20px !important; font-weight: 600 !important; padding: 8px 20px !important;
  background: var(--c-surface-2) !important; color: var(--c-text-2) !important;
  border: 1px solid var(--c-border) !important;
}
.exam-btn-prev:hover { background: var(--c-surface-3) !important; }

.exam-btn-next {
  background: var(--c-accent) !important; color: white !important;
  border-radius: 20px !important; font-weight: 600 !important; padding: 8px 20px !important;
  box-shadow: var(--m3-elev-1) !important;
}
.exam-btn-next:hover { background: var(--c-accent-hover) !important; }

.exam-btn-submit {
  background: var(--c-success) !important; color: white !important;
  border-radius: 20px !important; font-weight: 600 !important;
  box-shadow: var(--m3-elev-1) !important;
}
.exam-btn-submit:hover { filter: brightness(0.9) !important; }

/* ── FOOTER — M3 Surface ─────────────────────────────────── */
:global(.body--dark) :deep(.exam-footer) {
  background: #1A1C20 !important;
  border-top: 1px solid #383C44 !important;
}
:global(.body--light) :deep(.exam-footer) {
  background: #FFFFFF !important;
  border-top: 1px solid #C3CAD9 !important;
}
.exam-footer-toolbar { height: 56px; min-height: 56px !important; padding: 0 16px; }

.exam-progress-label   { display: flex; align-items: center; gap: 6px; }
.exam-progress-answered { font-size: 18px; font-weight: 800; color: var(--c-success); }
.exam-progress-total   { font-size: 12px; color: var(--c-text-3); }

.exam-mini-bar-wrap {
  width: 80px; height: 4px; border-radius: 999px; margin-left: 8px;
  overflow: hidden; background: var(--c-border);
}
.exam-mini-bar {
  height: 100%; background: var(--c-success);
  border-radius: 999px; transition: width 0.4s ease;
}

.exam-submit-btn {
  background: var(--c-success) !important; color: white !important;
  border-radius: 20px !important; font-weight: 700 !important;
  font-size: 13px !important; letter-spacing: 0.5px !important;
  box-shadow: var(--m3-elev-1) !important;
}
.exam-submit-btn:hover { filter: brightness(0.9) !important; }

/* ── MISC ─────────────────────────────────────────────────── */
.exam-layout { min-height: 100vh; }
.exam-no-select { user-select: none; -webkit-user-select: none; }
</style>
