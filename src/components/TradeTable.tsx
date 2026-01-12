import React, { useMemo, useState } from 'react'
import classNames from 'classnames'

type Props = { options: any[]; filters: any; query: string; series?: any[] }
type SortKey = 'score' | 'delta' | 'strike' | 'mid' | 'iv' | 'dte';

function scoreOption(opt: any, spot: number, ivPctile: number | null) {
  const mid = opt.mid || opt.lastPrice || 0
  const dist = Math.max(0.01, Math.abs(opt.strike - spot))
  const rr = mid / dist
  const delta = (opt.greeks?.delta != null ? Math.abs(opt.greeks.delta) : 0.5)
  const pop = 1 - Math.abs(delta - 0.5)
  const ivFactor = ivPctile != null ? (ivPctile / 100) : 1
  return rr * pop * (1 + ivFactor)
}

export default function TradeTable({ options, filters, query, series = [] }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDesc, setSortDesc] = useState(true);
  const [pageIdx, setPageIdx] = useState(0);
  const ROWS_PER_PAGE = 20;

  const spot = (series && series.length) ? series[series.length - 1].close : 0
  const allRows = useMemo(() => {
    const q = (query || '').trim().toLowerCase()
    const ivs = options.map(o => o.impliedVol != null ? o.impliedVol : 0).sort((a,b) => a-b)
    function ivPercentile(iv: number|null) {
      if (iv == null) return null
      const idx = ivs.findIndex(v => v >= iv)
      return idx < 0 ? 100 : Math.round((idx / Math.max(1, ivs.length - 1)) * 100)
    }

    const rows = options
      .filter(o => {
        if (!o.greeks || o.greeks.delta == null) return false
        const d = Math.abs(o.greeks.delta)
        if (d < filters.minDelta || d > filters.maxDelta) return false
        if (o.impliedVol == null) return false
        const pct = ivPercentile(o.impliedVol)
        if (pct == null) return false
        if (pct < filters.ivMinPct || pct > filters.ivMaxPct) return false
        if (filters.expiration && filters.expiration !== 'all' && new Date(filters.expiration).toISOString() !== new Date(o.expiration).toISOString()) return false
        if (q && !o.contractSymbol.toLowerCase().includes(q)) return false
        return true
      })
      .map(o => {
        const pct = ivPercentile(o.impliedVol)
        return ({ ...o, score: scoreOption(o, spot, pct), ivPct: pct })
      })

    // Sort
    const sorted = [...rows].sort((a, b) => {
      let aVal = 0, bVal = 0;
      switch (sortKey) {
        case 'score': aVal = a.score; bVal = b.score; break;
        case 'delta': aVal = Math.abs(a.greeks?.delta || 0); bVal = Math.abs(b.greeks?.delta || 0); break;
        case 'strike': aVal = a.strike; bVal = b.strike; break;
        case 'mid': aVal = a.mid || 0; bVal = b.mid || 0; break;
        case 'iv': aVal = a.impliedVol || 0; bVal = b.impliedVol || 0; break;
        case 'dte': aVal = a.dte || 0; bVal = b.dte || 0; break;
      }
      return sortDesc ? (bVal - aVal) : (aVal - bVal);
    });

    return sorted;
  }, [options, filters, query, series, sortKey, sortDesc])

  const pageCount = Math.ceil(allRows.length / ROWS_PER_PAGE);
  const rows = allRows.slice(pageIdx * ROWS_PER_PAGE, (pageIdx + 1) * ROWS_PER_PAGE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
    setPageIdx(0);
  };

  return (
    <div className="trade-table">
      <div className="table-controls">
        <div>Showing {allRows.length} trades • Page {pageIdx + 1} of {Math.max(1, pageCount)}</div>
        <div className="pagination">
          <button onClick={() => setPageIdx(Math.max(0, pageIdx - 1))} disabled={pageIdx === 0}>← Prev</button>
          <button onClick={() => setPageIdx(Math.min(pageCount - 1, pageIdx + 1))} disabled={pageIdx >= pageCount - 1}>Next →</button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th onClick={() => toggleSort('score')} className="sortable">Score {sortKey === 'score' && (sortDesc ? '↓' : '↑')}</th>
            <th>Symbol</th>
            <th>Type</th>
            <th>Exp</th>
            <th onClick={() => toggleSort('strike')} className="sortable">Strike {sortKey === 'strike' && (sortDesc ? '↓' : '↑')}</th>
            <th onClick={() => toggleSort('mid')} className="sortable">Mid {sortKey === 'mid' && (sortDesc ? '↓' : '↑')}</th>
            <th onClick={() => toggleSort('iv')} className="sortable">IV {sortKey === 'iv' && (sortDesc ? '↓' : '↑')}</th>
            <th>IV%</th>
            <th onClick={() => toggleSort('delta')} className="sortable">Δ {sortKey === 'delta' && (sortDesc ? '↓' : '↑')}</th>
            <th>Γ</th>
            <th>Θ</th>
            <th>V</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.contractSymbol + i} className={classNames({ weak: r.score < 0.001 })}>
              <td className="score">{r.score.toFixed(4)}</td>
              <td>{r.contractSymbol}</td>
              <td>{r.type}</td>
              <td>{new Date(r.expiration).toLocaleDateString()}</td>
              <td>{r.strike.toFixed(2)}</td>
              <td>{r.mid != null ? r.mid.toFixed(2) : '—'}</td>
              <td>{r.impliedVol != null ? (r.impliedVol * 100).toFixed(1) + '%' : '—'}</td>
              <td>{r.ivPct != null ? r.ivPct + '%' : '—'}</td>
              <td>{r.greeks?.delta != null ? r.greeks.delta.toFixed(3) : '—'}</td>
              <td>{r.greeks?.gamma != null ? r.greeks.gamma.toFixed(3) : '—'}</td>
              <td>{r.greeks?.theta != null ? r.greeks.theta.toFixed(4) : '—'}</td>
              <td>{r.greeks?.vega != null ? r.greeks.vega.toFixed(3) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
