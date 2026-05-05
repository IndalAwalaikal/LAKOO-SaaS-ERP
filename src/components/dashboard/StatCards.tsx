import { useFinance } from '../../hooks/useFinance'
import { useProducts } from '../../hooks/useProducts'
import { useAuthStore } from '../../store/auth'

export default function StatCards() {
  const { data: finances = [] } = useFinance()
  const { data: products = [] } = useProducts()
  const { user } = useAuthStore()
  const isCashier = user?.role?.toLowerCase() === 'cashier'

  const incomeRecords = finances.filter((f: any) => f.type === 'Income')
  const totalSalesStr = incomeRecords.reduce((acc: number, f: any) => acc + f.amount, 0).toLocaleString('id-ID')
  const lowStockCount = products.filter((p: any) => p.stock_qty <= (p.min_stock || 10)).length

  return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         {!isCashier && (
           <>
             <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
               <div className="text-sm font-medium text-muted-foreground mb-1">Total Pemasukan Kas</div>
               <div className="text-3xl font-bold text-foreground">Rp {totalSalesStr}</div>
               <div className="text-sm text-emerald-500 mt-2 font-medium">Berdasarkan Faktur Lunas</div>
             </div>
             <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
               <div className="text-sm font-medium text-muted-foreground mb-1">Total Transaksi</div>
               <div className="text-3xl font-bold text-foreground">{incomeRecords.length}</div>
               <div className="text-sm text-muted-foreground mt-2 font-medium">Histori Catatan Keuangan</div>
             </div>
           </>
         )}
         
         <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
           <div className="text-sm font-medium text-muted-foreground mb-1">Peringatan Stok Tipis</div>
           <div className="text-3xl font-bold text-red-600">{lowStockCount} Item</div>
           <div className="text-sm text-muted-foreground mt-2 font-medium">Membutuhkan Restock</div>
         </div>
         <div className={`bg-card p-6 rounded-2xl shadow-sm border border-border bg-primary/5 ${isCashier ? 'lg:col-span-3' : ''}`}>
           <div className="text-sm font-medium text-muted-foreground mb-1">Insight Performa</div>
           <div className="text-xl font-bold text-primary">{isCashier ? 'Fokus Melayani Pelanggan' : 'Operasional Stabil'}</div>
           <div className="text-sm text-muted-foreground mt-2 font-medium">Sistem berjalan optimal</div>
         </div>
      </div>
  )
}
