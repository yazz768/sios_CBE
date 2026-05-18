import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGuruStore = defineStore('guru', () => {
  const serverInfo = ref({ ip: '127.0.0.1', port: 3000 })
  const soalList = ref([])
  const ujianList = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const baseUrl = computed(() => `http://127.0.0.1:${serverInfo.value.port}`)

  async function fetchServerInfo () {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const info = await window.electronAPI.getServerInfo()
      serverInfo.value = info
    }
  }

  async function fetchSoal () {
    isLoading.value = true
    error.value = null
    try {
      const res = await fetch(`${baseUrl.value}/guru/soal`)
      if (!res.ok) throw new Error(await res.text())
      soalList.value = await res.json()
    } catch (err) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  async function createSoal (payload) {
    const res = await fetch(`${baseUrl.value}/guru/soal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Gagal menyimpan soal')
    }
    return res.json()
  }

  async function updateSoal (id, payload) {
    const res = await fetch(`${baseUrl.value}/guru/soal/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Gagal mengupdate soal')
    }
    return res.json()
  }

  async function deleteSoal (id) {
    const res = await fetch(`${baseUrl.value}/guru/soal/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Gagal menghapus soal')
    return res.json()
  }

  async function fetchUjian () {
    isLoading.value = true
    error.value = null
    try {
      const res = await fetch(`${baseUrl.value}/guru/ujian`)
      if (!res.ok) throw new Error(await res.text())
      ujianList.value = await res.json()
    } catch (err) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  async function createUjian (payload) {
    const res = await fetch(`${baseUrl.value}/guru/ujian`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Gagal membuat ujian')
    }
    return res.json()
  }

  async function fetchMonitor (token) {
    const res = await fetch(`${baseUrl.value}/guru/monitor/${token}`)
    if (!res.ok) throw new Error('Gagal memuat data monitor')
    return res.json()
  }

  async function fetchHasil (token) {
    const res = await fetch(`${baseUrl.value}/guru/hasil/${token}`)
    if (!res.ok) throw new Error('Gagal memuat hasil ujian')
    return res.json()
  }

  async function fetchDetailPeserta (token, pesertaId) {
    const res = await fetch(`${baseUrl.value}/guru/hasil/${token}/peserta/${pesertaId}`)
    if (!res.ok) throw new Error('Gagal memuat detail jawaban')
    return res.json()
  }

  async function updateUjianStatus (id, status) {
    const res = await fetch(`${baseUrl.value}/guru/ujian/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Gagal mengubah status ujian')
    }
    return res.json()
  }

  async function simpanNilaiEssay (jawabanId, nilai) {
    const res = await fetch(`${baseUrl.value}/guru/nilai-essay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jawaban_id: jawabanId, nilai })
    })
    if (!res.ok) throw new Error('Gagal menyimpan nilai')
    return res.json()
  }

  // Computed stats
  const totalSoal = computed(() => soalList.value.length)
  const totalUjian = computed(() => ujianList.value.length)
  const ujianAktif = computed(() => ujianList.value.filter(u => u.status === 'aktif').length)

  return {
    serverInfo, soalList, ujianList, isLoading, error,
    baseUrl, totalSoal, totalUjian, ujianAktif,
    fetchServerInfo, fetchSoal, createSoal, updateSoal, deleteSoal,
    fetchUjian, createUjian, updateUjianStatus, fetchMonitor, fetchHasil,
    fetchDetailPeserta, simpanNilaiEssay
  }
})
