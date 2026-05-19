<template>
  <q-layout
    view="lHh Lpr lFf"
    :class="$q.dark.isActive ? 'gl-dark' : 'gl-light'"
  >
    <!-- ── TOPBAR ──────────────────────────────────────────── -->
    <q-header class="gl-topbar" :elevation="0">
      <q-toolbar class="gl-toolbar">
        <!-- Hamburger -->
        <q-btn
          flat dense round
          icon="menu"
          class="gl-icon-btn"
          @click="drawer = !drawer"
        />

        <!-- Page title dengan gradient text -->
        <div class="gl-page-title">{{ pageTitle }}</div>

        <q-space />

        <!-- Server status chip -->
        <div class="gl-server-chip">
          <span class="gl-pulse-dot" />
          <q-icon name="wifi" size="13px" class="q-mr-xs gl-server-icon" />
          <span class="gl-server-text">
            {{ guruStore.serverInfo.ip }}:{{ guruStore.serverInfo.port }}
          </span>
        </div>
      </q-toolbar>
    </q-header>

    <!-- ── SIDEBAR ─────────────────────────────────────────── -->
    <q-drawer
      v-model="drawer"
      show-if-above
      :width="220"
      :breakpoint="700"
      class="gl-drawer"
    >
      <q-scroll-area style="height: calc(100% - 60px)">

        <!-- Logo area -->
        <div class="gl-logo-area">
          <div class="gl-logo-icon-wrap">
            <img :src="logoSrc" alt="CBE" class="gl-logo-img" />
          </div>
          <div class="gl-logo-text">
            <div class="gl-logo-name">Sios CBE</div>
            <div class="gl-logo-sub">Dashboard Guru</div>
          </div>
        </div>

        <div class="gl-divider" />

        <!-- Navigation -->
        <nav class="gl-nav q-px-sm q-pt-xs">
          <q-item
            v-ripple
            clickable
            :to="{ path: '/dashboard' }"
            active-class="gl-nav-active"
            exact
            class="gl-nav-item"
          >
            <q-item-section avatar class="gl-nav-icon-sec">
              <q-icon name="dashboard" size="18px" />
            </q-item-section>
            <q-item-section class="gl-nav-label">Dashboard</q-item-section>
          </q-item>

          <q-item
            v-ripple
            clickable
            :to="{ path: '/bank-soal' }"
            active-class="gl-nav-active"
            exact
            class="gl-nav-item"
          >
            <q-item-section avatar class="gl-nav-icon-sec">
              <q-icon name="quiz" size="18px" />
            </q-item-section>
            <q-item-section class="gl-nav-label">Bank Soal</q-item-section>
          </q-item>

          <q-item
            v-ripple
            clickable
            :to="{ path: '/buat-ujian' }"
            active-class="gl-nav-active"
            exact
            class="gl-nav-item"
          >
            <q-item-section avatar class="gl-nav-icon-sec">
              <q-icon name="add_task" size="18px" />
            </q-item-section>
            <q-item-section class="gl-nav-label">Buat Ujian</q-item-section>
          </q-item>

          <q-item
            v-ripple
            clickable
            :to="{ path: '/hasil' }"
            active-class="gl-nav-active"
            exact
            class="gl-nav-item"
          >
            <q-item-section avatar class="gl-nav-icon-sec">
              <q-icon name="bar_chart" size="18px" />
            </q-item-section>
            <q-item-section class="gl-nav-label">Hasil Ujian</q-item-section>
          </q-item>

        </nav>
      </q-scroll-area>

      <!-- Settings + Version — pinned ke bawah -->
      <div class="gl-bottom-section q-px-sm">
        <div class="gl-divider-sm" />
        <q-item
          v-ripple
          clickable
          :to="{ path: '/settings' }"
          active-class="gl-nav-active"
          exact
          class="gl-nav-item"
        >
          <q-item-section avatar class="gl-nav-icon-sec">
            <q-icon name="settings" size="18px" />
          </q-item-section>
          <q-item-section class="gl-nav-label">Pengaturan</q-item-section>
        </q-item>
        <div class="gl-version-bottom">v1.0 — Sios CBE</div>
      </div>
    </q-drawer>

    <!-- ── PAGE CONTENT ───────────────────────────────────── -->
    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="gl-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import { useGuruStore } from 'stores/guru'
import logoSrc from 'src/assets/logo.png'

const $q = useQuasar()
const route = useRoute()
const drawer = ref(true)
const guruStore = useGuruStore()

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  'bank-soal': 'Bank Soal',
  'buat-ujian': 'Buat Ujian',
  hasil: 'Hasil Ujian',
  monitor: 'Monitor Ujian',
  csp: 'Monitor Layar',
  settings: 'Pengaturan',
}

const pageTitle = computed(() => {
  const segment = route.path.split('/')[1]
  return PAGE_TITLES[segment] || 'Sios CBE'
})

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
/* ── PAGE TRANSITION ──────────────────────────────────── */
.gl-fade-enter-active,
.gl-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.gl-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.gl-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── TOPBAR — M3 Surface style ────────────────────────── */
.gl-dark :deep(.gl-topbar) {
  background: #1A1C20 !important;
  border-bottom: 1px solid #383C44 !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4) !important;
}

.gl-light :deep(.gl-topbar) {
  background: #FFFFFF !important;
  border-bottom: 1px solid #C3CAD9 !important;
  box-shadow: 0 1px 3px rgba(26,28,74,0.08) !important;
}

.gl-toolbar {
  height: 60px;
  min-height: 60px !important;
  padding: 0 20px;
}

/* Hamburger button */
.gl-icon-btn {
  margin-right: 12px;
}

.gl-dark .gl-icon-btn {
  color: #A8B0C0 !important;
}
.gl-light .gl-icon-btn {
  color: #44546F !important;
}
.gl-icon-btn:hover {
  background: rgba(26,95,168,0.08) !important;
}

/* Page title */
.gl-page-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.3px;
  background: linear-gradient(90deg, #1a5fa8, #0095C8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Server chip */
.gl-server-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  cursor: default;
  letter-spacing: 0.2px;
}

.gl-dark .gl-server-chip {
  background: rgba(26,95,168,0.15);
  border: 1px solid rgba(168,200,255,0.2);
  color: #A8C8FF;
}
.gl-light .gl-server-chip {
  background: #D3E4FF;
  border: 1px solid #A8C8FF;
  color: #1a5fa8;
}

.gl-server-icon {
  opacity: 0.7;
}

.gl-server-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
}

/* Pulse dot */
.gl-pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22C55E;
  flex-shrink: 0;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6);
  animation: gl-pulse 2s ease-out infinite;
}

@keyframes gl-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
  70%  { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

/* ── SIDEBAR (DRAWER) — tetap dark navy M3 ────────────── */
:deep(.gl-drawer),
:deep(.gl-drawer .q-drawer__content),
:deep(.gl-drawer .q-scrollarea),
:deep(.gl-drawer .q-scrollarea__container),
:deep(.gl-drawer .q-scrollarea__content) {
  border-right: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

:deep(.gl-drawer) {
  box-shadow: 2px 0 8px rgba(0,0,0,0.25) !important;
}

.gl-dark :deep(.gl-drawer) {
  background: #0F1118 !important;
}
.gl-dark :deep(.gl-drawer .q-drawer__content) {
  background: #0F1118 !important;
}

.gl-light :deep(.gl-drawer) {
  background: #1A1C4A !important;
}
.gl-light :deep(.gl-drawer .q-drawer__content) {
  background: #1A1C4A !important;
}

:deep(.gl-drawer .q-scrollarea__container),
:deep(.gl-drawer .q-scrollarea__content) {
  min-height: 100% !important;
}

/* ── LOGO AREA ────────────────────────────────────────── */
.gl-logo-area {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px 16px;
}

.gl-logo-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(168,200,255,0.15);
  border: 1px solid rgba(168,200,255,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.gl-logo-img {
  width: 26px;
  height: 26px;
  object-fit: contain;
  filter: brightness(1.1);
}

.gl-logo-name {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: #FFFFFF;
}

.gl-logo-sub {
  font-size: 10.5px;
  font-weight: 500;
  margin-top: 1px;
  color: rgba(168, 200, 255, 0.55);
}

/* ── DIVIDERS ─────────────────────────────────────────── */
.gl-divider {
  height: 1px;
  margin: 4px 16px 10px;
  background: rgba(168,200,255,0.1);
}

.gl-divider-sm {
  height: 1px;
  margin: 6px 12px;
  background: rgba(168,200,255,0.08);
}

/* ── NAV ITEMS ────────────────────────────────────────── */
.gl-nav-item {
  border-radius: 12px !important;
  margin-bottom: 3px !important;
  min-height: 42px !important;
  padding: 8px 12px !important;
  position: relative;
  overflow: hidden;
  transition: background 0.15s ease, color 0.15s ease !important;
  color: rgba(168, 200, 255, 0.6) !important;
}

:deep(.gl-nav-icon-sec) {
  min-width: 28px !important;
  padding-right: 0 !important;
}

.gl-nav-item:hover {
  background: rgba(168,200,255,0.08) !important;
  color: rgba(200, 220, 255, 0.9) !important;
}

.gl-nav-label {
  font-size: 13px !important;
  font-weight: 500 !important;
}

/* ── ACTIVE NAV ITEM — M3 Navigation Rail style ───────── */
:deep(.gl-nav-active) {
  background: rgba(168,200,255,0.14) !important;
  color: #FFFFFF !important;
}
:deep(.gl-nav-active) .gl-nav-label {
  font-weight: 600 !important;
}

:deep(.gl-nav-active)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 7px;
  bottom: 7px;
  width: 3px;
  background: #A8C8FF;
  border-radius: 0 3px 3px 0;
}

/* ── BOTTOM SECTION (Settings pinned) ────────────────── */
.gl-bottom-section {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: 8px;
}

/* ── VERSION TEXT ─────────────────────────────────────── */
.gl-version-bottom {
  text-align: center;
  font-size: 10px;
  letter-spacing: 0.3px;
  color: rgba(168, 200, 255, 0.25);
  padding: 6px 0 4px;
}
</style>
