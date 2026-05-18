<template>
  <q-page padding>
    <div class="text-h5 text-primary q-mb-lg">Pengaturan</div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-7">

        <!-- ── Tampilan ── -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-icon name="palette" color="primary" size="20px" class="q-mr-sm" />
              <div class="text-h6">Tampilan</div>
            </div>
            <div class="row items-center justify-between">
              <div>
                <div class="text-body2">Mode Gelap / Terang</div>
                <div class="text-caption text-grey-6">Ubah tema tampilan aplikasi</div>
              </div>
              <q-toggle
                :model-value="themeStore.isDark"
                checked-icon="dark_mode"
                unchecked-icon="light_mode"
                color="primary"
                size="lg"
                @update:model-value="themeStore.toggle()"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- ── Identitas Sekolah ── -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-icon name="school" color="primary" size="20px" class="q-mr-sm" />
              <div class="text-h6">Identitas Sekolah</div>
            </div>
            <div class="text-caption text-grey-6 q-mb-md">
              Nama sekolah akan ditampilkan di halaman login siswa.
            </div>
            <div class="row q-gutter-sm items-start">
              <q-input
                v-model="namaSekolahInput"
                label="Nama Sekolah"
                outlined
                class="col"
                :loading="savingNama"
              />
              <q-btn
                unelevated
                color="primary"
                label="Simpan"
                class="q-mt-xs"
                :loading="savingNama"
                @click="simpanNamaSekolah"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- ── Server & Koneksi ── -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-icon name="router" color="primary" size="20px" class="q-mr-sm" />
              <div class="text-h6">Server & Koneksi</div>
            </div>

            <!-- IP & Port -->
            <div class="row q-gutter-md q-mb-lg">
              <div class="col">
                <div class="text-caption text-grey-6 q-mb-xs">IP Server</div>
                <div class="row items-center q-gutter-sm">
                  <div class="text-h6 text-primary text-weight-bold">{{ guruStore.serverInfo.ip }}</div>
                  <q-btn flat dense round icon="content_copy" size="sm" color="primary" @click="copyIP" />
                </div>
              </div>
              <div>
                <div class="text-caption text-grey-6 q-mb-xs">Port</div>
                <div class="text-h6 text-weight-medium">{{ guruStore.serverInfo.port }}</div>
              </div>
            </div>

            <q-separator class="q-mb-md" />

            <!-- Auto-save interval -->
            <div>
              <div class="text-body2 q-mb-xs">Interval Auto-save Ujian</div>
              <div class="text-caption text-grey-6 q-mb-sm">
                Seberapa sering jawaban siswa disimpan otomatis ke server saat ujian berlangsung.
              </div>
              <q-btn-toggle
                v-model="autoSaveIntervalLocal"
                :options="[
                  { label: '30 detik', value: 30 },
                  { label: '60 detik', value: 60 },
                  { label: '120 detik', value: 120 }
                ]"
                unelevated
                rounded
                color="primary"
                text-color="primary"
                toggle-color="primary"
                toggle-text-color="white"
                @update:model-value="settingsStore.setAutoSaveInterval($event)"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- ── Data & Backup ── -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-icon name="storage" color="primary" size="20px" class="q-mr-sm" />
              <div class="text-h6">Data & Backup</div>
            </div>
            <div class="text-caption text-grey-6 q-mb-md">
              Backup database SQLite ke lokasi yang kamu pilih. Disarankan rutin dilakukan sebelum dan sesudah ujian.
            </div>
            <div class="row items-center q-gutter-md">
              <q-btn
                unelevated
                color="brown-6"
                icon="archive"
                label="Backup Database"
                :loading="backingUp"
                @click="backupDb"
              />
              <div v-if="lastBackupTime" class="text-caption text-grey-6">
                <q-icon name="check_circle" color="positive" size="14px" class="q-mr-xs" />
                Terakhir: {{ lastBackupTime }}
              </div>
            </div>
          </q-card-section>
        </q-card>

      </div>

      <!-- ── Tentang Aplikasi (kolom kanan) ── -->
      <div class="col-12 col-md-5">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-icon name="info" color="primary" size="20px" class="q-mr-sm" />
              <div class="text-h6">Tentang Aplikasi</div>
            </div>

            <div class="text-center q-py-md">
              <img :src="logoSrc" alt="Sios CBE" style="height: 64px; object-fit: contain" class="q-mb-sm" />
              <div class="text-h6 text-weight-bold text-primary">Sios CBE</div>
              <div class="text-caption text-grey-6">Computer Based Exam</div>
            </div>

            <q-separator class="q-my-md" />

            <q-list dense>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Versi</q-item-label>
                  <q-item-label>1.0.0</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Framework</q-item-label>
                  <q-item-label>Quasar 2 + Vue 3</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Runtime</q-item-label>
                  <q-item-label>Electron</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Database</q-item-label>
                  <q-item-label>SQLite (better-sqlite3)</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Platform</q-item-label>
                  <q-item-label>Linux / Windows</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
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
