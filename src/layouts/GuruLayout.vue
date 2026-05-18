<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Header -->
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="drawer = !drawer" />
        <q-toolbar-title class="text-weight-bold">
          Sios CBE
        </q-toolbar-title>
        <q-chip color="green-8" text-color="white" icon="wifi" dense>
          Server: {{ guruStore.serverInfo.ip }}:{{ guruStore.serverInfo.port }}
        </q-chip>
      </q-toolbar>
    </q-header>

    <!-- Sidebar Navigasi -->
    <q-drawer
      v-model="drawer"
      show-if-above
      :width="220"
      :breakpoint="700"
      bordered
    >
      <q-scroll-area class="fit">
        <div class="q-pa-md q-pb-sm row items-center no-wrap">
          <img :src="logoSrc" alt="CBE" style="height: 40px; object-fit: contain; margin-right: 10px; flex-shrink: 0" />
          <div>
            <div class="text-weight-bold text-white" style="font-size: 15px">Sios CBE</div> 
            <div class="text-caption" style="color: rgba(255,255,255,0.45)">Dashboard Guru</div>
          </div>
        </div>

        <q-separator dark />

        <q-list padding>
          <q-item
            clickable v-ripple
            :to="{ path: '/dashboard' }"
            active-class="bg-white-2 text-white"
            exact
          >
            <q-item-section avatar>
              <q-icon name="dashboard" color="white" />
            </q-item-section>
            <q-item-section class="text-white">Dashboard</q-item-section>
          </q-item>

          <q-item
            clickable v-ripple
            :to="{ path: '/bank-soal' }"
            active-class="bg-white-2 text-white"
            exact
          >
            <q-item-section avatar>
              <q-icon name="quiz" color="white" />
            </q-item-section>
            <q-item-section class="text-white">Bank Soal</q-item-section>
          </q-item>

          <q-item
            clickable v-ripple
            :to="{ path: '/buat-ujian' }"
            active-class="bg-white-2 text-white"
            exact
          >
            <q-item-section avatar>
              <q-icon name="add_task" color="white" />
            </q-item-section>
            <q-item-section class="text-white">Buat Ujian</q-item-section>
          </q-item>

          <q-item
            clickable v-ripple
            :to="{ path: '/hasil' }"
            active-class="bg-white-2 text-white"
            exact
          >
            <q-item-section avatar>
              <q-icon name="bar_chart" color="white" />
            </q-item-section>
            <q-item-section class="text-white">Hasil Ujian</q-item-section>
          </q-item>

          <q-separator dark class="q-my-sm" />

          <q-item
            clickable v-ripple
            :to="{ path: '/settings' }"
            active-class="bg-white-2 text-white"
            exact
          >
            <q-item-section avatar>
              <q-icon name="settings" color="white" />
            </q-item-section>
            <q-item-section class="text-white">Pengaturan</q-item-section>
          </q-item>
        </q-list>

        <div class="q-px-md q-pb-md absolute-bottom">
          <div class="text-caption" style="color: rgba(255,255,255,0.3)">v1.0 — Sios CBE</div>
        </div>
      </q-scroll-area>
    </q-drawer>

    <!-- Konten Halaman -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { useGuruStore } from 'stores/guru'
import logoSrc from 'src/assets/logo.png'

const $q = useQuasar()
const drawer = ref(true)
const guruStore = useGuruStore()

let removeSubmitListener = null

onMounted(async () => {
  await guruStore.fetchServerInfo()

  if (window.electronAPI?.onStudentSubmit) {
    removeSubmitListener = window.electronAPI.onStudentSubmit(({ nama }) => {
      $q.notify({
        type: 'positive',
        message: `${nama} telah mengumpulkan ujian`,
        icon: 'assignment_turned_in',
        timeout: 5000,
        position: 'top-right'
      })
    })
  }
})

onUnmounted(() => {
  removeSubmitListener?.()
})
</script>

<style scoped>
/* Sidebar menggunakan warna nav dari design tokens */
:deep(.q-drawer) {
  background: var(--c-nav-bg) !important;
}
</style>
