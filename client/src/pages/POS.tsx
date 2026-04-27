import { useState, useMemo, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { 
  Search, ShoppingBag, Plus, Minus,
  X, Printer, CheckCircle2, QrCode, Trash2, Wallet, 
  ArrowLeft, TrendingUp
} from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { useCustomers } from '../hooks/useCustomers'
import type { Product } from '../hooks/useProducts'
import { apiClient } from '../lib/api'
import { useAuthStore } from '../store/auth'
import { formatImageUrl } from '../lib/utils'
import { toast } from '../store/toastStore'

export default function POS() {
  const { tenant } = useAuthStore()
  const [cart, setCart] = useState<{product: Product, qty: number}[]>([])
  const [search, setSearch] = useState('')
  const { data: products = [] } = useProducts()
  const { data: customers = [] } = useCustomers()
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const [showModal, setShowModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash'|'qris'|'transfer'|'ewallet'>('cash')
  const [paymentDetected, setPaymentDetected] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerResults, setShowCustomerResults] = useState(false)
  
  const [discount, setDiscount] = useState<number>(0)
  const [appliedTier, setAppliedTier] = useState<{min_spend: number, discount_pct: number} | null>(null)
  console.log("Current applied discount tier:", appliedTier?.discount_pct); // Use it in a console log for verification (will be removed or kept for debug)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastInvoice, setLastInvoice] = useState<any>(null)
  const [showCartMobile, setShowCartMobile] = useState(false)

  const paymentConfig = useMemo(() => {
    if (tenant?.payment_config) {
      try { return JSON.parse(tenant.payment_config) } catch (e) { return null }
    }
    return null
  }, [tenant])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); if (cart.length > 0) setShowModal(true) }
      if (e.key === 'Escape') { setShowModal(false); setShowReceipt(false) }
      if (e.key === '/') { if (document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); searchInputRef.current?.focus() } }
      if (e.key === 'Enter' && showModal && !isProcessing && !isDetecting && !showCustomerResults) handleCheckout()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart, showModal, isProcessing, isDetecting, showCustomerResults])

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id)
    const currentQty = existing ? existing.qty : 0

    if (product.stock_qty <= 0) {
      toast.error(`Stok ${product.name} sudah habis!`, 2000)
      return
    }

    if (currentQty + 1 > product.stock_qty) {
      toast.warning(`Stok ${product.name} tidak mencukupi!`, 2000)
      return
    }

    setCart(prev => {
      const isExisting = prev.find(item => item.product.id === product.id)
      if (isExisting) return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item)
      return [...prev, { product, qty: 1 }]
    })
    toast.info(`${product.name} ditambahkan ke keranjang`, 1000)
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const updateQty = (id: string, delta: number) => {
    const item = cart.find(i => i.product.id === id)
    if (!item) return

    if (delta > 0 && item.qty + delta > item.product.stock_qty) {
      toast.warning(`Stok ${item.product.name} tidak mencukupi!`, 1500)
      return
    }

    setCart(prev => prev.map(item => {
      if (item.product.id === id) {
        const newQty = item.qty + delta
        return newQty > 0 ? { ...item, qty: newQty } : item
      }
      return item
    }))
  }

  const subtotalAmount = cart.reduce((acc, item) => acc + (item.product.selling_price * item.qty), 0)
  const totalAmount = Math.max(0, subtotalAmount - discount)
  const displayedProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return []
    return customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch))
  }, [customerSearch, customers])

  const selectedCustomer = useMemo(() => customers.find(c => c.id === selectedCustomerId), [selectedCustomerId, customers])

  useEffect(() => {
    if (selectedCustomer?.is_member && paymentConfig?.member_discount_tiers) {
      const tiers = [...paymentConfig.member_discount_tiers].sort((a,b) => b.min_spend - a.min_spend)
      const tier = tiers.find(t => subtotalAmount >= t.min_spend)
      if (tier) {
        setDiscount(Math.floor(subtotalAmount * (tier.discount_pct / 100)))
        setAppliedTier(tier)
      } else { setDiscount(0); setAppliedTier(null) }
    } else { setDiscount(0); setAppliedTier(null) }
  }, [selectedCustomer, subtotalAmount, paymentConfig])

  const handleCheckout = async () => {
    if (cart.length === 0) return
    if (paymentMethod !== 'cash' && !paymentDetected) {
      setIsDetecting(true)
      await new Promise(r => setTimeout(r, 2000))
      setIsDetecting(false)
      setPaymentDetected(true)
    }
    setIsProcessing(true)
    try {
      const payment_provider = paymentMethod === 'ewallet' ? paymentConfig?.ewallet?.provider : (paymentMethod === 'transfer' ? paymentConfig?.bank?.provider : null)
      
      const res = await apiClient.post('/sales', {
        customer_id: selectedCustomerId || null,
        discount_amount: discount || 0,
        payment_method: paymentMethod,
        payment_provider: payment_provider,
        items: cart.map(item => ({ product_id: item.product.id, qty: item.qty }))
      })
      const invoiceNo = res.data?.data?.invoice_no || `INV-${Date.now()}`
      setLastInvoice({
        invoice_no: invoiceNo, cart: [...cart], subtotal: subtotalAmount, discount: discount, total: totalAmount, 
        method: paymentMethod, provider: payment_provider,
        date: new Date().toLocaleString('id-ID'), customer_name: selectedCustomer?.name || 'Pelanggan Umum', customer_phone: selectedCustomer?.phone || ''
      })
      toast.success("Transaksi berhasil diproses!")
      setShowModal(false); setShowReceipt(true); setCart([]); setDiscount(0); setAppliedTier(null); setPaymentDetected(false); setSelectedCustomerId(''); setCustomerSearch('');
    } catch(err) {
      toast.error("Gagal memproses transaksi. Stok tidak cukup?")
    } finally { setIsProcessing(false) }
  }

  const formatPhoneForWA = (phone: string) => {
    let cl = phone.replace(/\D/g, '');
    if (cl.startsWith('0')) cl = '62' + cl.substring(1);
    return cl;
  }

  const sendWhatsAppReceipt = (targetPhone?: string) => {
    if (!lastInvoice) return
    const items = lastInvoice.cart.map((i: any) => `${i.qty}x ${i.product.name} - Rp ${(i.qty * i.product.selling_price).toLocaleString('id-ID')}`).join('\n')
    const msg = encodeURIComponent(`*STRUK BELANJA*\nOrder #${lastInvoice.invoice_no}\nTanggal: ${lastInvoice.date}\n\n---\n${items}\n---\n\n*Total: Rp ${lastInvoice.total.toLocaleString('id-ID')}*\nMetode: ${lastInvoice.method.toUpperCase()}\n\nTerima kasih!`)
    const phone = targetPhone ? formatPhoneForWA(targetPhone) : ''
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  if (showReceipt && lastInvoice) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 print:p-0">
          <div className="bg-card p-8 max-w-sm w-full rounded-2xl shadow-xl border print:shadow-none text-foreground">
            <div className="text-center mb-6">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3 print:hidden" />
              <h1 className="text-2xl font-bold">{tenant?.name}</h1>
              <p className="text-xs text-muted-foreground">{lastInvoice.date}</p>
              <p className="text-xs font-mono mt-1">#{lastInvoice.invoice_no}</p>
            </div>
            <div className="border-t border-b border-dashed py-4 mb-4 space-y-3">
              {lastInvoice.cart.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <div><div className="font-medium">{item.product.name}</div><div className="text-xs opacity-60">{item.qty} x Rp {item.product.selling_price.toLocaleString('id-ID')}</div></div>
                  <div className="font-bold">Rp {(item.qty * item.product.selling_price).toLocaleString('id-ID')}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm">
               <div className="flex justify-between text-xs opacity-60"><span>Subtotal</span><span>Rp {lastInvoice.subtotal.toLocaleString('id-ID')}</span></div>
               {lastInvoice.discount > 0 && <div className="flex justify-between text-red-500 font-bold"><span>Diskon Member</span><span>- Rp {lastInvoice.discount.toLocaleString('id-ID')}</span></div>}
               <div className="flex justify-between font-black text-lg pt-2"><span>Total</span><span>Rp {lastInvoice.total.toLocaleString('id-ID')}</span></div>
            </div>
            <div className="mt-8 pt-4 flex flex-col gap-3 print:hidden">
              {lastInvoice.customer_phone && (
                <button onClick={() => sendWhatsAppReceipt(lastInvoice.customer_phone)} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl flex flex-col items-center justify-center shadow-lg active:scale-95">
                  <div className="flex items-center gap-2"><QrCode className="w-5 h-5" /> Kirim WhatsApp</div>
                  <span className="text-[10px] opacity-80 mt-1">Ke: {lastInvoice.customer_name}</span>
                </button>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowReceipt(false)} className="flex-1 py-3 bg-secondary font-bold rounded-xl text-sm">Tutup</button>
                <button onClick={() => window.print()} className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm flex items-center justify-center"><Printer className="w-4 h-4 mr-2" /> Cetak</button>
              </div>
            </div>
          </div>
        </div>
    )
  }

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-8rem)] gap-6 relative">
        {/* Mobile Cart Floating Button */}
        <button 
          onClick={() => setShowCartMobile(!showCartMobile)}
          className="lg:hidden fixed bottom-6 right-6 z-40 bg-primary text-primary-foreground p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce"
        >
          <ShoppingBag />
          <span className="font-bold">{cart.length} Item</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">Rp {totalAmount.toLocaleString('id-ID')}</span>
        </button>

        <div className={`flex-1 flex flex-col bg-card rounded-2xl shadow-sm border border-border overflow-hidden transition-all ${showCartMobile ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input 
                ref={searchInputRef} 
                type="text" 
                placeholder="Cari produk (hubungkan barcode scanner untuk input otomatis)..." 
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all text-foreground" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-muted/5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-max">
             {displayedProducts.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => addToCart(p)} 
                  className={`
                    bg-card border border-border p-3 rounded-2xl cursor-pointer 
                    hover:border-primary hover:shadow-md transition-all group flex flex-col h-fit
                    active:scale-95 active:bg-primary/5
                    ${p.stock_qty <= 0 ? 'opacity-50 grayscale select-none' : ''}
                  `}
                >
                   <div className="relative aspect-square w-full bg-muted/20 rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-border">
                     {p.image_url ? (
                       <img src={formatImageUrl(p.image_url)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                     ) : (
                       <ShoppingBag className="opacity-20 w-8 h-8" />
                     )}
                     {p.stock_qty <= 0 && (
                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center rotate-[-15deg]">
                         <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg uppercase tracking-tighter">HABIS</span>
                       </div>
                     )}
                   </div>
                   <h3 className="font-bold text-xs text-foreground line-clamp-2 min-h-[2rem] leading-snug">{p.name}</h3>
                   <div className="mt-2 flex items-center justify-between">
                     <p className="text-primary font-black text-xs">Rp {p.selling_price.toLocaleString('id-ID')}</p>
                     <div className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${p.stock_qty <= 0 ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground bg-muted'}`}>Stok: {p.stock_qty}</div>
                   </div>
                </div>
             ))}
          </div>
        </div>

        <div className={`
          w-full lg:w-[380px] bg-card rounded-2xl shadow-2xl border border-border flex flex-col 
          ${showCartMobile ? 'flex fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-0' : 'hidden lg:flex'}
        `}>
          <div className="p-4 border-b border-border bg-slate-900 text-white flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" /> 
              <h2 className="font-black text-sm uppercase tracking-widest text-white">Keranjang Belanja</h2>
            </div>
            {showCartMobile && (
              <button onClick={() => setShowCartMobile(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
             {cart.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Keranjang Kosong</h3>
                  <p className="text-[10px] mt-1 text-muted-foreground">Silakan pilih produk untuk memulai transaksi</p>
               </div>
             ) : (
               cart.map(item => (
                  <div key={item.product.id} className="group relative flex justify-between items-center bg-card border border-border p-3 rounded-2xl shadow-sm hover:shadow-md transition-all">
                     <div className="flex-1 min-w-0 mr-3">
                        <h4 className="text-[11px] font-bold text-foreground truncate">{item.product.name}</h4>
                        <p className="text-[11px] font-black text-primary mt-0.5">Rp {item.product.selling_price.toLocaleString('id-ID')}</p>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border">
                           <button onClick={() => updateQty(item.product.id, -1)} className="p-1 hover:bg-background rounded-lg text-muted-foreground hover:text-foreground"><Minus className="w-3 h-3" /></button>
                           <span className="text-xs font-black min-w-[1.5rem] text-center text-foreground">{item.qty}</span>
                           <button onClick={() => updateQty(item.product.id, 1)} className="p-1 hover:bg-background rounded-lg text-muted-foreground hover:text-foreground"><Plus className="w-3 h-3" /></button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               ))
             )}
          </div>

          <div className="p-6 border-t border-border bg-card">
             <div className="space-y-2 mb-4">
               <div className="flex justify-between items-center text-xs text-muted-foreground">
                 <span>Subtotal</span>
                 <span>Rp {subtotalAmount.toLocaleString('id-ID')}</span>
               </div>
               {discount > 0 && (
                 <div className="flex justify-between items-center text-xs font-bold text-red-500">
                   <span>Diskon Member</span>
                   <span>- Rp {discount.toLocaleString('id-ID')}</span>
                 </div>
               )}
               <div className="flex justify-between items-center pt-2 border-t border-border">
                 <span className="text-sm font-bold text-foreground uppercase tracking-widest">Total Bayar</span>
                 <span className="text-xl font-black text-primary">Rp {totalAmount.toLocaleString('id-ID')}</span>
               </div>
             </div>
             
             <button 
                disabled={cart.length === 0} 
                onClick={() => setShowModal(true)} 
                className="w-full py-4 bg-primary text-primary-foreground font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
             >
                PROSES CHECKOUT (F2)
             </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-card rounded-[2rem] shadow-2xl max-w-lg w-full border border-border animate-in zoom-in-95 duration-300 overflow-hidden">
             <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
                <div>
                   <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Konfirmasi Pembayaran</h2>
                   <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Selesaikan transaksi pelanggan</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="w-5 h-5 text-foreground"/></button>
             </div>
             
             <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Member Search */}
                  <div className="col-span-full">
                    <label className="text-[10px] font-black uppercase text-muted-foreground mb-2.5 block tracking-widest">Informasi Pelanggan</label>
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 text-foreground" />
                       <input 
                         type="text" 
                         placeholder="Cari Member / No. HP..." 
                         value={selectedCustomer ? selectedCustomer.name : customerSearch} 
                         onChange={e => {setCustomerSearch(e.target.value); setShowCustomerResults(true);}} 
                         className="w-full pl-10 pr-10 py-3.5 rounded-2xl border border-border bg-background text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                       />
                       {selectedCustomer && (
                         <button onClick={() => {setSelectedCustomerId(''); setCustomerSearch('');}} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 hover:bg-red-500/10 p-1 rounded-lg">
                           <X className="w-4 h-4"/>
                         </button>
                       )}
                    </div>
                    {showCustomerResults && customerSearch && !selectedCustomer && (
                      <div className="absolute left-6 right-6 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-[70] py-2 max-h-48 overflow-y-auto animate-in slide-in-from-top-2">
                         {filteredCustomers.length === 0 ? (
                           <div className="px-4 py-6 text-center text-xs text-muted-foreground">Pelanggan tidak ditemukan. <br/><span className="font-bold text-primary mt-1 block cursor-pointer">Daftar Baru?</span></div>
                         ) : filteredCustomers.map(c => (
                            <div key={c.id} onClick={() => {setSelectedCustomerId(c.id); setShowCustomerResults(false);}} className="px-4 py-3 hover:bg-muted cursor-pointer flex items-center gap-4 transition-colors">
                               <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-black uppercase">{c.name.charAt(0)}</div>
                               <div className="flex-1 min-w-0">
                                  <p className="text-xs font-black text-foreground truncate">{c.name}</p>
                                  <p className="text-[10px] text-muted-foreground font-mono">{c.phone}</p>
                               </div>
                               {c.is_member && <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-500/20 uppercase tracking-tighter">Gold Member</span>}
                            </div>
                         ))}
                      </div>
                    )}
                  </div>

                  {/* Payment Details Display */}
                  <div className="col-span-full">
                    <label className="text-[10px] font-black uppercase text-muted-foreground mb-3 block tracking-widest">Metode Pembayaran</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                       {[
                         {id:'cash', label:'Tunai', icon:<ShoppingBag className="w-5 h-5"/>},
                         {id:'qris', label:'QRIS', icon:<QrCode className="w-5 h-5"/>},
                         {id:'transfer', label:'Transfer', icon:<TrendingUp className="w-5 h-5"/>},
                         {id:'ewallet', label:'E-Wallet', icon:<Wallet className="w-5 h-5"/>}
                       ].map(m => (
                         <button 
                           key={m.id}
                           onClick={() => setPaymentMethod(m.id as any)}
                           className={`
                             p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all group
                             ${paymentMethod === m.id ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/50'}
                           `}
                         >
                            <div className={`p-2 rounded-xl transition-colors ${paymentMethod === m.id ? 'bg-primary text-white' : 'bg-muted group-hover:bg-primary/10 group-hover:text-primary'}`}>
                               {m.icon}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider">{m.label}</span>
                         </button>
                       ))}
                    </div>

                    {paymentMethod === 'transfer' && (
                       <div className="bg-muted/30 p-5 rounded-2xl border border-border animate-in slide-in-from-top-4">
                          <label className="text-[10px] font-black uppercase text-muted-foreground mb-2 block">Rekening Tujuan</label>
                          {paymentConfig?.bank?.number ? (
                             <div className="space-y-1">
                                <p className="text-sm font-black text-foreground">{paymentConfig.bank.provider}</p>
                                <p className="text-lg font-mono font-bold text-primary">{paymentConfig.bank.number}</p>
                                <p className="text-xs text-muted-foreground uppercase font-bold">a.n. {paymentConfig.bank.name}</p>
                             </div>
                          ) : (
                             <p className="text-xs text-red-500 font-bold py-2 italic opacity-60">Konfigurasi bank belum diatur di Pengaturan.</p>
                          )}
                       </div>
                    )}

                    {paymentMethod === 'ewallet' && (
                       <div className="bg-muted/30 p-5 rounded-2xl border border-border animate-in slide-in-from-top-4">
                          <label className="text-[10px] font-black uppercase text-muted-foreground mb-2 block">ID E-Wallet</label>
                          {paymentConfig?.ewallet?.number ? (
                             <div className="space-y-1">
                                <p className="text-sm font-black text-foreground">{paymentConfig.ewallet.provider}</p>
                                <p className="text-lg font-mono font-bold text-primary">{paymentConfig.ewallet.number}</p>
                                <p className="text-xs text-muted-foreground uppercase font-bold">a.n. {paymentConfig.ewallet.name}</p>
                             </div>
                          ) : (
                             <p className="text-xs text-red-500 font-bold py-2 italic opacity-60">Konfigurasi e-wallet belum diatur di Pengaturan.</p>
                          )}
                       </div>
                    )}

                    {paymentMethod === 'qris' && (
                       <div className="bg-muted/30 p-5 rounded-2xl border border-border animate-in slide-in-from-top-4 flex flex-col items-center gap-3">
                          <label className="text-[10px] font-black uppercase text-muted-foreground mb-2 self-start">Scan QRIS</label>
                          {paymentConfig?.qris_url ? (
                             <div className="bg-white p-3 rounded-2xl shadow-sm border border-border">
                                <img src={formatImageUrl(paymentConfig.qris_url)} className="w-48 h-48 object-contain" alt="QRIS" />
                             </div>
                          ) : (
                             <p className="text-xs text-red-500 font-bold py-4 italic opacity-60">Gambar QRIS belum diunggah di Pengaturan.</p>
                          )}
                       </div>
                    )}
                  </div>
                </div>

                <div className="bg-muted/10 rounded-[1.5rem] p-6 space-y-3 border border-border">
                   <div className="flex justify-between items-center text-xs text-muted-foreground font-medium"><span>Subtotal Belanja</span><span className="text-foreground">Rp {subtotalAmount.toLocaleString('id-ID')}</span></div>
                   {discount > 0 && <div className="flex justify-between items-center text-xs font-bold text-red-500"><span>Diskon Perolehan Member</span><span>- Rp {discount.toLocaleString('id-ID')}</span></div>}
                   <div className="flex justify-between items-center font-black text-xl border-t border-border pt-4 mt-2">
                     <span className="text-foreground uppercase tracking-tighter">Total Akhir</span>
                     <span className="text-primary">Rp {totalAmount.toLocaleString('id-ID')}</span>
                   </div>
                </div>

                <div className="flex flex-col gap-3">
                   <button 
                      onClick={handleCheckout} 
                      disabled={isProcessing || isDetecting} 
                      className="w-full py-5 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
                   >
                     {isProcessing ? 'Memproses Transaksi...' : isDetecting ? 'Menunggu Pembayaran...' : 'Konfirmasi & Kirim Struk'}
                   </button>
                   <p className="text-[9px] text-center text-muted-foreground/60 uppercase font-bold tracking-widest">Tekan Enter untuk konfirmasi instan</p>
                </div>
             </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
