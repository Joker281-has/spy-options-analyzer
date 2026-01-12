import React, { useState, useEffect } from 'react'

export default function Filters({ expirations = [], onChange, onSearch }: any) {
  const [minDelta, setMinDelta] = useState(0.3)
  const [maxDelta, setMaxDelta] = useState(0.7)
  const [ivMinPct, setIvMinPct] = useState(0)
  const [ivMaxPct, setIvMaxPct] = useState(100)
  const [expiration, setExpiration] = useState('all')
  useEffect(() => onChange({ minDelta, maxDelta, ivMinPct, ivMaxPct, expiration }), [minDelta, maxDelta, ivMinPct, ivMaxPct, expiration, onChange])

  return (
    <div className="filters">
      <label>Delta range
        <input type="range" min={0} max={1} step={0.01} value={minDelta} onChange={e => setMinDelta(Number(e.target.value))} />
        <input type="range" min={0} max={1} step={0.01} value={maxDelta} onChange={e => setMaxDelta(Number(e.target.value))} />
      </label>

      <label>IV %tile
        <input type="range" min={0} max={100} step={1} value={ivMinPct} onChange={e => setIvMinPct(Number(e.target.value))} />
        <input type="range" min={0} max={100} step={1} value={ivMaxPct} onChange={e => setIvMaxPct(Number(e.target.value))} />
      </label>

      <label>Exp
        <select value={expiration} onChange={e => setExpiration(e.target.value)}>
          <option value="all">All</option>
          {expirations.slice(0, 20).map((ex:string) => <option value={ex} key={ex}>{new Date(ex).toLocaleDateString()}</option>)}
        </select>
      </label>

      <label>Search
        <input placeholder="contract symbol" onChange={e => onSearch(e.target.value)} />
      </label>
    </div>
  )
}
