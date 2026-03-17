const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

function makeHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-calls': 'true',
  }
}

/**
 * Analyse keywords against page content.
 * Returns a structured list of missing/underrepresented keywords.
 */
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

  const systemPrompt = `Tu es un expert SEO on-page francophone. Tu analyses du contenu web et identifies les opportunités d'optimisation avec des mots-clés.
Tu réponds UNIQUEMENT avec un JSON valide, sans markdown ni explication.`

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
      "gram": "1-gram" | "2-gram" | "3-gram",
      "priority": "haute" | "moyenne" | "faible",
      "reason": "Courte explication (max 80 chars)"
    }
  ]
}

Retourne entre 10 et 30 mots-clés, triés par priorité décroissante. JSON pur uniquement.`

  const body = {
    model: MODEL,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: makeHeaders(apiKey),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Erreur API Anthropic : ${res.status}`)
  }

  const data = await res.json()
  const content = data.content?.[0]?.text || ''

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Réponse IA invalide : JSON introuvable')

  const parsed = JSON.parse(jsonMatch[0])
  if (!Array.isArray(parsed.keywords)) throw new Error('Format JSON inattendu')

  return parsed.keywords
}

/**
 * Generate optimized text incorporating selected keywords.
 * Returns the rewritten text with keywords marked for highlighting.
 */
export async function generateOptimizedText(apiKey, originalText, selectedKeywords) {
  const kwList = selectedKeywords.map((k) => `"${k.keyword}"`).join(', ')

  const systemPrompt = `Tu es un expert en rédaction web SEO francophone. Tu réécris du contenu en intégrant naturellement des mots-clés pour améliorer le référencement, sans dénaturer le sens original.
Tu réponds UNIQUEMENT avec un JSON valide, sans markdown ni explication.`

  const userPrompt = `Voici le texte original de la page :

<original_text>
${originalText.slice(0, 6000)}
</original_text>

Mots-clés à intégrer naturellement dans le texte :
${kwList}

Instructions :
- Réécris le texte en intégrant ces mots-clés de façon naturelle et fluide
- Conserve le sens, le ton et la structure du texte original
- Ne force pas l'intégration si cela nuit à la lisibilité
- Pour chaque mot-clé effectivement intégré, entoure-le avec le marqueur [[KEYWORD]] et [[/KEYWORD]]
  Exemple : "Notre [[KEYWORD]]service de référencement[[/KEYWORD]] est..."
- Retourne UNIQUEMENT un JSON au format :

{
  "optimized_text": "Le texte réécrit avec les marqueurs [[KEYWORD]]...[[/KEYWORD]]",
  "integrated_keywords": ["liste", "des", "mots-clés", "intégrés"]
}

JSON pur uniquement.`

  const body = {
    model: MODEL,
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: makeHeaders(apiKey),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Erreur API Anthropic : ${res.status}`)
  }

  const data = await res.json()
  const content = data.content?.[0]?.text || ''

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Réponse IA invalide : JSON introuvable')

  const parsed = JSON.parse(jsonMatch[0])
  if (!parsed.optimized_text) throw new Error('Format JSON inattendu')

  return parsed
}
