const CORS_PROXY = 'https://api.codetabs.com/v1/proxy?quest='

/**
 * Fetch a URL via CORS proxy and extract visible text content,
 * ignoring nav, footer, header, scripts, styles, and other non-content elements.
 */
export async function crawlPage(url) {
  const encoded = encodeURIComponent(url)
  const res = await fetch(`${CORS_PROXY}${encoded}`)
  if (!res.ok) {
    throw new Error(`Erreur réseau : ${res.status} ${res.statusText}`)
  }
  
  let html
  const contentType = res.headers.get('content-type') || ''
  
  if (contentType.includes('application/json')) {
    const json = await res.json()
    html = json.contents || json.body || json.data
  } else {
    html = await res.text()
  }

  if (!html) throw new Error('Aucun contenu retourné par le proxy')

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  const remove = [
    'script', 'style', 'noscript', 'iframe',
    'nav', 'footer', 'header',
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
    '.nav', '.navbar', '.footer', '.header', '.menu', '.sidebar',
    '#nav', '#navbar', '#footer', '#header', '#menu', '#sidebar',
    'aside',
  ]
  remove.forEach((selector) => {
    try {
      doc.querySelectorAll(selector).forEach((el) => el.remove())
    } catch {}
  })

  const body = doc.body
  if (!body) throw new Error('Impossible de parser le HTML de la page')
  const text = extractText(body)
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/(\n\s*){3,}/g, '\n\n')
    .trim()
  if (cleaned.length < 50) {
    throw new Error('Contenu textuel insuffisant récupéré depuis la page')
  }
  return cleaned
}

function extractText(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const tag = node.tagName.toLowerCase()
  const blockTags = new Set([
    'p', 'div', 'section', 'article', 'main', 'h1', 'h2', 'h3',
    'h4', 'h5', 'h6', 'li', 'td', 'th', 'blockquote', 'figure',
    'figcaption', 'br',
  ])

  let text = ''
  for (const child of node.childNodes) {
    text += extractText(child)
  }

  if (blockTags.has(tag)) {
    return '\n' + text + '\n'
  }
  return text
}
