import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSettingsStore } from './settings.js'

export const useExamStore = defineStore('exam', () => {
  // Koneksi
  const guruIP = ref('')
  const tokenInput = ref('')
  const namaSiswa = ref('')
  const pesertaId = ref(null)

  // Data ujian
  const ujianInfo = ref(null)
  const soalList = ref([])

  // Jawaban: { [soal_id]: jawaban_teks }
  const jawaban = ref({})

  // Timer
  const timeRemaining = ref(0) // detik
  const timerHandle = ref(null)

  // Auto-save
  const autoSaveHandle = ref(null)
  const lastAutoSaved = ref(null)
  const isAutoSaving = ref(false)

  // State ujian
  const currentIndex = ref(0)
  const isSubmitted = ref(false)

  // ─── Computed ────────────────────────────────────────────────

  const baseUrl = computed(() => guruIP.value ? `http://${guruIP.value}:3000` : '')

  const currentSoal = computed(() => soalList.value[currentIndex.value] || null)

  const answeredCount = computed(() => Object.keys(jawaban.value).length)

  const timerDisplay = computed(() => {
    const m = Math.floor(timeRemaining.value / 60)
    const s = timeRemaining.value % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })

  const timerIsRed = computed(() => timeRemaining.value > 0 && timeRemaining.value <= 300) // < 5 menit

  const progress = computed(() =>
    soalList.value.length ? Math.round((answeredCount.value / soalList.value.length) * 100) : 0
  )

  // ─── Actions ─────────────────────────────────────────────────

  async function verifyToken () {
    if (!guruIP.value || !tokenInput.value) throw new Error('IP guru dan token harus diisi')
    const res = await fetch(`${baseUrl.value}/verify/${tokenInput.value}`)
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Verifikasi gagal')
    }
    ujianInfo.value = await res.json()
    return ujianInfo.value
  }

  async function joinExam () {
    if (!namaSiswa.value) throw new Error('Nama siswa harus diisi')
    const res = await fetch(`${baseUrl.value}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: namaSiswa.value, token: tokenInput.value })
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Gagal bergabung')
    }
    const data = await res.json()
    pesertaId.value = data.peserta_id
    return data
  }

  async function loadSoal () {
    const url = pesertaId.value
      ? `${baseUrl.value}/soal/${tokenInput.value}?peserta_id=${pesertaId.value}`
      : `${baseUrl.value}/soal/${tokenInput.value}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Gagal memuat soal')
    soalList.value = await res.json()
  }

  function startTimer () {
    if (!ujianInfo.value) return
    timeRemaining.value = (ujianInfo.value.durasi_menit || 60) * 60

    timerHandle.value = setInterval(() => {
      if (timeRemaining.value <= 0) {
        clearInterval(timerHandle.value)
        submitExam()
      } else {
        timeRemaining.value--
      }
    }, 1000)
  }

  function stopTimer () {
    if (timerHandle.value) {
      clearInterval(timerHandle.value)
      timerHandle.value = null
    }
  }

  async function autoSave () {
    if (isSubmitted.value || !pesertaId.value) return
    const entries = Object.entries(jawaban.value).filter(([, v]) => v !== '')
    if (entries.length === 0) return

    isAutoSaving.value = true
    try {
      const jawabanArray = entries.map(([soalId, jawaban_teks]) => ({
        soal_id: Number(soalId),
        jawaban_teks
      }))
      const res = await fetch(`${baseUrl.value}/auto-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peserta_id: pesertaId.value, jawaban: jawabanArray })
      })
      if (res.ok) lastAutoSaved.value = new Date()
    } catch (_) {
      // Gagal auto-save — silent, akan dicoba lagi di interval berikutnya
    } finally {
      isAutoSaving.value = false
    }
  }

  function startAutoSave () {
    stopAutoSave()
    const settingsStore = useSettingsStore()
    const intervalMs = (settingsStore.autoSaveInterval || 60) * 1000
    autoSaveHandle.value = setInterval(autoSave, intervalMs)
  }

  function stopAutoSave () {
    if (autoSaveHandle.value) {
      clearInterval(autoSaveHandle.value)
      autoSaveHandle.value = null
    }
  }

  function setJawaban (soalId, teks) {
    jawaban.value = { ...jawaban.value, [soalId]: teks }
  }

  function isAnswered (soalId) {
    return jawaban.value[soalId] !== undefined && jawaban.value[soalId] !== ''
  }

  async function submitExam () {
    if (isSubmitted.value) return true
    stopTimer()
    isSubmitted.value = true

    const jawabanArray = soalList.value.map(s => ({
      soal_id: s.id,
      jawaban_teks: jawaban.value[s.id] || ''
    }))

    try {
      const res = await fetch(`${baseUrl.value}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peserta_id: pesertaId.value, jawaban: jawabanArray })
      })
      // endExam() dihandle oleh ExamPage setelah router.push — urutan: submit → navigate → endExam
      return res.ok
    } catch (err) {
      throw err
    }
  }

  function $reset () {
    stopTimer()
    stopAutoSave()
    guruIP.value = ''
    tokenInput.value = ''
    namaSiswa.value = ''
    pesertaId.value = null
    ujianInfo.value = null
    soalList.value = []
    jawaban.value = {}
    timeRemaining.value = 0
    currentIndex.value = 0
    isSubmitted.value = false
    lastAutoSaved.value = null
    isAutoSaving.value = false
  }

  return {
    guruIP, tokenInput, namaSiswa, pesertaId,
    ujianInfo, soalList, jawaban,
    timeRemaining, currentIndex, isSubmitted,
    lastAutoSaved, isAutoSaving,
    baseUrl, currentSoal, answeredCount, timerDisplay, timerIsRed, progress,
    verifyToken, joinExam, loadSoal, startTimer, stopTimer,
    autoSave, startAutoSave, stopAutoSave,
    setJawaban, isAnswered, submitExam, $reset
  }
})
