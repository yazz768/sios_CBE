<template>
  <q-page padding>

    <div class="hi-page-title q-mb-lg">Hasil Ujian</div>

    <div class="hi-table-card">
      <q-table
        :rows="ujianDenganPeserta"
        :columns="columns"
        row-key="id"
        flat
        :loading="guruStore.isLoading"
        no-data-label="Belum ada ujian yang memiliki peserta"
        :pagination="{ rowsPerPage: 10 }"
        class="hi-table"
      >
        <template #body-cell-status="props">
          <q-td :props="props">
            <span :class="['hi-status-pill', `hi-status-${props.value}`]">
              {{ props.value }}
            </span>
          </q-td>
        </template>

        <template #body-cell-aksi="props">
          <q-td :props="props">
            <q-btn
              unelevated
              icon="bar_chart"
              label="Lihat Hasil"
              size="sm"
              class="hi-hasil-btn q-mr-xs"
              :to="`/hasil/${props.row.token}`"
            />
            <q-btn
              flat dense
              icon="delete"
              size="sm"
              class="hi-hapus-btn"
              @click="confirmHapus(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </div>

  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useGuruStore } from 'stores/guru'

const $q = useQuasar()
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

function confirmHapus (ujian) {
  $q.dialog({
    title: 'Hapus Ujian',
    message: `Yakin ingin menghapus ujian "<strong>${ujian.judul}</strong>"?<br><br>Semua data peserta dan jawaban akan ikut terhapus dan tidak bisa dikembalikan.`,
    html: true,
    ok: { label: 'Hapus', color: 'negative', unelevated: true },
    cancel: { label: 'Batal', flat: true },
    persistent: true
  }).onOk(async () => {
    try {
      await guruStore.deleteUjian(ujian.id)
      await guruStore.fetchUjian()
      $q.notify({ type: 'positive', message: 'Ujian berhasil dihapus', timeout: 2000 })
    } catch (err) {
      $q.notify({ type: 'negative', message: err.message })
    }
  })
}

onMounted(() => guruStore.fetchUjian())
</script>

<style scoped>
/* ── PAGE TITLE ──────────────────────────────────────────── */
.hi-page-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: linear-gradient(90deg, #1a5fa8, #0095C8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── TABLE CARD — M3 Surface (sama seperti halaman lain) ─── */
.hi-table-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  box-shadow: var(--m3-elev-1);
}

/* ── TABLE OVERRIDES ─────────────────────────────────────── */
:deep(.hi-table .q-table__top),
:deep(.hi-table .q-table__bottom) { background: transparent !important; }

:deep(.hi-table thead th) {
  background: transparent !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  letter-spacing: 0.6px !important;
  text-transform: uppercase !important;
  color: var(--c-text-3) !important;
}
:deep(.hi-table thead tr) {
  border-bottom: 1px solid var(--c-border) !important;
}
:deep(.hi-table tbody td) {
  border-bottom: 1px solid var(--c-border) !important;
  font-size: 13px !important;
  color: var(--c-text-2) !important;
  background: transparent !important;
}
:deep(.hi-table tbody tr:hover td) {
  background: var(--c-surface-2) !important;
}

/* ── STATUS PILLS ────────────────────────────────────────── */
.hi-status-pill {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: capitalize;
}
.hi-status-aktif   { background: var(--c-success-bg); color: var(--c-success); border: 1px solid var(--c-success); }
.hi-status-selesai { background: var(--c-accent-soft); color: var(--c-accent); border: 1px solid var(--c-accent); }
.hi-status-draft   { background: var(--c-surface-2); color: var(--c-text-3); border: 1px solid var(--c-border); }

/* ── ACTION BUTTONS ──────────────────────────────────────── */
.hi-hasil-btn {
  background: var(--c-success-bg) !important;
  color: var(--c-success) !important;
  border-radius: var(--radius-sm) !important;
  font-weight: 700 !important;
  font-size: 12px !important;
  transition: all 0.2s !important;
}
.hi-hasil-btn:hover { filter: brightness(0.95) !important; }

.hi-hapus-btn {
  color: var(--c-danger) !important;
  border-radius: var(--radius-sm) !important;
  transition: all 0.15s !important;
  opacity: 0.5;
}
.hi-hapus-btn:hover {
  background: var(--c-danger-bg) !important;
  opacity: 1 !important;
}
</style>
