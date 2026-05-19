<template>
  <q-page padding class="db-page">

    <!-- ── HEADER ─────────────────────────────────────── -->
    <div class="db-page-header q-mb-xl">
      <h1 class="db-page-title">Dashboard</h1>
      <p class="db-page-sub">Selamat datang di panel kontrol ujian</p>
    </div>

    <!-- ── STAT CARDS ─────────────────────────────────── -->
    <div class="row q-col-gutter-md q-mb-xl">

      <!-- Total Soal -->
      <div class="col-12 col-sm-6 col-md-3">
        <div class="db-stat-card db-stat-blue">
          <div class="db-stat-top">
            <div class="db-stat-icon-wrap db-icon-blue">
              <q-icon name="quiz" size="20px" color="white" />
            </div>
            <div class="db-stat-badge db-badge-blue">Soal</div>
          </div>
          <div class="db-stat-number">{{ guruStore.totalSoal }}</div>
          <div class="db-stat-label">Total Soal di Bank</div>
          <div class="db-stat-bar db-bar-blue" />
        </div>
      </div>

      <!-- Total Ujian -->
      <div class="col-12 col-sm-6 col-md-3">
        <div class="db-stat-card db-stat-green">
          <div class="db-stat-top">
            <div class="db-stat-icon-wrap db-icon-green">
              <q-icon name="assignment" size="20px" color="white" />
            </div>
            <div class="db-stat-badge db-badge-green">Ujian</div>
          </div>
          <div class="db-stat-number">{{ guruStore.totalUjian }}</div>
          <div class="db-stat-label">Total Ujian Dibuat</div>
          <div class="db-stat-bar db-bar-green" />
        </div>
      </div>

      <!-- Ujian Aktif -->
      <div class="col-12 col-sm-6 col-md-3">
        <div class="db-stat-card db-stat-orange">
          <div class="db-stat-top">
            <div class="db-stat-icon-wrap db-icon-orange">
              <q-icon name="play_circle" size="20px" color="white" />
            </div>
            <div class="db-stat-badge db-badge-orange">Live</div>
          </div>
          <div class="db-stat-number">{{ guruStore.ujianAktif }}</div>
          <div class="db-stat-label">Ujian Sedang Aktif</div>
          <div class="db-stat-bar db-bar-orange" />
        </div>
      </div>

      <!-- Server IP -->
      <div class="col-12 col-sm-6 col-md-3">
        <div class="db-server-card">
          <!-- Decorative circles -->
          <div class="db-server-circle db-server-circle-1" />
          <div class="db-server-circle db-server-circle-2" />

          <div class="db-server-inner">
            <div class="row items-center justify-between q-mb-sm">
              <div class="db-server-icon-wrap">
                <q-icon name="dns" size="18px" color="white" />
              </div>
              <div class="db-server-status-dot">
                <span class="db-dot-pulse" />
                <span class="db-server-status-text">Online</span>
              </div>
            </div>

            <div class="db-server-ip-label">IP Server Guru</div>
            <div class="db-server-ip">{{ guruStore.serverInfo.ip }}</div>

            <div class="db-server-footer">
              <div class="db-server-port-pill">
                <q-icon name="settings_ethernet" size="12px" class="q-mr-xs" />
                Port {{ guruStore.serverInfo.port }}
              </div>
              <q-btn
                flat dense
                icon="copy_all"
                label="Salin"
                size="xs"
                class="db-copy-btn"
                @click="copyIP"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── AKSI CEPAT ──────────────────────────────────── -->
    <div class="db-section-title q-mb-md">Aksi Cepat</div>
    <div class="row q-gutter-sm q-mb-xl">
      <q-btn
        unelevated
        icon="add"
        label="Buat Soal Baru"
        to="/bank-soal"
        size="md"
        class="db-btn-primary"
      />
      <q-btn
        unelevated
        icon="add_task"
        label="Buat Ujian Baru"
        to="/buat-ujian"
        size="md"
        class="db-btn-glass"
      />
      <q-btn
        unelevated
        icon="settings"
        label="Pengaturan"
        to="/settings"
        size="md"
        class="db-btn-glass"
      />
    </div>

    <!-- ── UJIAN TERBARU ───────────────────────────────── -->
    <div class="db-section-title q-mb-md">Ujian Terbaru</div>
    <div class="db-table-card">
      <q-table
        :rows="guruStore.ujianList"
        :columns="ujianColumns"
        row-key="id"
        flat
        :loading="guruStore.isLoading"
        no-data-label="Belum ada ujian dibuat"
        :pagination="{ rowsPerPage: 5 }"
        class="db-table"
      >
        <template #body-cell-status="props">
          <q-td :props="props">
            <span :class="['db-status-pill', `db-status-${props.value}`]">{{ props.value }}</span>
          </q-td>
        </template>
        <template #body-cell-aksi="props">
          <q-td :props="props">
            <q-btn
              v-if="props.row.status === 'draft'"
              flat dense
              icon="play_arrow"
              label="Aktifkan"
              size="sm"
              :loading="changingStatus[props.row.id]"
              class="db-act-aktif q-mr-xs"
              @click="changeStatus(props.row, 'aktif')"
            />
            <q-btn
              v-if="props.row.status === 'aktif'"
              flat dense
              icon="monitor"
              label="Monitor"
              size="sm"
              :to="`/monitor/${props.row.token}`"
              class="monitor-btn q-mr-xs"
            />
            <q-btn
              v-if="props.row.status === 'aktif'"
              flat dense
              icon="stop_circle"
              label="Selesai"
              size="sm"
              :loading="changingStatus[props.row.id]"
              class="db-act-selesai q-mr-xs"
              @click="changeStatus(props.row, 'selesai')"
            />
            <q-btn
              flat dense
              icon="bar_chart"
              label="Hasil"
              size="sm"
              :to="`/hasil/${props.row.token}`"
              class="hasil-btn"
            />
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useGuruStore } from 'stores/guru'

const $q = useQuasar()
const guruStore = useGuruStore()

const changingStatus = ref({})

const ujianColumns = [
  { name: 'judul', label: 'Judul Ujian', field: 'judul', align: 'left', sortable: true },
  { name: 'mata_pelajaran', label: 'Mata Pelajaran', field: 'mata_pelajaran', align: 'left' },
  { name: 'token', label: 'Token', field: 'token', align: 'center' },
  { name: 'durasi_menit', label: 'Durasi', field: 'durasi_menit', align: 'center', format: v => `${v} menit` },
  { name: 'jumlah_soal', label: 'Soal', field: 'jumlah_soal', align: 'center' },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'aksi', label: 'Aksi', field: 'aksi', align: 'center' }
]

function statusColor (status) {
  return { aktif: 'positive', draft: 'grey', selesai: 'blue' }[status] || 'grey'
}

function changeStatus (ujian, newStatus) {
  const label = newStatus === 'aktif' ? 'mengaktifkan' : 'menyelesaikan'
  const konfirmasi = newStatus === 'selesai'
    ? `Siswa yang belum submit tidak dapat lagi mengakses ujian ini.`
    : ''
  $q.dialog({
    title: 'Konfirmasi',
    message: `Yakin ingin ${label} ujian "${ujian.judul}"? ${konfirmasi}`.trim(),
    ok: { label: 'Ya', color: newStatus === 'aktif' ? 'positive' : 'negative', unelevated: true },
    cancel: { label: 'Batal', flat: true }
  }).onOk(async () => {
    changingStatus.value[ujian.id] = true
    try {
      await guruStore.updateUjianStatus(ujian.id, newStatus)
      await guruStore.fetchUjian()
      $q.notify({ type: 'positive', message: `Status ujian diubah ke "${newStatus}"`, timeout: 2000 })
    } catch (err) {
      $q.notify({ type: 'negative', message: err.message })
    } finally {
      delete changingStatus.value[ujian.id]
    }
  })
}

async function copyIP () {
  try {
    await navigator.clipboard.writeText(guruStore.serverInfo.ip)
    $q.notify({ type: 'positive', message: 'IP berhasil disalin!', timeout: 1500 })
  } catch (_) {
    $q.notify({ type: 'warning', message: guruStore.serverInfo.ip })
  }
}

onMounted(async () => {
  await Promise.all([
    guruStore.fetchServerInfo(),
    guruStore.fetchSoal(),
    guruStore.fetchUjian()
  ])
})
</script>

<style scoped>
/* ── PAGE ──────────────────────────────────────────────── */
.db-page-title {
  font-size: 26px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(90deg, #1a5fa8, #0095C8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}
.db-page-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--c-text-2);
}
.db-section-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--c-text-3);
}

/* ── STAT CARD BASE — M3 Surface + Elevation ────────────── */
.db-stat-card,
.db-server-card {
  border-radius: var(--radius-xl);
  padding: 20px 20px 0;
  position: relative;
  overflow: hidden;
  cursor: default;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-height: 148px;
  display: flex;
  flex-direction: column;
}
:global(.body--light) .db-stat-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  box-shadow: var(--m3-elev-1);
}
:global(.body--dark) .db-stat-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  box-shadow: var(--m3-elev-2);
}
.db-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--m3-elev-3) !important;
}

/* ── CARD TOP ROW (icon + badge) ────────────────────────── */
.db-stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.db-stat-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.db-icon-blue   { background: #1a5fa8; }
.db-icon-green  { background: #1B6B3A; }
.db-icon-orange { background: #875200; }
:global(.body--dark) .db-icon-blue   { background: #00497D; }
:global(.body--dark) .db-icon-green  { background: #003918; }
:global(.body--dark) .db-icon-orange { background: #3A1F00; }

/* Badge kecil kanan atas */
.db-stat-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 999px;
}
.db-badge-blue   { background: var(--c-accent-soft); color: var(--c-accent); }
.db-badge-green  { background: var(--c-success-bg);  color: var(--c-success); }
.db-badge-orange { background: var(--c-warning-bg);  color: var(--c-warning); }

/* ── BIG NUMBER ─────────────────────────────────────────── */
.db-stat-number {
  font-size: 42px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -1px;
  margin-bottom: 6px;
}
.db-stat-blue   .db-stat-number { color: var(--c-accent); }
.db-stat-green  .db-stat-number { color: var(--c-success); }
.db-stat-orange .db-stat-number { color: var(--c-warning); }

.db-stat-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--c-text-2);
  margin-bottom: 16px;
  flex: 1;
}

/* ── BOTTOM ACCENT BAR ──────────────────────────────────── */
.db-stat-bar {
  height: 4px;
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  margin: 0 -20px;
  margin-top: auto;
}
.db-bar-blue   { background: var(--c-accent); }
.db-bar-green  { background: var(--c-success); }
.db-bar-orange { background: var(--c-warning); }

/* ── SERVER CARD — M3 Primary Container style ────────────── */
.db-server-card {
  background: #1a5fa8 !important;
  border: none !important;
  box-shadow: var(--m3-elev-2) !important;
  position: relative;
  overflow: hidden;
  padding: 0 !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
:global(.body--dark) .db-server-card {
  background: #003060 !important;
  border: 1px solid #004080 !important;
}
.db-server-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--m3-elev-3) !important;
}

.db-server-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
  pointer-events: none;
}
.db-server-circle-1 {
  width: 120px;
  height: 120px;
  top: -40px;
  right: -30px;
}
.db-server-circle-2 {
  width: 80px;
  height: 80px;
  bottom: -20px;
  left: -20px;
  background: rgba(255,255,255,0.04);
}

.db-server-inner {
  position: relative;
  z-index: 1;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.db-server-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: rgba(255,255,255,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.db-server-status-dot {
  display: flex;
  align-items: center;
  gap: 5px;
}
.db-dot-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ADE80;
  box-shadow: 0 0 0 0 rgba(74,222,128,0.6);
  animation: pulse-green 2s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes pulse-green {
  0%   { box-shadow: 0 0 0 0 rgba(74,222,128,0.6); }
  70%  { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
  100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
}
.db-server-status-text {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  letter-spacing: 0.3px;
}

.db-server-ip-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.55);
  margin-bottom: 4px;
  margin-top: 14px;
}
.db-server-ip {
  font-family: 'JetBrains Mono', monospace;
  font-size: 19px;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 0.5px;
  line-height: 1.2;
  margin-bottom: 12px;
}

.db-server-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}
.db-server-port-pill {
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
  background: rgba(255,255,255,0.12);
  border-radius: 999px;
  padding: 3px 10px;
}

.db-copy-btn {
  border-radius: var(--radius-md) !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  padding: 3px 10px !important;
  color: white !important;
  background: rgba(255,255,255,0.15) !important;
  border: 1px solid rgba(255,255,255,0.25) !important;
  transition: all 0.2s !important;
}
.db-copy-btn:hover {
  background: rgba(255,255,255,0.25) !important;
}

/* ── ACTION BUTTONS — M3 Filled & Tonal ─────────────────── */
.db-btn-primary {
  background: var(--c-accent) !important;
  color: white !important;
  font-weight: 600 !important;
  border-radius: 20px !important;
  padding: 0 20px !important;
  box-shadow: var(--m3-elev-1) !important;
  transition: all 0.2s !important;
}
.db-btn-primary:hover {
  background: var(--c-accent-hover) !important;
  box-shadow: var(--m3-elev-2) !important;
}

.db-btn-glass {
  border-radius: 20px !important;
  font-weight: 600 !important;
  padding: 0 20px !important;
  transition: all 0.2s !important;
}
:global(.body--light) .db-btn-glass {
  background: var(--c-accent-soft) !important;
  border: none !important;
  color: var(--c-accent) !important;
}
:global(.body--dark) .db-btn-glass {
  background: var(--c-accent-soft) !important;
  border: none !important;
  color: var(--c-accent) !important;
}
.db-btn-glass:hover {
  filter: brightness(0.95) !important;
}

/* ── TABLE CARD — M3 Surface ─────────────────────────────── */
.db-table-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
}
:global(.body--light) .db-table-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  box-shadow: var(--m3-elev-1);
}
:global(.body--dark) .db-table-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  box-shadow: var(--m3-elev-2);
}

:deep(.db-table .q-table__top),
:deep(.db-table thead th) {
  background: transparent !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  letter-spacing: 0.6px !important;
  text-transform: uppercase !important;
  color: var(--c-text-3) !important;
}
:deep(.db-table thead tr) {
  border-bottom: 1px solid var(--c-border) !important;
}
:deep(.db-table tbody tr) {
  transition: background 0.15s ease !important;
}
:global(.body--light) :deep(.db-table tbody tr:hover td) {
  background: var(--c-surface-2) !important;
}
:global(.body--dark) :deep(.db-table tbody tr:hover td) {
  background: var(--c-surface-2) !important;
}
:deep(.db-table tbody td) {
  border-bottom: 1px solid var(--c-border) !important;
  font-size: 13px !important;
}

/* ── STATUS PILLS ──────────────────────────────────────── */
.db-status-pill {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: capitalize;
}
.db-status-aktif {
  background: var(--c-success-bg);
  color: var(--c-success);
  border: 1px solid var(--c-success);
}
.db-status-selesai {
  background: var(--c-accent-soft);
  color: var(--c-accent);
  border: 1px solid var(--c-accent);
}
.db-status-draft {
  color: var(--c-text-3);
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
}

/* ── ROW ACTION BUTTONS ────────────────────────────────── */
.monitor-btn {
  font-size: 11px !important;
  font-weight: 700 !important;
  border-radius: var(--radius-sm) !important;
  padding: 3px 10px !important;
  transition: all 0.2s !important;
  background: var(--c-accent-soft) !important;
  border: none !important;
  color: var(--c-accent) !important;
}
.monitor-btn:hover { filter: brightness(0.95) !important; }

.hasil-btn {
  font-size: 11px !important;
  font-weight: 700 !important;
  border-radius: var(--radius-sm) !important;
  padding: 3px 10px !important;
  transition: all 0.2s !important;
  background: var(--c-success-bg) !important;
  border: none !important;
  color: var(--c-success) !important;
}
.hasil-btn:hover { filter: brightness(0.95) !important; }

.db-act-aktif {
  font-size: 11px !important;
  font-weight: 700 !important;
  border-radius: var(--radius-sm) !important;
  padding: 3px 10px !important;
  transition: all 0.2s !important;
  background: var(--c-success-bg) !important;
  border: none !important;
  color: var(--c-success) !important;
}

.db-act-selesai {
  font-size: 11px !important;
  font-weight: 700 !important;
  border-radius: var(--radius-sm) !important;
  padding: 3px 10px !important;
  transition: all 0.2s !important;
  background: var(--c-danger-bg) !important;
  border: none !important;
  color: var(--c-danger) !important;
}
.db-act-selesai:hover { filter: brightness(0.95) !important; }
</style>
