<template>
  <q-page class="sl-page flex flex-center">

    <div class="sl-card">

      <!-- Icon area -->
      <div class="sl-icon-wrap" :class="data.isTimeout ? 'sl-icon-timeout' : 'sl-icon-success'">
        <q-icon
          :name="data.isTimeout ? 'timer_off' : 'check_circle'"
          size="56px"
          :style="{ color: data.isTimeout ? 'var(--c-warning)' : 'var(--c-success)' }"
        />
      </div>

      <!-- Heading -->
      <div class="sl-heading" :class="data.isTimeout ? 'sl-heading-timeout' : 'sl-heading-success'">
        {{ data.isTimeout ? 'Waktu Habis' : 'Ujian Selesai!' }}
      </div>
      <div class="sl-subheading">
        {{ data.isTimeout
          ? 'Ujian dikumpulkan otomatis karena waktu habis.'
          : 'Jawabanmu telah berhasil dikumpulkan.' }}
      </div>

      <div class="sl-divider" />

      <!-- Info rows -->
      <div class="sl-info-list">
        <div class="sl-info-row">
          <q-icon name="person" size="16px" class="sl-info-icon" />
          <span class="sl-info-label">Nama</span>
          <span class="sl-info-val">{{ data.nama }}</span>
        </div>
        <div class="sl-info-row">
          <q-icon name="assignment" size="16px" class="sl-info-icon" />
          <span class="sl-info-label">Ujian</span>
          <span class="sl-info-val">{{ data.judulUjian }}</span>
        </div>
        <div v-if="data.mataPelajaran" class="sl-info-row">
          <q-icon name="school" size="16px" class="sl-info-icon" />
          <span class="sl-info-label">Mata Pelajaran</span>
          <span class="sl-info-val">{{ data.mataPelajaran }}</span>
        </div>
        <div class="sl-info-row">
          <q-icon name="quiz" size="16px" class="sl-info-icon" />
          <span class="sl-info-label">Soal Dijawab</span>
          <span class="sl-info-val">
            <span class="sl-val-answered">{{ data.dijawab }}</span>
            <span class="sl-val-total"> / {{ data.totalSoal }}</span>
          </span>
        </div>
        <div class="sl-info-row">
          <q-icon name="schedule" size="16px" class="sl-info-icon" />
          <span class="sl-info-label">Waktu Selesai</span>
          <span class="sl-info-val">{{ waktuFormatted }}</span>
        </div>
      </div>

      <!-- Footer note -->
      <div class="sl-note">
        Silakan beritahu gurumu bahwa ujian telah selesai.
      </div>

      <!-- Tombol aksi -->
      <div class="sl-btn-row q-mt-md">
        <q-btn
          unelevated
          icon="login"
          label="Lanjut Ujian"
          class="sl-btn-lanjut"
          :class="hasElectron ? 'col' : 'full-width'"
          @click="lanjutUjian"
        />
        <q-btn
          v-if="hasElectron"
          unelevated
          icon="power_settings_new"
          label="Tutup"
          class="sl-btn-close col"
          @click="tutupAplikasi"
        />
      </div>
    </div>

  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExamStore } from 'stores/exam'

const router = useRouter()
const examStore = useExamStore()

const data = computed(() => examStore.completionData || {
  nama: '',
  judulUjian: '',
  mataPelajaran: '',
  totalSoal: 0,
  dijawab: 0,
  waktuSelesai: null,
  isTimeout: false
})

const waktuFormatted = computed(() => {
  if (!data.value.waktuSelesai) return '-'
  return new Date(data.value.waktuSelesai).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
})

const hasElectron = typeof window !== 'undefined' && !!window.electronAPI?.closeWindow

function lanjutUjian () {
  examStore.setCompletionData(null)
  router.replace('/')
}

function tutupAplikasi () {
  if (window.electronAPI?.closeWindow) {
    window.electronAPI.closeWindow()
  }
}

// Jika tidak ada completionData, redirect ke login
onMounted(() => {
  if (!examStore.completionData) {
    router.replace('/')
  }
})
</script>

<style scoped>
/* ── PAGE ─────────────────────────────────────────────────── */
.sl-page {
  min-height: 100vh;
}

/* ── CARD — M3 Surface ────────────────────────────────────── */
.sl-card {
  width: 440px;
  max-width: calc(100vw - 32px);
  border-radius: var(--radius-xl);
  padding: 40px 36px 32px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  box-shadow: var(--m3-elev-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* ── ICON ─────────────────────────────────────────────────── */
.sl-icon-wrap {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}
.sl-icon-success { background: var(--c-success-bg); }
.sl-icon-timeout { background: var(--c-warning-bg); }

/* ── HEADING ──────────────────────────────────────────────── */
.sl-heading {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.4px;
  margin-bottom: 8px;
}
.sl-heading-success { color: var(--c-success); }
.sl-heading-timeout { color: var(--c-warning); }

.sl-subheading {
  font-size: 13px;
  color: var(--c-text-2);
  margin-bottom: 4px;
  line-height: 1.5;
}

/* ── DIVIDER ──────────────────────────────────────────────── */
.sl-divider {
  width: 100%;
  height: 1px;
  background: var(--c-border);
  margin: 24px 0;
}

/* ── INFO LIST ────────────────────────────────────────────── */
.sl-info-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.sl-info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--c-border);
  text-align: left;
}
.sl-info-row:last-child { border-bottom: none; }

.sl-info-icon { color: var(--c-text-3); flex-shrink: 0; }

.sl-info-label {
  font-size: 13px;
  color: var(--c-text-2);
  min-width: 110px;
  flex-shrink: 0;
}

.sl-info-val {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text);
  flex: 1;
  text-align: right;
}

.sl-val-answered {
  font-size: 16px;
  font-weight: 800;
  color: var(--c-accent);
}
.sl-val-total {
  font-size: 13px;
  font-weight: 500;
  color: var(--c-text-3);
}

/* ── FOOTER NOTE ──────────────────────────────────────────── */
.sl-note {
  margin-top: 24px;
  font-size: 12px;
  color: var(--c-text-3);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  width: 100%;
  line-height: 1.5;
}

/* ── BUTTON ROW ───────────────────────────────────────────── */
.sl-btn-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

/* ── LANJUT UJIAN — M3 Filled primary ────────────────────── */
.sl-btn-lanjut {
  background: var(--c-accent) !important;
  color: white !important;
  border-radius: 20px !important;
  font-weight: 600 !important;
  height: 44px !important;
  flex: 1 !important;
  box-shadow: var(--m3-elev-1) !important;
  transition: all 0.2s !important;
}
.sl-btn-lanjut:hover {
  background: var(--c-accent-hover) !important;
  box-shadow: var(--m3-elev-2) !important;
}

/* ── TUTUP APLIKASI — M3 Tonal ────────────────────────────── */
.sl-btn-close {
  background: var(--c-surface-3) !important;
  color: var(--c-text-2) !important;
  border-radius: 20px !important;
  font-weight: 600 !important;
  height: 44px !important;
  flex: 1 !important;
  border: 1px solid var(--c-border) !important;
  transition: all 0.2s !important;
}
.sl-btn-close:hover {
  background: var(--c-danger-bg) !important;
  color: var(--c-danger) !important;
  border-color: var(--c-danger) !important;
}
</style>
