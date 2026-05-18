<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5 text-primary col">Bank Soal</div>
      <q-btn unelevated color="primary" icon="add" label="Tambah Soal" @click="openDialog()" />
    </div>

    <!-- Filter -->
    <div class="row q-gutter-sm q-mb-md">
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
      />
    </div>

    <!-- Tabel Soal -->
    <q-card flat bordered>
      <q-table
        :rows="filteredSoal"
        :columns="columns"
        row-key="id"
        flat
        :loading="guruStore.isLoading"
        no-data-label="Belum ada soal. Klik 'Tambah Soal' untuk mulai."
        :pagination="{ rowsPerPage: 10 }"
      >
        <template #body-cell-tipe="props">
          <q-td :props="props">
            <q-badge :color="props.value === 'PG' ? 'blue' : 'orange'" :label="props.value" />
          </q-td>
        </template>
        <template #body-cell-pertanyaan="props">
          <q-td :props="props">
            <div class="text-truncate" style="max-width: 400px" :title="props.value">
              <MathText :text="props.value" />
            </div>
          </q-td>
        </template>
        <template #body-cell-aksi="props">
          <q-td :props="props">
            <q-btn flat dense round icon="edit" color="primary" size="sm" @click="openDialog(props.row)" />
            <q-btn flat dense round icon="delete" color="negative" size="sm" @click="confirmDelete(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Dialog Tambah/Edit Soal -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 600px; max-width: 700px">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">{{ editMode ? 'Edit Soal' : 'Tambah Soal Baru' }}</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <!-- Tipe -->
          <q-select
            v-model="form.tipe"
            :options="[{ label: 'Pilihan Ganda (PG)', value: 'PG' }, { label: 'Essay', value: 'Essay' }]"
            label="Tipe Soal *"
            outlined
            emit-value
            map-options
          />

          <!-- Mata Pelajaran -->
          <q-input v-model="form.mata_pelajaran" label="Mata Pelajaran" outlined />

          <!-- Pertanyaan -->
          <q-input
            v-model="form.pertanyaan"
            label="Pertanyaan *"
            type="textarea"
            outlined
            :rows="3"
          />

          <!-- Gambar Soal -->
          <div>
            <div class="text-caption text-grey-7 q-mb-xs">Gambar Soal (opsional)</div>
            <div v-if="form.gambar_url" class="q-mb-sm">
              <img
                :src="`${guruStore.baseUrl}${form.gambar_url}`"
                style="max-height: 160px; max-width: 100%; border-radius: 8px; border: 1px solid var(--c-border)"
              />
            </div>
            <div class="row q-gutter-sm">
              <q-btn flat dense icon="image" label="Pilih Gambar" color="primary" @click="pilihGambar" />
              <q-btn
                v-if="form.gambar_url"
                flat dense icon="delete" label="Hapus Gambar"
                color="negative"
                @click="form.gambar_url = null"
              />
            </div>
          </div>

          <!-- Opsi PG -->
          <template v-if="form.tipe === 'PG'">
            <div class="text-subtitle2 q-mt-sm">Pilihan Jawaban</div>
            <q-input v-model="form.opsi_a" label="Opsi A *" outlined dense prefix="A. " />
            <q-input v-model="form.opsi_b" label="Opsi B *" outlined dense prefix="B. " />
            <q-input v-model="form.opsi_c" label="Opsi C *" outlined dense prefix="C. " />
            <q-input v-model="form.opsi_d" label="Opsi D *" outlined dense prefix="D. " />

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
            />
          </template>

          <!-- Panduan Essay -->
          <template v-if="form.tipe === 'Essay'">
            <q-input
              v-model="form.panduan_penilaian"
              label="Panduan Penilaian (opsional)"
              type="textarea"
              outlined
              :rows="3"
            />
          </template>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="Batal" @click="closeDialog" />
          <q-btn
            unelevated
            color="primary"
            :label="editMode ? 'Simpan Perubahan' : 'Tambah Soal'"
            :loading="saving"
            @click="saveSoal"
          />
        </q-card-actions>
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

const mapelOptions = computed(() => {
  const mapels = [...new Set(guruStore.soalList.map(s => s.mata_pelajaran).filter(Boolean))]
  return [{ label: 'Semua', value: null }, ...mapels.map(m => ({ label: m, value: m }))]
})

const filteredSoal = computed(() => {
  let list = guruStore.soalList
  if (filterMapel.value) list = list.filter(s => s.mata_pelajaran === filterMapel.value)
  if (filterTipe.value) list = list.filter(s => s.tipe === filterTipe.value)
  return list
})

function openDialog (soal = null) {
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
