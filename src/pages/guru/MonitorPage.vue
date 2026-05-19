<template>
  <q-page padding class="mp-page">

    <!-- ── HEADER ─────────────────────────────────────────────── -->
    <div class="row items-center q-mb-lg">
      <q-btn flat round icon="arrow_back" to="/dashboard" class="mp-back-btn q-mr-sm" />
      <div class="mp-title">Monitor Ujian</div>
      <q-space />
      <div class="row items-center q-gutter-sm">
        <q-btn
          v-if="ujianInfo?.status === 'draft'"
          unelevated icon="play_arrow" label="Aktifkan Ujian" size="sm"
          class="mp-btn-green" :loading="changingStatus"
          @click="ubahStatusUjian('aktif')"
        />
        <q-btn
          v-if="ujianInfo?.status === 'aktif'"
          unelevated icon="stop_circle" label="Selesaikan Ujian" size="sm"
          class="mp-btn-red" :loading="changingStatus"
          @click="ubahStatusUjian('selesai')"
        />
        <q-btn
          v-if="ujianInfo?.status === 'aktif'"
          unelevated icon="monitor" label="Lihat Layar" size="sm"
          class="mp-btn-purple" :to="`/csp/${route.params.token}`"
        />
        <q-btn
          flat dense icon="bar_chart" label="Lihat Hasil" size="sm"
          class="mp-btn-teal" :to="`/hasil/${route.params.token}`"
        />
        <div class="mp-token-chip">
          <q-icon name="vpn_key" size="13px" class="q-mr-xs" />
          <span>{{ route.params.token }}</span>
        </div>
      </div>
    </div>

    <!-- ── INFO BANNER ─────────────────────────────────────────── -->
    <div v-if="ujianInfo" class="mp-banner q-mb-lg">
      <div class="row items-center">
        <div class="col">
          <div class="mp-banner-title">{{ ujianInfo.judul }}</div>
          <div class="mp-banner-sub">
            {{ ujianInfo.mata_pelajaran }} · Durasi {{ ujianInfo.durasi_menit }} menit
          </div>
        </div>
        <div class="mp-badge-status" :class="ujianInfo.status === 'aktif' ? 'mp-badge-aktif' : 'mp-badge-selesai'">
          <span v-if="ujianInfo.status === 'aktif'" class="mp-pulse" />
          {{ ujianInfo.status === 'aktif' ? 'Aktif' : ujianInfo.status === 'selesai' ? 'Selesai' : 'Draft' }}
        </div>
      </div>
    </div>

    <!-- ── STAT CARDS ─────────────────────────────────────────── -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-4">
        <div class="mp-stat-card">
          <div class="mp-stat-icon mp-icon-blue"><q-icon name="people" size="20px" /></div>
          <div class="mp-stat-body">
            <div class="mp-stat-num mp-num-blue">{{ pesertaList.length }}</div>
            <div class="mp-stat-label">Total Peserta</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-sm-4">
        <div class="mp-stat-card">
          <div class="mp-stat-icon mp-icon-green"><q-icon name="check_circle" size="20px" /></div>
          <div class="mp-stat-body">
            <div class="mp-stat-num mp-num-green">{{ submittedCount }}</div>
            <div class="mp-stat-label">Sudah Submit</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-sm-4">
        <div class="mp-stat-card">
          <div class="mp-stat-icon mp-icon-orange"><q-icon name="edit_note" size="20px" /></div>
          <div class="mp-stat-body">
            <div class="mp-stat-num mp-num-orange">{{ pesertaList.length - submittedCount }}</div>
            <div class="mp-stat-label">Sedang Mengerjakan</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── TABEL PESERTA ──────────────────────────────────────── -->
    <div class="mp-table-card">
      <div class="row items-center q-mb-md">
        <div class="mp-section-title col">Daftar Peserta</div>
        <div class="mp-refresh-hint">
          <q-icon name="refresh" size="13px" class="mp-spin q-mr-xs" />
          Auto-refresh setiap 5 detik
        </div>
      </div>

      <q-table
        :rows="pesertaList"
        :columns="columns"
        row-key="id"
        flat
        :loading="loading"
        no-data-label="Belum ada siswa yang bergabung"
        class="mp-table"
      >
        <template #body-cell-status="props">
          <q-td :props="props">
            <div class="mp-status-pill"
              :class="props.row.submitted_at ? 'mp-pill-selesai' : 'mp-pill-mengerjakan'">
              {{ props.row.submitted_at ? 'Selesai' : 'Mengerjakan' }}
            </div>
          </q-td>
        </template>
        <template #body-cell-joined_at="props">
          <q-td :props="props" class="mp-time-cell">{{ formatTime(props.value) }}</q-td>
        </template>
        <template #body-cell-submitted_at="props">
          <q-td :props="props" class="mp-time-cell">
            {{ props.value ? formatTime(props.value) : '—' }}
          </q-td>
        </template>
      </q-table>
    </div>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useGuruStore } from 'stores/guru'

const route = useRoute()
const $q = useQuasar()
const guruStore = useGuruStore()

const pesertaList = ref([])
const ujianInfo = ref(null)
const loading = ref(false)
const changingStatus = ref(false)
let pollInterval = null

const columns = [
  { name: 'no', label: 'No', field: 'id', align: 'center', style: 'width: 60px',
    format: (_, row) => pesertaList.value.indexOf(row) + 1 },
  { name: 'nama', label: 'Nama Siswa', field: 'nama', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'joined_at', label: 'Bergabung', field: 'joined_at', align: 'center' },
  { name: 'submitted_at', label: 'Submit', field: 'submitted_at', align: 'center' }
]

const submittedCount = computed(() => pesertaList.value.filter(p => p.submitted_at).length)

function formatTime (isoStr) {
  if (!isoStr) return '-'
  return new Date(isoStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function ubahStatusUjian (newStatus) {
  const label = newStatus === 'aktif' ? 'mengaktifkan' : 'menyelesaikan'
  const pesan = newStatus === 'selesai'
    ? 'Siswa yang belum submit tidak dapat lagi mengakses ujian ini.'
    : ''
  $q.dialog({
    title: 'Konfirmasi',
    message: `Yakin ingin ${label} ujian ini? ${pesan}`.trim(),
    ok: { label: 'Ya', color: newStatus === 'aktif' ? 'positive' : 'negative', unelevated: true },
    cancel: { label: 'Batal', flat: true }
  }).onOk(async () => {
    changingStatus.value = true
    try {
      await guruStore.updateUjianStatus(ujianInfo.value.id, newStatus)
      ujianInfo.value = { ...ujianInfo.value, status: newStatus }
      $q.notify({ type: 'positive', message: `Ujian berhasil diubah ke "${newStatus}"`, timeout: 2000 })
    } catch (err) {
      $q.notify({ type: 'negative', message: err.message })
    } finally {
      changingStatus.value = false
    }
  })
}

async function fetchData () {
  loading.value = true
  try {
    const data = await guruStore.fetchMonitor(route.params.token)
    ujianInfo.value = data.ujian
    pesertaList.value = data.peserta
  } catch (_) {}
  finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
  pollInterval = setInterval(fetchData, 5000)
})

onUnmounted(() => {
  clearInterval(pollInterval)
})
</script>

<style scoped>
/* ── TITLE ────────────────────────────────────────────────── */
.mp-title {
  font-size: 20px; font-weight: 700; letter-spacing: -0.3px;
  background: linear-gradient(90deg, #1a5fa8, #0095C8);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

/* ── BACK BUTTON ──────────────────────────────────────────── */
.mp-back-btn {
  color: var(--c-text-2) !important;
  background: var(--c-surface-2) !important;
  border: 1px solid var(--c-border) !important;
}
.mp-back-btn:hover { background: var(--c-accent-soft) !important; color: var(--c-accent) !important; }

/* ── ACTION BUTTONS — M3 Filled ───────────────────────────── */
.mp-btn-red {
  background: var(--c-danger) !important; color: white !important;
  border-radius: 20px !important; font-weight: 600 !important;
}
.mp-btn-red:hover { filter: brightness(0.9) !important; }

.mp-btn-green {
  background: var(--c-success) !important; color: white !important;
  border-radius: 20px !important; font-weight: 600 !important;
}
.mp-btn-green:hover { filter: brightness(0.9) !important; }

.mp-btn-purple {
  background: #6750A4 !important; color: white !important;
  border-radius: 20px !important; font-weight: 600 !important;
}
.mp-btn-purple:hover { filter: brightness(0.9) !important; }

.mp-btn-teal {
  border-radius: 20px !important; font-weight: 600 !important; font-size: 12px !important;
  color: var(--c-success) !important; border: 1px solid var(--c-success) !important;
}
.mp-btn-teal:hover { background: var(--c-success-bg) !important; }

/* ── TOKEN CHIP ───────────────────────────────────────────── */
.mp-token-chip {
  display: flex; align-items: center;
  padding: 6px 14px; border-radius: 999px;
  font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
  background: var(--c-accent-soft); border: 1px solid var(--c-border); color: var(--c-accent);
}

/* ── INFO BANNER — M3 Surface ─────────────────────────────── */
.mp-banner {
  padding: 16px 20px; border-radius: var(--radius-md);
  background: var(--c-surface); border: 1px solid var(--c-border);
  border-left: 4px solid var(--c-accent); box-shadow: var(--m3-elev-1);
}
.mp-banner-title { font-weight: 700; font-size: 15px; color: var(--c-text); }
.mp-banner-sub   { font-size: 13px; margin-top: 2px; color: var(--c-text-2); }

.mp-badge-status {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 14px; border-radius: 999px; font-size: 12px; font-weight: 700;
}
.mp-badge-aktif  { background: var(--c-success-bg); color: var(--c-success); border: 1px solid var(--c-success); }
.mp-badge-selesai { background: var(--c-surface-2); color: var(--c-text-3); border: 1px solid var(--c-border); }
.mp-pulse {
  width: 7px; height: 7px; border-radius: 50%; background: var(--c-success);
  animation: mpPulse 1.8s ease-out infinite;
}
@keyframes mpPulse {
  0%   { box-shadow: 0 0 0 0 rgba(27,107,58,0.7); }
  70%  { box-shadow: 0 0 0 6px rgba(27,107,58,0); }
  100% { box-shadow: 0 0 0 0 rgba(27,107,58,0); }
}

/* ── STAT CARDS — M3 Surface ──────────────────────────────── */
.mp-stat-card {
  display: flex; align-items: center; gap: 16px;
  padding: 18px 20px; border-radius: var(--radius-lg);
  transition: transform 0.15s;
  background: var(--c-surface); border: 1px solid var(--c-border); box-shadow: var(--m3-elev-1);
}
.mp-stat-card:hover { transform: translateY(-2px); box-shadow: var(--m3-elev-2) !important; }
.mp-stat-icon {
  width: 44px; height: 44px; border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.mp-icon-blue   { background: var(--c-accent-soft); color: var(--c-accent); }
.mp-icon-green  { background: var(--c-success-bg);  color: var(--c-success); }
.mp-icon-orange { background: var(--c-warning-bg);  color: var(--c-warning); }
.mp-stat-body { flex: 1; }
.mp-stat-num { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; line-height: 1; }
.mp-num-blue   { color: var(--c-accent); }
.mp-num-green  { color: var(--c-success); }
.mp-num-orange { color: var(--c-warning); }
.mp-stat-label { font-size: 12px; margin-top: 4px; color: var(--c-text-2); }

/* ── TABLE CARD — M3 Surface ──────────────────────────────── */
.mp-table-card {
  padding: 20px; border-radius: var(--radius-lg);
  background: var(--c-surface); border: 1px solid var(--c-border); box-shadow: var(--m3-elev-1);
}
.mp-section-title { font-size: 15px; font-weight: 700; color: var(--c-text); }
.mp-refresh-hint { display: flex; align-items: center; font-size: 12px; color: var(--c-text-3); }
@keyframes mpSpin { to { transform: rotate(360deg); } }
.mp-spin { animation: mpSpin 3s linear infinite; display: inline-block; }

:deep(.mp-table .q-table__top),
:deep(.mp-table .q-table__bottom) { background: transparent !important; }
:deep(.mp-table thead tr th) {
  font-size: 11px !important; font-weight: 600 !important; letter-spacing: 0.5px !important;
  text-transform: uppercase !important; background: transparent !important;
  color: var(--c-text-3) !important; border-bottom: 1px solid var(--c-border) !important;
}
:deep(.mp-table tbody tr td) {
  color: var(--c-text-2); border-bottom: 1px solid var(--c-border) !important;
}
:deep(.mp-table tbody tr:hover td) { background: var(--c-surface-2) !important; }

.mp-time-cell { font-family: 'JetBrains Mono', monospace !important; font-size: 12px !important; color: var(--c-text-3) !important; }

/* ── STATUS PILLS ─────────────────────────────────────────── */
.mp-status-pill {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 600;
}
.mp-pill-selesai    { background: var(--c-success-bg); color: var(--c-success); border: 1px solid var(--c-success); }
.mp-pill-mengerjakan {
  background: var(--c-accent-soft); color: var(--c-accent); border: 1px solid var(--c-accent);
  animation: mpShimmer 2s ease-in-out infinite;
}
@keyframes mpShimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
