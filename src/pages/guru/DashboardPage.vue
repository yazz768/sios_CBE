<template>
  <q-page padding>
    <div class="text-h5 text-primary q-mb-lg">Dashboard</div>

    <!-- Stat Cards -->
    <div class="row q-gutter-md q-mb-lg">
      <div class="col-12 col-sm-3">
        <q-card flat bordered>
          <q-card-section class="row items-center no-wrap">
            <q-icon name="quiz" size="40px" color="primary" class="q-mr-md" />
            <div>
              <div class="text-h4 text-primary text-weight-bold">{{ guruStore.totalSoal }}</div>
              <div class="text-caption text-grey-7">Total Soal</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-3">
        <q-card flat bordered>
          <q-card-section class="row items-center no-wrap">
            <q-icon name="assignment" size="40px" color="secondary" class="q-mr-md" />
            <div>
              <div class="text-h4 text-secondary text-weight-bold">{{ guruStore.totalUjian }}</div>
              <div class="text-caption text-grey-7">Total Ujian</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-3">
        <q-card flat bordered>
          <q-card-section class="row items-center no-wrap">
            <q-icon name="play_circle" size="40px" color="positive" class="q-mr-md" />
            <div>
              <div class="text-h4 text-positive text-weight-bold">{{ guruStore.ujianAktif }}</div>
              <div class="text-caption text-grey-7">Ujian Aktif</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Server Info -->
      <div class="col-12 col-sm-3">
        <q-card flat bordered class="bg-primary text-white">
          <q-card-section>
            <div class="text-caption text-white q-mb-xs opacity-70">IP Server Guru</div>
            <div class="text-h5 text-weight-bold">{{ guruStore.serverInfo.ip }}</div>
            <div class="text-caption opacity-80">Port {{ guruStore.serverInfo.port }}</div>
            <q-btn
              flat
              dense
              color="white"
              icon="copy_all"
              label="Salin IP"
              size="sm"
              class="q-mt-sm"
              @click="copyIP"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Aksi Cepat -->
    <div class="text-h6 q-mb-md">Aksi Cepat</div>
    <div class="row q-gutter-md q-mb-xl">
      <q-btn
        unelevated
        color="primary"
        icon="add"
        label="Buat Soal Baru"
        to="/bank-soal"
        size="md"
      />
      <q-btn
        unelevated
        color="secondary"
        icon="add_task"
        label="Buat Ujian Baru"
        to="/buat-ujian"
        size="md"
      />
      <q-btn
        unelevated
        color="grey-7"
        icon="settings"
        label="Pengaturan"
        to="/settings"
        size="md"
      />
    </div>

    <!-- Daftar Ujian Terbaru -->
    <div class="text-h6 q-mb-md">Ujian Terbaru</div>
    <q-card flat bordered>
      <q-table
        :rows="guruStore.ujianList"
        :columns="ujianColumns"
        row-key="id"
        flat
        :loading="guruStore.isLoading"
        no-data-label="Belum ada ujian dibuat"
        :pagination="{ rowsPerPage: 5 }"
      >
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge :color="statusColor(props.value)" :label="props.value" />
          </q-td>
        </template>
        <template #body-cell-aksi="props">
          <q-td :props="props">
            <q-btn
              v-if="props.row.status === 'draft'"
              flat
              dense
              icon="play_arrow"
              label="Aktifkan"
              size="sm"
              color="positive"
              :loading="changingStatus[props.row.id]"
              class="q-mr-xs"
              @click="changeStatus(props.row, 'aktif')"
            />
            <q-btn
              v-if="props.row.status === 'aktif'"
              flat
              dense
              icon="monitor"
              label="Monitor"
              size="sm"
              :to="`/monitor/${props.row.token}`"
              class="monitor-btn q-mr-xs"
            />
            <q-btn
              v-if="props.row.status === 'aktif'"
              flat
              dense
              icon="stop_circle"
              label="Selesai"
              size="sm"
              color="negative"
              :loading="changingStatus[props.row.id]"
              class="q-mr-xs"
              @click="changeStatus(props.row, 'selesai')"
            />
            <q-btn
              flat
              dense
              icon="bar_chart"
              label="Hasil"
              size="sm"
              :to="`/hasil/${props.row.token}`"
              class="hasil-btn"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>
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
.monitor-btn {
  color: var(--c-accent) !important;
  border: 1px solid var(--c-accent) !important;
  border-radius: 8px !important;
  padding: 4px 12px !important;
  font-weight: 600 !important;
  font-size: 12px !important;
  transition: all 0.2s !important;
}

:global(.body--dark) .monitor-btn {
  color: var(--c-accent-2) !important;
  border-color: var(--c-accent) !important;
  box-shadow: 0 0 8px rgba(76, 110, 245, 0.4),
              0 0 16px rgba(76, 110, 245, 0.15) !important;
  text-shadow: 0 0 8px rgba(124, 157, 255, 0.8) !important;
}

:global(.body--dark) .monitor-btn:hover {
  background: rgba(76, 110, 245, 0.15) !important;
  box-shadow: 0 0 12px rgba(76, 110, 245, 0.6),
              0 0 24px rgba(76, 110, 245, 0.25) !important;
  text-shadow: 0 0 10px rgba(124, 157, 255, 1) !important;
}

.hasil-btn {
  color: #1a6b3c !important;
  border: 1px solid #1a6b3c !important;
  border-radius: 8px !important;
  padding: 4px 12px !important;
  font-weight: 600 !important;
  font-size: 12px !important;
  transition: all 0.2s !important;
}

:global(.body--dark) .hasil-btn {
  color: #4ade80 !important;
  border-color: #22c55e !important;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.4),
              0 0 16px rgba(74, 222, 128, 0.15) !important;
  text-shadow: 0 0 8px rgba(74, 222, 128, 0.8) !important;
}

:global(.body--dark) .hasil-btn:hover {
  background: rgba(74, 222, 128, 0.12) !important;
  box-shadow: 0 0 12px rgba(74, 222, 128, 0.6),
              0 0 24px rgba(74, 222, 128, 0.25) !important;
}
</style>
