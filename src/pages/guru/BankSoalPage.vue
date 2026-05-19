<template>
  <q-page padding class="bs-page">

    <!-- ── HEADER ─────────────────────────────────────── -->
    <div class="row items-center q-mb-lg">
      <div class="bs-page-title col">Bank Soal</div>
      <q-btn
        unelevated
        icon="add"
        label="Tambah Soal"
        class="bs-btn-add"
        @click="openDialog()"
      />
    </div>

    <!-- ── FILTER BAR ──────────────────────────────────── -->
    <div class="bs-filter-bar row q-gutter-sm q-mb-md">
      <q-select
        v-model="filterMapel"
        :options="mapelOptions"
        label="Filter Mata Pelajaran"
        clearable
        dense
        outlined
        style="min-width: 200px"
        emit-value
        map-options
        class="bs-filter-select"
      />
      <q-select
        v-model="filterTipe"
        :options="[{ label: 'Semua', value: '' }, { label: 'Pilihan Ganda', value: 'PG' }, { label: 'Essay', value: 'Essay' }]"
        label="Filter Tipe"
        dense
        outlined
        style="min-width: 160px"
        emit-value
        map-options
        class="bs-filter-select"
      />
    </div>

    <!-- ── TABEL SOAL ──────────────────────────────────── -->
    <div class="bs-table-card">
      <q-table
        :rows="filteredSoal"
        :columns="columns"
        row-key="id"
        flat
        :loading="guruStore.isLoading"
        no-data-label="Belum ada soal. Klik 'Tambah Soal' untuk mulai."
        :pagination="{ rowsPerPage: 10 }"
        class="bs-table"
      >
        <template #body-cell-tipe="props">
          <q-td :props="props">
            <span :class="['bs-badge', props.value === 'PG' ? 'bs-badge-pg' : 'bs-badge-essay']">
              {{ props.value }}
            </span>
          </q-td>
        </template>
        <template #body-cell-pertanyaan="props">
          <q-td :props="props">
            <div class="text-truncate bs-question-text" :title="props.value">
              <MathText :text="props.value" />
            </div>
          </q-td>
        </template>
        <template #body-cell-aksi="props">
          <q-td :props="props" class="bs-action-cell">
            <q-btn flat dense round icon="edit"   size="sm" class="bs-btn-edit"   @click="openDialog(props.row)" />
            <q-btn flat dense round icon="delete" size="sm" class="bs-btn-delete" @click="confirmDelete(props.row)" />
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- ── DIALOG TAMBAH / EDIT SOAL ──────────────────── -->
    <q-dialog v-model="showDialog" persistent>
      <q-card class="bs-dialog-card">
        <!-- Dialog header -->
        <div class="bs-dialog-header">
          <div class="bs-dialog-title">{{ editMode ? 'Edit Soal' : 'Tambah Soal Baru' }}</div>
          <q-btn flat round dense icon="close" class="bs-dialog-close" @click="closeDialog" />
        </div>

        <q-card-section class="q-gutter-md bs-dialog-body">
          <!-- Tipe -->
          <q-select
            v-model="form.tipe"
            :options="[{ label: 'Pilihan Ganda (PG)', value: 'PG' }, { label: 'Essay', value: 'Essay' }]"
            label="Tipe Soal *"
            outlined
            emit-value
            map-options
            class="bs-input"
          />

          <!-- Mata Pelajaran — pilih dari list atau ketik baru, Enter untuk konfirmasi -->
          <q-select
            v-model="form.mata_pelajaran"
            :options="mapelDialogOptions"
            use-input
            input-debounce="0"
            new-value-mode="add-unique"
            label="Mata Pelajaran"
            outlined
            clearable
            class="bs-input"
            @filter="filterMapelDialog"
            @new-value="onNewMapel"
          >
            <template #no-option="{ inputValue }">
              <q-item>
                <q-item-section class="text-caption" style="color: var(--c-text-3)">
                  <span v-if="inputValue">
                    Tekan <kbd>Enter</kbd> untuk menambah "<strong>{{ inputValue }}</strong>"
                  </span>
                  <span v-else>Belum ada mata pelajaran — ketik untuk membuat baru</span>
                </q-item-section>
              </q-item>
            </template>
            <template #append>
              <q-icon name="school" size="16px" style="color: var(--c-text-3)" />
            </template>
          </q-select>

          <!-- Pertanyaan -->
          <q-input
            v-model="form.pertanyaan"
            label="Pertanyaan *"
            type="textarea"
            outlined
            :rows="3"
            class="bs-input"
          />

          <!-- Gambar Soal -->
          <div class="bs-image-section">
            <div class="bs-image-label">Gambar Soal <span class="bs-optional">(opsional)</span></div>
            <div v-if="form.gambar_url" class="q-mb-sm">
              <img
                :src="`${guruStore.baseUrl}${form.gambar_url}`"
                style="max-height: 160px; max-width: 100%; border-radius: 10px; border: 1px solid var(--c-border)"
              />
            </div>
            <div class="row q-gutter-sm">
              <q-btn flat dense icon="image" label="Pilih Gambar" class="bs-img-btn" @click="pilihGambar" />
              <q-btn
                v-if="form.gambar_url"
                flat dense icon="delete" label="Hapus Gambar"
                class="bs-img-btn-del"
                @click="form.gambar_url = null"
              />
            </div>
          </div>

          <!-- Opsi PG -->
          <template v-if="form.tipe === 'PG'">
            <div class="bs-opsi-section">
              <div class="bs-opsi-title">Pilihan Jawaban</div>
              <div class="q-gutter-sm">
                <q-input v-model="form.opsi_a" label="Opsi A *" outlined dense prefix="A. " class="bs-input" />
                <q-input v-model="form.opsi_b" label="Opsi B *" outlined dense prefix="B. " class="bs-input" />
                <q-input v-model="form.opsi_c" label="Opsi C *" outlined dense prefix="C. " class="bs-input" />
                <q-input v-model="form.opsi_d" label="Opsi D *" outlined dense prefix="D. " class="bs-input" />
              </div>
              <q-select
                v-model="form.kunci_jawaban"
                :options="[
                  { label: 'A. ' + (form.opsi_a || ''), value: 'A' },
                  { label: 'B. ' + (form.opsi_b || ''), value: 'B' },
                  { label: 'C. ' + (form.opsi_c || ''), value: 'C' },
                  { label: 'D. ' + (form.opsi_d || ''), value: 'D' }
                ]"
                label="Kunci Jawaban *"
                outlined
                emit-value
                map-options
                class="bs-input bs-kunci-select q-mt-sm"
              />
            </div>
          </template>

          <!-- Panduan Essay -->
          <template v-if="form.tipe === 'Essay'">
            <q-input
              v-model="form.panduan_penilaian"
              label="Panduan Penilaian (opsional)"
              type="textarea"
              outlined
              :rows="3"
              class="bs-input"
            />
          </template>
        </q-card-section>

        <!-- Dialog actions -->
        <div class="bs-dialog-actions">
          <q-btn flat label="Batal" class="bs-btn-cancel" @click="closeDialog" />
          <q-btn
            unelevated
            :label="editMode ? 'Simpan Perubahan' : 'Tambah Soal'"
            :loading="saving"
            class="bs-btn-submit"
            @click="saveSoal"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useGuruStore } from 'stores/guru'
import MathText from 'components/MathText.vue'

const $q = useQuasar()
const guruStore = useGuruStore()

const filterMapel = ref(null)
const filterTipe = ref('')
const showDialog = ref(false)
const editMode = ref(false)
const saving = ref(false)
const editId = ref(null)

const formDefault = () => ({
  tipe: 'PG',
  mata_pelajaran: '',
  pertanyaan: '',
  opsi_a: '',
  opsi_b: '',
  opsi_c: '',
  opsi_d: '',
  kunci_jawaban: 'A',
  panduan_penilaian: '',
  gambar_url: null
})

const form = ref(formDefault())

const columns = [
  { name: 'id', label: 'No', field: 'id', align: 'center', sortable: true, style: 'width: 60px' },
  { name: 'tipe', label: 'Tipe', field: 'tipe', align: 'center', style: 'width: 100px' },
  { name: 'mata_pelajaran', label: 'Mata Pelajaran', field: 'mata_pelajaran', align: 'left' },
  { name: 'pertanyaan', label: 'Pertanyaan', field: 'pertanyaan', align: 'left' },
  { name: 'aksi', label: 'Aksi', field: 'aksi', align: 'center', style: 'width: 100px' }
]

// Options untuk filter bar (label/value object dengan pilihan "Semua")
const mapelOptions = computed(() => {
  const mapels = [...new Set(guruStore.soalList.map(s => s.mata_pelajaran).filter(Boolean))]
  return [{ label: 'Semua', value: null }, ...mapels.map(m => ({ label: m, value: m }))]
})

// Semua mata pelajaran unik sebagai string murni (untuk dialog select)
const allMapel = computed(() =>
  [...new Set(guruStore.soalList.map(s => s.mata_pelajaran).filter(Boolean))].sort()
)

// Options yang ditampilkan di dropdown dialog (difilter saat user mengetik)
const mapelDialogOptions = ref([])

function filterMapelDialog (val, update) {
  update(() => {
    if (!val) {
      mapelDialogOptions.value = allMapel.value
    } else {
      const needle = val.toLowerCase()
      mapelDialogOptions.value = allMapel.value.filter(m => m.toLowerCase().includes(needle))
    }
  })
}

function onNewMapel (val, done) {
  const trimmed = val.trim()
  if (trimmed) done(trimmed, 'add-unique')
}

const filteredSoal = computed(() => {
  let list = guruStore.soalList
  if (filterMapel.value) list = list.filter(s => s.mata_pelajaran === filterMapel.value)
  if (filterTipe.value) list = list.filter(s => s.tipe === filterTipe.value)
  return list
})

function openDialog (soal = null) {
  // Inisialisasi list opsi mapel saat dialog dibuka
  mapelDialogOptions.value = allMapel.value

  if (soal) {
    editMode.value = true
    editId.value = soal.id
    form.value = {
      tipe: soal.tipe,
      mata_pelajaran: soal.mata_pelajaran || '',
      pertanyaan: soal.pertanyaan,
      opsi_a: soal.opsi_a || '',
      opsi_b: soal.opsi_b || '',
      opsi_c: soal.opsi_c || '',
      opsi_d: soal.opsi_d || '',
      kunci_jawaban: soal.kunci_jawaban || 'A',
      panduan_penilaian: soal.panduan_penilaian || '',
      gambar_url: soal.gambar_url || null
    }
  } else {
    editMode.value = false
    editId.value = null
    form.value = formDefault()
  }
  showDialog.value = true
}

function closeDialog () {
  showDialog.value = false
}

async function pilihGambar () {
  if (!window.electronAPI?.selectImage) {
    $q.notify({ type: 'warning', message: 'Fitur gambar hanya tersedia di aplikasi desktop' })
    return
  }
  const url = await window.electronAPI.selectImage()
  if (url) form.value.gambar_url = url
}

async function saveSoal () {
  if (!form.value.pertanyaan) {
    $q.notify({ type: 'negative', message: 'Pertanyaan wajib diisi' })
    return
  }
  if (form.value.tipe === 'PG' && (!form.value.opsi_a || !form.value.opsi_b || !form.value.opsi_c || !form.value.opsi_d)) {
    $q.notify({ type: 'negative', message: 'Semua opsi A-D wajib diisi untuk soal PG' })
    return
  }

  saving.value = true
  try {
    if (editMode.value) {
      await guruStore.updateSoal(editId.value, form.value)
      $q.notify({ type: 'positive', message: 'Soal berhasil diperbarui' })
    } else {
      await guruStore.createSoal(form.value)
      $q.notify({ type: 'positive', message: 'Soal berhasil ditambahkan' })
    }
    await guruStore.fetchSoal()
    closeDialog()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
  } finally {
    saving.value = false
  }
}

function confirmDelete (soal) {
  $q.dialog({
    title: 'Hapus Soal',
    message: `Yakin ingin menghapus soal ini?\n"${soal.pertanyaan.substring(0, 60)}..."`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await guruStore.deleteSoal(soal.id)
      await guruStore.fetchSoal()
      $q.notify({ type: 'positive', message: 'Soal berhasil dihapus' })
    } catch (err) {
      $q.notify({ type: 'negative', message: err.message })
    }
  })
}

onMounted(() => guruStore.fetchSoal())
</script>

<style scoped>
/* ── PAGE HEADER ───────────────────────────────────────── */
.bs-page-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: linear-gradient(90deg, #1a5fa8, #0095C8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* M3 Filled Button */
.bs-btn-add {
  background: var(--c-accent) !important;
  color: white !important;
  font-weight: 700 !important;
  border-radius: 20px !important;
  padding: 0 20px !important;
  height: 38px !important;
  box-shadow: var(--m3-elev-1) !important;
  transition: all 0.2s !important;
}
.bs-btn-add:hover {
  background: var(--c-accent-hover) !important;
  box-shadow: var(--m3-elev-2) !important;
}

/* ── FILTER BAR — M3 Outlined ──────────────────────────── */
:deep(.bs-filter-select .q-field__control) {
  background: var(--c-surface-2) !important;
  border-radius: var(--radius-md) !important;
}
:deep(.bs-filter-select .q-field__control:before) {
  border-color: var(--c-border) !important;
}
:deep(.bs-filter-select .q-field__control:hover:before) {
  border-color: var(--c-border-2) !important;
}

/* ── TABLE CARD — M3 Surface ───────────────────────────── */
.bs-table-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  box-shadow: var(--m3-elev-1);
}

:deep(.bs-table thead th) {
  background: transparent !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  letter-spacing: 0.6px !important;
  text-transform: uppercase !important;
  color: var(--c-text-3) !important;
}
:deep(.bs-table thead tr) {
  border-bottom: 1px solid var(--c-border) !important;
}
:deep(.bs-table tbody td) {
  border-bottom: 1px solid var(--c-border) !important;
  font-size: 13px !important;
}
:deep(.bs-table tbody tr:hover td) {
  background: var(--c-surface-2) !important;
}

.bs-action-cell .bs-btn-edit,
.bs-action-cell .bs-btn-delete {
  opacity: 0.35;
  transition: opacity 0.15s, transform 0.15s !important;
}
:deep(.bs-table tbody tr:hover) .bs-action-cell .bs-btn-edit,
:deep(.bs-table tbody tr:hover) .bs-action-cell .bs-btn-delete {
  opacity: 1 !important;
}

.bs-btn-edit {
  color: var(--c-accent) !important;
  transition: all 0.15s !important;
}
.bs-btn-edit:hover { background: var(--c-accent-soft) !important; transform: scale(1.1) !important; }

.bs-btn-delete {
  color: var(--c-danger) !important;
  transition: all 0.15s !important;
}
.bs-btn-delete:hover { background: var(--c-danger-bg) !important; transform: scale(1.1) !important; }

.bs-question-text { max-width: 400px; }

/* ── BADGES — M3 Tonal ─────────────────────────────────── */
.bs-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
}
.bs-badge-pg    { background: var(--c-accent-soft); color: var(--c-accent); }
.bs-badge-essay { background: var(--c-warning-bg); color: var(--c-warning); }

/* ── DIALOG — M3 Surface ───────────────────────────────── */
.bs-dialog-card {
  min-width: 600px;
  max-width: 700px;
  border-radius: var(--radius-xl) !important;
  overflow: hidden;
}
:global(.body--light) .bs-dialog-card {
  background: var(--c-surface) !important;
  border: 1px solid var(--c-border) !important;
  box-shadow: var(--m3-elev-4) !important;
}
:global(.body--dark) .bs-dialog-card {
  background: var(--c-surface-2) !important;
  border: 1px solid var(--c-border) !important;
  box-shadow: var(--m3-elev-4) !important;
}

.bs-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--c-border);
}
.bs-dialog-title {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.3px;
  color: var(--c-text);
}
.bs-dialog-close { color: var(--c-text-3) !important; }

.bs-dialog-body { padding: 20px 24px !important; }

/* M3 Outlined inputs */
:deep(.bs-input .q-field__control) {
  background: var(--c-surface-2) !important;
  border-radius: var(--radius-md) !important;
}
:deep(.bs-input .q-field__control:before) {
  border-color: var(--c-border) !important;
}
:deep(.bs-input .q-field--focused .q-field__control:after) {
  border-color: var(--c-accent) !important;
}
:deep(.bs-input .q-field__control:focus-within) {
  box-shadow: var(--c-shadow-focus) !important;
}

.bs-opsi-section {
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid var(--c-border);
  background: var(--c-surface-2);
}
.bs-opsi-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--c-text-3);
  margin-bottom: 12px;
}

.bs-kunci-select :deep(.q-field__native) { color: var(--c-success) !important; font-weight: 600; }

.bs-image-section {
  border-radius: var(--radius-md);
  padding: 14px;
  border: 1px dashed var(--c-border);
  background: var(--c-surface-2);
}
.bs-image-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--c-text-2);
  margin-bottom: 8px;
}
.bs-optional { color: var(--c-text-3); font-weight: 400; }
.bs-img-btn     { color: var(--c-accent) !important; border-radius: var(--radius-sm) !important; }
.bs-img-btn-del { color: var(--c-danger) !important; border-radius: var(--radius-sm) !important; }

.bs-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--c-border);
}
.bs-btn-cancel {
  border-radius: 20px !important;
  font-weight: 600 !important;
  color: var(--c-text-2) !important;
}
.bs-btn-submit {
  background: var(--c-accent) !important;
  color: white !important;
  font-weight: 700 !important;
  border-radius: 20px !important;
  padding: 0 24px !important;
  box-shadow: var(--m3-elev-1) !important;
  transition: all 0.2s !important;
}
.bs-btn-submit:hover {
  background: var(--c-accent-hover) !important;
  box-shadow: var(--m3-elev-2) !important;
}
</style>
