import katex from 'katex'

export function renderMath (text) {
  if (!text) return ''
  let result = String(text)

  // Display math: $$...$$
  result = result.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })
    } catch {
      return `$$${math}$$`
    }
  })

  // Inline math: $...$
  result = result.replace(/\$([^$\n]+)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })
    } catch {
      return `$${math}$`
    }
  })

  // Jaga line break
  return result.replace(/\n/g, '<br>')
}
