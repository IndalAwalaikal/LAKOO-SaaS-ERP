import { useState } from 'react'
import Layout from '../components/Layout'
import { Search, UserPlus, X, Pencil } from 'lucide-react'
import { useCustomers, useCreateCustomer, useUpdateCustomer } from '../hooks/useCustomers'
import CustomerGrid from '../components/customer/CustomerGrid'
import { toast } from '../store/toastStore'

export default function Customer() {
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '', is_member: false })
  
  const { data: customers = [], isLoading } = useCustomers()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const [editingCustomer, setEditingCustomer] = useState<any>(null)

  const displayedCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createCustomer.mutateAsync(newCustomer)
      setIsModalOpen(false)
      setNewCustomer({ name: '', email: '', phone: '', address: '', is_member: false })
      toast.success("Pelanggan baru berhasil didaftarkan")
    } catch(err) {
      toast.error("Gagal mendaftarkan pelanggan ke server")
    }
  }

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCustomer) return
    try {
      await updateCustomer.mutateAsync(editingCustomer)
      setEditingCustomer(null)
      toast.success("Data pelanggan berhasil diperbarui")
    } catch(err) {
      toast.error("Gagal memperbarui data pelanggan")
    }
  }

  return (
    <Layout>
      <div className="flex flex-col gap-6 h-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div>
             <h2 className="text-2xl font-bold text-foreground">Pelanggan</h2>
             <p className="text-muted-foreground text-sm mt-1">Kelola data kontak dan riwayat belanja pelanggan</p>
           </div>
           
           <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Cari nama atau nomor HP..."
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
             
             <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center transition-colors shadow-sm w-full sm:w-auto">
                <UserPlus className="h-4 w-4 mr-2" /> Tambah Baru
             </button>
           </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center text-muted-foreground animate-pulse font-medium">Memuat pangkalan kontak...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CustomerGrid items={displayedCustomers} onEdit={setEditingCustomer} />
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg p-5 sm:p-7 shadow-2xl border border-border animate-in zoom-in-95 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground">Registrasi Pelanggan Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground bg-muted p-2 rounded-full transition-all"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleAddCustomer} className="flex flex-col gap-5">
               <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Nama Lengkap</label>
                    <input required value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground text-sm" placeholder="Contoh: Budi Santoso" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Nomor HP</label>
                      <input required value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground font-mono text-sm" placeholder="08..." />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Email (Opsional)</label>
                      <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground text-sm" placeholder="@gmail.com" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Alamat Lengkap</label>
                    <textarea rows={3} required value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground text-sm resize-none" placeholder="Alamat rumah..." />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg"><UserPlus className="w-4 h-4" /></div>
                        <div><p className="text-sm font-bold text-foreground">Status Pelanggan Member</p><p className="text-[10px] text-muted-foreground uppercase font-black">Aktifkan diskon otomatis</p></div>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={newCustomer.is_member} onChange={e => setNewCustomer({...newCustomer, is_member: e.target.checked})} />
                        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                     </label>
                  </div>
               </div>
               <button type="submit" disabled={createCustomer.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                {createCustomer.isPending ? "Sedang Menyimpan..." : "Simpan Pelanggan"}
               </button>
            </form>
          </div>
        </div>
      )}

      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg p-5 sm:p-7 shadow-2xl border border-border animate-in zoom-in-95 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground">Perbarui Data Pelanggan</h3>
              <button onClick={() => setEditingCustomer(null)} className="text-muted-foreground hover:text-foreground bg-muted p-2 rounded-full transition-all"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleEditCustomer} className="flex flex-col gap-5">
               <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Nama Lengkap</label>
                    <input required value={editingCustomer.name} onChange={e => setEditingCustomer({...editingCustomer, name: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground text-sm" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Nomor HP</label>
                      <input required value={editingCustomer.phone} onChange={e => setEditingCustomer({...editingCustomer, phone: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground font-mono text-sm" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Email (Opsional)</label>
                      <input type="email" value={editingCustomer.email} onChange={e => setEditingCustomer({...editingCustomer, email: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Alamat Lengkap</label>
                    <textarea rows={3} required value={editingCustomer.address} onChange={e => setEditingCustomer({...editingCustomer, address: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground text-sm resize-none" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg"><Pencil className="w-4 h-4" /></div>
                        <div><p className="text-sm font-bold text-foreground">Status Pelanggan Member</p><p className="text-[10px] text-muted-foreground uppercase font-black">Aktifkan diskon otomatis</p></div>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={editingCustomer.is_member} onChange={e => setEditingCustomer({...editingCustomer, is_member: e.target.checked})} />
                        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                     </label>
                  </div>
               </div>
               <button type="submit" disabled={updateCustomer.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                {updateCustomer.isPending ? "Sedang Memperbarui..." : "Simpan Perubahan"}
               </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
