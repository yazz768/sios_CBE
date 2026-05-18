<template>
  <q-page padding>
    <div class="text-h5 text-primary q-mb-lg">Buat Ujian Baru</div>

    <div class="row q-gutter-lg">
      <!-- Kiri: Form Ujian -->
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">Detail Ujian</div>

            <div class="q-gutter-sm">
              <q-input v-model="form.judul" label="Judul Ujian *" outlined />
              <q-input v-model="form.mata_pelajaran" label="Mata Pelajaran *" outlined />
              <q-input
                v-model.number="form.durasi_menit"
                label="Durasi (menit) *"
                type="number"
                outlined
                min="5"
                max="180"
                suffix="menit"
              />
            </div>

            <q-separator class="q-my-md" />

            <!-- Opsi acak -->
            <q-toggle
              v-model="form.acak_soal"
              label="Acak urutan soal per siswa"
              color="primary"
              class="q-mb-sm"
            />

            <!-- Reorderable list soal terpilih -->
            <div class="text-caption text-grey-7 q-mb-xs">
              Urutan Soal Terpilih
              <span class="q-ml-xs">({{ pgCount }} PG + {{ essayCount }} Essay)</span>
            </div>
            <div v-if="!selectedSoal.length" class="text-caption text-grey-5 q-mb-sm">
              Belum ada soal dipilih dari tabel kanan
            </div>
            <q-list v-else dense bordered separator class="rounded-borders q-mb-sm" style="max-height: 280px; overflow-y: auto">
              <q-item v-for="(soal, idx) in selectedSoal" :key="soal.id" dense class="q-py-xs">
                <q-item-section side style="min-width: 24px">
                  <span class="text-caption text-grey-6">{{ idx + 1 }}</span>
                </q-item-section>
                <q-item-section>
                  <div class="row items-center no-wrap">
                    <q-badge
                      dense
                      :color="soal.tipe === 'PG' ? 'blue' : 'orange'"
                      :label="soal.tipe"
                      class="q-mr-xs"
                      style="flex-shrink:0"
                    />
                    <span class="text-caption text-truncate" style="max-width: 140px" :title="soal.pertanyaan">
                      {{ soal.pertanyaan }}
                    </span>
                  </div>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center">
                    <q-btn flat round dense icon="keyboard_arrow_up" size="xs" :disable="idx === 0" @click="moveUp(idx)" />
                    <q-btn flat round dense icon="keyboard_arrow_down" size="xs" :disable="idx === selectedSoal.length - 1" @click="moveDown(idx)" />
                    <q-btn flat round dense icon="close" size="xs" color="negative" @click="removeFromSelected(idx)" />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>

            <q-btn
              unelevated
              color="primary"
              icon="generate"
              label="Buat Ujian & Generate Token"
              class="full-width"
              :disable="!canSubmit"
              :loading="submitting"
              @click="buatUjian"
            />
          </q-card-section>
        </q-card>
      </div>

      <!-- Kanan: Pilih Soal -->
      <div class="col">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center q-gutter-sm q-mb-md">
              <div class="text-h6 col">Pilih Soal</div>
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
              />
              <q-input
                v-model="searchSoal"
                label="Cari soal..."
                dense
                outlined
                clearable
                style="max-width: 220px"
              >
                <template #prepend>
                  <q-icon name="search" />
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
            >
              <template #body-cell-tipe="props">
                <q-td :props="props">
                  <q-badge :color="props.value === 'PG' ? 'blue' : 'orange'" :label="props.value" />
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
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialog Hasil: Token Generated -->
    <q-dialog v-model="showTokenDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="bg-positive text-white">
          <div class="text-h6">
            <q-icon name="check_circle" class="q-mr-sm" />
            Ujian Berhasil Dibuat!
          </div>
        </q-card-section>

        <q-card-section class="q-pa-lg">
          <div class="text-center q-mb-lg">
            <div class="text-caption text-grey-7 q-mb-sm">TOKEN UJIAN</div>
            <div
              class="text-h2 text-primary text-weight-bold q-pa-md bg-blue-1 rounded-borders"
              style="letter-spacing: 0.3em; cursor: pointer"
              @click="copyToken"
            >
              {{ generatedToken }}
            </div>
            <q-btn
              flat
              icon="content_copy"
              label="Salin Token"
              color="primary"
              size="sm"
              class="q-mt-sm"
              @click="copyToken"
            />
          </div>

          <q-separator class="q-mb-md" />

          <div class="text-center">
            <div class="text-caption text-grey-7 q-mb-xs">Bagikan ke siswa:</div>
            <div class="text-body1">
              <strong>IP Server:</strong> {{ guruStore.serverInfo.ip }}
            </div>
            <div class="text-body1">
              <strong>Token:</strong> {{ generatedToken }}
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="center" class="q-pb-md">
          <q-btn
            unelevated
            color="primary"
            icon="monitor"
            label="Monitor Ujian"
            :to="`/monitor/${generatedToken}`"
            @click="showTokenDialog = false"
          />
          <q-btn flat label="Tutup" @click="resetForm" />
        </q-card-actions>
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
