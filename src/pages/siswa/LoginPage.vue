<template>
  <q-page class="flex flex-center" style="min-height: 100vh; background: var(--c-bg)">
    <q-card style="width: 420px" flat bordered>
      <!-- Header / Branding -->
      <q-card-section class="bg-primary text-white text-center q-py-lg" style="position: relative">
        <button
          class="theme-toggle"
          style="position: absolute; top: 12px; right: 12px;"
          :title="theme.isDark ? 'Switch to Light mode' : 'Switch to Dark mode'"
          @click="theme.toggle()"
        >
          {{ theme.isDark ? '☀️' : '🌙' }}
        </button>
        <img :src="logoSrc" alt="Sios CBE" style="height: 80px; object-fit: contain; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3))" class="q-mb-sm" />
        <div class="text-h5 text-weight-bold">{{ namaSekolah }}</div>
        <div class="text-caption opacity-80">Computer Based Exam</div>
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <div class="text-h6 text-grey-8 q-mb-md">Masuk Ujian</div>

        <q-form @submit.prevent="masukUjian" class="q-gutter-md">
          <!-- Nama Siswa -->
          <q-input
            v-model="examStore.namaSiswa"
            label="Nama Lengkap *"
            outlined
            autofocus
            :rules="[v => !!v || 'Nama tidak boleh kosong']"
          >
            <template #prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <!-- IP Guru -->
          <q-input
            v-model="examStore.guruIP"
            label="IP Server Guru *"
            outlined
            placeholder="Contoh: 192.168.1.5"
            :rules="[v => !!v || 'IP server guru diperlukan']"
          >
            <template #prepend>
              <q-icon name="wifi" />
            </template>
          </q-input>

          <!-- Token Ujian -->
          <q-input
            v-model="tokenDisplay"
            label="Token Ujian *"
            outlined
            maxlength="6"
            placeholder="Contoh: A3F7KM"
            :rules="[v => v.length === 6 || 'Token harus 6 karakter']"
            @update:model-value="onTokenInput"
          >
            <template #prepend>
              <q-icon name="vpn_key" />
            </template>
          </q-input>

          <q-btn
            type="submit"
            unelevated
            color="primary"
            label="Masuk Ujian"
            class="full-width"
            size="lg"
            :loading="loading"
          />
        </q-form>
      </q-card-section>

      <q-card-section v-if="errorMsg" class="q-pt-none">
        <q-banner class="bg-negative text-white" dense rounded>
          <template #avatar>
            <q-icon name="error" />
          </template>
          {{ errorMsg }}
        </q-banner>
      </q-card-section>
    </q-card>
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

// Fetch nama sekolah dari server guru saat IP diisi
async function fetchNamaSekolah () {
  if (!examStore.guruIP) return
  try {
    const res = await fetch(`http://${examStore.guruIP}:3000/settings/nama_sekolah`)
    if (res.ok) {
      const data = await res.json()
      namaSekolah.value = data.value || 'Sios CBE'
    }
  } catch (_) {
    // Tidak bisa fetch — tetap pakai default
  }
}

// Watch IP — update nama sekolah saat IP diubah
watch(() => examStore.guruIP, (ip) => {
  if (ip) fetchNamaSekolah()
})

onMounted(() => {
  if (examStore.guruIP) fetchNamaSekolah()
})

// Token selalu uppercase
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
