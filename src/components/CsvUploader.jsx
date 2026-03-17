import { useRef } from 'react'

const GRAM_LABELS = {
  '1gram': '1-gram',
  '2gram': '2-gram',
  '3gram': '3-gram',
}

export default function CsvUploader({ csvData, onFileLoad, onError }) {
  const refs = {
    '1gram': useRef(null),
    '2gram': useRef(null),
    '3gram': useRef(null),
  }

  const handleChange = async (type, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await onFileLoad(type, file)
    } catch (err) {
      onError(`Erreur ${GRAM_LABELS[type]} : ${err.message}`)
      e.target.value = ''
    }
  }

  return (
    <div className="card p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
        Import des mots-clés (CSV)
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(GRAM_LABELS).map(([type, label]) => {
          const data = csvData[type]
          const loaded = data && data.length > 0
          return (
            <div key={type} className="flex flex-col gap-1">
              <label className="label">{label}</label>
              <div
                onClick={() => refs[type].current?.click()}
                className={`relative flex flex-col items-center justify-center gap-1 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-center
                  ${loaded
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
              >
                <input
                  ref={refs[type]}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => handleChange(type, e)}
                />
                {loaded ? (
                  <>
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs text-green-700 font-medium">{data.length} mots-clés</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-xs text-gray-500">Charger CSV</span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {Object.values(csvData).some((d) => d && d.length > 0) && (
        <p className="mt-3 text-xs text-gray-500">
          Total : {Object.values(csvData).reduce((acc, d) => acc + (d?.length || 0), 0)} mots-clés chargés
        </p>
      )}
    </div>
  )
}
