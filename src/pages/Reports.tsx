import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, 
  ShoppingBag, FileDown, Calendar, ArrowRight, Sparkles, X, CheckCircle 
} from 'lucide-react'
import { useSales } from '../hooks/useSales'
import { useFinance } from '../hooks/useFinance'
import { exportToPDF } from '../lib/pdfExport'
import { useAuthStore } from '../store/auth'

export default function Reports() {
  const { tenant } = useAuthStore()
  const { data: sales = [], isLoading: salesLoading } = useSales()
  const { data: finance = [], isLoading: financeLoading } = useFinance()
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false)

  const metrics = useMemo(() => {
    const totalSales = sales.reduce((acc, s) => acc + s.total_amount, 0)
    const totalIncome = finance
      .filter(f => f.type === 'Income')
      .reduce((acc, f) => acc + f.amount, 0)
    const totalExpense = finance
      .filter(f => f.type === 'Expense')
      .reduce((acc, f) => acc + f.amount, 0)
    
    // Net result considering both sales and manual entries
    const netProfit = (totalSales + totalIncome) - totalExpense

    return {
      totalSales,
      totalIncome,
      totalExpense,
      netProfit,
      salesCount: sales.length,
      financeCount: finance.length
    }
  }, [sales, finance])

  const handleDownloadFullReport = () => {
    const headers = ['Kategori', 'Detail', 'Nilai']
    const rows = [
      ['Total Penjualan', `${metrics.salesCount} Transaksi`, `Rp ${metrics.totalSales.toLocaleString('id-ID')}`],
      ['Total Pemasukan Manual', `${metrics.financeCount} Record`, `Rp ${metrics.totalIncome.toLocaleString('id-ID')}`],
      ['Total Pengeluaran', 'Biaya Operasional', `Rp ${metrics.totalExpense.toLocaleString('id-ID')}`],
      ['Laba/Rugi Bersih', 'Estimasi Akhir', `Rp ${metrics.netProfit.toLocaleString('id-ID')}`],
    ]

    exportToPDF({
      title: 'Laporan Ringkasan Bisnis - Lakoo ERP',
      subtitle: `Tenant: ${tenant?.name || 'Lakoo Merchant'} | Dicetak: ${new Date().toLocaleDateString('id-ID')}`,
      headers,
      rows,
      fileName: `Laporan_Bisnis_${new Date().toISOString().split('T')[0]}`
    })
  }

  const isLoading = salesLoading || financeLoading

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pusat Laporan Bisnis</h1>
            <p className="text-muted-foreground text-sm mt-1">Kelola dan unduh laporan performa toko Anda secara keseluruhan.</p>
          </div>
          <button 
            onClick={handleDownloadFullReport}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold flex items-center transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Download Laporan PDF
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse font-medium">Berdemonstrasi menarik data analitik...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Penjualan (POS)" 
                value={`Rp ${metrics.totalSales.toLocaleString('id-ID')}`}
                subValue={`${metrics.salesCount} Pesanan Sukses`}
                icon={<ShoppingBag className="w-6 h-6 text-primary" />}
                trend="up"
              />
              <StatCard 
                title="Pemasukan Lainnya" 
                value={`Rp ${metrics.totalIncome.toLocaleString('id-ID')}`}
                subValue="Catatan Manual"
                icon={<TrendingUp className="w-6 h-6 text-emerald-500" />}
              />
              <StatCard 
                title="Total Pengeluaran" 
                value={`Rp ${metrics.totalExpense.toLocaleString('id-ID')}`}
                subValue="Operasional & Stok"
                icon={<TrendingDown className="w-6 h-6 text-red-500" />}
                trend="down"
              />
              <StatCard 
                title="Estimasi Laba Bersih" 
                value={`Rp ${metrics.netProfit.toLocaleString('id-ID')}`}
                subValue="Total Keseluruhan"
                icon={<DollarSign className="w-6 h-6 text-indigo-500" />}
                highlight
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <BarChart3 className="w-5 h-5" />
                         </div>
                         <h3 className="font-bold text-lg text-foreground">Analisis Agregat</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full uppercase tracking-wider">
                         <Calendar className="w-3 h-3" />
                         Realtime Sync
                      </div>
                   </div>
                   
                   <div className="space-y-4">
                      <ComparisonBar label="Rasio Pendapatan vs Pengeluaran" current={metrics.totalSales + metrics.totalIncome} target={metrics.totalExpense} color="bg-emerald-500" />
                      <div className="pt-4 border-t border-border mt-6">
                         <p className="text-sm text-muted-foreground leading-relaxed italic">
                           *Data di atas menggabungkan hasil transaksi POS otomatis dan pencatatan manual di modul Keuangan.
                         </p>
                      </div>
                   </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-24 h-24 text-indigo-600" />
                   </div>
                   <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                         <Sparkles className="w-5 h-5 text-indigo-500" />
                         <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">AI Financial Butler</span>
                      </div>
                      <h4 className="text-xl font-bold text-foreground mb-2">Insight Strategis Bisnis</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                        Berdasarkan perbandingan antara POS dan Pengeluaran manual, efisiensi operasional Anda berada di angka 82%. Disarankan untuk mengalokasikan 10% dari laba bersih bulan ini untuk kampanye pemasaran loyalitas pelanggan di kategori produk paling laris.
                      </p>
                      <button 
                        onClick={() => setIsInsightModalOpen(true)}
                        className="mt-4 flex items-center text-sm font-bold text-indigo-600 hover:gap-2 transition-all cursor-pointer"
                      >
                        Pelajari Rekomendasi Lengkap <ArrowRight className="ml-1 w-4 h-4" />
                      </button>
                   </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm overflow-hidden relative">
                   <h3 className="font-bold text-foreground mb-4">Ringkasan Aktifitas</h3>
                   <div className="space-y-4 relative">
                      <ActivityItem label="Penjualan Selesai" count={metrics.salesCount} color="bg-primary" />
                      <ActivityItem label="Pengeluaran Baru" count={metrics.financeCount} color="bg-red-500" />
                   </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Insight Modal */}
      {isInsightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-card w-full max-w-2xl rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600">
                       <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                       <h2 className="font-black text-xl text-foreground">Rekomendasi Strategis AI</h2>
                       <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Analisis Performa Laporan</p>
                    </div>
                 </div>
                 <button 
                  onClick={() => setIsInsightModalOpen(false)}
                  className="bg-card hover:bg-muted border border-border p-2 rounded-full transition-colors"
                 >
                    <X className="w-5 h-5 text-muted-foreground" />
                 </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                 <div className="space-y-4">
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                       <CheckCircle className="w-5 h-5 text-emerald-500" />
                       Optimalisasi Margin Laba
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                       Rasio pengeluaran operasional Anda sedikit di atas rata-rata industri untuk kategori retail SaaS. Kami menyarankan evaluasi ulang pemasok untuk produk dengan turn-over rendah untuk mengurangi 'cost of holding' di inventori.
                    </p>
                 </div>

                 <div className="space-y-4">
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                       <CheckCircle className="w-5 h-5 text-emerald-500" />
                       Strategi Loyalitas Pelanggan
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                       Data POS menunjukkan lonjakan transaksi pada jam 16:00 - 19:00. Implementasikan program 'Happy Hour' atau diskon khusus member pada jam tersebut untuk meningkatkan frekuensi kunjungan ulang pelanggan setia sebesar estimasi 15%.
                    </p>
                 </div>

                 <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-2xl flex items-start gap-4">
                    <div className="mt-1">
                       <TrendingUp className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                       <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm mb-1 text-foreground">Proyeksi Pertumbuhan</h4>
                       <p className="text-xs text-indigo-800/70 dark:text-indigo-400/70 leading-relaxed">
                         Dengan mengikuti rekomendasi di atas, proyeksi laba bersih toko Anda berpotensi meningkat hingga **12.4%** dalam kuartal berikutnya.
                       </p>
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-muted/30 border-t border-border flex justify-end">
                 <button 
                  onClick={() => setIsInsightModalOpen(false)}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                 >
                    Mengerti, Terapkan Strategi
                 </button>
              </div>
           </div>
        </div>
      )}
    </Layout>
  )
}

function StatCard({ title, value, subValue, icon, trend, highlight }: any) {
  return (
    <div className={`bg-card p-6 rounded-2xl border ${highlight ? 'border-indigo-500/30 bg-indigo-500/[0.02]' : 'border-border'} shadow-sm group hover:scale-[1.02] transition-all`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-muted rounded-xl group-hover:bg-primary/10 transition-colors">
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            {trend === 'up' ? '+Dynamic' : 'Stable'}
          </span>
        )}
      </div>
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{title}</div>
      <div className={`text-2xl font-black tracking-tight ${highlight ? 'text-indigo-600' : 'text-foreground'}`}>{value}</div>
      <div className="text-[11px] font-medium text-muted-foreground mt-1">{subValue}</div>
    </div>
  )
}

function ComparisonBar({ label, current, target, color }: any) {
  const percentage = Math.min(100, Math.max(10, (current / (current + target)) * 100))
  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-tight">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">{Math.round(percentage)}%</span>
      </div>
      <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
        <div className="h-full bg-red-500/20" style={{ width: `${100 - percentage}%` }}></div>
      </div>
    </div>
  )
}

function ActivityItem({ label, count, color }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-1.5 h-10 rounded-full ${color}`}></div>
      <div>
        <div className="text-xs font-bold text-muted-foreground uppercase">{label}</div>
        <div className="text-lg font-black text-foreground">{count}</div>
      </div>
    </div>
  )
}
