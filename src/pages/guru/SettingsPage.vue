<template>
  <q-page padding class="st-page">

    <div class="st-title q-mb-lg">Pengaturan</div>

    <div class="row q-col-gutter-md">

      <!-- ── KOLOM KIRI ──────────────────────────────────────── -->
      <div class="col-12 col-md-7">

        <!-- Tampilan -->
        <div class="st-section-card q-mb-md">
          <div class="st-section-header">
            <div class="st-section-icon">
              <q-icon name="palette" size="16px" style="color: #6750A4" />
            </div>
            <div class="st-section-title">Tampilan</div>
          </div>
          <div class="st-section-divider" />
          <div class="row items-center justify-between q-mt-md">
            <div>
              <div class="st-label">Mode Gelap / Terang</div>
              <div class="st-hint">Ubah tema tampilan aplikasi</div>
            </div>
            <div class="st-theme-toggle-wrap">
              <q-icon :name="themeStore.isDark ? 'dark_mode' : 'light_mode'" size="16px" class="q-mr-sm st-theme-icon" />
              <q-toggle
                :model-value="themeStore.isDark"
                color="primary"
                size="md"
                @update:model-value="themeStore.toggle()"
              />
            </div>
          </div>
        </div>

        <!-- Identitas Sekolah -->
        <div class="st-section-card q-mb-md">
          <div class="st-section-header">
            <div class="st-section-icon">
              <q-icon name="school" size="16px" style="color: #1a5fa8" />
            </div>
            <div class="st-section-title">Identitas Sekolah</div>
          </div>
          <div class="st-section-divider" />
          <div class="st-hint q-mb-md q-mt-md">
            Nama sekolah akan ditampilkan di halaman login siswa.
          </div>
          <div class="row q-gutter-sm items-start">
            <q-input
              v-model="namaSekolahInput"
              label="Nama Sekolah"
              outlined
              class="col st-glass-input"
              :loading="savingNama"
            />
            <q-btn
              unelevated
              label="Simpan"
              class="q-mt-xs st-btn-primary"
              :loading="savingNama"
              @click="simpanNamaSekolah"
            />
          </div>
        </div>

        <!-- Server & Koneksi -->
        <div class="st-section-card q-mb-md">
          <div class="st-section-header">
            <div class="st-section-icon">
              <q-icon name="router" size="16px" style="color: #1B6B3A" />
            </div>
            <div class="st-section-title">Server & Koneksi</div>
          </div>
          <div class="st-section-divider" />

          <div class="row q-gutter-md q-mb-lg q-mt-md">
            <div class="col">
              <div class="st-hint q-mb-xs">IP Server</div>
              <div class="row items-center q-gutter-sm">
                <div class="st-ip-chip">
                  <q-icon name="lan" size="13px" class="q-mr-xs" />
                  {{ guruStore.serverInfo.ip }}
                </div>
                <q-btn flat dense round icon="content_copy" size="sm" class="st-copy-btn" @click="copyIP" />
              </div>
            </div>
            <div>
              <div class="st-hint q-mb-xs">Port</div>
              <div class="st-port-num">{{ guruStore.serverInfo.port }}</div>
            </div>
          </div>

          <div class="st-section-divider q-mb-md" />

          <div>
            <div class="st-label q-mb-xs">Interval Auto-save Ujian</div>
            <div class="st-hint q-mb-sm">
              Seberapa sering jawaban siswa disimpan otomatis ke server saat ujian berlangsung.
            </div>
            <div class="row q-gutter-sm">
              <div
                v-for="opt in autoSaveOptions"
                :key="opt.value"
                class="st-interval-pill"
                :class="autoSaveIntervalLocal === opt.value ? 'st-interval-active' : 'st-interval-inactive'"
                @click="autoSaveIntervalLocal = opt.value; settingsStore.setAutoSaveInterval(opt.value)"
              >
                {{ opt.label }}
              </div>
            </div>
          </div>
        </div>

        <!-- Data & Backup -->
        <div class="st-section-card q-mb-md">
          <div class="st-section-header">
            <div class="st-section-icon">
              <q-icon name="storage" size="16px" style="color: #875200" />
            </div>
            <div class="st-section-title">Data & Backup</div>
          </div>
          <div class="st-section-divider" />
          <div class="st-hint q-mb-md q-mt-md">
            Backup database SQLite ke lokasi yang kamu pilih. Disarankan rutin dilakukan sebelum dan sesudah ujian.
          </div>
          <div class="row items-center q-gutter-md">
            <q-btn
              unelevated
              icon="archive"
              label="Backup Database"
              class="st-btn-backup"
              :loading="backingUp"
              @click="backupDb"
            />
            <div v-if="lastBackupTime" class="st-backup-info">
              <q-icon name="check_circle" size="14px" class="q-mr-xs" style="color: #10B981" />
              Terakhir: {{ lastBackupTime }}
            </div>
          </div>
        </div>

      </div>

      <!-- ── KOLOM KANAN: Tentang ─────────────────────────────── -->
      <div class="col-12 col-md-5">
        <div class="st-about-card">
          <div class="st-section-header">
            <div class="st-section-icon">
              <q-icon name="info" size="16px" style="color: #1a5fa8" />
            </div>
            <div class="st-section-title">Tentang Aplikasi</div>
          </div>
          <div class="st-section-divider" />

          <div class="text-center q-py-lg">
            <div class="st-logo-wrap">
              <img :src="logoSrc" alt="Sios CBE" style="height: 56px; object-fit: contain" />
            </div>
            <div class="st-app-name q-mt-md">Sios CBE</div>
            <div class="st-app-sub">Computer Based Exam</div>
          </div>

          <div class="st-section-divider q-mb-md" />

          <div class="st-info-list">
            <div class="st-info-row">
              <div class="st-info-icon"><q-icon name="tag" size="14px" /></div>
              <div class="st-info-label">Versi</div>
              <div class="st-info-val">1.0.0</div>
            </div>
            <div class="st-info-row">
              <div class="st-info-icon"><q-icon name="code" size="14px" /></div>
              <div class="st-info-label">Framework</div>
              <div class="st-info-val">Quasar 2 + Vue 3</div>
            </div>
            <div class="st-info-row">
              <div class="st-info-icon"><q-icon name="memory" size="14px" /></div>
              <div class="st-info-label">Runtime</div>
              <div class="st-info-val">Electron</div>
            </div>
            <div class="st-info-row">
              <div class="st-info-icon"><q-icon name="table_chart" size="14px" /></div>
              <div class="st-info-label">Database</div>
              <div class="st-info-val">SQLite (better-sqlite3)</div>
            </div>
            <div class="st-info-row" style="border-bottom: none">
              <div class="st-info-icon"><q-icon name="computer" size="14px" /></div>
              <div class="st-info-label">Platform</div>
              <div class="st-info-val">Linux / Windows</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useGuruStore } from 'stores/guru'
import { useThemeStore } from 'stores/theme'
import { useSettingsStore } from 'stores/settings'
import logoSrc from 'src/assets/logo.png'

const $q = useQuasar()
const guruStore = useGuruStore()
const themeStore = useThemeStore()
const settingsStore = useSettingsStore()

const namaSekolahInput = ref('')
const savingNama = ref(false)
const backingUp = ref(false)
const lastBackupTime = ref(localStorage.getItem('cbe-last-backup') || '')
const autoSaveIntervalLocal = ref(settingsStore.autoSaveInterval)

const autoSaveOptions = [
  { label: '30 detik', value: 30 },
  { label: '60 detik', value: 60 },
  { label: '120 detik', value: 120 }
]

async function loadSettings () {
  try {
    const res = await fetch(`${guruStore.baseUrl}/guru/settings`)
    if (res.ok) {
      const data = await res.json()
      namaSekolahInput.value = data.nama_sekolah || 'Sios CBE'
    }
  } catch (_) {
    namaSekolahInput.value = 'Sios CBE'
  }
}

async function simpanNamaSekolah () {
  if (!namaSekolahInput.value.trim()) return
  savingNama.value = true
  try {
    await fetch(`${guruStore.baseUrl}/guru/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'nama_sekolah', value: namaSekolahInput.value.trim() })
    })
    $q.notify({ type: 'positive', message: 'Nama sekolah berhasil disimpan', timeout: 2000 })
  } catch (_) {
    $q.notify({ type: 'negative', message: 'Gagal menyimpan nama sekolah' })
  } finally {
    savingNama.value = false
  }
}

async function backupDb () {
  if (!window.electronAPI?.backupDb) {
    $q.notify({ type: 'warning', message: 'Fitur backup hanya tersedia di aplikasi desktop' })
    return
  }
  backingUp.value = true
  try {
    const result = await window.electronAPI.backupDb()
    if (result.success) {
      const waktu = new Date().toLocaleString('id-ID')
      lastBackupTime.value = waktu
      localStorage.setItem('cbe-last-backup', waktu)
      $q.notify({ type: 'positive', message: 'Backup berhasil disimpan', timeout: 2500 })
    }
  } catch (_) {
    $q.notify({ type: 'negative', message: 'Gagal backup database' })
  } finally {
    backingUp.value = false
  }
}

async function copyIP () {
  try {
    await navigator.clipboard.writeText(guruStore.serverInfo.ip)
    $q.notify({ type: 'positive', message: 'IP berhasil disalin!', timeout: 1500 })
  } catch (_) {
    $q.notify({ message: guruStore.serverInfo.ip })
  }
}

onMounted(async () => {
  settingsStore.initSettings()
  autoSaveIntervalLocal.value = settingsStore.autoSaveInterval
  await Promise.all([guruStore.fetchServerInfo(), loadSettings()])
})
</script>

<style scoped>
/* ── TITLE ────────────────────────────────────────────────── */
.st-title {
  font-size: 22px; font-weight: 800; letter-spacing: -0.4px;
  background: linear-gradient(90deg, #1a5fa8, #0095C8);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

/* ── SECTION CARD — M3 Surface ────────────────────────────── */
.st-section-card, .st-about-card {
  padding: 20px; border-radius: var(--radius-lg);
  background: var(--c-surface); border: 1px solid var(--c-border); box-shadow: var(--m3-elev-1);
}

.st-section-header { display: flex; align-items: center; gap: 12px; }
.st-section-icon {
  width: 34px; height: 34px; border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  background: var(--c-surface-2);
}
.st-section-title { font-size: 14px; font-weight: 700; color: var(--c-text); }
.st-section-divider { height: 1px; margin: 12px 0; background: var(--c-border); }

/* ── TEXT ─────────────────────────────────────────────────── */
.st-label { font-size: 14px; font-weight: 500; color: var(--c-text); }
.st-hint  { font-size: 12px; color: var(--c-text-3); }

/* ── THEME TOGGLE ─────────────────────────────────────────── */
.st-theme-toggle-wrap { display: flex; align-items: center; }
.st-theme-icon { transition: color 0.2s; color: var(--c-text-2); }

/* ── M3 OUTLINED INPUT ────────────────────────────────────── */
:deep(.st-glass-input .q-field__control) {
  background: var(--c-surface-2) !important;
  border-radius: var(--radius-md) !important;
}
:deep(.st-glass-input .q-field__control:before) { border-color: var(--c-border) !important; }
:deep(.st-glass-input.q-field--focused .q-field__control:after) { border-color: var(--c-accent) !important; }
:deep(.st-glass-input.q-field--focused .q-field__control) { box-shadow: var(--c-shadow-focus) !important; }

/* ── BUTTONS — M3 Filled ──────────────────────────────────── */
.st-btn-primary {
  background: var(--c-accent) !important; color: white !important;
  border-radius: 20px !important; font-weight: 600 !important;
  box-shadow: var(--m3-elev-1) !important;
}
.st-btn-primary:hover { background: var(--c-accent-hover) !important; }

.st-btn-backup {
  background: var(--c-warning) !important; color: white !important;
  border-radius: 20px !important; font-weight: 600 !important;
  box-shadow: var(--m3-elev-1) !important;
}
.st-btn-backup:hover { filter: brightness(0.9) !important; }

.st-backup-info { font-size: 12px; display: flex; align-items: center; color: var(--c-text-3); }

/* ── IP CHIP ──────────────────────────────────────────────── */
.st-ip-chip {
  display: flex; align-items: center;
  padding: 6px 14px; border-radius: 999px;
  font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600;
  background: var(--c-accent-soft); border: 1px solid var(--c-border); color: var(--c-accent);
}
.st-port-num {
  font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 800;
  color: var(--c-accent);
}
.st-copy-btn { color: var(--c-text-3) !important; }

/* ── AUTO-SAVE PILLS — M3 Filter Chip ───────────────────────*/
.st-interval-pill {
  padding: 7px 18px; border-radius: 999px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s; user-select: none;
}
.st-interval-active {
  background: var(--c-accent); color: white; box-shadow: var(--m3-elev-1);
}
.st-interval-inactive {
  background: var(--c-surface-2); border: 1px solid var(--c-border); color: var(--c-text-2);
}
.st-interval-inactive:hover {
  background: var(--c-accent-soft); border-color: var(--c-accent); color: var(--c-accent);
}

/* ── ABOUT CARD ───────────────────────────────────────────── */
.st-logo-wrap {
  display: inline-flex; align-items: center; justify-content: center;
  width: 80px; height: 80px; border-radius: var(--radius-lg);
  background: var(--c-accent-soft); border: 1px solid var(--c-border);
}
.st-app-name {
  font-size: 18px; font-weight: 800;
  background: linear-gradient(90deg, #1a5fa8, #0095C8);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.st-app-sub { font-size: 12px; margin-top: 2px; color: var(--c-text-3); }

.st-info-list { display: flex; flex-direction: column; }
.st-info-row {
  display: flex; align-items: center; gap: 10px; padding: 10px 0;
  border-bottom: 1px solid var(--c-border);
}
.st-info-icon  { width: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--c-text-3); }
.st-info-label { flex: 1; font-size: 13px; color: var(--c-text-2); }
.st-info-val   { font-size: 13px; font-weight: 600; color: var(--c-text); }
</style>
