import React, { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import debounce from 'lodash.debounce'
import TradeTable from './components/TradeTable'
import Filters from './components/Filters'
import ChartView from './components/ChartView'
import ErrorBoundary from './components/ErrorBoundary'

type OptionItem = {
  contractSymbol: string
  strike: number
  type: 'call' | 'put'
  expiration: string
  dte: number
  lastPrice: number | null
  bid: number | null
  ask: number | null
  mid: number | null
  impliedVol: number | null
  volume: number | null
  openInterest: number | null
  greeks: { delta: number | null; gamma: number | null; theta: number | null; vega: number | null }
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ minDelta: 0.3, maxDelta: 0.7, ivMinPct: 0, ivMaxPct: 100, expiration: 'all' })

  useEffect(() => {
    let mounted = true
    setLoading(true)
    axios.get('/.netlify/functions/fetchData')
      .then((r) => { if (!mounted) return; setData(r.data); setLoading(false) })
      .catch((e) => {
        axios.get('/sample.json').then(r => { if (!mounted) return; setData(r.data); setLoading(false) }).catch(() => { if (!mounted) return; setError(String(e)); setLoading(false) })
      })
    return () => { mounted = false }
  }, [])

  const onQuery = useMemo(() => debounce((q: string) => setQuery(q), 300), [])

  if (loading) return <div className="state">Loading data…</div>
  if (error) return <div className="state error">Error: {error}</div>
  if (!data) return <div className="state">No data</div>

  const options: OptionItem[] = data.optionsSample || []
  const expirations = data.expirations || []

  return (
    <ErrorBoundary>
      <div className="app">
        <header>
          <h1>SPY Options Analyzer</h1>
          <div className="meta">Source: {data.source} • Options: {data.optionsCount}</div>
        </header>

        <section className="controls">
          <Filters expirations={expirations} onChange={setFilters} onSearch={onQuery} />
        </section>

        <section className="layout">
          <div className="left">
            <ChartView series={data.series} indicators={data.indicators} />
          </div>
          <div className="right">
            <TradeTable options={options} filters={filters} query={query} series={data.series} />
          </div>
        </section>
      </div>
    </ErrorBoundary>
  )
}
