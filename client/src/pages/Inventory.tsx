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

export default function Inventory() {
  const { user } = useAuthStore()
  const isCashier = user?.role?.toLowerCase() === 'cashier'
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', image_url: '', cost_price: 0, selling_price: 0, stock_qty: 0, min_stock: 0, unit: 'pcs' })
  
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: products = [], isLoading, isError } = useProducts()
  
  const handleExportCSV = () => {
    const exportData = products.map(p => ({
      sku: p.sku,
      name: p.name,
      selling_price: p.selling_price,
      cost_price: p.cost_price,
      stock_qty: p.stock_qty,
      min_stock: p.min_stock,
      unit: p.unit || 'pcs'
    }))
    jsonToCsv(exportData, `inventory_lakoo_${new Date().toISOString().split('T')[0]}`)
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      try {
        const jsonData = csvToJson(text)
        if (jsonData.length === 0) return alert("File CSV kosong atau format tidak sesuai.")

        let successCount = 0
        for (const item of jsonData) {
          try {
            await createProduct.mutateAsync(item)
            successCount++
          } catch (err) {
            console.error(`Gagal impor SKU: ${item.sku}`, err)
          }
        }
        alert(`Impor selesai! ${successCount} produk berhasil diunggah.`)
      } catch (err) {
        alert("Gagal memproses file CSV.")
      }
    }
    reader.readAsText(file)
  }
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const uploadMedia = useUploadMedia()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resp = await uploadMedia.mutateAsync({ file });
      const url = resp.data?.url || '';
      if (isEdit && editingProduct) {
        setEditingProduct({ ...editingProduct, image_url: url });
      } else {
        setNewProduct({ ...newProduct, image_url: url });
      }
    } catch(err) {
      alert("Gagal mengunggah gambar!");
    }
  }

  const displayedItems = products.filter((item: Product) => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.sku.toLowerCase().includes(search.toLowerCase())
  )

  const lowStockCount = products.filter((p: Product) => p.stock_qty <= p.min_stock).length;
  const totalValue = products.reduce((acc: number, p: Product) => acc + (p.selling_price * p.stock_qty), 0);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createProduct.mutateAsync({
         name: newProduct.name,
         sku: newProduct.sku,
         image_url: newProduct.image_url,
         cost_price: newProduct.cost_price,
         selling_price: newProduct.selling_price,
         stock_qty: newProduct.stock_qty,
         min_stock: newProduct.min_stock,
         unit: newProduct.unit || 'pcs'
      } as any)
      setIsModalOpen(false)
      setNewProduct({ name: '', sku: '', image_url: '', cost_price: 0, selling_price: 0, stock_qty: 0, min_stock: 0, unit: 'pcs' })
    } catch(err) {
      alert("Gagal menambahkan produk ke Database Server")
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
    } catch(err) {
      alert("Gagal memperbarui produk di Database")
    }
  }

  if (isLoading) return <Layout><div className="p-8">Loading inventory...</div></Layout>
  if (isError) return <Layout><div className="p-8 text-red-500">Failed to load inventory</div></Layout>

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        
        {/* Top Header Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground font-medium">Total Items</div>
              <div className="text-2xl font-bold text-foreground mt-1">{products.length}</div>
            </div>
            <div className="h-12 w-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center">
              <PackageSearch className="h-6 w-6" />
            </div>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground font-medium">Low Stock</div>
              <div className="text-2xl font-bold text-foreground mt-1">{lowStockCount}</div>
            </div>
            <div className="h-12 w-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center">
              <ArrowDownRight className="h-6 w-6" />
            </div>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground font-medium">Stock In (Monthly)</div>
              <div className="text-2xl font-bold text-foreground mt-1">+0</div>
            </div>
            <div className="h-12 w-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground font-medium">Value Estimate</div>
              <div className="text-2xl font-bold text-foreground mt-1 truncate max-w-[120px]">Rp {totalValue.toLocaleString('id-ID')}</div>
            </div>
            <div className="h-12 w-12 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center">
              <Box className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col min-h-[500px]">
          {/* Toolbar */}
          <div className="p-5 border-b border-border sm:flex-row flex-col flex justify-between items-center bg-muted/30 gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Cari SKU atau nama barang..."
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            {!isCashier && (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
                <button 
                  onClick={() => handleExportCSV()}
                  className="flex-1 sm:flex-none border border-border bg-card hover:bg-muted text-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors shadow-sm"
                >
                  <FileDown className="h-4 w-4 mr-2 text-muted-foreground" />
                  Ekspor
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 sm:flex-none border border-border bg-card hover:bg-muted text-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors shadow-sm"
                >
                  <FileUp className="h-4 w-4 mr-2 text-muted-foreground" />
                  Impor
                </button>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah
                </button>
              </div>
            )}
          </div>

          {/* Isolated Table Layer */}
          <ProductTable items={displayedItems} onEdit={isCashier ? undefined : (p) => setEditingProduct(p)} isReadOnly={isCashier} />
          
        </div>
      </div>

      {/* Add Product Modal Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in transition-all">
          <div className="bg-card rounded-2xl w-full max-w-xl p-7 shadow-2xl border border-border animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground">Registrasi Inventori Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground bg-muted p-2 rounded-full transition-all">
                 <X className="w-5 h-5"/>
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Nama Produk</label>
                  <input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-4 py-2.5 outline-none bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Contoh: Kopi Bubuk Asli" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">SKU / Barcode</label>
                  <input required value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="w-full px-4 py-2.5 outline-none bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm" placeholder="KOP-001" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Foto Produk (Opsional)</label>
                  <div className="flex items-start gap-4">
                    {newProduct.image_url && (
                      <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden shrink-0 border border-border shadow-sm">
                        <img src={formatImageUrl(newProduct.image_url)} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <input type="text" placeholder="Tempel Tautan URL Gambar Eksternal (https://...)" value={newProduct.image_url} onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})} className="w-full px-4 py-2 outline-none bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-xs font-bold text-muted-foreground">ATAU UNGGAH LOKAL:</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, false)} className="flex-1 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer text-sm" />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Stok Aktual</label>
                  <input required type="number" min="0" value={newProduct.stock_qty || ''} onChange={e => setNewProduct({...newProduct, stock_qty: Number(e.target.value)})} className="w-full px-4 py-2.5 outline-none bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Peringatan Stok Minimum</label>
                  <input required type="number" min="0" value={newProduct.min_stock || ''} onChange={e => setNewProduct({...newProduct, min_stock: Number(e.target.value)})} className="w-full px-4 py-2.5 outline-none bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="5" />
                </div>
                <div className="col-span-2 mt-2 pt-5 border-t border-border grid grid-cols-2 gap-5">
                   <div>
                     <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Harga Beli Modal (Rp)</label>
                     <input required type="number" min="0" value={newProduct.cost_price || ''} onChange={e => setNewProduct({...newProduct, cost_price: Number(e.target.value)})} className="w-full px-4 py-2.5 outline-none bg-amber-500/10 focus:bg-background border border-amber-500/30 rounded-xl focus:border-amber-500 transition-all font-bold text-amber-500 placeholder-amber-500/50" placeholder="HPP" />
                   </div>
                   <div>
                     <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Harga Jual Akhir (Rp)</label>
                     <input required type="number" min="0" value={newProduct.selling_price || ''} onChange={e => setNewProduct({...newProduct, selling_price: Number(e.target.value)})} className="w-full px-4 py-2.5 outline-none bg-primary/10 focus:bg-background border border-primary/30 rounded-xl focus:border-primary transition-all font-bold text-primary placeholder-primary/50" placeholder="Harga Rak" />
                   </div>
                </div>
              </div>
              
              <button type="submit" disabled={createProduct.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 px-4 rounded-xl mt-4 shadow-lg hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center disabled:opacity-50 disabled:transform-none">
                {createProduct.isPending ? "Menyinkronkan ke Database..." : "Simpan & Daftarkan Inventori"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal Drawer */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in transition-all">
          <div className="bg-card rounded-2xl w-full max-w-xl p-7 shadow-2xl border border-border animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground">Perbarui Inventori</h3>
              <button onClick={() => setEditingProduct(null)} className="text-muted-foreground hover:text-foreground bg-muted p-2 rounded-full transition-all">
                 <X className="w-5 h-5"/>
              </button>
            </div>
            
            <form onSubmit={handleUpdateProduct} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Nama Produk</label>
                  <input required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-4 py-2.5 outline-none bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">SKU / Barcode</label>
                  <input required value={editingProduct.sku} onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})} className="w-full px-4 py-2.5 outline-none bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Foto Produk (Opsional)</label>
                  <div className="flex items-start gap-4">
                    {editingProduct.image_url && (
                      <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden shrink-0 border border-border shadow-sm">
                        <img src={formatImageUrl(editingProduct.image_url)} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <input type="text" placeholder="Tempel Tautan URL Gambar Eksternal (https://...)" value={editingProduct.image_url} onChange={(e) => setEditingProduct({...editingProduct, image_url: e.target.value})} className="w-full px-4 py-2 outline-none bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-xs font-bold text-muted-foreground">ATAU UNGGAH LOKAL:</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, true)} className="flex-1 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer text-sm" />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Stok Aktual</label>
                  <input required type="number" min="0" value={editingProduct.stock_qty ?? editingProduct.stock ?? ''} onChange={e => setEditingProduct({...editingProduct, stock_qty: Number(e.target.value)})} className="w-full px-4 py-2.5 outline-none bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Peringatan Stok Minimum</label>
                  <input required type="number" min="0" value={editingProduct.min_stock || ''} onChange={e => setEditingProduct({...editingProduct, min_stock: Number(e.target.value)})} className="w-full px-4 py-2.5 outline-none bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
                <div className="col-span-2 mt-2 pt-5 border-t border-border grid grid-cols-2 gap-5">
                   <div>
                     <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Harga Beli Modal (Rp)</label>
                     <input required type="number" min="0" value={editingProduct.cost_price || ''} onChange={e => setEditingProduct({...editingProduct, cost_price: Number(e.target.value)})} className="w-full px-4 py-2.5 outline-none bg-amber-500/10 focus:bg-background border border-amber-500/30 rounded-xl focus:border-amber-500 transition-all font-bold text-amber-500 placeholder-amber-500/50" />
                   </div>
                   <div>
                     <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Harga Jual Akhir (Rp)</label>
                     <input required type="number" min="0" value={editingProduct.selling_price ?? editingProduct.price ?? ''} onChange={e => setEditingProduct({...editingProduct, selling_price: Number(e.target.value)})} className="w-full px-4 py-2.5 outline-none bg-primary/10 focus:bg-background border border-primary/30 rounded-xl focus:border-primary transition-all font-bold text-primary placeholder-primary/50" />
                   </div>
                </div>
              </div>
              
              <button type="submit" disabled={updateProduct.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 px-4 rounded-xl mt-4 shadow-lg hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center disabled:opacity-50 disabled:transform-none">
                {updateProduct.isPending ? "Mensinkronkan Perubahan..." : "Simpan Perubahan Inventori"}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
