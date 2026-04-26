import { useState, useMemo } from 'react'
import { Sparkles, TrendingUp, Loader2 } from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { useSalesTrend } from '../../hooks/useSalesTrend'
import { aiClient } from '../../lib/api'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function SalesChart() {
  const { data: trendData = [], isLoading } = useSalesTrend()
  const [showPrediction, setShowPrediction] = useState(false)
  const [isPredicting, setIsPredicting] = useState(false)
  const [predictionData, setPredictionData] = useState<any[]>([])

  const chartData = useMemo(() => {
    // Start with real sales trend data
    const baseData: any[] = trendData.map((d, idx) => ({
      name: format(new Date(d.date), 'dd MMM', { locale: id }),
      rawDate: d.date,
      Pendapatan: d.amount,
      index: idx + 1
    }))
      
    // Append ML predictions if active
    if (showPrediction && predictionData.length > 0) {
       predictionData.forEach((pred, i) => {
         baseData.push({
           name: `H+${i+1} (AI)`,
           Pendapatan: pred.projected_demand,
           index: baseData.length + 1,
           isPrediction: true
         })
       })
    }
    return baseData
  }, [trendData, showPrediction, predictionData])

  const handlePredict = async () => {
    if (showPrediction) {
       setShowPrediction(false)
       setPredictionData([])
       return
    }

    if (trendData.length < 3) {
       alert("Mesin AI membutuhkan minimal 3 hari rekaman penjualan untuk mengalkulasi Proyeksi secara valid.")
       return
    }

    const historicalData = trendData.map((d, idx) => ({
       day_index: idx + 1,
       sold_qty: d.amount
    }))

    setIsPredicting(true)
    try {
      const res = await aiClient.post('/predict/demand', {
        product_id: "global_revenue_index",
        historical_data: historicalData,
        days_to_predict: 3
      })
      if (res.data?.predictions) {
          setPredictionData(res.data.predictions)
          setShowPrediction(true)
      }
    } catch(err) {
      alert("Koneksi mesin Python AI FastAPI Gagal (Luring). Menggunakan estimasi linear internal...")
      // Fallback simple linear estimation if Python is down
      const lastVal = trendData[trendData.length-1].amount
      const prevVal = trendData[trendData.length-2].amount
      const diff = lastVal - prevVal
      setPredictionData([
        { projected_demand: Math.max(0, lastVal + diff) },
        { projected_demand: Math.max(0, lastVal + diff * 2) },
        { projected_demand: Math.max(0, lastVal + diff * 3) }
      ])
      setShowPrediction(true)
    } finally {
      setIsPredicting(false)
    }
  }

  return (
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex flex-col relative overflow-hidden h-[450px]">
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-foreground">Tren Penjualan & Proyeksi AI</h3>
            <p className="text-sm text-muted-foreground mt-1">Data penjualan 7 hari terakhir dengan estimasi cerdas.</p>
          </div>
          
          <button 
             disabled={isPredicting || isLoading}
             onClick={handlePredict}
             className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all border disabled:opacity-50 cursor-pointer ${
               showPrediction 
               ? 'bg-primary/10 border-primary/20 text-primary shadow-inner'
               : 'bg-card border-border text-muted-foreground hover:border-primary hover:text-primary shadow-sm hover:shadow'
             }`}
          >
            {isPredicting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {showPrediction ? 'Sembunyikan Prediksi' : 'Eksplorasi Proyeksi AI'}
          </button>
        </div>

        <div className="flex-1 w-full h-full min-h-0 pl-0">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground animate-pulse">
               Menganalisis data tren...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
               <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
               <p>Belum ada data penjualan tersedia.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                  tickFormatter={(val) => `Rp ${val >= 1000000 ? (val/1000000).toFixed(1)+'M' : (val/1000).toFixed(0)+'k'}`} 
                />
                <Tooltip 
                   formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Grand Total']}
                   labelStyle={{ fontWeight: "bold", color: "hsl(var(--foreground))", marginBottom: "4px" }}
                   contentStyle={{ 
                     borderRadius: '16px', 
                     backgroundColor: 'hsl(var(--card))', 
                     border: '1px solid hsl(var(--border))', 
                     boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                     padding: '12px'
                   }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Pendapatan" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--card))', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
  )
}
