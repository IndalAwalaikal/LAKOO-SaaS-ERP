import { useState } from 'react'
import Layout from '../components/Layout'
import { Search, Plus, ArrowUpCircle, ArrowDownCircle, Sparkles, X, FileDown } from 'lucide-react'
import { useFinance, useRecordFinance } from '../hooks/useFinance'
import type { FinanceTransaction } from '../hooks/useFinance'
import LedgerTable from '../components/finance/LedgerTable'
import { exportToPDF } from '../lib/pdfExport'
import { toast } from '../store/toastStore'

export default function Finance() {
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newRecord, setNewRecord] = useState({ type: 'Income', amount: 0, category: 'General', description: '', date: new Date().toISOString().split('T')[0] })
  
  const { data: financeData = [], isLoading, isError } = useFinance()
  const recordFinance = useRecordFinance()

  const displayedFinance = financeData.filter((f: FinanceTransaction) => {
    if (!f.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFilter === 'all') return true;
    const txDate = new Date(f.date)
    const now = new Date()
    const diffDays = Math.ceil(Math.abs(now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24))
    return dateFilter === '7' ? diffDays <= 7 : (dateFilter === '30' ? diffDays <= 30 : true);
  })

  const totalIncome = financeData.filter((f: FinanceTransaction) => f.type === 'Income').reduce((acc: number, curr: FinanceTransaction) => acc + curr.amount, 0)
  const totalExpense = financeData.filter((f: FinanceTransaction) => f.type === 'Expense').reduce((acc: number, curr: FinanceTransaction) => acc + curr.amount, 0)
  const netProfit = totalIncome - totalExpense

  const handleDownloadPDF = () => {
    const headers = ['Tanggal', 'Deskripsi', 'Tipe', 'Nominal']
    const rows = displayedFinance.map(f => [f.date?.slice(0, 10) || 'N/A', f.description, f.type === 'Income' ? 'Pemasukan' : 'Pengeluaran', `Rp ${f.amount.toLocaleString('id-ID')}`])
    exportToPDF({ title: 'Laporan Keuangan Lakoo ERP', subtitle: `Periode: ${dateFilter === 'all' ? 'Semua Waktu' : dateFilter + ' Hari'}`, headers, rows, fileName: `Laporan_Keuangan_${new Date().toISOString().split('T')[0]}` })
    toast.success("Laporan PDF berhasil diunduh")
  }

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await recordFinance.mutateAsync({ ...newRecord, amount: Number(newRecord.amount) } as any)
      setIsModalOpen(false)
      setNewRecord({ type: 'Income', amount: 0, category: 'General', description: '', date: new Date().toISOString().split('T')[0] })
      toast.success("Transaksi keuangan berhasil dicatat")
    } catch(err) {
      toast.error("Gagal mencatat transaksi keuangan manual")
    }
  }

  if (isLoading) return <Layout><div className="p-8">Memuat Data Keuangan...</div></Layout>
  if (isError) return <Layout><div className="p-8 text-red-500">Gagal memuat ledger keuangan</div></Layout>

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-center">
             <div className="text-sm text-muted-foreground font-medium">Laba Bersih</div>
             <div className="text-4xl font-bold text-foreground mt-2 mb-1 tracking-tight font-black">Rp {netProfit.toLocaleString('id-ID')}</div>
             <div className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center"><Sparkles className="w-3 h-3 mr-1" /> Analisis Net AI Aktif</div>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm"><div className="flex items-center gap-2 mb-2 text-emerald-500"><ArrowUpCircle className="w-5 h-5" /><div className="text-sm font-bold opacity-60">Pemasukan</div></div><div className="text-2xl font-black">Rp {totalIncome.toLocaleString('id-ID')}</div></div>
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm"><div className="flex items-center gap-2 mb-2 text-red-500"><ArrowDownCircle className="w-5 h-5" /><div className="text-sm font-bold opacity-60">Pengeluaran</div></div><div className="text-2xl font-black">Rp {totalExpense.toLocaleString('id-ID')}</div></div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
          <div className="p-5 border-b flex flex-col sm:flex-row justify-between items-center bg-muted/30 gap-4">
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type="text" placeholder="Cari..." className="w-full pl-9 pr-4 py-2 bg-background border rounded-lg text-sm" value={search} onChange={e => setSearch(e.target.value)} /></div>
              <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="bg-background border rounded-lg text-sm px-4 py-2">
                 <option value="all">Semua</option><option value="7">7 Hari</option><option value="30">30 Hari</option>
              </select>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={handleDownloadPDF} className="flex-1 sm:flex-none bg-secondary px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center"><FileDown className="w-4 h-4 mr-2" /> PDF</button>
              <button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center"><Plus className="w-4 h-4 mr-2" /> Catat</button>
            </div>
          </div>
          <LedgerTable items={displayedFinance} />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg p-7 shadow-2xl border animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Catat Manual</h3><button onClick={() => setIsModalOpen(false)}><X /></button></div>
            <form onSubmit={handleAddRecord} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <select value={newRecord.type} onChange={e => setNewRecord({...newRecord, type: e.target.value as any})} className="w-full px-4 py-3 bg-background text-foreground border border-border rounded-xl font-bold focus:ring-2 focus:ring-primary/20 outline-none"><option value="Income">Income</option><option value="Expense">Expense</option></select>
                <input required type="number" value={newRecord.amount || ''} onChange={e => setNewRecord({...newRecord, amount: Number(e.target.value)})} className={`w-full px-4 py-3 bg-background border border-border rounded-xl font-black focus:ring-2 focus:ring-primary/20 outline-none ${newRecord.type === 'Income' ? 'text-emerald-500' : 'text-red-500'}`} placeholder="Nominal Rp" />
                <input required value={newRecord.description} onChange={e => setNewRecord({...newRecord, description: e.target.value})} className="col-span-2 px-4 py-3 bg-background text-foreground border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Deskripsi" />
                <input type="date" value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} className="px-4 py-3 bg-background text-foreground border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <button type="submit" disabled={recordFinance.isPending} className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-lg">{recordFinance.isPending ? "Merekam..." : "Simpan Keuangan"}</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
