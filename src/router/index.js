import { defineRouter } from '#q-app/wrappers'
import { createRouter, createWebHashHistory } from 'vue-router'

// Routes guru — dimuat saat APP_MODE=guru
const guruRoutes = [
  {
    path: '/',
    component: () => import('layouts/GuruLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: () => import('pages/guru/DashboardPage.vue') },
      { path: 'bank-soal', component: () => import('pages/guru/BankSoalPage.vue') },
      { path: 'buat-ujian', component: () => import('pages/guru/BuatUjianPage.vue') },
      { path: 'monitor/:token', component: () => import('pages/guru/MonitorPage.vue') },
      { path: 'hasil', component: () => import('pages/guru/HasilIndexPage.vue') },
      { path: 'hasil/:token', component: () => import('pages/guru/HasilUjianPage.vue') },
      { path: 'settings', component: () => import('pages/guru/SettingsPage.vue') },
      { path: 'csp/:token', component: () => import('pages/guru/CspPage.vue') }
    ]
  },
  { path: '/:catchAll(.*)*', redirect: '/dashboard' }
]

// Routes siswa — dimuat saat APP_MODE=siswa
const siswaRoutes = [
  {
    path: '/',
    component: () => import('layouts/SiswaLayout.vue'),
    children: [
      { path: '', component: () => import('pages/siswa/LoginPage.vue') },
      { path: 'info-ujian', component: () => import('pages/siswa/InfoUjianPage.vue') },
      { path: 'exam', component: () => import('pages/siswa/ExamPage.vue') },
      { path: 'selesai', component: () => import('pages/siswa/SelesaiPage.vue') }
    ]
  },
  { path: '/:catchAll(.*)*', redirect: '/' }
]

export default defineRouter(function () {
  const appMode = process.env.APP_MODE || 'guru'
  const routes = appMode === 'siswa' ? siswaRoutes : guruRoutes

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createWebHashHistory()
  })
  return Router
})
