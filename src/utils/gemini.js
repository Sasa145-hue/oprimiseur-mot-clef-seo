const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

async function callGemini(apiKey, systemPrompt, userPrompt, maxTokens = 2000) {
  const res = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Erreur API Gemini : ${res.status}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

function parseJSON(content) {
  // Extrait le JSON entre les backticks si présent
  let str = content
    .replace(/^[\s\S]*?```(?:json)?/m, '')  // supprime tout avant ```json
    .replace(/```[\s\S]*$/m, '')             // supprime tout après ```
    .trim()
  
  // Si pas de backticks, cherche le premier { jusqu'au dernier }
  if (!str.startsWith('{')) {
    const start = content.indexOf('{')
    const end = content.lastIndexOf('}')
    if (start !== -1 && end !== -1) {
      str = content.slice(start, end + 1)
    }
  }
  
  // Nettoyage
  str = str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/,\s*([\]}])/g, '$1')
    .trim()

  return JSON.parse(str)
}

export async function analyzeKeywords(apiKey, pageText, keywords1gram, keywords2gram, keywords3gram) {
  const formatList = (list, label) => {
    if (!list || list.length === 0) return ''
    const top = list.slice(0, 80)
    return `\n### ${label}\n` + top.map((k) => `- "${k.keyword}" (fréquence: ${k.frequency})`).join('\n')
  }

  const kwSection =
    formatList(keywords1gram, 'Mots-clés 1-gram') +
    formatList(keywords2gram, 'Mots-clés 2-gram') +
    formatList(keywords3gram, 'Mots-clés 3-gram')

  const systemPrompt = `Tu es un expert SEO on-page francophone. Tu analyses du contenu web et identifies les opportunités d'optimisation avec des mots-clés. Tu réponds UNIQUEMENT avec un JSON valide, sans markdown ni explication.`

  const userPrompt = `Voici le texte extrait de la page web à analyser :

<page_content>
${pageText.slice(0, 6000)}
</page_content>

Voici les mots-clés issus des analyses de fréquence :
${kwSection}

Ta tâche :
1. Identifie les mots-clés absents ou sous-représentés dans le texte de la page
2. Priorise les mots-clés selon leur pertinence sémantique et leur facilité d'intégration
3. Retourne UNIQUEMENT un JSON au format suivant :

{
  "keywords": [
    {
      "keyword": "mot-clé exact",
      "frequency": 123,
      "gram": "1-gram",
      "priority": "haute",
      "reason": "Courte explication (max 80 chars)"
    }
  ]
}

Retourne entre 10 et 30 mots-clés, triés par priorité décroissante. JSON pur uniquement.`

  const content = await callGemini(apiKey, systemPrompt, userPrompt, 2000)
  const parsed = parseJSON(content)
  if (!Array.isArray(parsed.keywords)) throw new Error('Format JSON inattendu')
  return parsed.keywords
}

export async function generateOptimizedText(apiKey, originalText, selectedKeywords) {
  const kwList = selectedKeywords.map((k) => `"${k.keyword}"`).join(', ')

  const systemPrompt = `Tu es un expert en rédaction web SEO francophone. Tu réécris du contenu en intégrant naturellement des mots-clés pour améliorer le référencement, sans dénaturer le sens original. Tu réponds UNIQUEMENT avec un JSON valide, sans markdown ni explication.`

  const userPrompt = `Voici le texte original de la page :

<original_text>
${originalText.slice(0, 6000)}
</original_text>

Mots-clés à intégrer naturellement dans le texte :
${kwList}

Instructions :
- Réécris le texte en intégrant ces mots-clés de façon naturelle et fluide
- Conserve le sens, le ton et la structure du texte original
- Pour chaque mot-clé effectivement intégré, entoure-le avec [[KEYWORD]] et [[/KEYWORD]]
- Retourne UNIQUEMENT un JSON au format :

{
  "optimized_text": "Le texte réécrit avec les marqueurs [[KEYWORD]]...[[/KEYWORD]]",
  "integrated_keywords": ["liste", "des", "mots-clés", "intégrés"]
}

JSON pur uniquement.`

  const content = await callGemini(apiKey, systemPrompt, userPrompt, 4000)
  const parsed = parseJSON(content)
  if (!parsed.optimized_text) throw new Error('Format JSON inattendu')
  return parsed
}
