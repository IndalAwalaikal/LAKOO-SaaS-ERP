import { useMemo } from 'react'
import Layout from '../components/Layout'
import StatCards from '../components/dashboard/StatCards'
import SalesChart from '../components/dashboard/SalesChart'
import { useProducts } from '../hooks/useProducts'
import { useSales } from '../hooks/useSales'
import { useFinance } from '../hooks/useFinance'
import { useAuthStore } from '../store/auth'
import { PackageSearch, History, AlertTriangle, ArrowUpRight, ArrowDownRight, ShoppingCart } from 'lucide-react'

export default function Dashboard() {
  const { data: products = [] } = useProducts()
  const { data: sales = [] } = useSales()
  const { data: finance = [] } = useFinance()
  const { user } = useAuthStore()
  const isCashier = user?.role?.toLowerCase() === 'cashier'

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock_qty <= (p.min_stock || 10)).slice(0, 5)
  }, [products])

  const recentActivities = useMemo(() => {
    const saleActs = sales.slice(0, 5).map(s => ({
      id: s.id,
      type: 'Sale',
      title: `Penjualan ${s.invoice_no}`,
      amount: s.total_amount,
      time: s.created_at,
      icon: <ShoppingCart className="w-4 h-4 text-primary" />
    }))

    const financeActs = isCashier ? [] : finance.slice(0, 5).map(f => ({
      id: f.id,
      type: f.type,
      title: f.description,
      amount: f.amount,
      time: f.date,
      icon: f.type === 'Income' ? <ArrowUpRight className="w-4 h-4 text-emerald-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />
    }))

    return [...saleActs, ...financeActs]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 7)
  }, [sales, finance, isCashier])

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-end">
           <div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Ringkasan Operasional</h2>
              <p className="text-muted-foreground text-sm font-medium mt-1">Pantau seluruh metrik vital perusahaan secara Real-time</p>
           </div>
        </div>
        
        <StatCards />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2">
              {!isCashier ? (
                <SalesChart />
              ) : (
                <div className="bg-card rounded-2xl border border-border p-8 flex flex-col items-center justify-center text-center h-[400px]">
                   <div className="p-4 bg-primary/5 text-primary rounded-full mb-4">
                      <ShoppingCart className="w-8 h-8" />
                   </div>
                   <h3 className="text-lg font-bold">Siap Melayani Pelanggan?</h3>
                   <p className="text-muted-foreground text-sm max-w-xs mt-2">Gunakan menu POS untuk mulai mencatat transaksi penjualan hari ini.</p>
                   <button onClick={() => window.location.href='/dashboard/pos'} className="mt-6 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
                      Buka Kasir (POS)
                   </button>
                </div>
              )}
           </div>
           
           <div className="space-y-8">
              {/* Recent Activity Card */}
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                 <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-2">
                       <History className="w-4 h-4 text-muted-foreground" />
                       <h3 className="font-bold text-sm text-foreground">Aktivitas Terbaru</h3>
                    </div>
                    <span className="text-[10px] font-black uppercase text-primary/60 tracking-widest">Live Feed</span>
                 </div>
                 <div className="p-2">
                    {recentActivities.length > 0 ? (
                      recentActivities.map(act => (
                        <div key={`${act.type}-${act.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-colors group">
                           <div className="p-2 bg-muted rounded-lg group-hover:bg-background transition-colors">
                              {act.icon}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{act.title}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(act.time).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</p>
                           </div>
                           <p className={`text-xs font-black ${act.type === 'Expense' ? 'text-red-500' : 'text-foreground'}`}>
                              {act.type === 'Expense' ? '-' : '+'}Rp {act.amount.toLocaleString('id-ID')}
                           </p>
                        </div>
                      ))
                    ) : (
                      <p className="p-8 text-center text-xs text-muted-foreground">Belum ada aktivitas hari ini</p>
                    )}
                 </div>
              </div>

              {/* Low Stock Watcher */}
              <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl overflow-hidden shadow-sm">
                 <div className="px-5 py-4 border-b border-orange-500/10 flex items-center gap-2 bg-orange-500/10">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <h3 className="font-bold text-sm text-orange-900 dark:text-orange-300">Peringatan Stok Rendah</h3>
                 </div>
                 <div className="p-2">
                    {lowStockProducts.length > 0 ? (
                      lowStockProducts.map(product => (
                        <div key={product.id} className="flex items-center justify-between p-3 hover:bg-orange-500/5 rounded-xl transition-colors">
                           <div className="flex flex-col">
                              <span className="text-xs font-bold text-foreground">{product.name}</span>
                              <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-tighter">SKU: {product.sku}</span>
                           </div>
                           <div className="flex flex-col items-end">
                              <span className="text-xs font-black text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">{product.stock_qty} {product.unit}</span>
                              <span className="text-[9px] text-muted-foreground mt-0.5">Min: {product.min_stock || 10}</span>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center space-y-2">
                        <PackageSearch className="w-8 h-8 text-emerald-500 mx-auto opacity-20" />
                        <p className="text-xs text-muted-foreground">Stok aman terkendali</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </Layout>
  )
}
