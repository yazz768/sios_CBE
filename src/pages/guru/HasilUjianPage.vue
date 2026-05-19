<template>
  <q-page padding class="hu-page">

    <!-- ── HEADER ─────────────────────────────────────────────── -->
    <div class="row items-center q-mb-lg">
      <q-btn flat round icon="arrow_back" to="/hasil" class="hu-back-btn q-mr-sm" />
      <div class="col">
        <div class="hu-title">Hasil Ujian</div>
        <div class="hu-subtitle">{{ ujianInfo?.judul }} — {{ ujianInfo?.mata_pelajaran }}</div>
      </div>
      <div class="row items-center q-gutter-sm">
        <div class="hu-token-chip">
          <q-icon name="vpn_key" size="13px" class="q-mr-xs" />
          {{ route.params.token }}
        </div>
        <q-btn
          unelevated icon="picture_as_pdf" label="Export PDF" size="sm"
          class="hu-btn-red"
          :disable="!pesertaList.length" :loading="exportingPDF"
          @click="exportPDF"
        />
        <q-btn
          unelevated icon="download" label="Export CSV" size="sm"
          class="hu-btn-green"
          :disable="!pesertaList.length"
          @click="exportCSV"
        />
      </div>
    </div>

    <!-- ── LAYOUT SPLIT ────────────────────────────────────────── -->
    <div class="row q-col-gutter-md">

      <!-- ── KOLOM KIRI ─────────────────────────────────────────── -->
      <div class="col-12 layout-left" :class="selectedPeserta ? 'col-md-5' : ''">

        <!-- STAT CARDS -->
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-6 col-sm-3">
            <div class="hu-stat-card">
              <div class="hu-stat-icon hu-icon-blue"><q-icon name="people" size="16px" /></div>
              <div class="hu-stat-num hu-num-blue">{{ pesertaList.length }}</div>
              <div class="hu-stat-label">Total Peserta</div>
            </div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="hu-stat-card">
              <div class="hu-stat-icon hu-icon-green"><q-icon name="check_circle" size="16px" /></div>
              <div class="hu-stat-num hu-num-green">{{ submittedCount }}</div>
              <div class="hu-stat-label">Sudah Submit</div>
            </div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="hu-stat-card" :class="pendingEssayCount > 0 ? 'hu-stat-warning' : ''">
              <div class="hu-stat-icon hu-icon-orange"><q-icon name="pending_actions" size="16px" /></div>
              <div class="hu-stat-num hu-num-orange">{{ pendingEssayCount }}</div>
              <div class="hu-stat-label">Essay Pending</div>
            </div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="hu-stat-card">
              <div class="hu-stat-icon hu-icon-blue"><q-icon name="bar_chart" size="16px" /></div>
              <div class="hu-stat-num" :class="avgNilaiColor">{{ avgNilaiPg }}%</div>
              <div class="hu-stat-label">Rata-rata PG</div>
            </div>
          </div>
        </div>

        <!-- TABEL REKAP -->
        <div class="hu-table-card">
          <div class="hu-section-title q-mb-md">Rekap Nilai Siswa</div>
          <q-table
            :rows="pesertaList"
            :columns="selectedPeserta ? rekapColumnsCompact : rekapColumns"
            row-key="id"
            flat
            :loading="loading"
            no-data-label="Belum ada peserta bergabung"
            :pagination="{ rowsPerPage: 20 }"
            class="hu-table"
          >
            <template #body-cell-status="props">
              <q-td :props="props">
                <div class="hu-status-pill" :class="props.row.submitted_at ? 'hu-pill-selesai' : 'hu-pill-belum'">
                  {{ props.row.submitted_at ? 'Selesai' : 'Belum' }}
                </div>
              </q-td>
            </template>

            <template #body-cell-nilai_pg="props">
              <q-td :props="props" class="hu-mono-cell">
                <span v-if="props.row.total_pg > 0">
                  {{ props.row.nilai_pg_raw }}/{{ props.row.total_pg }}
                  <span class="hu-persen q-ml-xs">({{ pgPersen(props.row) }}%)</span>
                </span>
                <span v-else class="hu-dash">—</span>
              </q-td>
            </template>

            <template #body-cell-nilai_essay="props">
              <q-td :props="props" class="hu-mono-cell">
                <span v-if="props.row.total_essay > 0">
                  {{ props.row.nilai_essay_raw }}
                  <q-badge
                    v-if="props.row.pending_essay > 0"
                    color="warning"
                    :label="`${props.row.pending_essay} belum`"
                    class="q-ml-xs"
                  />
                </span>
                <span v-else class="hu-dash">—</span>
              </q-td>
            </template>

            <template #body-cell-total="props">
              <q-td :props="props">
                <span class="hu-total-val" :class="totalValueClass(totalNilai(props.row))">
                  {{ totalNilai(props.row) }}%
                </span>
              </q-td>
            </template>

            <template #body-cell-aksi="props">
              <q-td :props="props">
                <q-btn
                  flat dense icon="visibility" label="Detail" size="sm"
                  class="hu-detail-btn"
                  :class="selectedPeserta?.id === props.row.id ? 'hu-detail-active' : ''"
                  @click="loadDetail(props.row)"
                />
              </q-td>
            </template>
          </q-table>
        </div>
      </div>

      <!-- ── KOLOM KANAN: PANEL DETAIL ──────────────────────────── -->
      <transition name="slide-detail">
        <div v-if="selectedPeserta" class="col-12 col-md-7">
          <div class="hu-detail-panel">
            <transition name="hu-switch" mode="out-in">
            <div :key="selectedPeserta?.id" class="hu-switch-wrap">

            <!-- Header Panel -->
            <div class="hu-panel-header row items-center no-wrap">
              <div class="hu-panel-avatar">
                <q-icon name="person" size="20px" />
              </div>
              <div class="col q-ml-sm">
                <div class="hu-panel-name">{{ selectedPeserta.nama }}</div>
                <div class="hu-panel-sub">
                  Submit: {{ selectedPeserta.submitted_at ? formatTime(selectedPeserta.submitted_at) : 'Belum submit' }}
                </div>
              </div>
              <div class="row q-gutter-md text-center q-mr-md">
                <div>
                  <div class="hu-score-label">PG</div>
                  <div class="hu-score-val hu-score-blue">{{ pgPersen(selectedPeserta) }}%</div>
                </div>
                <div v-if="selectedPeserta.total_essay > 0">
                  <div class="hu-score-label">Essay</div>
                  <div class="hu-score-val hu-score-purple">{{ selectedPeserta.nilai_essay_raw }}</div>
                </div>
                <div>
                  <div class="hu-score-label">Total</div>
                  <div class="hu-score-val hu-score-green">{{ totalNilai(selectedPeserta) }}%</div>
                </div>
              </div>
              <q-btn flat round dense icon="close" class="hu-close-btn"
                @click="selectedPeserta = null; detailJawaban = []" />
            </div>

            <div class="hu-panel-divider" />

            <!-- Isi Detail -->
            <div class="hu-panel-body">
              <q-inner-loading :showing="loadingDetail" />

              <div v-for="(item, idx) in detailJawaban" :key="item.soal_id" class="hu-soal-item q-mb-lg">
                <!-- Nomor & Tipe -->
                <div class="row items-center q-mb-sm">
                  <div class="col">
                    <span class="hu-soal-num">Soal {{ idx + 1 }}</span>
                    <span class="hu-tipe-badge q-ml-sm"
                      :class="item.tipe === 'PG' ? 'hu-badge-pg' : 'hu-badge-essay'">
                      {{ item.tipe }}
                    </span>
                  </div>
                  <template v-if="item.tipe === 'PG'">
                    <span v-if="item.jawaban_teks === item.kunci_jawaban" class="benar-badge">✅ Benar</span>
                    <span v-else-if="item.jawaban_teks" class="salah-badge">❌ Salah</span>
                    <span v-else class="kosong-badge">— Tidak dijawab</span>
                  </template>
                </div>

                <!-- Pertanyaan -->
                <div class="hu-pertanyaan-box q-mb-sm">
                  <MathText :text="item.pertanyaan" />
                </div>

                <!-- PG -->
                <template v-if="item.tipe === 'PG'">
                  <div class="row q-gutter-sm">
                    <div class="col hu-jawaban-box"
                      :class="item.jawaban_teks === item.kunci_jawaban ? 'hu-jawaban-benar' : (item.jawaban_teks ? 'hu-jawaban-salah' : 'hu-jawaban-kosong')">
                      <div class="hu-jawaban-label q-mb-xs">Jawaban Siswa</div>
                      <div class="hu-jawaban-val">{{ item.jawaban_teks || '(tidak dijawab)' }}</div>
                    </div>
                    <div class="col hu-jawaban-box hu-jawaban-kunci">
                      <div class="hu-jawaban-label q-mb-xs">Kunci Jawaban</div>
                      <div class="hu-jawaban-val">{{ item.kunci_jawaban }}</div>
                    </div>
                  </div>
                </template>

                <!-- Essay -->
                <template v-else>
                  <div class="hu-jawaban-box q-mb-sm">
                    <div class="hu-jawaban-label q-mb-xs">Jawaban Siswa</div>
                    <div class="hu-jawaban-essay">{{ item.jawaban_teks || '(tidak dijawab)' }}</div>
                  </div>
                  <div v-if="item.panduan_penilaian" class="hu-panduan-box q-mb-sm">
                    <div class="hu-jawaban-label q-mb-xs">Panduan Penilaian</div>
                    <div class="hu-jawaban-essay">{{ item.panduan_penilaian }}</div>
                  </div>
                  <div class="row items-center q-gutter-sm">
                    <q-input
                      v-model.number="essayNilai[item.jawaban_id]"
                      type="number" min="0" max="100" label="Nilai (0–100)"
                      outlined dense class="hu-essay-input"
                    />
                    <q-btn
                      unelevated label="Simpan Nilai" size="sm" class="hu-simpan-btn"
                      :loading="savingNilai[item.jawaban_id]"
                      :disable="essayNilai[item.jawaban_id] === undefined || essayNilai[item.jawaban_id] === null"
                      @click="simpanNilai(item)"
                    />
                    <q-chip v-if="item.dinilai" dense color="positive" text-color="white" icon="check" label="Sudah dinilai" />
                  </div>
                </template>

                <div class="hu-soal-divider q-mt-md" />
              </div>
            </div>
            </div><!-- end hu-switch-wrap -->
            </transition><!-- end hu-switch -->
          </div>
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

const essayNilai = ref({})
const savingNilai = ref({})

const submittedCount = computed(() => pesertaList.value.filter(p => p.submitted_at).length)
const pendingEssayCount = computed(() => pesertaList.value.reduce((acc, p) => acc + (p.pending_essay || 0), 0))
const avgNilaiPg = computed(() => {
  const submitted = pesertaList.value.filter(p => p.submitted_at && p.total_pg > 0)
  if (!submitted.length) return 0
  const avg = submitted.reduce((acc, p) => acc + pgPersen(p), 0) / submitted.length
  return Math.round(avg)
})

const avgNilaiColor = computed(() => {
  if (avgNilaiPg.value >= 75) return 'hu-num-green'
  if (avgNilaiPg.value >= 60) return 'hu-num-orange'
  return 'hu-num-red'
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

const rekapColumnsCompact = [
  { name: 'nama', label: 'Nama Siswa', field: 'nama', align: 'left', sortable: true },
  { name: 'nilai_essay', label: 'Essay', field: 'nilai_essay', align: 'center' },
  { name: 'total', label: 'Total', field: 'total', align: 'center' },
  { name: 'aksi', label: 'Aksi', field: 'aksi', align: 'center' }
]

function pgPersen (p) {
  if (!p || !p.total_pg) return 0
  return Math.round((p.nilai_pg_raw / p.total_pg) * 100)
}

function totalNilai (p) {
  if (!p) return 0
  const pgScore = pgPersen(p)
  if (!p.total_essay) return pgScore
  const essayPersen = Math.round((p.nilai_essay_raw / (p.total_essay * 100)) * 100)
  const total_soal = (p.total_pg || 0) + (p.total_essay || 0)
  const weighted = ((pgScore * (p.total_pg || 0)) + (essayPersen * (p.total_essay || 0))) / total_soal
  return Math.round(weighted)
}

function totalValueClass (val) {
  if (val >= 75) return 'hu-val-green'
  if (val >= 60) return 'hu-val-orange'
  return 'hu-val-red'
}

function formatTime (isoStr) {
  if (!isoStr) return '-'
  return new Date(isoStr).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

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
    item.nilai = nilai
    item.dinilai = 1
    await fetchRekap()
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
    p.nama, pgPersen(p), p.nilai_essay_raw, totalNilai(p),
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
/* ── HEADER ───────────────────────────────────────────────── */
.hu-title {
  font-size: 20px; font-weight: 800; letter-spacing: -0.3px;
  background: linear-gradient(90deg, #1a5fa8, #0095C8);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.hu-subtitle { font-size: 13px; margin-top: 2px; color: var(--c-text-2); }

.hu-back-btn {
  color: var(--c-text-2) !important;
  background: var(--c-surface-2) !important;
  border: 1px solid var(--c-border) !important;
}
.hu-back-btn:hover { background: var(--c-accent-soft) !important; color: var(--c-accent) !important; }

.hu-token-chip {
  display: flex; align-items: center;
  padding: 6px 14px; border-radius: 999px;
  font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600;
  background: var(--c-accent-soft); border: 1px solid var(--c-border); color: var(--c-accent);
}

/* M3 Filled Buttons */
.hu-btn-red {
  background: var(--c-danger) !important;
  color: white !important; border-radius: 20px !important; font-weight: 600 !important;
}
.hu-btn-red:hover { filter: brightness(0.9) !important; }

.hu-btn-green {
  background: var(--c-success) !important;
  color: white !important; border-radius: 20px !important; font-weight: 600 !important;
}
.hu-btn-green:hover { filter: brightness(0.9) !important; }

/* ── STAT CARDS — M3 Surface ──────────────────────────────── */
.hu-stat-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: 14px 10px; border-radius: var(--radius-lg); text-align: center;
  transition: transform 0.15s;
  background: var(--c-surface); border: 1px solid var(--c-border); box-shadow: var(--m3-elev-1);
}
.hu-stat-card:hover { transform: translateY(-2px); box-shadow: var(--m3-elev-2) !important; }
.hu-stat-warning { border-color: var(--c-warning) !important; background: var(--c-warning-bg) !important; }

.hu-stat-icon {
  width: 36px; height: 36px; border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
}
.hu-icon-blue   { background: var(--c-accent-soft); color: var(--c-accent); }
.hu-icon-green  { background: var(--c-success-bg);  color: var(--c-success); }
.hu-icon-orange { background: var(--c-warning-bg);  color: var(--c-warning); }

.hu-stat-num { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1; }
.hu-num-blue   { color: var(--c-accent); }
.hu-num-green  { color: var(--c-success); }
.hu-num-orange { color: var(--c-warning); }
.hu-num-red    { color: var(--c-danger); }
.hu-stat-label { font-size: 11px; line-height: 1.3; color: var(--c-text-2); }

/* ── TABLE CARD — M3 Surface ──────────────────────────────── */
.hu-table-card {
  padding: 20px; border-radius: var(--radius-lg);
  background: var(--c-surface); border: 1px solid var(--c-border); box-shadow: var(--m3-elev-1);
}
.hu-section-title { font-size: 15px; font-weight: 700; color: var(--c-text); }

:deep(.hu-table .q-table__top),
:deep(.hu-table .q-table__bottom) { background: transparent !important; }
:deep(.hu-table thead tr th) {
  font-size: 11px !important; font-weight: 600 !important; letter-spacing: 0.5px !important;
  text-transform: uppercase !important; background: transparent !important;
  color: var(--c-text-3) !important; border-bottom: 1px solid var(--c-border) !important;
}
:deep(.hu-table tbody tr td) {
  color: var(--c-text-2); border-bottom: 1px solid var(--c-border) !important;
}
:deep(.hu-table tbody tr:hover td) { background: var(--c-surface-2) !important; }

.hu-mono-cell { font-family: 'JetBrains Mono', monospace !important; font-size: 12px !important; }
.hu-persen    { font-size: 11px; color: var(--c-text-3); }
.hu-dash      { font-style: italic; color: var(--c-text-3); }

.hu-total-val { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 13px; }
.hu-val-green  { color: var(--c-success); }
.hu-val-orange { color: var(--c-warning); }
.hu-val-red    { color: var(--c-danger); }

/* ── STATUS PILLS ─────────────────────────────────────────── */
.hu-status-pill {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600;
}
.hu-pill-selesai { background: var(--c-success-bg); color: var(--c-success); border: 1px solid var(--c-success); }
.hu-pill-belum   { background: var(--c-surface-2);  color: var(--c-text-3); border: 1px solid var(--c-border); }

/* ── DETAIL BUTTON ────────────────────────────────────────── */
.hu-detail-btn {
  border-radius: var(--radius-sm) !important; font-weight: 600 !important; font-size: 12px !important;
  color: var(--c-accent) !important; border: 1px solid var(--c-border) !important;
}
.hu-detail-btn:hover { background: var(--c-accent-soft) !important; border-color: var(--c-accent) !important; }
.hu-detail-active { background: var(--c-accent-soft) !important; border-color: var(--c-accent) !important; }

/* ── LAYOUT ───────────────────────────────────────────────── */
.layout-left { transition: all 0.3s ease; }
.slide-detail-enter-active, .slide-detail-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.slide-detail-enter-from, .slide-detail-leave-to { opacity: 0; transform: translateX(24px); }

/* Animasi switch antar murid — fade + geser ke atas */
.hu-switch-wrap { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.hu-switch-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.hu-switch-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.hu-switch-enter-from   { opacity: 0; transform: translateY(10px); }
.hu-switch-leave-to     { opacity: 0; transform: translateY(-6px); }

/* ── DETAIL PANEL — M3 Surface ────────────────────────────── */
.hu-detail-panel {
  position: sticky; top: 16px;
  max-height: calc(100vh - 80px);
  display: flex; flex-direction: column; overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--c-surface); border: 1px solid var(--c-border); box-shadow: var(--m3-elev-2);
}

.hu-panel-header { flex-shrink: 0; padding: 14px 16px; }
.hu-panel-avatar {
  width: 36px; height: 36px; border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  background: var(--c-accent-soft); color: var(--c-accent);
}
.hu-panel-name { font-size: 15px; font-weight: 700; color: var(--c-text); }
.hu-panel-sub  { font-size: 12px; margin-top: 1px; color: var(--c-text-2); }

.hu-score-label { font-size: 10px; font-weight: 500; color: var(--c-text-3); }
.hu-score-val   { font-size: 15px; font-weight: 800; }
.hu-score-blue  { color: var(--c-accent); }
.hu-score-purple { color: #7C3AED; }
.hu-score-green { color: var(--c-success); }

.hu-close-btn { color: var(--c-text-2) !important; }

.hu-panel-divider { height: 1px; flex-shrink: 0; background: var(--c-border); }
.hu-panel-body { flex: 1; overflow-y: auto; padding: 16px; }

/* ── SOAL ITEM ────────────────────────────────────────────── */
.hu-soal-num { font-weight: 700; font-size: 14px; color: var(--c-text); }
.hu-tipe-badge {
  display: inline-flex; align-items: center;
  padding: 2px 8px; border-radius: 999px; font-size: 10.5px; font-weight: 700;
}
.hu-badge-pg    { background: var(--c-accent-soft); color: var(--c-accent); }
.hu-badge-essay { background: var(--c-warning-bg);  color: var(--c-warning); }

.hu-pertanyaan-box {
  padding: 10px 14px; border-radius: var(--radius-md); line-height: 1.6; font-size: 14px;
  background: var(--c-surface-2); border: 1px solid var(--c-border);
  border-left: 3px solid var(--c-accent); color: var(--c-text);
}

.hu-jawaban-box {
  padding: 10px 14px; border-radius: var(--radius-md);
  background: var(--c-surface-2); border: 1px solid var(--c-border);
}
.hu-jawaban-benar { border-color: var(--c-success) !important; background: var(--c-success-bg) !important; }
.hu-jawaban-salah { border-color: var(--c-danger) !important;  background: var(--c-danger-bg) !important; }
.hu-jawaban-kunci { border-color: var(--c-accent) !important; }

.hu-jawaban-label  { font-size: 11px; font-weight: 600; color: var(--c-text-3); }
.hu-jawaban-val    { font-weight: 600; font-size: 14px; color: var(--c-text); }
.hu-jawaban-essay  { white-space: pre-wrap; font-size: 13px; line-height: 1.6; color: var(--c-text-2); }

.hu-panduan-box {
  padding: 10px 14px; border-radius: var(--radius-md);
  background: var(--c-warning-bg); border: 1px solid var(--c-warning);
  border-left-width: 3px;
}

.hu-soal-divider { height: 1px; background: var(--c-border); }
.hu-essay-input { max-width: 150px; }
.hu-simpan-btn {
  background: var(--c-accent) !important; color: white !important;
  border-radius: 20px !important; font-weight: 600 !important;
}

.benar-badge  { color: var(--c-success); font-weight: 600; font-size: 13px; }
.salah-badge  { color: var(--c-danger);  font-weight: 600; font-size: 13px; }
.kosong-badge { font-size: 13px; color: var(--c-text-3); }
</style>
