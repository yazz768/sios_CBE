import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Dark } from 'quasar'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  function toggle () {
    isDark.value = !isDark.value
    apply()
  }

  function apply () {
    Dark.set(isDark.value)
    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
    localStorage.setItem('cbe-theme', isDark.value ? 'dark' : 'light')
  }

  function init () {
    const saved = localStorage.getItem('cbe-theme')
    isDark.value = saved === 'dark'
    apply()
  }

  return { isDark, toggle, init }
})
