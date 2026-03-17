import Papa from 'papaparse'

/**
 * Parse a CSV file and extract keyword + frequency columns.
 * Auto-detects column names (case-insensitive).
 */
export function parseKeywordCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(`Erreur de parsing : ${results.errors[0].message}`))
          return
        }

        const headers = results.meta.fields || []

        // Find keyword column
        const keywordCol = headers.find((h) =>
          /mot.?cl[eé]f?|keyword|kw|terme|query|requête/i.test(h)
        ) || headers[0]

        // Find frequency/volume column
        const freqCol = headers.find((h) =>
          /fr[eé]quence|volume|count|nombre|occurrences?|score/i.test(h)
        ) || headers[1]

        if (!keywordCol) {
          reject(new Error('Impossible de détecter la colonne mots-clés'))
          return
        }

        const keywords = results.data
          .map((row) => ({
            keyword: String(row[keywordCol] || '').trim(),
            frequency: Number(row[freqCol]) || 0,
          }))
          .filter((k) => k.keyword.length > 0)

        resolve(keywords)
      },
      error: (err) => reject(new Error(err.message)),
    })
  })
}
