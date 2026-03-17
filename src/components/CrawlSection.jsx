import { useState } from 'react'
import { crawlPage } from '../utils/crawler'

export default function CrawlSection({ pageText, onPageText, onError }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCrawl = async () => {
    if (!url.trim()) return
    let crawlUrl = url.trim()
    if (!/^https?:\/\//i.test(crawlUrl)) crawlUrl = 'https://' + crawlUrl

    setLoading(true)
    try {
      const text = await crawlPage(crawlUrl)
      onPageText(text)
    } catch (err) {
      onError(`Erreur de crawl : ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCrawl()
  }

  return (
    <div className="card p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
        Crawl de la page cible
      </h2>
      <div className="flex gap-2">
        <input
          type="url"
          className="input flex-1"
          placeholder="https://exemple.com/ma-page"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          onClick={handleCrawl}
          disabled={loading || !url.trim()}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Crawl en cours…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Analyser la page
            </>
          )}
        </button>
      </div>
      {pageText && (
        <p className="mt-2 text-xs text-green-600 font-medium">
          ✓ Page crawlée — {pageText.length.toLocaleString('fr-FR')} caractères extraits
        </p>
      )}
    </div>
  )
}
