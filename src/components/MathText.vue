<template>
  <span v-html="rendered" class="math-text" />
</template>

<script setup>
import { computed } from 'vue'
import { renderMath } from 'src/utils/math.js'
import 'katex/dist/katex.min.css'

const props = defineProps({
  text: { type: String, default: '' }
})

const rendered = computed(() => renderMath(props.text))
</script>

<style scoped>
.math-text {
  line-height: 1.7;
  white-space: pre-wrap;
}
/* Override katex display block agar tidak overflow */
:deep(.katex-display) {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 0;
}
</style>
