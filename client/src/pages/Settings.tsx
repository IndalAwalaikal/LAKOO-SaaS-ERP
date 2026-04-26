import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Store, User, Shield, Save, UploadCloud, X, QrCode, Users, UserPlus, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { useUpdateTenantProfile, useChangePassword, useStaffMembers, useAddStaff, useDeleteStaff } from '../hooks/useTenant'
import { useUploadMedia } from '../hooks/useMedia'
import { formatImageUrl } from '../lib/utils'

const BANKS = ['BCA', 'Mandiri', 'BNI', 'BRI', 'Danamon', 'CIMB Niaga', 'Permata', 'BSI', 'Lainnya']
const EWALLETS = ['GoPay', 'OVO', 'Dana', 'LinkAja', 'ShopeePay', 'Lainnya']

export default function Settings() {
  const { user, tenant } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'payment' | 'staff' | 'security'>('profile')
  
  const [shopName, setShopName] = useState(tenant?.name || '')
  const [slug, setSlug] = useState(tenant?.slug || '')
  
  const [userName, setUserName] = useState(user?.name || '')
  const [userEmail, setUserEmail] = useState(user?.email || '')
  const [logoUrl, setLogoUrl] = useState(tenant?.logo_url || '')

  const [qrisUrl, setQrisUrl] = useState('')
  const [bankConfig, setBankConfig] = useState({ provider: '', name: '', number: '' })
  const [ewalletConfig, setEwalletConfig] = useState({ provider: '', name: '', number: '' })

  useEffect(() => {
    if (tenant?.payment_config) {
      try {
        const conf = JSON.parse(tenant.payment_config)
        setQrisUrl(conf.qris_url || '')
        
        const b = conf.bank
        if (b && typeof b === 'object') {
          setBankConfig(b as any)
        } else if (typeof b === 'string') {
          setBankConfig({ provider: 'Lainnya', name: 'Legacy Data', number: b })
        }

        const ewc = conf.ewallet
        if (ewc && typeof ewc === 'object') {
          setEwalletConfig(ewc as any)
        } else if (typeof ewc === 'string') {
          setEwalletConfig({ provider: 'Lainnya', name: 'Legacy Data', number: ewc })
        }
      } catch(e) {}
    }
  }, [tenant])

  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '' })

  const updateProfile = useUpdateTenantProfile()
  const changePassword = useChangePassword()
  const uploadMedia = useUploadMedia()

  const handleSaveProfile = async () => {
    try {
      const cfg = JSON.stringify({ 
        qris_url: qrisUrl, 
        bank: bankConfig, 
        ewallet: ewalletConfig 
      })
      await updateProfile.mutateAsync({ 
        name: shopName, 
        slug, 
        owner_name: userName, 
        email: userEmail,
        logo_url: logoUrl,
        payment_config: cfg 
      })
      alert("Profil dan Konfigurasi Pembayaran Berhasil Diperbarui")
    } catch(err: any) {
      alert("Gagal mengubah profil: " + (err.response?.data?.message || err.message))
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await changePassword.mutateAsync(passwords)
      alert("Password berhasil diubah")
      setPasswordModalOpen(false)
      setPasswords({ old_password: '', new_password: '' })
    } catch(err: any) {
      alert("Gagal mengubah password: " + (err.response?.data?.message || err.message))
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-10">
        
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengaturan Sistem & Organisasi</h1>
          <p className="text-muted-foreground mt-1 text-sm">Kelola profil, konfigurasi pembayaran, dan manajemen akses tim Anda.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border gap-8 mb-2 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`pb-4 text-sm font-bold transition-all px-1 relative whitespace-nowrap ${activeTab === 'profile' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Profil & Toko
            {activeTab === 'profile' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('payment')}
            className={`pb-4 text-sm font-bold transition-all px-1 relative whitespace-nowrap ${activeTab === 'payment' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Metode Pembayaran
            {activeTab === 'payment' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`pb-4 text-sm font-bold transition-all px-1 relative whitespace-nowrap ${activeTab === 'security' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Keamanan Akun
            {activeTab === 'security' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
          
          {(user?.role?.toLowerCase() === 'owner') && (
            <button 
              onClick={() => setActiveTab('staff')}
              className={`pb-4 text-sm font-bold transition-all px-1 relative whitespace-nowrap ${activeTab === 'staff' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Manajemen Tim
              {activeTab === 'staff' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
            </button>
          )}
        </div>

        {activeTab === 'profile' && (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
               <div className="p-6 border-b border-border flex items-center gap-3 bg-muted/30">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                     <Store className="w-5 h-5" />
                  </div>
                  <div>
                     <h2 className="text-lg font-semibold text-foreground">Profil Toko (Tenant)</h2>
                     <p className="text-sm text-muted-foreground">Konfigurasi representasi toko Anda di ekosistem ERP Lakoo.</p>
                  </div>
               </div>
               
               <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                     <label className="block text-sm font-semibold text-muted-foreground mb-2">Logo Banner Perusahaan</label>
                     <div className="flex items-center gap-6">
                        <div className="w-32 h-32 rounded-2xl bg-muted/30 border border-border overflow-hidden flex items-center justify-center flex-shrink-0 relative group">
                           {logoUrl ? (
                              <>
                                 <img src={formatImageUrl(logoUrl)} alt="Logo" className="w-full h-full object-cover" />
                                 <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={() => setLogoUrl('')} className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-all"><X className="w-4 h-4"/></button>
                                 </div>
                              </>
                           ) : (
                              <Store className="w-8 h-8 text-muted-foreground opacity-30" />
                           )}
                        </div>
                        <div className="flex-1">
                           <label className="inline-flex items-center px-4 py-2 bg-background border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted cursor-pointer shadow-sm transition-all mb-2">
                              <UploadCloud className="w-4 h-4 mr-2" />
                              {uploadMedia.isPending ? 'Mengunggah...' : 'Pilih Logo Baru'}
                              <input 
                                 type="file" 
                                 className="hidden" 
                                 accept="image/*"
                                 onChange={async (e) => {
                                    if (e.target.files?.[0]) {
                                       try {
                                         const res = await uploadMedia.mutateAsync({ 
                                            file: e.target.files[0]
                                         })
                                         const newUrl = res.data?.url || res.url || ''
                                          if (newUrl) {
                                             setLogoUrl(newUrl)
                                          } else {
                                             alert("Format respons server tidak dikenal.")
                                          }
                                       } catch (err: any) {
                                          alert("Gagal mengunggah logo: " + (err.response?.data?.message || err.message))
                                       }
                                    }
                                 }}
                              />
                           </label>
                           <p className="text-xs text-muted-foreground">Direkomendasikan format PNG/JPG transparan (Maks 2MB)</p>
                        </div>
                     </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">Nama Toko / Organisasi</label>
                    <input 
                      type="text" 
                      value={shopName}
                      onChange={e => setShopName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">Slug Akses Subdomain</label>
                    <div className="flex">
                       <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-border bg-muted/30 text-muted-foreground text-sm">
                         lakoo.id/
                       </span>
                       <input 
                         type="text" 
                         value={slug}
                         onChange={e => setSlug(e.target.value)}
                         className="flex-1 w-full px-4 py-2.5 bg-background border border-border rounded-r-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-foreground"
                       />
                    </div>
                  </div>
               </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
               <div className="p-6 border-b border-border flex items-center gap-3 bg-muted/30">
                  <div className="p-2 bg-emerald-100/10 text-emerald-500 rounded-lg">
                     <User className="w-5 h-5" />
                  </div>
                  <div>
                     <h2 className="text-lg font-semibold text-foreground">Informasi Pemilik</h2>
                     <p className="text-sm text-muted-foreground">Data kontak utama untuk akun pengelola bisnis.</p>
                  </div>
               </div>
               <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">Nama Pemilik Akun</label>
                    <input 
                      type="text" 
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={userEmail}
                      onChange={e => setUserEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
               </div>
            </div>
          </section>
        )}

        {activeTab === 'payment' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
             <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex items-center gap-3 bg-muted/30">
                   <div className="p-2 bg-amber-100/10 text-amber-500 rounded-lg">
                      <QrCode className="w-5 h-5" />
                   </div>
                   <div>
                      <h2 className="text-lg font-semibold text-foreground">Detail Pembayaran Pelanggan (POS)</h2>
                      <p className="text-sm text-muted-foreground">Atur instruksi transfer dan QRIS untuk pelanggan kasir.</p>
                   </div>
                </div>
                <div className="p-6 space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1">
                         <label className="block text-sm font-semibold text-muted-foreground mb-2">Metode QRIS</label>
                         <div className="mt-2 w-full h-48 bg-muted/20 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center relative overflow-hidden group">
                            {qrisUrl ? (
                               <>
                                  <img src={formatImageUrl(qrisUrl)} alt="QRIS" className="w-full h-full object-contain p-2" />
                                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                     <button onClick={() => setQrisUrl('')} className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-all"><X className="w-5 h-5"/></button>
                                  </div>
                               </>
                            ) : (
                               <div className="flex flex-col items-center text-muted-foreground p-4 text-center">
                                  <QrCode className="w-10 h-10 mb-2 opacity-30" />
                                  <label className="text-xs font-bold text-primary hover:underline cursor-pointer">
                                     Unggah File QRIS
                                     <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={async (e) => {
                                           if (e.target.files?.[0]) {
                                              try {
                                                 const res = await uploadMedia.mutateAsync({ file: e.target.files[0] })
                                                 const url = res.data?.url || res.url || ''
                                                 if (url) setQrisUrl(url)
                                              } catch (err: any) { alert("Gagal unggah QRIS") }
                                           }
                                        }}
                                     />
                                  </label>
                               </div>
                            )}
                         </div>
                         <input 
                            type="text" 
                            placeholder="URL QRIS..." 
                            value={qrisUrl} 
                            onChange={e => setQrisUrl(e.target.value)} 
                            className="w-full mt-3 px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:ring-2 focus:ring-primary/20 transition-all font-mono" 
                         />
                      </div>

                      <div className="md:col-span-2 space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Pilih Bank</label>
                               <select 
                                  value={bankConfig.provider}
                                  onChange={e => setBankConfig({...bankConfig, provider: e.target.value})}
                                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 transition-all"
                               >
                                  <option value="">-- Pilih Bank --</option>
                                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                               </select>
                            </div>
                            <div>
                               <label className="block text-sm font-semibold text-muted-foreground mb-1.5">No. Rekening</label>
                               <input 
                                  type="text" 
                                  value={bankConfig.number}
                                  onChange={e => setBankConfig({...bankConfig, number: e.target.value})}
                                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground font-mono focus:ring-2 focus:ring-primary/20 transition-all"
                               />
                            </div>
                         </div>
                         <div>
                            <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Atas Nama (Rekening)</label>
                            <input 
                               type="text" 
                               value={bankConfig.name}
                               onChange={e => setBankConfig({...bankConfig, name: e.target.value})}
                               className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                         </div>
                         
                         <div className="pt-6 border-t border-border grid grid-cols-2 gap-4">
                             <div>
                               <label className="block text-sm font-semibold text-muted-foreground mb-1.5">E-Wallet Platform</label>
                               <select 
                                  value={ewalletConfig.provider}
                                  onChange={e => setEwalletConfig({...ewalletConfig, provider: e.target.value})}
                                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 transition-all"
                               >
                                  <option value="">-- Pilih Wallet --</option>
                                  {EWALLETS.map(e => <option key={e} value={e}>{e}</option>)}
                               </select>
                             </div>
                             <div>
                               <label className="block text-sm font-semibold text-muted-foreground mb-1.5">ID E-Wallet / Nomor</label>
                               <input 
                                  type="text" 
                                  value={ewalletConfig.number}
                                  onChange={e => setEwalletConfig({...ewalletConfig, number: e.target.value})}
                                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground font-mono focus:ring-2 focus:ring-primary/20 transition-all"
                               />
                             </div>
                         </div>
                      </div>
                   </div>
                </div>
             </section>
          </div>
        )}

        {activeTab === 'staff' && <StaffManagementSection />}

        {activeTab === 'security' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
             <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex items-center gap-3 bg-muted/30">
                   <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                      <ShieldCheck className="w-5 h-5" />
                   </div>
                   <div>
                      <h2 className="text-lg font-semibold text-foreground">Keamanan Sesi & Password</h2>
                      <p className="text-sm text-muted-foreground">Lindungi akun Anda dengan kata sandi yang kuat.</p>
                   </div>
                </div>
                <div className="p-8">
                   <div className="bg-muted/10 border border-border rounded-2xl p-6 flex items-center justify-between gap-6 flex-wrap">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                            <Shield className="w-6 h-6" />
                         </div>
                         <div>
                            <h3 className="font-bold text-foreground">Ubah Kata Sandi</h3>
                            <p className="text-xs text-muted-foreground">Terakhir diubah: Beberapa saat yang lalu</p>
                         </div>
                      </div>
                      <button 
                         onClick={() => setPasswordModalOpen(true)}
                         className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95"
                      >
                         Perbarui Password
                      </button>
                   </div>
                </div>
             </section>
          </div>
        )}

        {(activeTab === 'profile' || activeTab === 'payment') && (
          <div className="flex justify-center mt-4">
            <button 
              onClick={handleSaveProfile} 
              disabled={updateProfile.isPending}
              className="bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-xl text-md font-bold flex items-center transition-all shadow-lg hover:shadow-primary/30 hover:-translate-y-1 disabled:opacity-50"
            >
              <Save className="h-5 w-5 mr-3" />
              {updateProfile.isPending ? "Menyimpan Konfigurasi..." : "Simpan Semua Pengaturan"}
            </button>
          </div>
        )}
      </div>

      {/* Shared Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in transition-all">
          <div className="bg-card rounded-2xl w-full max-w-md p-7 shadow-2xl border border-border animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-foreground">Ubah Kata Sandi</h3>
               <button onClick={() => setPasswordModalOpen(false)} className="text-muted-foreground hover:text-foreground bg-muted p-2 rounded-full transition-all">
                  <X className="w-5 h-5"/>
               </button>
            </div>
            <form onSubmit={handleSavePassword} className="flex flex-col gap-5">
               <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Kata Sandi Saat Ini</label>
                  <input required type="password" value={passwords.old_password} onChange={e => setPasswords({...passwords, old_password: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground font-mono focus:border-primary transition-all" placeholder="••••••••" />
               </div>
               <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Kata Sandi Baru</label>
                  <input required type="password" minLength={6} value={passwords.new_password} onChange={e => setPasswords({...passwords, new_password: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground font-mono focus:border-primary transition-all" placeholder="Minimal 6 karakter" />
               </div>
               <button type="submit" disabled={changePassword.isPending} className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                  {changePassword.isPending ? "Memproses..." : "Konfirmasi Perubahan"}
               </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

function StaffManagementSection() {
  const [isInviteModalOpen, setInviteModalOpen] = useState(false)
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'cashier' })
  const { data: staff = [], isLoading, refetch } = useStaffMembers()
  const addStaff = useAddStaff()
  const deleteStaff = useDeleteStaff()

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addStaff.mutateAsync({
        ...newStaff,
        name: newStaff.name.trim(),
        email: newStaff.email.trim()
      })
      setNewStaff({ name: '', email: '', password: '', role: 'cashier' })
      setInviteModalOpen(false)
      refetch()
      alert('Staff berhasil diundang!')
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message
      alert(`Gagal mengundang staff: ${msg}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus akses staff ini?')) {
      try {
        await deleteStaff.mutateAsync(id)
        refetch()
      } catch (err: any) {
        alert("Gagal menghapus staff.")
      }
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
       <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                   <Users className="w-5 h-5" />
                </div>
                <div>
                   <h2 className="text-lg font-semibold text-foreground">Manajemen Tim</h2>
                   <p className="text-sm text-muted-foreground">Kelola siapa saja yang memiliki akses ke dashboard toko Anda.</p>
                </div>
             </div>
             <button 
               onClick={() => setInviteModalOpen(true)}
               className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center shadow-lg shadow-primary/20 transition-all active:scale-95"
             >
                <UserPlus className="w-4 h-4 mr-2" />
                Tambah Staff
             </button>
          </div>

          <div className="p-6">
             {isLoading ? (
               <div className="py-8 text-center text-muted-foreground animate-pulse">Memuat data tim...</div>
             ) : (
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="text-[10px] uppercase font-black text-muted-foreground tracking-widest border-b border-border">
                           <th className="pb-4 px-2">Nama & Peran</th>
                           <th className="pb-4 px-2 text-center">Status</th>
                           <th className="pb-4 px-2 text-right">Aksi</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-border">
                        {staff.map((member: any) => (
                           <tr key={member.id} className="group transition-colors hover:bg-muted/5">
                              <td className="py-4 px-2">
                                 <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                       {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                       <div className="text-sm font-bold text-foreground">{member.name}</div>
                                       <div className="text-[10px] text-muted-foreground uppercase font-medium">{member.role}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-4 px-2 text-center">
                                 <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-500 uppercase">
                                    Aktif
                                 </span>
                              </td>
                              <td className="py-4 px-2 text-right">
                                 {member.role !== 'owner' && (
                                    <button 
                                      onClick={() => handleDelete(member.id)}
                                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                    >
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 )}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
             )}
          </div>
       </section>

       <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 flex gap-4">
          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg h-fit">
             <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
             <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Hak Akses Role (RBAC)</h4>
             <p className="text-xs text-indigo-800 dark:text-indigo-400/80 leading-relaxed mt-1">
                **Manager** memiliki akses penuh kecuali manajemen log keuangan sensitif. **Cashier** terbatas hanya pada POS dan Inventori stok. Gunakan peran ini secara bijak untuk keamanan data organisasi.
             </p>
          </div>
       </div>

       {/* Invite Modal */}
       {isInviteModalOpen && (
         <div className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in p-4">
            <div className="bg-card rounded-2xl w-full max-w-md p-7 shadow-2xl border border-border animate-in zoom-in-95">
               <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <UserPlus className="w-5 h-5" />
                     </div>
                     <h3 className="text-lg font-bold text-foreground">Undang Staff Baru</h3>
                  </div>
                  <button onClick={() => setInviteModalOpen(false)} className="text-muted-foreground hover:text-foreground bg-muted p-2 rounded-full transition-all">
                     <X className="w-5 h-5"/>
                  </button>
               </div>
               
               <form onSubmit={handleAddStaff} className="space-y-4">
                  <div>
                     <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase">Nama Lengkap</label>
                     <input required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:border-primary transition-all" placeholder="Masukkan nama..." />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase">Email Address</label>
                     <input required type="email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:border-primary transition-all" placeholder="email@toko.id" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase">Password</label>
                        <input required type="password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground font-mono focus:border-primary transition-all" placeholder="••••••••" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase">Role / Peran</label>
                        <select 
                           value={newStaff.role} 
                           onChange={e => setNewStaff({...newStaff, role: e.target.value})}
                           className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:border-primary transition-all"
                        >
                           <option value="cashier">Cashier</option>
                           <option value="manager">Manager</option>
                        </select>
                     </div>
                  </div>
                  <button type="submit" disabled={addStaff.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 mt-4">
                     {addStaff.isPending ? "Memproses..." : "Daftarkan Staff Sekarang"}
                  </button>
               </form>
            </div>
         </div>
       )}
    </div>
  )
}
