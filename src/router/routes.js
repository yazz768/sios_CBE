const routes = [
  // ─── Routes Guru ─────────────────────────────────────────────
  {
    path: '/guru',
    component: () => import('layouts/GuruLayout.vue'),
    children: [
      { path: '', redirect: '/guru/dashboard' },
      { path: 'dashboard', component: () => import('pages/guru/DashboardPage.vue') },
      { path: 'bank-soal', component: () => import('pages/guru/BankSoalPage.vue') },
      { path: 'buat-ujian', component: () => import('pages/guru/BuatUjianPage.vue') },
      { path: 'monitor/:token', component: () => import('pages/guru/MonitorPage.vue') }
    ]
  },

  // ─── Routes Siswa ─────────────────────────────────────────────
  {
    path: '/siswa',
    component: () => import('layouts/SiswaLayout.vue'),
    children: [
      { path: '', redirect: '/siswa/login' },
      { path: 'login', component: () => import('pages/siswa/LoginPage.vue') },
      { path: 'info-ujian', component: () => import('pages/siswa/InfoUjianPage.vue') },
      { path: 'exam', component: () => import('pages/siswa/ExamPage.vue') }
    ]
  },

  // Redirect root ke dashboard guru
  { path: '/', redirect: '/guru/dashboard' },

  // 404
  { path: '/:catchAll(.*)*', redirect: '/' }
]

export default routes
