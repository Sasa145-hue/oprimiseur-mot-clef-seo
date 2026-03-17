const PRIORITY_STYLES = {
  haute: 'bg-red-100 text-red-700',
  moyenne: 'bg-yellow-100 text-yellow-700',
  faible: 'bg-gray-100 text-gray-600',
}

export default function KeywordList({ keywords, selected, onToggle, onSelectAll, onDeselectAll }) {
  if (!keywords || keywords.length === 0) return null

  const allSelected = keywords.every((k) => selected.has(k.keyword))

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-sm">
          Mots-clés suggérés ({keywords.length})
        </h3>
        <div className="flex gap-2">
          <button onClick={onSelectAll} className="text-xs text-blue-600 hover:underline">
            Tout cocher
          </button>
          <span className="text-gray-300">|</span>
          <button onClick={onDeselectAll} className="text-xs text-gray-500 hover:underline">
            Tout décocher
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {keywords.map((kw) => {
          const isChecked = selected.has(kw.keyword)
          return (
            <label
              key={kw.keyword}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                ${isChecked ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggle(kw.keyword)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 text-sm">{kw.keyword}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_STYLES[kw.priority] || PRIORITY_STYLES.faible}`}>
                    {kw.priority}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    {kw.gram}
                  </span>
                </div>
                {kw.frequency > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">Fréquence : {kw.frequency.toLocaleString('fr-FR')}</p>
                )}
                {kw.reason && (
                  <p className="text-xs text-gray-400 mt-0.5 italic">{kw.reason}</p>
                )}
              </div>
            </label>
          )
        })}
      </div>
      {selected.size > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-blue-700 font-medium">
            {selected.size} mot{selected.size > 1 ? 's-clés sélectionnés' : '-clé sélectionné'}
          </p>
        </div>
      )}
    </div>
  )
}
