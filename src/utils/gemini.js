const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

async function callGemini(apiKey, systemPrompt, userPrompt, maxTokens = 4000) {
  const res = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { 
        maxOutputTokens: maxTokens, 
        temperature: 0.3,
        response_mime_type: 'application/json'
      },
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Erreur API Gemini : ${res.status}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function analyzeKeywords(apiKey, pageText, keywords1gram, keywords2gram, keywords3gram) {
  const formatList = (list, label) => {
    if (!list || list.length === 0) return ''
    const top = list.slice(0, 50)
    return `\n### ${label}\n` + top.map((k) => `- "${k.keyword}" (frequence: ${k.frequency})`).join('\n')
  }
  const kwSection =
    formatList(keywords1gram, 'Mots-cles 1-gram') +
    formatList(keywords2gram, 'Mots-cles 2-gram') +
    formatList(keywords3gram, 'Mots-cles 3-gram')

  const systemPrompt = `Tu es un expert SEO. Reponds UNIQUEMENT avec du JSON valide.`

  const userPrompt = `Texte de la page :
${pageText.slice(0, 4000)}

Mots-cles disponibles :
${kwSection}

Retourne un JSON avec cette structure exacte (entre 10 et 20 items) :
{"keywords":[{"keyword":"exemple","frequency":10,"gram":"1-gram","priority":"haute","reason":"explication courte"}]}`

  const content = await callGemini(apiKey, systemPrompt, userPrompt, 4000)
  const parsed = JSON.parse(content)
  if (!Array.isArray(parsed.keywords)) throw new Error('Format JSON inattendu')
  return parsed.keywords
}

export async function generateOptimizedText(apiKey, originalText, selectedKeywords) {
  const kwList = selectedKeywords.map((k) => k.keyword).join(', ')

  const systemPrompt = `Tu es un expert SEO. Reponds UNIQUEMENT avec du JSON valide.`

  const userPrompt = `Texte original :
${originalText.slice(0, 4000)}

Mots-cles a integrer : ${kwList}

Retourne un JSON avec cette structure exacte :
{"optimized_text":"texte reecrit avec [[KEYWORD]]mot-cle[[/KEYWORD]] pour chaque mot integre","integrated_keywords":["mot1","mot2"]}`

  const content = await callGemini(apiKey, systemPrompt, userPrompt, 4000)
  const parsed = JSON.parse(content)
  if (!parsed.optimized_text) throw new Error('Format JSON inattendu')
  return parsed
}
