import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Store, Shield, Save, X, QrCode, Users, Trash2 } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { useUpdateTenantProfile, useChangePassword, useStaffMembers, useAddStaff, useDeleteStaff } from '../hooks/useTenant'
import { useUploadMedia } from '../hooks/useMedia'
import { formatImageUrl } from '../lib/utils'
import { toast } from '../store/toastStore'

const BANKS = ['BCA', 'Mandiri', 'BNI', 'BRI', 'Danamon', 'CIMB Niaga', 'Permata', 'BSI', 'Lainnya']
const EWALLETS = ['GoPay', 'OVO', 'Dana', 'LinkAja', 'ShopeePay', 'Lainnya']

interface DiscountTier {
  min_spend: number
  discount_pct: number
}

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
  
  const [discountTiers, setDiscountTiers] = useState<DiscountTier[]>([])

  useEffect(() => {
    if (tenant?.payment_config) {
      try {
        const conf = JSON.parse(tenant.payment_config)
        setQrisUrl(conf.qris_url || '')
        
        if (conf.member_discount_tiers) {
           setDiscountTiers(conf.member_discount_tiers)
        } else if (conf.member_discount_pct) {
           setDiscountTiers([{ min_spend: 0, discount_pct: conf.member_discount_pct }])
        }
        
        if (conf.bank && typeof conf.bank === 'object') setBankConfig(conf.bank)
        if (conf.ewallet && typeof conf.ewallet === 'object') setEwalletConfig(conf.ewallet)
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
        ewallet: ewalletConfig,
        member_discount_tiers: discountTiers.sort((a, b) => a.min_spend - b.min_spend)
      })
      await updateProfile.mutateAsync({ 
        name: shopName, 
        slug, 
        owner_name: userName, 
        email: userEmail,
        logo_url: logoUrl,
        payment_config: cfg 
      })
      toast.success("Profil dan Konfigurasi Pembayaran Berhasil Diperbarui")
    } catch(err: any) {
      toast.error("Gagal mengubah profil: " + (err.response?.data?.message || err.message))
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await changePassword.mutateAsync(passwords)
      toast.success("Password berhasil diubah")
      setPasswordModalOpen(false)
      setPasswords({ old_password: '', new_password: '' })
    } catch(err: any) {
      toast.error("Gagal mengubah password: " + (err.response?.data?.message || err.message))
    }
  }

  const addDiscountTier = () => setDiscountTiers([...discountTiers, { min_spend: 0, discount_pct: 0 }])

  const updateTier = (index: number, field: keyof DiscountTier, value: number) => {
    const newTiers = [...discountTiers]
    newTiers[index] = { ...newTiers[index], [field]: value }
    setDiscountTiers(newTiers)
  }

  const removeTier = (index: number) => {
    setDiscountTiers(discountTiers.filter((_, i) => i !== index))
    toast.info("Tier diskon dihapus", 2000)
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengaturan Sistem & Organisasi</h1>
          <p className="text-muted-foreground mt-1 text-sm">Kelola profil, konfigurasi pembayaran, dan manajemen akses tim Anda.</p>
        </div>

        <div className="flex border-b border-border gap-8 mb-2 overflow-x-auto">
          <button onClick={() => setActiveTab('profile')} className={`pb-4 text-sm font-bold transition-all px-1 relative whitespace-nowrap ${activeTab === 'profile' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            Profil & Toko {activeTab === 'profile' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
          <button onClick={() => setActiveTab('payment')} className={`pb-4 text-sm font-bold transition-all px-1 relative whitespace-nowrap ${activeTab === 'payment' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            Metode Pembayaran {activeTab === 'payment' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
          <button onClick={() => setActiveTab('security')} className={`pb-4 text-sm font-bold transition-all px-1 relative whitespace-nowrap ${activeTab === 'security' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            Keamanan Akun {activeTab === 'security' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
          {(user?.role?.toLowerCase() === 'owner') && (
            <button onClick={() => setActiveTab('staff')} className={`pb-4 text-sm font-bold transition-all px-1 relative whitespace-nowrap ${activeTab === 'staff' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              Manajemen Tim {activeTab === 'staff' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
            </button>
          )}
        </div>

        {activeTab === 'profile' && (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
               <div className="p-6 border-b border-border flex items-center gap-3 bg-muted/30">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg"><Store className="w-5 h-5" /></div>
                  <h2 className="text-lg font-semibold text-foreground">Profil Toko (Tenant)</h2>
               </div>
               <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                     <label className="block text-sm font-semibold text-muted-foreground mb-2">Logo Toko</label>
                     <div className="flex items-center gap-6">
                        <div className="w-32 h-32 rounded-2xl bg-muted/30 border border-border overflow-hidden flex items-center justify-center relative group">
                           {logoUrl ? <><img src={formatImageUrl(logoUrl)} className="w-full h-full object-cover" /><button onClick={() => setLogoUrl('')} className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"><X /></button></> : <Store className="w-8 h-8 opacity-30" />}
                        </div>
                        <label className="px-4 py-2 bg-background border border-border rounded-xl text-sm font-medium cursor-pointer shadow-sm">
                           {uploadMedia.isPending ? 'Mengunggah...' : 'Pilih Logo Baru'}
                           <input type="file" className="hidden" accept="image/*" onChange={async (e) => { if (e.target.files?.[0]) { try { const res = await uploadMedia.mutateAsync({ file: e.target.files[0] }); const url = res.data?.url || res.url || ''; if (url) setLogoUrl(url); } catch (err) { toast.error("Gagal unggah logo") } } }} />
                        </label>
                     </div>
                  </div>
                  <div><label className="block text-sm font-semibold text-muted-foreground mb-2">Nama Toko</label><input type="text" value={shopName} onChange={e => setShopName(e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm" /></div>
                  <div><label className="block text-sm font-semibold text-muted-foreground mb-2">Slug</label><div className="flex"><span className="px-4 py-2.5 bg-muted/30 border border-border border-r-0 rounded-l-xl text-sm text-foreground">lakoo.id/</span><input type="text" value={slug} onChange={e => setSlug(e.target.value)} className="flex-1 px-4 py-2.5 bg-background border border-border rounded-r-xl text-sm font-mono text-foreground focus:ring-2 focus:ring-primary/20 outline-none" /></div></div>
                  <div><label className="block text-sm font-semibold text-muted-foreground mb-2">Nama Pemilik</label><input type="text" value={userName} onChange={e => setUserName(e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm" /></div>
                  <div><label className="block text-sm font-semibold text-muted-foreground mb-2">Email Pemilik</label><input type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm" /></div>
               </div>
            </div>
          </section>
        )}

        {activeTab === 'payment' && (
          <div className="animate-in fade-in duration-300 space-y-6">
             <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden p-6 space-y-8">
                <h2 className="font-bold flex items-center gap-2"><QrCode className="w-5 h-5 text-amber-500" /> Detail Pembayaran</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="md:col-span-1">
                      <div className="h-48 bg-muted/20 rounded-2xl border-2 border-dashed flex items-center justify-center relative overlow-hidden">
                         {qrisUrl ? <><img src={formatImageUrl(qrisUrl)} className="w-full h-full object-contain p-2" /><button onClick={() => setQrisUrl('')} className="absolute inset-0 bg-slate-900/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white"><X /></button></> : <label className="cursor-pointer text-primary font-bold text-xs p-4 text-center">Unggah QRIS<input type="file" className="hidden" accept="image/*" onChange={async (e) => { if (e.target.files?.[0]) { try { const res = await uploadMedia.mutateAsync({ file: e.target.files[0] }); const url = res.data?.url || res.url || ''; if (url) setQrisUrl(url) } catch(e) { toast.error("Gagal") } } }} /></label>}
                      </div>
                      <input type="text" placeholder="URL QRIS..." value={qrisUrl} onChange={e => setQrisUrl(e.target.value)} className="w-full mt-3 px-3 py-2 bg-background border border-border rounded-xl text-xs font-mono" />
                   </div>
                   <div className="md:col-span-2 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <select value={bankConfig.provider} onChange={e => setBankConfig({...bankConfig, provider: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none">{BANKS.map(b => <option key={b} value={b}>{b}</option>)}</select>
                         <input type="text" value={bankConfig.number} onChange={e => setBankConfig({...bankConfig, number: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none" placeholder="No Rekening" />
                      </div>
                      <input type="text" value={bankConfig.name} onChange={e => setBankConfig({...bankConfig, name: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Atas Nama (Bank)" />
                      <div className="pt-4 border-t border-border grid grid-cols-2 gap-4">
                         <select value={ewalletConfig.provider} onChange={e => setEwalletConfig({...ewalletConfig, provider: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none">{EWALLETS.map(ew => <option key={ew} value={ew}>{ew}</option>)}</select>
                         <input type="text" value={ewalletConfig.number} onChange={e => setEwalletConfig({...ewalletConfig, number: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none" placeholder="ID E-Wallet / No. HP" />
                      </div>
                      <input type="text" value={ewalletConfig.name} onChange={e => setEwalletConfig({...ewalletConfig, name: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Atas Nama (E-Wallet)" />
                   </div>
                </div>
             </section>

             <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                   <h2 className="font-bold flex items-center gap-2 text-pink-500"><Users className="w-5 h-5" /> Tiered Member Discounts</h2>
                   <button onClick={addDiscountTier} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold">+ Tambah</button>
                </div>
                <div className="space-y-3">
                   {discountTiers.map((t, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 bg-muted/20 p-4 rounded-xl border border-border group animate-in slide-in-from-top-2">
                         <div className="flex-1 grid grid-cols-2 gap-4">
                            <div><label className="text-[10px] font-black opacity-60 uppercase mb-1">Min. Belanja</label><input type="number" value={t.min_spend || ''} onChange={e => updateTier(idx, 'min_spend', e.target.value === '' ? 0 : Number(e.target.value))} className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0" /></div>
                            <div><label className="text-[10px] font-black opacity-60 uppercase mb-1">Diskon (%)</label><input type="number" value={t.discount_pct || ''} onChange={e => updateTier(idx, 'discount_pct', e.target.value === '' ? 0 : Number(e.target.value))} className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0" /></div>
                         </div>
                         <button onClick={() => removeTier(idx)} className="p-2 text-muted-foreground hover:text-red-500"><Trash2 className="w-5 h-5"/></button>
                      </div>
                   ))}
                </div>
             </section>
          </div>
        )}

        {activeTab === 'staff' && <StaffManagementSection />}

        {activeTab === 'security' && (
          <div className="animate-in fade-in duration-300">
             <div className="bg-card rounded-2xl border p-8 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4"><Shield className="w-8 h-8 text-indigo-500" /><h3 className="font-bold">Keamanan Password</h3></div>
                <button onClick={() => setPasswordModalOpen(true)} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20">Ubah Password</button>
             </div>
          </div>
        )}

        {(activeTab === 'profile' || activeTab === 'payment') && (
          <div className="flex justify-center mt-4">
            <button onClick={handleSaveProfile} disabled={updateProfile.isPending} className="bg-primary text-primary-foreground px-10 py-4 rounded-xl font-bold shadow-xl active:scale-95 disabled:opacity-50 flex items-center gap-3">
              <Save className="h-5 w-5" /> {updateProfile.isPending ? "Menyimpan..." : "Simpan Semua Selamanya"}
            </button>
          </div>
        )}
      </div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-7 shadow-2xl border animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-xl">Ubah Password</h3><button onClick={() => setPasswordModalOpen(false)}><X /></button></div>
             <form onSubmit={handleSavePassword} className="space-y-4">
                <input required type="password" value={passwords.old_password} onChange={e => setPasswords({...passwords, old_password: e.target.value})} className="w-full px-4 py-3 bg-background text-foreground border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Old Password" />
                <input required type="password" minLength={6} value={passwords.new_password} onChange={e => setPasswords({...passwords, new_password: e.target.value})} className="w-full px-4 py-3 bg-background text-foreground border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" placeholder="New Password" />
                <button type="submit" disabled={changePassword.isPending} className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-lg">{changePassword.isPending ? "Loading..." : "Konfirmasi"}</button>
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
  const { data: staff = [], refetch } = useStaffMembers()
  const addStaff = useAddStaff()
  const deleteStaff = useDeleteStaff()

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addStaff.mutateAsync(newStaff)
      setNewStaff({ name: '', email: '', password: '', role: 'cashier' })
      setInviteModalOpen(false)
      refetch()
      toast.success('Staff berhasil diundang!')
    } catch (err: any) { toast.error(`Gagal: ${err.message}`) }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Hapus akses staff ini?')) {
      try { await deleteStaff.mutateAsync(id); refetch(); toast.success('Staff dihapus') } catch (err) { toast.error("Gagal") }
    }
  }

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
       <div className="bg-card rounded-2xl border p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6"><h2 className="font-bold text-lg">Manajemen Tim</h2><button onClick={() => setInviteModalOpen(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold">+ Undand Staff</button></div>
          <table className="w-full">
             <tbody>
                {staff.map((m: any) => (
                   <tr key={m.id} className="border-b last:border-0 hover:bg-muted/10">
                      <td className="py-4 font-bold text-sm">{m.name} <span className="text-[10px] font-normal uppercase opacity-60 ml-2">{m.role}</span></td>
                      <td className="py-4 text-right">{m.role !== 'owner' && <button onClick={() => handleDelete(m.id)} className="text-red-500"><Trash2 className="w-4 h-4"/></button>}</td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
       {isInviteModalOpen && (
          <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur flex items-center justify-center p-4">
             <div className="bg-card rounded-2xl w-full max-w-md p-7 shadow-2xl border animate-in zoom-in-95">
               <div className="flex justify-between items-center mb-6"><h3 className="font-bold">Tambah Staff</h3><button onClick={() => setInviteModalOpen(false)}><X /></button></div>
               <form onSubmit={handleAddStaff} className="space-y-4">
                  <input required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full px-4 py-3 bg-background text-foreground border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Nama" title='Nama Lengkap Staff' />
                  <input required type="email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full px-4 py-3 bg-background text-foreground border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Email" />
                  <input required type="password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="w-full px-4 py-3 bg-background text-foreground border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Password" />
                  <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} className="w-full px-4 py-3 bg-background text-foreground border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"><option value="cashier">Cashier</option><option value="manager">Manager</option></select>
                  <button type="submit" disabled={addStaff.isPending} className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-lg mt-4">Simpan Member</button>
               </form>
             </div>
          </div>
       )}
    </div>
  )
}
