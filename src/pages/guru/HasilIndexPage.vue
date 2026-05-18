<template>
  <q-page padding>
    <div class="text-h5 q-mb-lg" style="color: var(--c-text)">Hasil Ujian</div>

    <q-card flat bordered>
      <q-table
        :rows="ujianDenganPeserta"
        :columns="columns"
        row-key="id"
        flat
        :loading="guruStore.isLoading"
        no-data-label="Belum ada ujian yang memiliki peserta"
        :pagination="{ rowsPerPage: 10 }"
      >
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge :color="statusColor(props.value)" :label="props.value" />
          </q-td>
        </template>

        <template #body-cell-aksi="props">
          <q-td :props="props">
            <q-btn
              unelevated
              icon="bar_chart"
              label="Lihat Hasil"
              size="sm"
              class="hasil-btn"
              :to="`/hasil/${props.row.token}`"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useGuruStore } from 'stores/guru'

const guruStore = useGuruStore()

const columns = [
  { name: 'judul', label: 'Judul Ujian', field: 'judul', align: 'left', sortable: true },
  { name: 'mata_pelajaran', label: 'Mata Pelajaran', field: 'mata_pelajaran', align: 'left' },
  { name: 'token', label: 'Token', field: 'token', align: 'center' },
  { name: 'jumlah_peserta', label: 'Peserta', field: 'jumlah_peserta', align: 'center' },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'aksi', label: 'Aksi', field: 'aksi', align: 'center' }
]

const ujianDenganPeserta = computed(() =>
  guruStore.ujianList.filter(u => u.jumlah_peserta > 0)
)

function statusColor (status) {
  return { aktif: 'positive', draft: 'grey', selesai: 'blue' }[status] || 'grey'
}

onMounted(() => guruStore.fetchUjian())
</script>

<style scoped>
.hasil-btn {
  color: var(--c-success) !important;
  border: 1px solid var(--c-success) !important;
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
