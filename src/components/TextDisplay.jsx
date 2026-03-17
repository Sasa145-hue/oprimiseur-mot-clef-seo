/**
 * Renders text with [[KEYWORD]]...[[/KEYWORD]] markers highlighted in yellow.
 */
function HighlightedText({ text }) {
  const parts = text.split(/(\[\[KEYWORD\]\][\s\S]*?\[\[\/KEYWORD\]\])/g)
  return (
    <span>
      {parts.map((part, i) => {
        const match = part.match(/^\[\[KEYWORD\]\]([\s\S]*?)\[\[\/KEYWORD\]\]$/)
        if (match) {
          return (
            <mark key={i} className="bg-yellow-300 text-yellow-900 px-0.5 rounded">
              {match[1]}
            </mark>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

export default function TextDisplay({ originalText, optimizedText, integratedKeywords, onCopy, copySuccess }) {
  const hasOptimized = !!optimizedText

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-sm">
          {hasOptimized ? 'Texte optimisé' : 'Texte original de la page'}
        </h3>
        <div className="flex items-center gap-2">
          {hasOptimized && integratedKeywords?.length > 0 && (
            <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded font-medium">
              {integratedKeywords.length} mot{integratedKeywords.length > 1 ? 's-clés intégrés' : '-clé intégré'}
            </span>
          )}
          {(originalText || optimizedText) && (
            <button
              onClick={onCopy}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              {copySuccess ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copié !
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copier
                </>
              )}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg border border-gray-200 p-4">
        {hasOptimized ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            <HighlightedText text={optimizedText} />
          </p>
        ) : originalText ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{originalText}</p>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Le texte crawlé apparaîtra ici</p>
          </div>
        )}
      </div>
    </div>
  )
}
