import { Banknote } from 'lucide-react'
import type { FinanceTransaction } from '../../hooks/useFinance'

export default function LedgerTable({ items }: { items: FinanceTransaction[] }) {
  return (
    <div className="flex-1 overflow-x-auto">
       <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border text-sm text-muted-foreground">
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Tanggal</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Deskripsi</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Kategori Aliran</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Nominal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((f) => (
              <tr key={f.id} className="hover:bg-muted/50 transition-colors animate-in fade-in">
                <td className="px-6 py-4 text-sm font-medium text-muted-foreground">{f.date?.slice(0,10) || 'N/A'}</td>
                <td className="px-6 py-4 text-sm font-semibold text-foreground">{f.description}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                    f.type === 'Income' 
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' 
                    : 'border-red-500/30 bg-red-500/10 text-red-500'
                  }`}>
                    {f.type === 'Income' ? 'Pemasukan' : 'Pengeluaran'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-right">
                  <span className={f.type === 'Income' ? 'text-emerald-500' : 'text-red-500'}>
                    {f.type === 'Income' ? '+' : '-'} Rp {f.amount.toLocaleString('id-ID')}
                  </span>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr className="bg-muted/20">
                 <td colSpan={4} className="py-16 text-center text-muted-foreground">
                   <div className="flex flex-col items-center justify-center">
                     <Banknote className="h-10 w-10 mb-3 opacity-20" />
                     <p className="text-sm font-medium">Belum ada rekaman catatan finansial.</p>
                   </div>
                 </td>
              </tr>
            )}
          </tbody>
       </table>
    </div>
  )
}
