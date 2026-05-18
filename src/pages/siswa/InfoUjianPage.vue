<template>
  <q-page class="flex flex-center" style="min-height: 100vh; background: var(--c-bg)">
    <q-card style="width: 480px" flat bordered>
      <q-card-section class="bg-primary text-white text-center q-py-md" style="position: relative">
        <button
          class="theme-toggle"
          style="position: absolute; top: 12px; right: 12px;"
          :title="theme.isDark ? 'Switch to Light mode' : 'Switch to Dark mode'"
          @click="theme.toggle()"
        >
          {{ theme.isDark ? '☀️' : '🌙' }}
        </button>
        <img :src="logoSrc" alt="Sios CBE" style="height: 56px; object-fit: contain; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3))" class="q-mb-xs" />
        <div class="text-h6 text-weight-bold">Informasi Ujian</div>
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <!-- Detail Ujian -->
        <q-list bordered separator rounded>
          <q-item>
            <q-item-section avatar>
              <q-icon name="title" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>Judul Ujian</q-item-label>
              <q-item-label class="text-weight-medium">{{ examStore.ujianInfo?.judul }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon name="book" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>Mata Pelajaran</q-item-label>
              <q-item-label>{{ examStore.ujianInfo?.mata_pelajaran }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon name="timer" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>Durasi</q-item-label>
              <q-item-label>{{ examStore.ujianInfo?.durasi_menit }} menit</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon name="quiz" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>Jumlah Soal</q-item-label>
              <q-item-label>{{ examStore.ujianInfo?.jumlah_soal }} soal</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon name="person" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>Peserta</q-item-label>
              <q-item-label class="text-weight-medium">{{ examStore.namaSiswa }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Peraturan -->
        <q-banner class="q-mt-md" dense rounded :style="{ background: 'var(--c-warning-bg)', color: 'var(--c-text)' }">
          <template #avatar>
            <q-icon name="warning" color="warning" />
          </template>
          <div class="text-weight-medium q-mb-xs" :style="{ color: 'var(--c-text)' }">Peraturan Ujian:</div>
          <ul class="q-pl-md q-ma-none text-caption" :style="{ color: 'var(--c-text-2)' }">
            <li>Dilarang berpindah aplikasi selama ujian berlangsung</li>
            <li>Dilarang membuka program atau website lain</li>
            <li>Layar akan dikunci penuh selama ujian</li>
            <li>Ujian otomatis dikumpulkan saat waktu habis</li>
            <li>Bekerjalah secara jujur dan mandiri</li>
          </ul>
        </q-banner>
      </q-card-section>

      <q-card-actions class="q-pa-lg q-pt-none" align="center">
        <q-btn flat label="Kembali" @click="router.push('/')" />
        <q-btn
          unelevated
          color="primary"
          icon="play_arrow"
          label="Mulai Ujian"
          size="md"
          :loading="loading"
          @click="mulaiUjian"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useExamStore } from 'stores/exam'
import { useThemeStore } from 'stores/theme'
import logoSrc from 'src/assets/logo.png'

const router = useRouter()
const $q = useQuasar()
const examStore = useExamStore()
const theme = useThemeStore()

const loading = ref(false)

async function mulaiUjian () {
  loading.value = true
  try {
    await examStore.joinExam()
    await examStore.loadSoal()
    router.push('/exam')
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message || 'Gagal memulai ujian' })
  } finally {
    loading.value = false
  }
}
</script>
