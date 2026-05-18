<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" to="/dashboard" class="q-mr-sm" />
      <div class="text-h5 text-primary col">Monitor Ujian</div>
      <q-btn
        v-if="ujianInfo?.status === 'draft'"
        unelevated
        icon="play_arrow"
        label="Aktifkan Ujian"
        color="positive"
        size="sm"
        :loading="changingStatus"
        class="q-mr-sm"
        @click="ubahStatusUjian('aktif')"
      />
      <q-btn
        v-if="ujianInfo?.status === 'aktif'"
        unelevated
        icon="stop_circle"
        label="Selesaikan Ujian"
        color="negative"
        size="sm"
        :loading="changingStatus"
        class="q-mr-sm"
        @click="ubahStatusUjian('selesai')"
      />
      <q-btn
        v-if="ujianInfo?.status === 'aktif'"
        unelevated
        icon="monitor"
        label="Lihat Layar"
        color="deep-purple-6"
        size="sm"
        class="q-mr-sm"
        :to="`/csp/${route.params.token}`"
      />
      <q-btn
        flat
        dense
        icon="bar_chart"
        label="Lihat Hasil"
        class="hasil-btn q-mr-sm"
        :to="`/hasil/${route.params.token}`"
      />
      <q-chip color="primary" text-color="white" icon="vpn_key">
        Token: {{ route.params.token }}
      </q-chip>
    </div>

    <!-- Info Ujian -->
    <q-banner v-if="ujianInfo" inline-actions class="bg-blue-1 q-mb-md" rounded>
      <template #avatar>
        <q-icon name="info" color="primary" />
      </template>
      <strong>{{ ujianInfo.judul }}</strong> — {{ ujianInfo.mata_pelajaran }} |
      Durasi: {{ ujianInfo.durasi_menit }} menit |
      Status: <q-badge :color="ujianInfo.status === 'aktif' ? 'positive' : 'grey'" :label="ujianInfo.status" />
    </q-banner>

    <!-- Statistik Cepat -->
    <div class="row q-gutter-md q-mb-md">
      <q-card flat bordered class="col-12 col-sm-3">
        <q-card-section class="text-center">
          <div class="text-h4 text-primary">{{ pesertaList.length }}</div>
          <div class="text-caption text-grey-7">Total Peserta</div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="col-12 col-sm-3">
        <q-card-section class="text-center">
          <div class="text-h4 text-positive">{{ submittedCount }}</div>
          <div class="text-caption text-grey-7">Sudah Submit</div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="col-12 col-sm-3">
        <q-card-section class="text-center">
          <div class="text-h4 text-warning">{{ pesertaList.length - submittedCount }}</div>
          <div class="text-caption text-grey-7">Sedang Mengerjakan</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Tabel Peserta -->
    <q-card flat bordered>
      <q-card-section>
        <div class="row items-center q-mb-sm">
          <div class="text-h6 col">Daftar Peserta</div>
          <div class="text-caption text-grey-6">
            <q-icon name="refresh" />
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
        >
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.submitted_at ? 'positive' : 'blue'"
                :label="props.row.submitted_at ? 'Selesai' : 'Mengerjakan'"
              />
            </q-td>
          </template>
          <template #body-cell-joined_at="props">
            <q-td :props="props">
              {{ formatTime(props.value) }}
            </q-td>
          </template>
          <template #body-cell-submitted_at="props">
            <q-td :props="props">
              {{ props.value ? formatTime(props.value) : '-' }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
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
  } catch (_) {
    // Gagal refresh tidak perlu error popup
  } finally {
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
