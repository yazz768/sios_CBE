<template>
  <q-page class="lp-page flex flex-center">

    <!-- Decorative blobs -->
    <div class="lp-blob lp-blob-1" />
    <div class="lp-blob lp-blob-2" />
    <div class="lp-blob lp-blob-3" />

    <!-- Login Card -->
    <div class="lp-card">

      <!-- Theme toggle -->
      <button class="lp-theme-btn" :title="theme.isDark ? 'Mode Terang' : 'Mode Gelap'" @click="theme.toggle()">
        <q-icon :name="theme.isDark ? 'light_mode' : 'dark_mode'" size="18px" />
      </button>

      <!-- Header -->
      <div class="lp-card-header">
        <div class="lp-logo-wrap">
          <img :src="logoSrc" alt="Sios CBE" style="height: 44px; object-fit: contain" />
        </div>
        <div class="lp-app-name">{{ namaSekolah }}</div>
        <div class="lp-app-sub">Computer Based Exam</div>
      </div>

      <!-- Form -->
      <div class="lp-form-section">
        <div class="lp-form-title">Masuk Ujian</div>

        <q-form @submit.prevent="masukUjian" class="lp-form">
          <!-- Nama Siswa -->
          <div class="lp-field-wrap">
            <q-input
              v-model="examStore.namaSiswa"
              label="Nama Lengkap"
              outlined
              autofocus
              class="lp-input"
              :rules="[v => !!v || 'Nama tidak boleh kosong']"
            >
              <template #prepend>
                <q-icon name="person" class="lp-input-icon" />
              </template>
            </q-input>
          </div>

          <!-- IP Guru -->
          <div class="lp-field-wrap">
            <q-input
              v-model="examStore.guruIP"
              label="IP Server Guru"
              outlined
              placeholder="Contoh: 192.168.1.5"
              class="lp-input"
              :rules="[v => !!v || 'IP server guru diperlukan']"
            >
              <template #prepend>
                <q-icon name="wifi" class="lp-input-icon" />
              </template>
            </q-input>
          </div>

          <!-- Token -->
          <div class="lp-field-wrap">
            <q-input
              v-model="tokenDisplay"
              label="Token Ujian"
              outlined
              maxlength="6"
              placeholder="Contoh: A3F7KM"
              class="lp-input lp-input-mono"
              :rules="[v => v.length === 6 || 'Token harus 6 karakter']"
              @update:model-value="onTokenInput"
            >
              <template #prepend>
                <q-icon name="vpn_key" class="lp-input-icon" />
              </template>
            </q-input>
          </div>

          <!-- Error -->
          <div v-if="errorMsg" class="lp-error-box">
            <q-icon name="error_outline" size="16px" class="q-mr-xs" />
            {{ errorMsg }}
          </div>

          <!-- Submit -->
          <q-btn
            type="submit"
            unelevated
            label="MASUK UJIAN"
            class="lp-submit-btn full-width"
            :loading="loading"
          />
        </q-form>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useExamStore } from 'stores/exam'
import { useThemeStore } from 'stores/theme'
import logoSrc from 'src/assets/logo.png'

const router = useRouter()
const examStore = useExamStore()
const theme = useThemeStore()

const loading = ref(false)
const errorMsg = ref('')
const namaSekolah = ref('Sios CBE')

async function fetchNamaSekolah () {
  if (!examStore.guruIP) return
  try {
    const res = await fetch(`http://${examStore.guruIP}:3000/settings/nama_sekolah`)
    if (res.ok) {
      const data = await res.json()
      namaSekolah.value = data.value || 'Sios CBE'
    }
  } catch (_) {}
}

watch(() => examStore.guruIP, (ip) => {
  if (ip) fetchNamaSekolah()
})

onMounted(() => {
  if (examStore.guruIP) fetchNamaSekolah()
})

const tokenDisplay = computed({
  get: () => examStore.tokenInput,
  set: v => { examStore.tokenInput = v.toUpperCase() }
})

function onTokenInput (v) {
  examStore.tokenInput = v.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

async function masukUjian () {
  errorMsg.value = ''
  loading.value = true
  try {
    await examStore.verifyToken()
    router.push('/info-ujian')
  } catch (err) {
    errorMsg.value = err.message || 'Gagal terhubung ke server guru. Periksa IP dan token.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ── PAGE ─────────────────────────────────────────────────── */
.lp-page {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
}

/* Blobs disembunyikan — tidak sesuai M3 style */
.lp-blob { display: none; }

/* ── CARD — M3 Surface + Elevation ───────────────────────── */
.lp-card {
  position: relative;
  z-index: 1;
  width: 420px;
  max-width: calc(100vw - 32px);
  border-radius: var(--radius-xl);
  padding: 40px;
}
:global(.body--dark) .lp-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  box-shadow: var(--m3-elev-3);
}
:global(.body--light) .lp-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  box-shadow: var(--m3-elev-2);
}

/* ── THEME TOGGLE — M3 Icon Button ──────────────────────── */
.lp-theme-btn {
  position: absolute;
  top: 16px; right: 16px;
  width: 36px; height: 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--c-border);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  background: var(--c-surface-2);
  color: var(--c-text-2);
}
.lp-theme-btn:hover {
  background: var(--c-accent-soft);
  border-color: var(--c-accent);
  color: var(--c-accent);
}

/* ── HEADER ───────────────────────────────────────────────── */
.lp-card-header { text-align: center; margin-bottom: 32px; }
.lp-logo-wrap {
  display: inline-flex; align-items: center; justify-content: center;
  width: 72px; height: 72px; border-radius: var(--radius-lg);
  background: var(--c-accent-soft);
  border: 1px solid var(--c-border);
  margin-bottom: 12px;
}
.lp-app-name {
  font-size: 22px; font-weight: 800; letter-spacing: -0.5px;
  background: linear-gradient(90deg, #1a5fa8, #0095C8);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.lp-app-sub { font-size: 12px; margin-top: 4px; color: var(--c-text-3); }

/* ── FORM ─────────────────────────────────────────────────── */
.lp-form-title {
  font-size: 16px; font-weight: 700; margin-bottom: 20px;
  color: var(--c-text);
}
.lp-form { display: flex; flex-direction: column; gap: 4px; }
.lp-field-wrap { margin-bottom: 8px; }

/* M3 Outlined input */
:deep(.lp-input .q-field__control) {
  background: var(--c-surface-2) !important;
  border-radius: var(--radius-md) !important;
}
:deep(.lp-input .q-field__control:before) {
  border-color: var(--c-border) !important;
}
:deep(.lp-input:hover .q-field__control:before) {
  border-color: var(--c-border-2) !important;
}
:deep(.lp-input.q-field--focused .q-field__control:after) {
  border-color: var(--c-accent) !important;
}
:deep(.lp-input.q-field--focused .q-field__control) {
  box-shadow: var(--c-shadow-focus) !important;
}
:deep(.lp-input .q-field__label) { color: var(--c-text-3) !important; }
:deep(.lp-input .q-field__native),
:deep(.lp-input input) { color: var(--c-text) !important; }

.lp-input-icon { font-size: 18px !important; color: var(--c-text-3) !important; }

:deep(.lp-input-mono input) {
  font-family: 'JetBrains Mono', monospace !important;
  font-size: 16px !important;
  letter-spacing: 2px !important;
  font-weight: 700 !important;
}

/* ── ERROR ────────────────────────────────────────────────── */
.lp-error-box {
  display: flex; align-items: center;
  padding: 10px 14px; border-radius: var(--radius-md);
  font-size: 13px; margin-bottom: 8px;
  background: var(--c-danger-bg);
  border: 1px solid var(--c-danger);
  color: var(--c-danger);
}

/* ── SUBMIT BUTTON — M3 Filled Button ───────────────────── */
.lp-submit-btn {
  background: var(--c-accent) !important;
  color: white !important;
  border-radius: 20px !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  height: 48px !important;
  margin-top: 8px;
  transition: all 0.2s !important;
  box-shadow: var(--m3-elev-1) !important;
}
.lp-submit-btn:hover {
  background: var(--c-accent-hover) !important;
  box-shadow: var(--m3-elev-2) !important;
}
</style>
