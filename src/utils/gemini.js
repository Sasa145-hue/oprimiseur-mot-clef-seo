const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

async function callGemini(apiKey, systemPrompt, userPrompt, maxTokens = 10000) {
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
    const top = list.slice(0, 100)
    return `\n### ${label}\n` + top.map((k) => `- "${k.keyword}" (frequence: ${k.frequency})`).join('\n')
  }
  const kwSection =
    formatList(keywords1gram, 'Mots-cles 1-gram') +
    formatList(keywords2gram, 'Mots-cles 2-gram') +
    formatList(keywords3gram, 'Mots-cles 3-gram')

  const systemPrompt = `Tu es un expert SEO. Reponds UNIQUEMENT avec du JSON valide.`

  const userPrompt = `Texte de la page :
${pageText.slice(0, 10000)}

Mots-cles disponibles :
${kwSection}

IMPORTANT : Identifie les mots-clés de la liste qui sont ABSENTS ou SOUS-REPRÉSENTÉS dans le texte (présents moins de 2 fois). Privilégie les 2-gram et 3-gram. Ne suggère PAS les mots-clés déjà très présents dans le texte.

Retourne un JSON avec cette structure exacte (entre 10 et 20 items) :
{"keywords":[{"keyword":"exemple","frequency":10,"gram":"1-gram","priority":"haute","reason":"explication courte"}]}`

  const content = await callGemini(apiKey, systemPrompt, userPrompt, 10000)
  const parsed = JSON.parse(content)
  if (!Array.isArray(parsed.keywords)) throw new Error('Format JSON inattendu')
  return parsed.keywords
}

export async function generateOptimizedText(apiKey, originalText, selectedKeywords) {
  const kwList = selectedKeywords.map((k) => k.keyword).join(', ')

  const systemPrompt = `Tu es un expert SEO. Tu vas réécrire un texte en intégrant des mots-clés.`

  const userPrompt = `Texte original :
${originalText.slice(0, 10000)}

Mots-clés à intégrer : ${kwList}

Réécris ce texte en intégrant TOUS ces mots-clés naturellement dans le contenu. Certains peuvent déjà être présents — renforce-les si nécessaire, ajoute les autres de façon fluide.
Entoure chaque mot-clé intégré avec [[KEYWORD]] et [[/KEYWORD]].
Réponds UNIQUEMENT avec le texte réécrit, sans JSON, sans explication, sans balises.`

  // Appel sans JSON forcé pour le texte libre
  const res = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { maxOutputTokens: 16000, temperature: 0.3 },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Erreur API Gemini : ${res.status}`)
  }

  const data = await res.json()
  const optimized_text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  
  if (!optimized_text) throw new Error('Réponse vide de Gemini')

  // Extrait les mots-clés intégrés depuis les balises
  const integrated_keywords = []
  const regex = /\[\[KEYWORD\]\](.*?)\[\[\/KEYWORD\]\]/g
  let match
  while ((match = regex.exec(optimized_text)) !== null) {
    integrated_keywords.push(match[1])
  }

  return { optimized_text, integrated_keywords }
}
