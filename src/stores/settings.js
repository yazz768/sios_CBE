import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // Auto-save interval ujian dalam detik — disimpan di localStorage
  const autoSaveInterval = ref(60)

  // Cache nama sekolah — diambil dari server saat dibutuhkan
  const namaSekolah = ref('Sios CBE')

  function initSettings () {
    const saved = localStorage.getItem('cbe-autosave-interval')
    if (saved) autoSaveInterval.value = parseInt(saved) || 60
  }

  function setAutoSaveInterval (detik) {
    autoSaveInterval.value = detik
    localStorage.setItem('cbe-autosave-interval', String(detik))
  }

  return {
    autoSaveInterval, namaSekolah,
    initSettings, setAutoSaveInterval
  }
})
