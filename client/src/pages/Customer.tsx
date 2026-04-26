import { useState } from 'react'
import Layout from '../components/Layout'
import { Search, UserPlus, X } from 'lucide-react'
import { useCustomers, useCreateCustomer } from '../hooks/useCustomers'
import CustomerGrid from '../components/customer/CustomerGrid'

export default function Customer() {
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '' })
  
  const { data: customers = [], isLoading } = useCustomers()
  const createCustomer = useCreateCustomer()

  const displayedCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createCustomer.mutateAsync(newCustomer)
      setIsModalOpen(false)
      setNewCustomer({ name: '', email: '', phone: '', address: '' })
    } catch(err) {
      alert("Gagal menambahkan pelanggan ke Database Server")
    }
  }

  return (
    <Layout>
      <div className="flex flex-col gap-6 h-full">
        <div className="flex items-center justify-between">
           <div>
             <h2 className="text-2xl font-bold text-foreground">Pelanggan</h2>
             <p className="text-muted-foreground text-sm mt-1">Kelola data kontak dan riwayat belanja pelanggan</p>
           </div>
           
           <div className="flex gap-3">
             <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Cari nama atau nomor HP..."
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
             
             <button 
               onClick={() => setIsModalOpen(true)}
               className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
             >
                <UserPlus className="h-4 w-4 mr-2" />
                Tambah Baru
             </button>
           </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center text-muted-foreground animate-pulse font-medium">Memuat pangkalan kontak...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <CustomerGrid items={displayedCustomers} />
          </div>
        )}
      </div>

      {/* Add Customer Modal Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in transition-all">
          <div className="bg-card rounded-2xl w-full max-w-lg p-7 shadow-2xl border border-border animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground">Registrasi Pelanggan Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground bg-muted p-2 rounded-full transition-all">
                 <X className="w-5 h-5"/>
              </button>
            </div>
            
            <form onSubmit={handleAddCustomer} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Nama Lengkap</label>
                  <input required value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full px-4 py-2.5 outline-none bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Contoh: Budi Santoso" />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Nomor HP</label>
                    <input required value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full px-4 py-2.5 outline-none bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm" placeholder="08..." />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Email (Opsional)</label>
                    <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full px-4 py-2.5 outline-none bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="@gmail.com" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Alamat Lengkap</label>
                  <textarea rows={3} required value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} className="w-full px-4 py-2.5 outline-none bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" placeholder="Alamat rumah atau pengiriman..." />
                </div>
              </div>
              
              <button type="submit" disabled={createCustomer.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 px-4 rounded-xl mt-4 shadow-lg hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center disabled:opacity-50 disabled:transform-none">
                {createCustomer.isPending ? "Mendaftarkan Kontak..." : "Simpan Pelanggan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
