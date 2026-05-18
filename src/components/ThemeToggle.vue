<template>
  <button
    class="theme-toggle"
    :title="themeStore.isDark ? 'Switch to Light mode' : 'Switch to Dark mode'"
    @click="themeStore.toggle()"
  >
    {{ themeStore.isDark ? '☀️' : '🌙' }}
  </button>
</template>

<script setup>
import { useThemeStore } from 'stores/theme'
const themeStore = useThemeStore()
</script>
