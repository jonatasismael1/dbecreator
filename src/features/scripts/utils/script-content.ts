const ALLOWED_TAGS = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'OL', 'UL', 'LI', 'A'])

export function stripHtml(value: string | null | undefined): string {
  if (!value) return ''
  if (!/<[a-z][\s\S]*>/i.test(value)) return value

  if (typeof document === 'undefined') {
    return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  const element = document.createElement('div')
  element.innerHTML = value
  return element.textContent || ''
}

export function sanitizeScriptHtml(value: string | null | undefined): string {
  if (!value) return ''
  if (!/<[a-z][\s\S]*>/i.test(value)) {
    return escapeHtml(value).replace(/\n/g, '<br>')
  }

  if (typeof document === 'undefined') return ''

  const template = document.createElement('template')
  template.innerHTML = value
  sanitizeNode(template.content)
  return template.innerHTML
}

function sanitizeNode(node: Node) {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as HTMLElement
      if (!ALLOWED_TAGS.has(element.tagName)) {
        sanitizeNode(element)
        element.replaceWith(...Array.from(element.childNodes))
        return
      }

      Array.from(element.attributes).forEach((attribute) => {
        if (element.tagName === 'A' && attribute.name === 'href') {
          const href = attribute.value.trim()
          if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) return
        }
        element.removeAttribute(attribute.name)
      })

      if (element.tagName === 'A') {
        element.setAttribute('target', '_blank')
        element.setAttribute('rel', 'noreferrer')
      }
    }

    sanitizeNode(child)
  })
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
