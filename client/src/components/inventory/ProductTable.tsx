import { PackageSearch, Trash, Edit2 } from 'lucide-react'
import { useDeleteProduct, type Product } from '../../hooks/useProducts'
import { formatImageUrl } from '../../lib/utils'

export default function ProductTable({ items, onEdit, isReadOnly }: { items: Product[], onEdit?: (product: Product) => void, isReadOnly?: boolean }) {
  const deleteProduct = useDeleteProduct()
  return (
    <div className="flex-1 overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-muted/30 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
            <th className="px-6 py-4 font-bold">Produk</th>
            <th className="px-6 py-4 font-bold">SKU</th>
            <th className="px-6 py-4 font-bold">Stok</th>
            <th className="px-6 py-4 font-bold">Batas</th>
            <th className="px-6 py-4 font-bold">Harga Jual</th>
            <th className="px-6 py-4 font-bold">Status</th>
            <th className="px-6 py-4 font-bold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-muted/50 transition-colors animate-in fade-in">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {item.image_url ? (
                      <img src={formatImageUrl(item.image_url)} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <PackageSearch className="w-5 h-5 text-muted-foreground opacity-20" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.name}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded border border-border">
                  {item.sku}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`text-sm font-bold ${item.stock_qty <= item.min_stock ? 'text-red-500' : 'text-foreground'}`}>
                  {item.stock_qty}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-muted-foreground">{item.min_stock}</td>
              <td className="px-6 py-4 text-sm font-bold text-foreground">Rp {item.selling_price.toLocaleString('id-ID')}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  item.stock_qty > item.min_stock ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' : 'border-red-500/30 bg-red-500/10 text-red-500'
                }`}>
                  {item.stock_qty > item.min_stock ? 'AMAN' : 'LOW STOCK'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end items-center gap-1">
                  {onEdit && (
                    <button 
                      onClick={() => onEdit(item)}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                      title="Edit Produk"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  {!isReadOnly && (
                    <button 
                      onClick={() => confirm('Hapus produk ini?') && deleteProduct.mutateAsync(item.id)}
                      disabled={deleteProduct.isPending}
                      className="p-2 text-muted-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10 disabled:opacity-50"
                      title="Hapus Produk"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <PackageSearch className="h-12 w-12 mb-3 opacity-10" />
          <p className="text-sm font-medium">Tidak ada produk yang ditemukan.</p>
        </div>
      )}
    </div>
  )
}
