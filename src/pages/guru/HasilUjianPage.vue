<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" to="/hasil" class="q-mr-sm" />
      <div class="col">
        <div class="text-h5" style="color: var(--c-text)">Hasil Ujian</div>
        <div class="text-caption" style="color: var(--c-text-2)">
          {{ ujianInfo?.judul }} — {{ ujianInfo?.mata_pelajaran }}
        </div>
      </div>
      <q-chip icon="vpn_key" color="primary" text-color="white" dense class="q-mr-sm">
        {{ route.params.token }}
      </q-chip>
      <q-btn
        unelevated
        icon="picture_as_pdf"
        label="Export PDF"
        color="red-7"
        size="sm"
        :disable="!pesertaList.length"
        :loading="exportingPDF"
        class="q-mr-sm"
        @click="exportPDF"
      />
      <q-btn
        unelevated
        icon="download"
        label="Export CSV"
        color="secondary"
        size="sm"
        :disable="!pesertaList.length"
        @click="exportCSV"
      />
    </div>

    <!-- Layout Split: kiri (rekap) + kanan (detail) -->
    <div class="row q-col-gutter-md">

      <!-- ── KOLOM KIRI: Stat Cards + Tabel ── -->
      <div class="col-12 layout-left" :class="selectedPeserta ? 'col-md-5' : ''">

        <!-- Ringkasan -->
        <div class="row q-gutter-sm q-mb-md">
          <q-card flat bordered class="col">
            <q-card-section class="text-center q-pa-sm">
              <div class="text-h5 text-weight-bold" style="color: var(--c-accent)">{{ pesertaList.length }}</div>
              <div class="text-caption" style="color: var(--c-text-2)">Total Peserta</div>
            </q-card-section>
          </q-card>
          <q-card flat bordered class="col">
            <q-card-section class="text-center q-pa-sm">
              <div class="text-h5 text-weight-bold text-positive">{{ submittedCount }}</div>
              <div class="text-caption" style="color: var(--c-text-2)">Sudah Submit</div>
            </q-card-section>
          </q-card>
          <q-card flat bordered class="col">
            <q-card-section class="text-center q-pa-sm">
              <div class="text-h5 text-weight-bold text-warning">{{ pendingEssayCount }}</div>
              <div class="text-caption" style="color: var(--c-text-2)">Essay Pending</div>
            </q-card-section>
          </q-card>
          <q-card flat bordered class="col">
            <q-card-section class="text-center q-pa-sm">
              <div class="text-h5 text-weight-bold" style="color: var(--c-accent)">{{ avgNilaiPg }}%</div>
              <div class="text-caption" style="color: var(--c-text-2)">Rata-rata PG</div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Tabel Rekap Peserta -->
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md" style="color: var(--c-text)">Rekap Nilai Siswa</div>
            <q-table
              :rows="pesertaList"
              :columns="selectedPeserta ? rekapColumnsCompact : rekapColumns"
              row-key="id"
              flat
              :loading="loading"
              no-data-label="Belum ada peserta bergabung"
              :pagination="{ rowsPerPage: 20 }"
            >
              <template #body-cell-status="props">
                <q-td :props="props">
                  <q-badge
                    :color="props.row.submitted_at ? 'positive' : 'grey'"
                    :label="props.row.submitted_at ? 'Selesai' : 'Belum'"
                  />
                </q-td>
              </template>

              <template #body-cell-nilai_pg="props">
                <q-td :props="props">
                  <span v-if="props.row.total_pg > 0">
                    {{ props.row.nilai_pg_raw }}/{{ props.row.total_pg }}
                    <span class="q-ml-xs text-caption" style="color: var(--c-text-3)">
                      ({{ pgPersen(props.row) }}%)
                    </span>
                  </span>
                  <span v-else style="color: var(--c-text-3)">—</span>
                </q-td>
              </template>

              <template #body-cell-nilai_essay="props">
                <q-td :props="props">
                  <span v-if="props.row.total_essay > 0">
                    {{ props.row.nilai_essay_raw }}
                    <q-badge
                      v-if="props.row.pending_essay > 0"
                      color="warning"
                      :label="`${props.row.pending_essay} belum`"
                      class="q-ml-xs"
                    />
                  </span>
                  <span v-else style="color: var(--c-text-3)">—</span>
                </q-td>
              </template>

              <template #body-cell-total="props">
                <q-td :props="props">
                  <strong>{{ totalNilai(props.row) }}%</strong>
                </q-td>
              </template>

              <template #body-cell-aksi="props">
                <q-td :props="props">
                  <q-btn
                    flat dense
                    icon="visibility"
                    label="Detail"
                    size="sm"
                    :class="['detail-btn', selectedPeserta?.id === props.row.id ? 'detail-btn-active' : '']"
                    @click="loadDetail(props.row)"
                  />
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>

      <!-- ── KOLOM KANAN: Panel Detail ── -->
      <transition name="slide-detail">
        <div v-if="selectedPeserta" class="col-12 col-md-7">
          <q-card flat bordered class="detail-panel">
            <!-- Header Panel -->
            <q-card-section class="detail-panel-header row items-center no-wrap">
              <q-icon name="person" color="primary" size="24px" class="q-mr-sm" />
              <div class="col">
                <div class="text-h6" style="color: var(--c-text)">{{ selectedPeserta.nama }}</div>
                <div class="text-caption" style="color: var(--c-text-2)">
                  Submit: {{ selectedPeserta.submitted_at ? formatTime(selectedPeserta.submitted_at) : 'Belum submit' }}
                </div>
              </div>
              <!-- Ringkasan nilai kecil di header -->
              <div class="row q-gutter-md q-mr-md text-center">
                <div>
                  <div class="text-caption" style="color: var(--c-text-3)">PG</div>
                  <div class="text-weight-bold text-primary">{{ pgPersen(selectedPeserta) }}%</div>
                </div>
                <div v-if="selectedPeserta.total_essay > 0">
                  <div class="text-caption" style="color: var(--c-text-3)">Essay</div>
                  <div class="text-weight-bold text-secondary">{{ selectedPeserta.nilai_essay_raw }}</div>
                </div>
                <div>
                  <div class="text-caption" style="color: var(--c-text-3)">Total</div>
                  <div class="text-weight-bold text-positive">{{ totalNilai(selectedPeserta) }}%</div>
                </div>
              </div>
              <q-btn flat round dense icon="close" @click="selectedPeserta = null; detailJawaban = []" />
            </q-card-section>

            <q-separator />

            <!-- Isi Detail — scrollable sendiri -->
            <q-card-section class="detail-panel-body">
              <q-inner-loading :showing="loadingDetail" />

              <div v-for="(item, idx) in detailJawaban" :key="item.soal_id" class="soal-detail q-mb-md">
                <!-- Nomor & Tipe -->
                <div class="row items-center q-mb-sm">
                  <div class="text-subtitle2 col" style="color: var(--c-text)">
                    Soal {{ idx + 1 }}
                    <q-badge
                      :color="item.tipe === 'PG' ? 'blue' : 'orange'"
                      :label="item.tipe"
                      class="q-ml-sm"
                    />
                  </div>
                  <template v-if="item.tipe === 'PG'">
                    <span v-if="item.jawaban_teks === item.kunci_jawaban" class="benar-badge">✅ Benar</span>
                    <span v-else-if="item.jawaban_teks" class="salah-badge">❌ Salah</span>
                    <span v-else class="kosong-badge">— Tidak dijawab</span>
                  </template>
                </div>

                <!-- Pertanyaan -->
                <div
                  class="pertanyaan-box q-pa-sm q-mb-sm"
                  style="line-height: 1.6; border-radius: 8px; border: 0.5px solid var(--c-border); background: var(--c-surface-2)"
                >
                  <MathText :text="item.pertanyaan" />
                </div>

                <!-- PG: jawaban siswa + kunci -->
                <template v-if="item.tipe === 'PG'">
                  <div class="row q-gutter-sm">
                    <div
                      class="col jawaban-box"
                      :class="item.jawaban_teks === item.kunci_jawaban ? 'jawaban-benar' : (item.jawaban_teks ? 'jawaban-salah' : 'jawaban-kosong')"
                    >
                      <div class="text-caption q-mb-xs" style="color: var(--c-text-3)">Jawaban Siswa</div>
                      <div class="text-weight-medium">{{ item.jawaban_teks || '(tidak dijawab)' }}</div>
                    </div>
                    <div class="col jawaban-box jawaban-kunci">
                      <div class="text-caption q-mb-xs" style="color: var(--c-text-3)">Kunci Jawaban</div>
                      <div class="text-weight-medium">{{ item.kunci_jawaban }}</div>
                    </div>
                  </div>
                </template>

                <!-- Essay: jawaban + panduan + input nilai -->
                <template v-else>
                  <div class="jawaban-box q-pa-sm q-mb-sm" style="background: var(--c-surface-2)">
                    <div class="text-caption q-mb-xs" style="color: var(--c-text-3)">Jawaban Siswa</div>
                    <div style="white-space: pre-wrap; color: var(--c-text)">
                      {{ item.jawaban_teks || '(tidak dijawab)' }}
                    </div>
                  </div>

                  <div v-if="item.panduan_penilaian" class="jawaban-box q-pa-sm q-mb-sm" style="background: var(--c-warning-bg)">
                    <div class="text-caption q-mb-xs" style="color: var(--c-text-3)">Panduan Penilaian</div>
                    <div style="white-space: pre-wrap; color: var(--c-text)">{{ item.panduan_penilaian }}</div>
                  </div>

                  <div class="row items-center q-gutter-sm">
                    <q-input
                      v-model.number="essayNilai[item.jawaban_id]"
                      type="number"
                      min="0"
                      max="100"
                      label="Nilai (0–100)"
                      outlined
                      dense
                      style="max-width: 150px"
                    />
                    <q-btn
                      unelevated
                      color="primary"
                      label="Simpan Nilai"
                      size="sm"
                      :loading="savingNilai[item.jawaban_id]"
                      :disable="essayNilai[item.jawaban_id] === undefined || essayNilai[item.jawaban_id] === null"
                      @click="simpanNilai(item)"
                    />
                    <q-chip v-if="item.dinilai" dense color="positive" text-color="white" icon="check" label="Sudah dinilai" />
                  </div>
                </template>

                <q-separator class="q-mt-md" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </transition>

    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useGuruStore } from 'stores/guru'
import MathText from 'components/MathText.vue'

const route = useRoute()
const $q = useQuasar()
const guruStore = useGuruStore()

const ujianInfo = ref(null)
const pesertaList = ref([])
const loading = ref(false)
const exportingPDF = ref(false)

const selectedPeserta = ref(null)
const detailJawaban = ref([])
const loadingDetail = ref(false)

// { [jawaban_id]: nilai } — nilai essay yang sedang diinput
const essayNilai = ref({})
const savingNilai = ref({})

// ─── Computed ────────────────────────────────────────────────

const submittedCount = computed(() => pesertaList.value.filter(p => p.submitted_at).length)
const pendingEssayCount = computed(() => pesertaList.value.reduce((acc, p) => acc + (p.pending_essay || 0), 0))
const avgNilaiPg = computed(() => {
  const submitted = pesertaList.value.filter(p => p.submitted_at && p.total_pg > 0)
  if (!submitted.length) return 0
  const avg = submitted.reduce((acc, p) => acc + pgPersen(p), 0) / submitted.length
  return Math.round(avg)
})

const rekapColumns = [
  { name: 'no', label: 'No', field: 'id', align: 'center', style: 'width: 50px',
    format: (_, row) => pesertaList.value.indexOf(row) + 1 },
  { name: 'nama', label: 'Nama Siswa', field: 'nama', align: 'left', sortable: true },
  { name: 'nilai_pg', label: 'Nilai PG', field: 'nilai_pg', align: 'center' },
  { name: 'nilai_essay', label: 'Nilai Essay', field: 'nilai_essay', align: 'center' },
  { name: 'total', label: 'Total', field: 'total', align: 'center' },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'aksi', label: 'Aksi', field: 'aksi', align: 'center' }
]

// Kolom kompak saat panel detail terbuka (sembunyikan beberapa kolom)
const rekapColumnsCompact = [
  { name: 'nama', label: 'Nama Siswa', field: 'nama', align: 'left', sortable: true },
  { name: 'total', label: 'Total', field: 'total', align: 'center' },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'aksi', label: 'Aksi', field: 'aksi', align: 'center' }
]

// ─── Helpers ─────────────────────────────────────────────────

function pgPersen (p) {
  if (!p || !p.total_pg) return 0
  return Math.round((p.nilai_pg_raw / p.total_pg) * 100)
}

function totalNilai (p) {
  if (!p) return 0
  const pgScore = pgPersen(p)
  if (!p.total_essay) return pgScore

  // Total essay max = total_essay * 100
  const essayPersen = Math.round((p.nilai_essay_raw / (p.total_essay * 100)) * 100)
  const total_soal = (p.total_pg || 0) + (p.total_essay || 0)
  const weighted = ((pgScore * (p.total_pg || 0)) + (essayPersen * (p.total_essay || 0))) / total_soal
  return Math.round(weighted)
}

function formatTime (isoStr) {
  if (!isoStr) return '-'
  return new Date(isoStr).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// ─── Actions ─────────────────────────────────────────────────

async function fetchRekap () {
  loading.value = true
  try {
    const data = await guruStore.fetchHasil(route.params.token)
    ujianInfo.value = data.ujian
    pesertaList.value = data.peserta
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Gagal memuat data hasil ujian' })
  } finally {
    loading.value = false
  }
}

async function loadDetail (peserta) {
  if (selectedPeserta.value?.id === peserta.id) {
    selectedPeserta.value = null
    detailJawaban.value = []
    return
  }
  selectedPeserta.value = peserta
  detailJawaban.value = []
  essayNilai.value = {}
  loadingDetail.value = true
  try {
    const detail = await guruStore.fetchDetailPeserta(route.params.token, peserta.id)
    detailJawaban.value = detail
    // Prefill nilai essay yang sudah ada
    for (const item of detail) {
      if (item.tipe === 'Essay' && item.jawaban_id && item.dinilai) {
        essayNilai.value[item.jawaban_id] = item.nilai
      }
    }
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Gagal memuat detail jawaban' })
  } finally {
    loadingDetail.value = false
  }
}

async function simpanNilai (item) {
  const nilai = essayNilai.value[item.jawaban_id]
  if (nilai === undefined || nilai === null) return
  savingNilai.value[item.jawaban_id] = true
  try {
    await guruStore.simpanNilaiEssay(item.jawaban_id, nilai)
    // Update item lokal
    item.nilai = nilai
    item.dinilai = 1
    // Refresh rekap
    await fetchRekap()
    // Update selectedPeserta agar total nilai terupdate
    if (selectedPeserta.value) {
      selectedPeserta.value = pesertaList.value.find(p => p.id === selectedPeserta.value.id) || selectedPeserta.value
    }
    $q.notify({ type: 'positive', message: 'Nilai berhasil disimpan', timeout: 1500 })
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Gagal menyimpan nilai' })
  } finally {
    savingNilai.value[item.jawaban_id] = false
  }
}

async function exportPDF () {
  if (!window.electronAPI?.exportPDF) {
    $q.notify({ type: 'warning', message: 'Fitur ini hanya tersedia di aplikasi desktop' })
    return
  }
  exportingPDF.value = true
  try {
    const tanggal = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    const rows = pesertaList.value.map((p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${p.nama}</td>
        <td>${p.total_pg > 0 ? `${pgPersen(p)}%` : '—'}</td>
        <td>${p.total_essay > 0 ? p.nilai_essay_raw : '—'}</td>
        <td><strong>${totalNilai(p)}%</strong></td>
        <td>${p.submitted_at ? 'Selesai' : 'Belum'}</td>
        <td>${p.submitted_at ? formatTime(p.submitted_at) : '—'}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 20px; }
  h1 { font-size: 16px; margin: 0 0 4px; }
  .meta { color: #666; margin-bottom: 16px; font-size: 11px; }
  .stats { display: flex; gap: 24px; margin-bottom: 16px; background: #f5f5f5; padding: 10px 16px; border-radius: 6px; }
  .stat label { display: block; font-size: 10px; color: #888; }
  .stat span { font-size: 18px; font-weight: bold; color: #1a3a5c; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1a3a5c; color: white; padding: 8px 10px; text-align: left; font-size: 11px; }
  td { padding: 6px 10px; border-bottom: 1px solid #eee; font-size: 11px; }
  tr:nth-child(even) td { background: #f9f9f9; }
</style>
</head><body>
<h1>LAPORAN HASIL UJIAN</h1>
<div class="meta">
  ${ujianInfo.value?.judul} — ${ujianInfo.value?.mata_pelajaran} |
  Token: ${route.params.token} | Dicetak: ${tanggal}
</div>
<div class="stats">
  <div class="stat"><label>Total Peserta</label><span>${pesertaList.value.length}</span></div>
  <div class="stat"><label>Sudah Submit</label><span>${submittedCount.value}</span></div>
  <div class="stat"><label>Rata-rata PG</label><span>${avgNilaiPg.value}%</span></div>
</div>
<table>
  <thead><tr><th>No</th><th>Nama Siswa</th><th>Nilai PG</th><th>Nilai Essay</th><th>Total</th><th>Status</th><th>Waktu Submit</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
</body></html>`

    const result = await window.electronAPI.exportPDF({
      html,
      filename: `laporan-${route.params.token}.pdf`
    })
    if (result.success) {
      $q.notify({ type: 'positive', message: 'PDF berhasil disimpan', timeout: 2500 })
    }
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Gagal export PDF' })
  } finally {
    exportingPDF.value = false
  }
}

function exportCSV () {
  const header = ['Nama Siswa', 'Nilai PG (%)', 'Nilai Essay (raw)', 'Nilai Total (%)', 'Status', 'Waktu Submit']
  const rows = pesertaList.value.map(p => [
    p.nama,
    pgPersen(p),
    p.nilai_essay_raw,
    totalNilai(p),
    p.submitted_at ? 'Selesai' : 'Belum',
    p.submitted_at ? formatTime(p.submitted_at) : '-'
  ])

  const csvContent = [header, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hasil-${ujianInfo.value?.token || route.params.token}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => fetchRekap())
</script>

<style scoped>
/* ── Split Layout ────────────────────────────────────────── */
.layout-left {
  transition: all 0.3s ease;
}

.detail-panel {
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-panel-header {
  flex-shrink: 0;
  padding: 12px 16px;
}

.detail-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Transisi slide dari kanan */
.slide-detail-enter-active,
.slide-detail-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.slide-detail-enter-from,
.slide-detail-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

/* Highlight baris yang sedang dilihat */
.detail-btn-active {
  background: rgba(var(--c-accent-rgb, 26, 58, 92), 0.12) !important;
}

/* ── Jawaban Box ─────────────────────────────────────────── */
.jawaban-box {
  padding: 10px 14px;
  border-radius: 8px;
  border: 0.5px solid var(--c-border);
}
.jawaban-benar {
  background: var(--c-success-bg);
  border-color: var(--c-success);
}
.jawaban-salah {
  background: var(--c-danger-bg);
  border-color: var(--c-danger);
}
.jawaban-kosong {
  background: var(--c-surface-2);
}
.jawaban-kunci {
  background: var(--c-surface-2);
}

.benar-badge {
  color: var(--c-success);
  font-weight: 600;
  font-size: 13px;
}
.salah-badge {
  color: var(--c-danger);
  font-weight: 600;
  font-size: 13px;
}
.kosong-badge {
  color: var(--c-text-3);
  font-size: 13px;
}

.detail-btn {
  color: var(--c-accent) !important;
  border: 1px solid var(--c-accent) !important;
  border-radius: 8px !important;
  padding: 4px 12px !important;
  font-weight: 600 !important;
  font-size: 12px !important;
  transition: all 0.2s !important;
}

:global(.body--dark) .detail-btn {
  color: #34d399 !important;
  border-color: #34d399 !important;
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.4),
              0 0 16px rgba(52, 211, 153, 0.15) !important;
  text-shadow: 0 0 8px rgba(52, 211, 153, 0.8) !important;
}

:global(.body--dark) .detail-btn:hover {
  background: rgba(52, 211, 153, 0.1) !important;
  box-shadow: 0 0 12px rgba(52, 211, 153, 0.6),
              0 0 24px rgba(52, 211, 153, 0.25) !important;
  text-shadow: 0 0 10px rgba(52, 211, 153, 1) !important;
}
</style>
