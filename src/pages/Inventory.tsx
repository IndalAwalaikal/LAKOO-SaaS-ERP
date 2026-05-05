import { useState, useRef } from 'react'
import Layout from '../components/Layout'
import { FileDown, FileUp, Plus, ArrowUpRight, ArrowDownRight, Search, Box, PackageSearch, X } from 'lucide-react'
import { useProducts, useCreateProduct, useUpdateProduct } from '../hooks/useProducts'
import { jsonToCsv, csvToJson } from '../lib/csvUtils'
import { useUploadMedia } from '../hooks/useMedia'
import { formatImageUrl } from '../lib/utils'
import { useAuthStore } from '../store/auth'
import type { Product } from '../hooks/useProducts'
import ProductTable from '../components/inventory/ProductTable'
import { toast } from '../store/toastStore'

export default function Inventory() {
  const { user } = useAuthStore()
  const isCashier = user?.role?.toLowerCase() === 'cashier'
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', image_url: '', cost_price: 0, selling_price: 0, stock_qty: 0, min_stock: 0, unit: 'pcs' })
  
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: products = [], isLoading, isError } = useProducts()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const uploadMedia = useUploadMedia()
  
  const handleExportCSV = () => {
    const exportData = products.map(p => ({
      sku: p.sku, name: p.name, selling_price: p.selling_price, 
      cost_price: p.cost_price, stock_qty: p.stock_qty, min_stock: p.min_stock, unit: p.unit || 'pcs'
    }))
    jsonToCsv(exportData, `inventory_lakoo_${new Date().toISOString().split('T')[0]}`)
    toast.success("Data stok berhasil diekspor")
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      try {
        const jsonData = csvToJson(text)
        if (jsonData.length === 0) return toast.warning("File CSV kosong")

        let successCount = 0
        for (const item of jsonData) {
          try {
            await createProduct.mutateAsync(item)
            successCount++
          } catch (err) {}
        }
        toast.success(`${successCount} produk berhasil diimpor`)
      } catch (err) {
        toast.error("Gagal memproses file CSV")
      }
    }
    reader.readAsText(file)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resp = await uploadMedia.mutateAsync({ file });
      const url = resp.data?.url || '';
      if (url) {
        if (isEdit && editingProduct) setEditingProduct({ ...editingProduct, image_url: url });
        else setNewProduct({ ...newProduct, image_url: url });
        toast.success("Gambar berhasil diunggah");
      }
    } catch(err) {
      toast.error("Gagal mengunggah gambar");
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createProduct.mutateAsync(newProduct as any)
      setIsModalOpen(false)
      setNewProduct({ name: '', sku: '', image_url: '', cost_price: 0, selling_price: 0, stock_qty: 0, min_stock: 0, unit: 'pcs' })
      toast.success("Produk berhasil ditambahkan")
    } catch(err: any) {
      toast.error("Gagal: " + (err.response?.data?.error?.message || err.message))
    }
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return
    try {
      await updateProduct.mutateAsync({
         id: editingProduct.id,
         name: editingProduct.name,
         sku: editingProduct.sku,
         image_url: editingProduct.image_url,
         cost_price: Number(editingProduct.cost_price || 0),
         selling_price: Number(editingProduct.selling_price || editingProduct.price || 0),
         stock_qty: Number(editingProduct.stock_qty || editingProduct.stock || 0),
         min_stock: Number(editingProduct.min_stock || 0),
         unit: editingProduct.unit || 'pcs'
      } as any)
      setEditingProduct(null)
      toast.success("Data produk diperbarui")
    } catch(err: any) {
      toast.error("Gagal memperbarui: " + (err.response?.data?.error?.message || err.message))
    }
  }

  const displayedItems = products.filter((item: Product) => item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase()))
  const lowStockCount = products.filter((p: Product) => p.stock_qty <= p.min_stock).length;
  const totalValue = products.reduce((acc: number, p: Product) => acc + (p.selling_price * p.stock_qty), 0);

  if (isLoading) return <Layout><div className="p-8">Memuat Inventori...</div></Layout>
  if (isError) return <Layout><div className="p-8 text-red-500">Gagal memuat data inventori</div></Layout>

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
            <div><div className="text-sm text-muted-foreground font-medium">Total Items</div><div className="text-2xl font-bold mt-1 text-foreground">{products.length}</div></div>
            <div className="h-12 w-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center"><PackageSearch /></div>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
            <div><div className="text-sm text-muted-foreground font-medium">Low Stock</div><div className="text-2xl font-bold mt-1 text-foreground">{lowStockCount}</div></div>
            <div className="h-12 w-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center"><ArrowDownRight /></div>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
            <div><div className="text-sm text-muted-foreground font-medium">Monthly In</div><div className="text-2xl font-bold mt-1 text-foreground">+0</div></div>
            <div className="h-12 w-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center"><ArrowUpRight /></div>
          </div>
           <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
            <div><div className="text-sm text-muted-foreground font-medium">Stock Value</div><div className="text-2xl font-bold mt-1 text-foreground truncate max-w-[120px]">Rp {totalValue.toLocaleString('id-ID')}</div></div>
            <div className="h-12 w-12 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center"><Box /></div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col min-h-[500px]">
          <div className="p-5 border-b border-border flex flex-col sm:flex-row justify-between items-center bg-muted/30 gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Cari SKU atau nama..." className="w-full pl-9 pr-4 py-2 bg-background border rounded-lg text-sm" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {!isCashier && (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
                <button onClick={handleExportCSV} className="flex-1 border bg-card hover:bg-muted text-sm font-medium px-4 py-2 rounded-lg flex items-center justify-center"><FileDown className="h-4 w-4 mr-2" /> Ekspor</button>
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 border bg-card hover:bg-muted text-sm font-medium px-4 py-2 rounded-lg flex items-center justify-center"><FileUp className="h-4 w-4 mr-2" /> Impor</button>
                <button onClick={() => setIsModalOpen(true)} className="flex-1 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg flex items-center justify-center"><Plus className="h-4 w-4 mr-2" /> Tambah</button>
              </div>
            )}
          </div>
          <ProductTable items={displayedItems} onEdit={isCashier ? undefined : (p) => setEditingProduct(p)} isReadOnly={isCashier} />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-xl p-7 shadow-2xl border border-border animate-in zoom-in-95 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Daftar Produk Baru</h3><button onClick={() => setIsModalOpen(false)}><X /></button></div>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="col-span-2"><label className="text-sm font-bold opacity-60">Nama Produk</label><input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-4 py-2.5 bg-background text-foreground border border-border rounded-xl" /></div>
              <div className="col-span-2"><label className="text-sm font-bold opacity-60">SKU / Barcode</label><input required value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="w-full px-4 py-2.5 bg-background text-foreground border border-border rounded-xl font-mono" /></div>
              <div className="col-span-2">
                 <label className="text-sm font-bold opacity-60">Foto Produk</label>
                 <div className="flex items-center gap-4 mt-1">
                    {newProduct.image_url && <img src={formatImageUrl(newProduct.image_url)} className="w-16 h-16 rounded-lg object-cover" />}
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, false)} className="text-xs flex-1" />
                 </div>
              </div>
              <div><label className="text-sm font-bold opacity-60">Stok</label><input required type="number" value={newProduct.stock_qty || ''} onChange={e => setNewProduct({...newProduct, stock_qty: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-background text-foreground border border-border rounded-xl" /></div>
              <div><label className="text-sm font-bold opacity-60">Min. Stok</label><input required type="number" value={newProduct.min_stock || ''} onChange={e => setNewProduct({...newProduct, min_stock: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-background text-foreground border border-border rounded-xl" /></div>
              <div className="col-span-2 grid grid-cols-2 gap-4 border-t pt-5">
                  <div><label className="text-sm font-bold text-amber-500">Harga Modal (Rp)</label><input required type="number" value={newProduct.cost_price || ''} onChange={e => setNewProduct({...newProduct, cost_price: Number(e.target.value)})} className="w-full px-4 py-2.5 border border-amber-500/20 bg-background text-foreground rounded-xl font-bold" /></div>
                  <div><label className="text-sm font-bold text-primary">Harga Jual (Rp)</label><input required type="number" value={newProduct.selling_price || ''} onChange={e => setNewProduct({...newProduct, selling_price: Number(e.target.value)})} className="w-full px-4 py-2.5 border border-primary/20 bg-background text-foreground rounded-xl font-bold" /></div>
              </div>
              <button type="submit" disabled={createProduct.isPending} className="col-span-2 bg-primary text-primary-foreground py-4 rounded-xl font-bold shadow-lg mt-4">{createProduct.isPending ? "Syncing..." : "Simpan Produk"}</button>
            </form>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-xl p-7 shadow-2xl border animate-in zoom-in-95 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Edit Produk</h3><button onClick={() => setEditingProduct(null)}><X /></button></div>
            <form onSubmit={handleUpdateProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="col-span-2"><label className="text-sm font-bold opacity-60">Nama Produk</label><input required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-4 py-2.5 bg-background text-foreground border border-border rounded-xl" /></div>
              <div className="col-span-2"><label className="text-sm font-bold opacity-60">SKU / Barcode</label><input required value={editingProduct.sku} onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})} className="w-full px-4 py-2.5 bg-background text-foreground border border-border rounded-xl font-mono" /></div>
              <div><label className="text-sm font-bold opacity-60">Stok</label><input required type="number" value={editingProduct.stock_qty ?? editingProduct.stock ?? ''} onChange={e => setEditingProduct({...editingProduct, stock_qty: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-background text-foreground border border-border rounded-xl" /></div>
              <div><label className="text-sm font-bold opacity-60">Min. Stok</label><input required type="number" value={editingProduct.min_stock || ''} onChange={e => setEditingProduct({...editingProduct, min_stock: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-background text-foreground border border-border rounded-xl" /></div>
              <div className="col-span-2 grid grid-cols-2 gap-4 border-t pt-5">
                  <div><label className="text-sm font-bold text-amber-500">Harga Modal</label><input required type="number" value={editingProduct.cost_price || ''} onChange={e => setEditingProduct({...editingProduct, cost_price: Number(e.target.value)})} className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-xl" /></div>
                  <div><label className="text-sm font-bold text-primary">Harga Jual</label><input required type="number" value={editingProduct.selling_price ?? editingProduct.price ?? ''} onChange={e => setEditingProduct({...editingProduct, selling_price: Number(e.target.value)})} className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-xl" /></div>
              </div>
              <button type="submit" disabled={updateProduct.isPending} className="col-span-2 bg-primary text-primary-foreground py-4 rounded-xl font-bold shadow-lg mt-4">{updateProduct.isPending ? "Updating..." : "Simpan Perubahan"}</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
