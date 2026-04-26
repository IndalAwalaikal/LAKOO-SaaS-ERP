import { useState } from 'react'
import Layout from '../components/Layout'
import { DollarSign, Search, Plus, ArrowUpCircle, ArrowDownCircle, Sparkles, X, FileDown } from 'lucide-react'
import { useFinance, useRecordFinance } from '../hooks/useFinance'
import type { FinanceTransaction } from '../hooks/useFinance'
import LedgerTable from '../components/finance/LedgerTable'
import { exportToPDF } from '../lib/pdfExport'

export default function Finance() {
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newRecord, setNewRecord] = useState({ type: 'Income', amount: 0, category: 'General', description: '', date: new Date().toISOString().split('T')[0] })
  
  const { data: financeData = [], isLoading, isError } = useFinance()
  const recordFinance = useRecordFinance()

  const displayedFinance = financeData.filter((f: FinanceTransaction) => {
    const matchesSearch = f.description.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false;

    if (dateFilter === 'all') return true;

    const txDate = new Date(f.date)
    const now = new Date()
    const diffDays = Math.ceil(Math.abs(now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24))

    if (dateFilter === '7' && diffDays <= 7) return true;
    if (dateFilter === '30' && diffDays <= 30) return true;
    return false;
  })

  const totalIncome = financeData.filter((f: FinanceTransaction) => f.type === 'Income').reduce((acc: number, curr: FinanceTransaction) => acc + curr.amount, 0)
  const totalExpense = financeData.filter((f: FinanceTransaction) => f.type === 'Expense').reduce((acc: number, curr: FinanceTransaction) => acc + curr.amount, 0)
  const netProfit = totalIncome - totalExpense

  const handleDownloadPDF = () => {
    const headers = ['Tanggal', 'Deskripsi', 'Tipe', 'Nominal']
    const rows = displayedFinance.map(f => [
      f.date?.slice(0, 10) || 'N/A',
      f.description,
      f.type === 'Income' ? 'Pemasukan' : 'Pengeluaran',
      `Rp ${f.amount.toLocaleString('id-ID')}`
    ])

    exportToPDF({
      title: 'Laporan Keuangan Lakoo ERP',
      subtitle: `Periode: ${dateFilter === 'all' ? 'Semua Waktu' : dateFilter + ' Hari Terakhir'} | Total Transaksi: ${displayedFinance.length}`,
      headers,
      rows,
      fileName: `Laporan_Keuangan_${new Date().toISOString().split('T')[0]}`
    })
  }

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await recordFinance.mutateAsync({
         ...newRecord,
         amount: Number(newRecord.amount)
      } as any)
      setIsModalOpen(false)
      setNewRecord({ type: 'Income', amount: 0, category: 'General', description: '', date: new Date().toISOString().split('T')[0] })
    } catch(err) {
      alert("Gagal mencatat transaksi keuangan manual.")
    }
  }

  if (isLoading) return <Layout><div className="p-8">Loading finance ledger...</div></Layout>
  if (isError) return <Layout><div className="p-8 text-red-500">Failed to load finance ledger</div></Layout>

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        
        {/* Top Header Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
               <DollarSign className="w-32 h-32 text-foreground" />
             </div>
             <div className="text-sm text-muted-foreground font-medium">Laba Bersih</div>
             <div className="text-4xl font-bold text-foreground mt-2 mb-1 tracking-tight">Rp {netProfit.toLocaleString('id-ID')}</div>
             <div className="text-sm text-emerald-500 font-medium flex items-center">
                <Sparkles className="w-4 h-4 mr-1" />
                Dianalisis oleh Net AI
             </div>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-2">
                <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
                <div className="text-sm font-medium text-muted-foreground">Pemasukan</div>
             </div>
             <div className="text-2xl font-bold text-foreground">Rp {totalIncome.toLocaleString('id-ID')}</div>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-2">
                <ArrowDownCircle className="w-5 h-5 text-red-500" />
                <div className="text-sm font-medium text-muted-foreground">Pengeluaran</div>
             </div>
             <div className="text-2xl font-bold text-foreground">Rp {totalExpense.toLocaleString('id-ID')}</div>
          </div>
        </div>

        {/* Dynamic Financial Insights AI Bubble */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-5 border border-primary/20 flex gap-4 shadow-inner">
           <div className="mt-1 h-10 w-10 flex-shrink-0 bg-primary/20 rounded-full flex items-center justify-center text-primary">
              <Sparkles className="w-5 h-5" />
           </div>
           <div>
              <h3 className="font-semibold text-foreground text-lg mb-1">Cerdas: AI Financial Insight</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-4xl">
                 Berdasarkan data hari ini, metrik belanja persediaan (Restock) tampaknya lebih tinggi 15% dari biasanya. AI merekomendasikan negosiasi tender ulang dengan vendor "Susu & Gula Kopi" mengingat penjualan kategori Minuman Cepat Saji mengalami perlambatan -5% seminggu terakhir.
              </p>
           </div>
        </div>

        {/* Ledger */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
          <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
            <div className="flex gap-3">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Cari transaksi..."
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select 
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="bg-background border border-border text-foreground hover:bg-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm outline-none cursor-pointer"
              >
                 <option value="all">Semua Waktu</option>
                 <option value="7">7 Hari Terakhir</option>
                 <option value="30">30 Hari Terakhir</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleDownloadPDF}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Unduh PDF
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Catat Manual
              </button>
            </div>
          </div>

          {/* Componentized Ledger Table */}
          <LedgerTable items={displayedFinance} />
        </div>
      </div>

      {/* Manual Entry Finance Modal Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in transition-all">
          <div className="bg-card rounded-2xl w-full max-w-lg p-7 shadow-2xl border border-border animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground">Catat Transaksi Manual</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground bg-muted p-2 rounded-full transition-all">
                 <X className="w-5 h-5"/>
              </button>
            </div>
            
            <form onSubmit={handleAddRecord} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Tipe Arus</label>
                  <select 
                    value={newRecord.type} 
                    onChange={e => setNewRecord({...newRecord, type: e.target.value as any})}
                    className="w-full px-4 py-2.5 outline-none bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                  >
                    <option value="Income">Pemasukan (Income)</option>
                    <option value="Expense">Pengeluaran (Expense)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Jumlah (Rp)</label>
                  <input required type="number" min="0" value={newRecord.amount || ''} onChange={e => setNewRecord({...newRecord, amount: Number(e.target.value)})} className={`w-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-opacity-50 border rounded-xl transition-all font-bold ${newRecord.type === 'Income' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 focus:ring-emerald-500' : 'bg-red-500/10 text-red-500 border-red-500/30 focus:ring-red-500'}`} placeholder="Nominal Rupiah..." />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Deskripsi Lengkap</label>
                  <input required value={newRecord.description} onChange={e => setNewRecord({...newRecord, description: e.target.value})} className="w-full px-4 py-2.5 outline-none bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Contoh: Bayar Tagihan Listrik" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Kategori</label>
                  <input required value={newRecord.category} onChange={e => setNewRecord({...newRecord, category: e.target.value})} className="w-full px-4 py-2.5 outline-none bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Misal: Operasional" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Tanggal Catat</label>
                  <input required type="date" value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} className="w-full px-4 py-2.5 outline-none bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
              </div>
              
              <button type="submit" disabled={recordFinance.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 px-4 rounded-xl mt-4 shadow-lg hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center disabled:opacity-50 disabled:transform-none">
                {recordFinance.isPending ? "Merekam Ledger..." : "Simpan Pembukuan Manual"}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
