<template>
  <q-page padding class="bu-page">

    <!-- ── PAGE HEADER ─────────────────────────────────── -->
    <div class="bu-page-title q-mb-xl">Buat Ujian Baru</div>

    <div class="row q-gutter-lg">

      <!-- ── KIRI: DETAIL UJIAN ──────────────────────── -->
      <div class="col-12 col-md-4">
        <div class="bu-card">
          <div class="bu-card-title q-mb-lg">Detail Ujian</div>

          <div class="q-gutter-sm">
            <q-input v-model="form.judul" label="Judul Ujian *" outlined class="bu-input" />
            <q-input v-model="form.mata_pelajaran" label="Mata Pelajaran *" outlined class="bu-input" />
            <q-input
              v-model.number="form.durasi_menit"
              label="Durasi (menit) *"
              type="number"
              outlined
              min="5"
              max="180"
              suffix="menit"
              class="bu-input"
            />
          </div>

          <div class="bu-divider q-my-md" />

          <!-- Toggle acak -->
          <q-toggle
            v-model="form.acak_soal"
            label="Acak urutan soal per siswa"
            color="primary"
            class="q-mb-md bu-toggle"
          />

          <!-- Counter chip -->
          <div class="bu-counter-chip q-mb-sm">
            <div class="bu-counter-label">Urutan Soal Terpilih</div>
            <div class="bu-counter-nums">
              <span class="bu-counter-pg">{{ pgCount }} PG</span>
              <span class="bu-counter-sep">+</span>
              <span class="bu-counter-essay">{{ essayCount }} Essay</span>
            </div>
          </div>

          <!-- Reorderable list soal terpilih -->
          <div v-if="!selectedSoal.length" class="bu-empty-list">
            Belum ada soal dipilih dari tabel kanan
          </div>
          <div v-else class="bu-selected-list q-mb-md">
            <div
              v-for="(soal, idx) in selectedSoal"
              :key="soal.id"
              class="bu-selected-item"
            >
              <span class="bu-item-num">{{ idx + 1 }}</span>
              <span :class="['bu-item-badge', soal.tipe === 'PG' ? 'bu-badge-pg' : 'bu-badge-essay']">{{ soal.tipe }}</span>
              <span class="bu-item-text text-truncate">{{ soal.pertanyaan }}</span>
              <div class="bu-item-actions">
                <q-btn flat round dense icon="keyboard_arrow_up"   size="xs" :disable="idx === 0"                         @click="moveUp(idx)"            class="bu-reorder-btn" />
                <q-btn flat round dense icon="keyboard_arrow_down" size="xs" :disable="idx === selectedSoal.length - 1"   @click="moveDown(idx)"          class="bu-reorder-btn" />
                <q-btn flat round dense icon="close"               size="xs"                                               @click="removeFromSelected(idx)" class="bu-remove-btn" />
              </div>
            </div>
          </div>

          <!-- Submit -->
          <q-btn
            unelevated
            icon="rocket_launch"
            label="Buat Ujian & Generate Token"
            class="full-width bu-btn-submit"
            :disable="!canSubmit"
            :loading="submitting"
            @click="buatUjian"
          />
        </div>
      </div>

      <!-- ── KANAN: PILIH SOAL ────────────────────────── -->
      <div class="col">
        <div class="bu-card">
          <!-- Header dengan filter -->
          <div class="row items-center q-gutter-sm q-mb-md">
            <div class="bu-card-title col">Pilih Soal</div>
            <q-select
              v-model="filterMapel"
              :options="mapelOptions"
              label="Filter Mapel"
              dense
              outlined
              clearable
              emit-value
              map-options
              style="min-width: 160px"
              class="bu-filter-select"
            />
            <q-select
              v-model="filterTipe"
              :options="[
                { label: 'Semua Tipe', value: '' },
                { label: 'Pilihan Ganda', value: 'PG' },
                { label: 'Essay', value: 'Essay' }
              ]"
              label="Tipe Soal"
              dense
              outlined
              emit-value
              map-options
              style="min-width: 130px"
              class="bu-filter-select"
            />
            <q-input
              v-model="searchSoal"
              label="Cari soal..."
              dense
              outlined
              clearable
              style="max-width: 220px"
              class="bu-filter-select"
            >
              <template #prepend>
                <q-icon name="search" size="16px" />
              </template>
            </q-input>
          </div>

          <q-table
            :rows="filteredSoal"
            :columns="soalColumns"
            row-key="id"
            flat
            selection="multiple"
            v-model:selected="selectedSoal"
            no-data-label="Tidak ada soal. Tambah soal di Bank Soal terlebih dahulu."
            :pagination="{ rowsPerPage: 10 }"
            :loading="guruStore.isLoading"
            class="bu-table"
          >
            <template #body-cell-tipe="props">
              <q-td :props="props">
                <span :class="['bu-badge', props.value === 'PG' ? 'bu-badge-pg' : 'bu-badge-essay']">
                  {{ props.value }}
                </span>
              </q-td>
            </template>
            <template #body-cell-pertanyaan="props">
              <q-td :props="props">
                <div class="text-truncate" style="max-width: 350px" :title="props.value">
                  {{ props.value }}
                </div>
              </q-td>
            </template>
          </q-table>
        </div>
      </div>
    </div>

    <!-- ── TOKEN DIALOG ────────────────────────────────── -->
    <q-dialog v-model="showTokenDialog" persistent>
      <q-card class="bu-token-card">
        <!-- Success header -->
        <div class="bu-token-header">
          <q-icon name="check_circle" size="32px" class="q-mr-sm" style="color: #10B981" />
          <div class="bu-token-header-text">Ujian Berhasil Dibuat!</div>
        </div>

        <q-card-section class="q-pa-xl">
          <div class="text-center q-mb-lg">
            <div class="bu-token-label">TOKEN UJIAN</div>
            <div class="bu-token-display" @click="copyToken">
              {{ generatedToken }}
            </div>
            <q-btn
              flat
              icon="content_copy"
              label="Salin Token"
              size="sm"
              class="bu-copy-token-btn q-mt-sm"
              @click="copyToken"
            />
          </div>

          <div class="bu-token-divider q-mb-md" />

          <div class="text-center">
            <div class="bu-share-label">Bagikan ke siswa:</div>
            <div class="bu-share-info">
              <span class="bu-share-key">IP Server:</span>
              <span class="bu-share-val">{{ guruStore.serverInfo.ip }}</span>
            </div>
            <div class="bu-share-info">
              <span class="bu-share-key">Token:</span>
              <span class="bu-share-val">{{ generatedToken }}</span>
            </div>
          </div>
        </q-card-section>

        <div class="bu-token-actions">
          <q-btn
            unelevated
            icon="monitor"
            label="Monitor Ujian"
            :to="`/monitor/${generatedToken}`"
            class="bu-btn-monitor"
            @click="showTokenDialog = false"
          />
          <q-btn flat label="Tutup" class="bu-btn-tutup" @click="resetForm" />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useGuruStore } from 'stores/guru'

const $q = useQuasar()
const guruStore = useGuruStore()

const form = ref({ judul: '', mata_pelajaran: '', durasi_menit: 60, acak_soal: false })
const selectedSoal = ref([])
const searchSoal = ref('')
const filterMapel = ref(null)
const filterTipe = ref('')
const submitting = ref(false)
const showTokenDialog = ref(false)
const generatedToken = ref('')

const selectedSoalIds = computed(() => selectedSoal.value.map(s => s.id))
const pgCount = computed(() => selectedSoal.value.filter(s => s.tipe === 'PG').length)
const essayCount = computed(() => selectedSoal.value.filter(s => s.tipe === 'Essay').length)

const canSubmit = computed(() =>
  form.value.judul &&
  form.value.mata_pelajaran &&
  form.value.durasi_menit >= 5 &&
  selectedSoalIds.value.length > 0
)

const soalColumns = [
  { name: 'tipe', label: 'Tipe', field: 'tipe', align: 'center', style: 'width: 80px' },
  { name: 'mata_pelajaran', label: 'Mapel', field: 'mata_pelajaran', align: 'left', style: 'width: 120px' },
  { name: 'pertanyaan', label: 'Pertanyaan', field: 'pertanyaan', align: 'left' }
]

const mapelOptions = computed(() => {
  const mapels = [...new Set(guruStore.soalList.map(s => s.mata_pelajaran).filter(Boolean))]
  return mapels.map(m => ({ label: m, value: m }))
})

const filteredSoal = computed(() => {
  let list = guruStore.soalList
  if (filterMapel.value) list = list.filter(s => s.mata_pelajaran === filterMapel.value)
  if (filterTipe.value) list = list.filter(s => s.tipe === filterTipe.value)
  if (searchSoal.value) {
    const q = searchSoal.value.toLowerCase()
    list = list.filter(s => s.pertanyaan.toLowerCase().includes(q) || (s.mata_pelajaran || '').toLowerCase().includes(q))
  }
  return list
})

function moveUp (idx) {
  const arr = [...selectedSoal.value]
  ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
  selectedSoal.value = arr
}
function moveDown (idx) {
  const arr = [...selectedSoal.value]
  ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
  selectedSoal.value = arr
}
function removeFromSelected (idx) {
  selectedSoal.value = selectedSoal.value.filter((_, i) => i !== idx)
}

async function buatUjian () {
  submitting.value = true
  try {
    const result = await guruStore.createUjian({
      judul: form.value.judul,
      mata_pelajaran: form.value.mata_pelajaran,
      durasi_menit: form.value.durasi_menit,
      acak_soal: form.value.acak_soal,
      soal_ids: selectedSoalIds.value
    })
    generatedToken.value = result.token
    showTokenDialog.value = true
    await guruStore.fetchUjian()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
  } finally {
    submitting.value = false
  }
}

async function copyToken () {
  try {
    await navigator.clipboard.writeText(generatedToken.value)
    $q.notify({ type: 'positive', message: 'Token disalin!', timeout: 1500 })
  } catch (_) {
    $q.notify({ message: generatedToken.value })
  }
}

function resetForm () {
  form.value = { judul: '', mata_pelajaran: '', durasi_menit: 60, acak_soal: false }
  selectedSoal.value = []
  showTokenDialog.value = false
}

onMounted(() => guruStore.fetchSoal())
</script>

<style scoped>
/* ── PAGE TITLE ────────────────────────────────────────── */
.bu-page-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: linear-gradient(90deg, #1a5fa8, #0095C8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── M3 SURFACE CARDS ──────────────────────────────────── */
.bu-card {
  border-radius: var(--radius-xl);
  padding: 24px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  box-shadow: var(--m3-elev-1);
}

.bu-card-title {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.2px;
  color: var(--c-text);
}

.bu-divider { height: 1px; background: var(--c-border); }

/* ── M3 OUTLINED INPUTS ────────────────────────────────── */
:deep(.bu-input .q-field__control) {
  background: var(--c-surface-2) !important;
  border-radius: var(--radius-md) !important;
}
:deep(.bu-input .q-field__control:before) { border-color: var(--c-border) !important; }
:deep(.bu-input .q-field__control:hover:before) { border-color: var(--c-border-2) !important; }
:deep(.bu-input .q-field--focused .q-field__control:after) { border-color: var(--c-accent) !important; }

/* ── TOGGLE ────────────────────────────────────────────── */
:deep(.bu-toggle .q-toggle__track) { opacity: 0.8; }

/* ── COUNTER CHIP — M3 Tonal ───────────────────────────── */
.bu-counter-chip {
  border-radius: var(--radius-md);
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--c-accent-soft);
  border: 1px solid var(--c-border);
}
.bu-counter-label { font-size: 11px; font-weight: 600; letter-spacing: 0.3px; color: var(--c-text-3); }
.bu-counter-nums  { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; }
.bu-counter-pg    { color: var(--c-accent); }
.bu-counter-essay { color: var(--c-warning); }
.bu-counter-sep   { color: var(--c-text-3); font-weight: 400; }

/* ── EMPTY STATE ───────────────────────────────────────── */
.bu-empty-list {
  font-size: 12px;
  color: var(--c-text-3);
  text-align: center;
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px dashed var(--c-border);
  margin-bottom: 12px;
  background: var(--c-surface-2);
}

/* ── SELECTED SOAL LIST ────────────────────────────────── */
.bu-selected-list {
  border-radius: var(--radius-md);
  overflow: hidden;
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid var(--c-border);
}
.bu-selected-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  transition: background 0.15s;
  border-bottom: 1px solid var(--c-border);
}
.bu-selected-item:last-child { border-bottom: none; }
.bu-selected-item:hover { background: var(--c-surface-2); }

.bu-item-num  { color: var(--c-text-3); min-width: 18px; font-variant-numeric: tabular-nums; }
.bu-item-text { flex: 1; max-width: 140px; color: var(--c-text-2); }
.bu-item-actions { display: flex; align-items: center; margin-left: auto; }
.bu-reorder-btn { color: var(--c-text-3) !important; }
.bu-remove-btn  { color: var(--c-danger) !important; }

/* ── BADGES — M3 Tonal ─────────────────────────────────── */
.bu-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
.bu-badge-pg    { background: var(--c-accent-soft); color: var(--c-accent); }
.bu-badge-essay { background: var(--c-warning-bg); color: var(--c-warning); }

/* ── SUBMIT BUTTON — M3 Filled ─────────────────────────── */
.bu-btn-submit {
  background: var(--c-accent) !important;
  color: white !important;
  font-weight: 700 !important;
  font-size: 14px !important;
  border-radius: 20px !important;
  height: 46px !important;
  letter-spacing: 0.3px !important;
  box-shadow: var(--m3-elev-1) !important;
  transition: all 0.2s !important;
}
.bu-btn-submit:not(:disabled):hover {
  background: var(--c-accent-hover) !important;
  box-shadow: var(--m3-elev-2) !important;
}
.bu-btn-submit:disabled { opacity: 0.4 !important; }

/* ── FILTER + SEARCH ───────────────────────────────────── */
:deep(.bu-filter-select .q-field__control) {
  background: var(--c-surface-2) !important;
  border-radius: var(--radius-md) !important;
}
:deep(.bu-filter-select .q-field__control:before) { border-color: var(--c-border) !important; }

/* ── TABLE ─────────────────────────────────────────────── */
:deep(.bu-table thead th) {
  background: transparent !important;
  font-size: 11px !important; font-weight: 700 !important;
  letter-spacing: 0.6px !important; text-transform: uppercase !important;
  color: var(--c-text-3) !important;
}
:deep(.bu-table thead tr) { border-bottom: 1px solid var(--c-border) !important; }
:deep(.bu-table tbody td) { border-bottom: 1px solid var(--c-border) !important; font-size: 13px !important; }
:deep(.bu-table tbody .selected td) {
  background: var(--c-accent-soft) !important;
  border-left: 2px solid var(--c-accent) !important;
}
:deep(.bu-table .q-checkbox__inner--truthy .q-checkbox__bg) {
  background: var(--c-accent) !important;
  border-color: var(--c-accent) !important;
}

/* ── TOKEN DIALOG — M3 Surface ─────────────────────────── */
.bu-token-card {
  min-width: 420px;
  border-radius: var(--radius-xl) !important;
  overflow: hidden;
}
:global(.body--light) .bu-token-card {
  background: var(--c-surface) !important;
  border: 1px solid var(--c-border) !important;
  box-shadow: var(--m3-elev-4) !important;
}
:global(.body--dark) .bu-token-card {
  background: var(--c-surface-2) !important;
  border: 1px solid var(--c-border) !important;
  box-shadow: var(--m3-elev-4) !important;
}

.bu-token-header {
  display: flex; align-items: center;
  padding: 20px 28px 16px; border-bottom: 1px solid var(--c-border);
}
.bu-token-header-text { font-size: 17px; font-weight: 800; color: var(--c-text); }

.bu-token-label {
  font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
  text-transform: uppercase; color: var(--c-text-3); margin-bottom: 12px;
}

.bu-token-display {
  font-family: 'JetBrains Mono', monospace;
  font-size: 42px; font-weight: 800; letter-spacing: 0.25em;
  cursor: pointer; padding: 16px 24px; border-radius: var(--radius-lg);
  display: inline-block; transition: all 0.2s;
  background: linear-gradient(90deg, #1a5fa8, #0095C8);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  background-color: var(--c-accent-soft);
  border: 1px solid var(--c-border);
}
.bu-token-display:hover { filter: brightness(0.95); }

.bu-copy-token-btn { color: var(--c-accent) !important; font-weight: 600 !important; border-radius: var(--radius-sm) !important; }
.bu-token-divider  { height: 1px; background: var(--c-border); }
.bu-share-label    { font-size: 11px; color: var(--c-text-3); margin-bottom: 8px; font-weight: 600; letter-spacing: 0.3px; }
.bu-share-info     { font-size: 14px; margin-bottom: 4px; }
.bu-share-key      { color: var(--c-text-2); margin-right: 6px; font-weight: 600; }
.bu-share-val      { font-family: 'JetBrains Mono', monospace; color: var(--c-text); font-weight: 700; }

.bu-token-actions {
  display: flex; justify-content: center; gap: 10px;
  padding: 16px 28px; border-top: 1px solid var(--c-border);
}
.bu-btn-monitor {
  background: var(--c-accent) !important;
  color: white !important; font-weight: 700 !important;
  border-radius: 20px !important; padding: 0 20px !important;
  box-shadow: var(--m3-elev-1) !important;
}
.bu-btn-tutup { border-radius: 20px !important; font-weight: 600 !important; color: var(--c-text-2) !important; }
</style>
