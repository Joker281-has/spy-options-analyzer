import React, { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import debounce from 'lodash.debounce'
import { Toaster } from 'react-hot-toast'
import TradeTable from './components/TradeTable'
import Filters from './components/Filters'
import ChartView from './components/ChartView'
import ErrorBoundary from './components/ErrorBoundary'
import { TradeSignals } from './components/TradeSignals'
import { AlertConfigPanel } from './components/AlertConfig'
import { PortfolioTracker } from './components/PortfolioTracker'
import { DataImporter } from './components/DataImporter'
import { OptionContract } from './types'

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

type ActiveTab = 'dashboard' | 'signals' | 'alerts' | 'portfolio' | 'import'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ minDelta: 0.3, maxDelta: 0.7, ivMinPct: 0, ivMaxPct: 100, expiration: 'all' })
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')

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

  const contracts: OptionContract[] = useMemo(() => {
    if (!data?.optionsSample) return []
    const spot = data.series?.[data.series.length - 1]?.close || 440
    return data.optionsSample.map((opt: any) => ({
      symbol: opt.contractSymbol,
      type: opt.type,
      strike: opt.strike,
      exp: opt.expiration,
      bid: opt.bid || 0,
      ask: opt.ask || 0,
      mid: opt.mid || (opt.bid + opt.ask) / 2,
      volume: opt.volume || 0,
      openInterest: opt.openInterest || 0,
      delta: opt.greeks?.delta || 0.5,
      gamma: opt.greeks?.gamma || 0.01,
      theta: opt.greeks?.theta || -0.01,
      vega: opt.greeks?.vega || 0.1,
      iv: opt.impliedVol || 0.2,
      underlyingPrice: spot,
    }))
  }, [data])

  if (loading) return <div className="state">Loading data…</div>
  if (error) return <div className="state error">Error: {error}</div>
  if (!data) return <div className="state">No data</div>

  const options: OptionItem[] = data.optionsSample || []
  const expirations = data.expirations || []

  return (
    <ErrorBoundary>
      <Toaster position="top-right" />
      <div className="app">
        <header>
          <h1>SPY Trading Assistant</h1>
          <div className="meta">Source: {data.source} • Options: {data.optionsCount}</div>
        </header>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'signals', label: '🎯 Signals' },
            { id: 'alerts', label: '🔔 Alerts' },
            { id: 'portfolio', label: '💼 Portfolio' },
            { id: 'import', label: '📥 Import Data' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={activeTab === tab.id ? 'tab-button active' : 'tab-button'}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
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
          </>
        )}

        {/* Trade Signals Tab */}
        {activeTab === 'signals' && (
          <section className="tab-content">
            <TradeSignals contracts={contracts} />
          </section>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <section className="tab-content">
            <AlertConfigPanel />
          </section>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <section className="tab-content">
            <PortfolioTracker contracts={contracts} />
          </section>
        )}

        {/* Import Data Tab */}
        {activeTab === 'import' && (
          <section className="tab-content">
            <DataImporter onContractsImported={(imported) => console.log('Imported:', imported)} />
          </section>
        )}
      </div>
    </ErrorBoundary>
  )
}
