import React from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, LineElement, PointElement, LinearScale, TimeScale, CategoryScale, Tooltip, Legend, Filler } from 'chart.js'

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, CategoryScale, Tooltip, Legend, Filler)

export default function ChartView({ series, indicators }: any) {
  const labels = (series || []).slice(-60).map((s: any) => new Date(s.date).toLocaleDateString())
  const closes = (series || []).slice(-60).map((s: any) => s.close)
  const sma20Data = (indicators?.sma20 || []).slice(-60).map((x:any) => x || null)

  const data = {
    labels,
    datasets: [
      { 
        label: 'Close', 
        data: closes, 
        borderColor: '#1f77b4', 
        backgroundColor: 'rgba(31, 119, 180, 0.1)',
        tension: 0.1,
        fill: false
      },
      { 
        label: 'SMA20', 
        data: sma20Data, 
        borderColor: '#ff7f0e', 
        tension: 0.1,
        fill: false
      }
    ]
  }

  const options: any = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top' }
    },
    scales: {
      y: { beginAtZero: false }
    }
  }

  return (
    <div className="chart">
      <Line data={data} options={options} />
    </div>
  )
}
