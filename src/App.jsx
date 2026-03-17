import { useState, useCallback } from 'react'
import CsvUploader from './components/CsvUploader'
import CrawlSection from './components/CrawlSection'
import ApiKeyInput from './components/ApiKeyInput'
import KeywordList from './components/KeywordList'
import TextDisplay from './components/TextDisplay'
import { parseKeywordCSV } from './utils/csvParser'
import { analyzeKeywords, generateOptimizedText } from './utils/anthropic'

export default function App() {
  // Configuration state
  const [apiKey, setApiKey] = useState('')
  const [csvData, setCsvData] = useState({ '1gram': [], '2gram': [], '3gram': [] })
  const [pageText, setPageText] = useState('')

  // Analysis state
  const [suggestedKeywords, setSuggestedKeywords] = useState([])
  const [selectedKeywords, setSelectedKeywords] = useState(new Set())
  const [analyzing, setAnalyzing] = useState(false)

  // Optimization state
  const [optimizedText, setOptimizedText] = useState('')
  const [integratedKeywords, setIntegratedKeywords] = useState([])
  const [generating, setGenerating] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  // Error/status
  const [error, setError] = useState('')

  const handleCsvLoad = useCallback(async (type, file) => {
    const keywords = await parseKeywordCSV(file)
    setCsvData((prev) => ({ ...prev, [type]: keywords }))
    // Reset downstream state
    setSuggestedKeywords([])
    setSelectedKeywords(new Set())
    setOptimizedText('')
    setIntegratedKeywords([])
  }, [])

  const handlePageText = useCallback((text) => {
    setPageText(text)
    setSuggestedKeywords([])
    setSelectedKeywords(new Set())
    setOptimizedText('')
    setIntegratedKeywords([])
    setError('')
  }, [])

  const handleAnalyze = async () => {
    const totalKw = Object.values(csvData).reduce((acc, d) => acc + d.length, 0)
    if (!apiKey.trim()) { setError('Veuillez saisir votre clé API Anthropic.'); return }
    if (!pageText) { setError('Veuillez d\'abord crawler une page.'); return }
    if (totalKw === 0) { setError('Veuillez importer au moins un fichier CSV.'); return }

    setError('')
    setAnalyzing(true)
    setOptimizedText('')
    setIntegratedKeywords([])

    try {
      const keywords = await analyzeKeywords(
        apiKey,
        pageText,
        csvData['1gram'],
        csvData['2gram'],
        csvData['3gram']
      )
      setSuggestedKeywords(keywords)
      // Pre-select high priority keywords
      const highPriority = new Set(
        keywords.filter((k) => k.priority === 'haute').map((k) => k.keyword)
      )
      setSelectedKeywords(highPriority)
    } catch (err) {
      setError(`Erreur d'analyse IA : ${err.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleGenerate = async () => {
    if (!apiKey.trim()) { setError('Clé API manquante.'); return }
    if (selectedKeywords.size === 0) { setError('Sélectionnez au moins un mot-clé.'); return }

    setError('')
    setGenerating(true)

    try {
      const selected = suggestedKeywords.filter((k) => selectedKeywords.has(k.keyword))
      const result = await generateOptimizedText(apiKey, pageText, selected)
      setOptimizedText(result.optimized_text)
      setIntegratedKeywords(result.integrated_keywords || [])
    } catch (err) {
      setError(`Erreur de génération : ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    const text = optimizedText
      ? optimizedText.replace(/\[\[KEYWORD\]\]|\[\[\/KEYWORD\]\]/g, '')
      : pageText
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    })
  }

  const toggleKeyword = (kw) => {
    setSelectedKeywords((prev) => {
      const next = new Set(prev)
      next.has(kw) ? next.delete(kw) : next.add(kw)
      return next
    })
  }

  const selectAll = () => setSelectedKeywords(new Set(suggestedKeywords.map((k) => k.keyword)))
  const deselectAll = () => setSelectedKeywords(new Set())

  const canAnalyze = apiKey.trim() && pageText &&
    Object.values(csvData).some((d) => d.length > 0)

  const canGenerate = suggestedKeywords.length > 0 && selectedKeywords.size > 0 && !generating

  const showTwoColumns = suggestedKeywords.length > 0 || pageText

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Optimiseur SEO On-Page</h1>
            <p className="text-xs text-gray-500 mt-0.5">Analyse et optimisation de contenu par IA</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
              Powered by Claude
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        {/* Top configuration row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <CsvUploader csvData={csvData} onFileLoad={handleCsvLoad} onError={setError} />
          </div>
          <div>
            <ApiKeyInput apiKey={apiKey} onChange={setApiKey} />
          </div>
        </div>

        <CrawlSection pageText={pageText} onPageText={handlePageText} onError={setError} />

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Analyze button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze || analyzing}
            className="btn-primary flex items-center gap-2"
          >
            {analyzing ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Analyse en cours…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Analyser les mots-clés avec l'IA
              </>
            )}
          </button>
          {!canAnalyze && !analyzing && (
            <p className="text-xs text-gray-400">
              {!apiKey.trim() ? 'Clé API requise · ' : ''}
              {!pageText ? 'Crawl requis · ' : ''}
              {!Object.values(csvData).some((d) => d.length > 0) ? 'CSV requis' : ''}
            </p>
          )}
        </div>

        {/* Two-column layout */}
        {showTwoColumns && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left column: keyword list */}
            <div className="card p-5 flex flex-col" style={{ minHeight: '500px' }}>
              {suggestedKeywords.length > 0 ? (
                <>
                  <KeywordList
                    keywords={suggestedKeywords}
                    selected={selectedKeywords}
                    onToggle={toggleKeyword}
                    onSelectAll={selectAll}
                    onDeselectAll={deselectAll}
                  />
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleGenerate}
                      disabled={!canGenerate}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {generating ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Génération en cours…
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Générer le texte optimisé
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <p className="text-sm">Les mots-clés suggérés apparaîtront ici</p>
                  <p className="text-xs mt-1">après l'analyse IA</p>
                </div>
              )}
            </div>

            {/* Right column: text display */}
            <div className="card p-5 flex flex-col" style={{ minHeight: '500px' }}>
              <TextDisplay
                originalText={pageText}
                optimizedText={optimizedText}
                integratedKeywords={integratedKeywords}
                onCopy={handleCopy}
                copySuccess={copySuccess}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 mt-12 py-4">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-gray-400">
          Optimiseur SEO On-Page · Données traitées localement · Appels API directs vers Anthropic
        </div>
      </footer>
    </div>
  )
}
