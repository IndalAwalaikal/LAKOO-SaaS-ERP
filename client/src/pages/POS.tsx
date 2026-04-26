import { useState, useMemo, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { 
  Search, ShoppingBag, Plus, Minus, Trash2, CreditCard, 
  X, Printer, CheckCircle2, Wallet, QrCode, HelpCircle, Keyboard
} from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import type { Product } from '../hooks/useProducts'
import { apiClient } from '../lib/api'
import { useAuthStore } from '../store/auth'
import { formatImageUrl } from '../lib/utils'

export default function POS() {
  const { tenant } = useAuthStore()
  const [cart, setCart] = useState<{product: Product, qty: number}[]>([])
  const [search, setSearch] = useState('')
  const { data: products = [], isLoading } = useProducts()
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const [showModal, setShowModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash'|'qris'|'transfer'|'ewallet'>('cash')
  const [paymentDetected, setPaymentDetected] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [discount, setDiscount] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastInvoice, setLastInvoice] = useState<any>(null)

  const paymentConfig = useMemo(() => {
    if (tenant?.payment_config) {
      try {
        return JSON.parse(tenant.payment_config)
      } catch (e) {
        return null
      }
    }
    return null
  }, [tenant])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: Process Payment
      if (e.key === 'F2') {
        e.preventDefault()
        if (cart.length > 0) setShowModal(true)
      }
      // ESC: Close Modals
      if (e.key === 'Escape') {
        setShowModal(false)
        setShowReceipt(false)
      }
      // /: Focus Search
      if (e.key === '/') {
        if (document.activeElement?.tagName !== 'INPUT') {
           e.preventDefault()
           searchInputRef.current?.focus()
        }
      }
      // Enter: Confirm in Modal
      if (e.key === 'Enter' && showModal && !isProcessing && !isDetecting) {
        handleCheckout()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart, showModal, isProcessing, isDetecting])

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item)
      }
      return [...prev, { product, qty: 1 }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === id) {
        const newQty = item.qty + delta
        return newQty > 0 ? { ...item, qty: newQty } : item
      }
      return item
    }))
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.product.id !== id))
  }

  const subtotalAmount = cart.reduce((acc, item) => acc + (item.product.selling_price * item.qty), 0)
  const totalAmount = Math.max(0, subtotalAmount - discount)

  const displayedProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const handleCheckout = async () => {
    if (cart.length === 0) return

    if (paymentMethod !== 'cash' && !paymentDetected) {
      // Simulate Payment Detection mechanism / Webhook
      setIsDetecting(true)
      await new Promise(r => setTimeout(r, 2500))
      setIsDetecting(false)
      setPaymentDetected(true)
    }

    setIsProcessing(true)
    try {
      const payload = {
        discount_amount: discount || 0,
        payment_method: paymentMethod,
        items: cart.map(item => ({
          product_id: item.product.id,
          qty: item.qty
        }))
      }
      const res = await apiClient.post('/sales', payload)
      // On success, show receipt
      setLastInvoice({
        invoice_no: res.data?.data?.invoice_no || `INV-${Date.now()}`,
        cart: [...cart],
        subtotal: subtotalAmount,
        discount: discount,
        total: totalAmount,
        method: paymentMethod,
        date: new Date().toLocaleString('id-ID')
      })
      setShowModal(false)
      setShowReceipt(true)
      setCart([])
      setDiscount(0)
      setPaymentDetected(false)
    } catch(err) {
      alert("Gagal memproses transaksi. Periksa koneksi atau kelengkapan stok barang.")
    } finally {
      setIsProcessing(false)
    }
  }

  const sendWhatsAppReceipt = () => {
    if (!lastInvoice) return
    const itemsText = lastInvoice.cart.map((item: any) => 
      `${item.qty}x ${item.product.name} - Rp ${(item.qty * item.product.selling_price).toLocaleString('id-ID')}`
    ).join('\n')

    const message = encodeURIComponent(
      `*STRUK BELANJA - ${tenant?.name || 'Lakoo Merchant'}*\n` +
      `Order #${lastInvoice.invoice_no}\n` +
      `Tanggal: ${lastInvoice.date}\n\n` +
      `---\n${itemsText}\n---\n\n` +
      `*Total: Rp ${lastInvoice.total.toLocaleString('id-ID')}*\n` +
      `Metode: ${lastInvoice.method.toUpperCase()}\n\n` +
      `Terima kasih telah berbelanja!\n` +
      `_Powered by Lakoo SaaS ERP_`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  const printReceipt = () => {
    window.print()
  }

  if (showReceipt && lastInvoice) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 print:p-0 print:bg-white transition-colors duration-300">
          <div className="bg-card p-8 max-w-sm w-full rounded-2xl shadow-xl border border-border print:shadow-none print:w-full print:max-w-none print:bg-white print:text-black">
            <div className="text-center mb-6">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3 print:hidden" />
              {tenant?.logo_url ? (
                <img src={formatImageUrl(tenant.logo_url)} alt="Logo" className="h-16 w-16 object-contain mx-auto mb-2" />
              ) : (
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                  <ShoppingBag className="w-8 h-8" />
                </div>
              )}
              <h1 className="text-2xl font-bold text-foreground print:text-black">{tenant?.name || 'Lakoo Merchant'}</h1>
              <p className="text-muted-foreground text-sm print:text-gray-600">{lastInvoice.date}</p>
              <p className="text-muted-foreground text-sm font-mono mt-1 print:text-gray-600">Order #{lastInvoice.invoice_no}</p>
            </div>
            
            <div className="border-t border-b border-dashed border-border py-4 mb-4 space-y-3 print:border-gray-300">
              {lastInvoice.cart.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <div>
                    <div className="font-medium text-foreground print:text-black">{item.product.name}</div>
                    <div className="text-muted-foreground print:text-gray-600">{item.qty} x Rp {item.product.selling_price.toLocaleString('id-ID')}</div>
                  </div>
                  <div className="font-medium text-foreground print:text-black align-bottom">
                    Rp {(item.qty * item.product.selling_price).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm">
               <div className="flex justify-between text-muted-foreground print:text-gray-600">
                  <span>Subtotal</span>
                  <span>Rp {lastInvoice.subtotal.toLocaleString('id-ID')}</span>
               </div>
               {lastInvoice.discount > 0 && (
                 <div className="flex justify-between text-red-500">
                    <span>Diskon</span>
                    <span>- Rp {lastInvoice.discount.toLocaleString('id-ID')}</span>
                 </div>
               )}
               <div className="flex justify-between font-bold text-lg text-foreground pt-2 print:text-black">
                  <span>Total</span>
                  <span>Rp {lastInvoice.total.toLocaleString('id-ID')}</span>
               </div>
               <div className="flex justify-between text-muted-foreground text-xs pt-2 print:text-gray-500">
                  <span>Metode Bayar</span>
                  <span className="uppercase">{lastInvoice.method}</span>
               </div>
            </div>

            <div className="mt-8 pt-4 flex flex-col gap-3 print:hidden">
              <div className="flex gap-3">
                <button onClick={() => setShowReceipt(false)} className="flex-1 py-3 bg-secondary text-secondary-foreground font-bold rounded-xl hover:bg-secondary/80">Pesanan Baru</button>
                <button onClick={printReceipt} className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 flex items-center justify-center">
                  <Printer className="w-5 h-5 mr-2" /> Cetak
                </button>
              </div>
              <button 
                onClick={sendWhatsAppReceipt}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-emerald-500/20"
              >
                <QrCode className="w-5 h-5 mr-2" /> Kirim via WhatsApp
              </button>
            </div>
          </div>
        </div>
    )
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        {/* Left Side: Product Grid */}
        <div className="flex-1 flex flex-col bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Cari produk SKU atau nama ( / )..." 
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-sm text-foreground"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-4">
               <div className="hidden xl:flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-4 py-2 rounded-xl">
                  <div className="flex items-center gap-1.5"><kbd className="bg-background px-1.5 py-0.5 rounded border border-border text-foreground">F2</kbd> <span>Cari</span></div>
                  <div className="flex items-center gap-1.5"><kbd className="bg-background px-1.5 py-0.5 rounded border border-border text-foreground">/</kbd> <span>Cari</span></div>
                  <div className="flex items-center gap-1.5"><kbd className="bg-background px-1.5 py-0.5 rounded border border-border text-foreground">ESC</kbd> <span>Batal</span></div>
               </div>
               <button 
                  onClick={() => alert("Shortcut Keyboard POS:\n\nF2: Proses Bayar\nESC: Batalkan / Tutup Modal\n/ : Cari Produk\nEnter: Konfirmasi Bayar (di Modal)")}
                  className="p-2 text-muted-foreground hover:text-primary transition-colors hover:bg-primary/5 rounded-full" 
                  title="Keyboard Shortcuts Help"
               >
                  <HelpCircle className="w-5 h-5" />
               </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
            {isLoading ? (
               <div className="flex items-center justify-center h-full text-muted-foreground font-medium animate-pulse">Memuat inventaris tersinkronisasi...</div>
            ) : displayedProducts.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
                  <p>Katalog gudang kosong atau tidak ditemukan.</p>
               </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedProducts.map(product => (
                  <div 
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-card border border-border p-4 rounded-xl cursor-pointer hover:border-primary hover:shadow-md transition-all group flex flex-col"
                  >
                    <div className="h-32 bg-muted/30 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden group-hover:bg-primary/5 transition-colors">
                      {product.image_url ? (
                        <img src={formatImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <ShoppingBag className="h-8 w-8 text-muted-foreground group-hover:text-primary/40 transition-colors" />
                      )}
                      <div className="absolute top-2 right-2 bg-card/90 backdrop-blur tracking-tight px-2 py-0.5 rounded text-xs font-bold text-foreground shadow-sm">
                        Stok: {product.stock_qty}
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm leading-tight mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
                    <div className="mt-auto text-primary font-bold text-sm tracking-tight">
                      Rp {product.selling_price.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cart */}
        <div className="w-[400px] flex flex-col bg-card rounded-2xl shadow-xl border border-border overflow-hidden relative">
          <div className="p-5 border-b border-border bg-slate-900 text-white dark:bg-slate-950">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg flex items-center">
                <ShoppingBag className="mr-2 h-5 w-5 text-primary" />
                Detail Pesanan
              </h2>
              <div className="flex items-center gap-2 bg-white/10 px-2 py-1 rounded-lg">
                 <Keyboard className="w-3 h-3 text-primary" />
                 <span className="text-[10px] font-black tracking-widest uppercase">POS Mode</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">Belum ada item di keranjang</p>
                <p className="text-[10px] uppercase font-bold mt-2 opacity-60">Tekan / Untuk Mencari</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="flex gap-3 bg-card p-3 rounded-xl border border-border shadow-sm animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex-1">
                    <div className="font-semibold text-foreground text-sm leading-tight mb-1">{item.product.name}</div>
                    <div className="text-primary font-bold tracking-tight text-sm">Rp {item.product.selling_price.toLocaleString('id-ID')}</div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => removeFromCart(item.product.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2 bg-secondary border border-border rounded-lg p-1">
                      <button onClick={() => updateQty(item.product.id, -1)} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"><Minus className="h-3 w-3" /></button>
                      <span className="w-4 text-center text-sm font-bold text-foreground">{item.qty}</span>
                      <button onClick={() => updateQty(item.product.id, 1)} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"><Plus className="h-3 w-3" /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-5 border-t border-border bg-card">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-foreground">Total Tagihan</span>
              <span className="text-2xl font-black text-primary tracking-tight">Rp {subtotalAmount.toLocaleString('id-ID')}</span>
            </div>
            
            <button 
              disabled={cart.length === 0}
              onClick={() => setShowModal(true)}
              className="w-full py-3.5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center cursor-pointer group"
              title="Tekan F2 untuk Bayar"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Proses Bayar 
              <kbd className="ml-3 hidden group-hover:inline-block bg-white/20 px-1.5 py-0.5 rounded text-[10px]">F2</kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-card rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-border animate-in zoom-in-95 duration-200">
             <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
               <h2 className="font-bold text-xl text-foreground flex items-center gap-2">
                 Selesaikan Pembayaran
                 <span className="text-[10px] text-muted-foreground font-black bg-muted px-2 py-0.5 rounded-full uppercase tracking-tighter">Enter to Confirm</span>
               </h2>
               <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground bg-background rounded-full p-1 border border-border hover:bg-secondary transition-colors"><X className="w-5 h-5" /></button>
             </div>
             
             <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-2">Metode Pembayaran</label>
                  <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => {setPaymentMethod('cash'); setPaymentDetected(false);}} className={`py-3 px-1 border-2 text-xs rounded-xl font-bold flex flex-col items-center gap-2 transition-all cursor-pointer ${paymentMethod === 'cash' ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-border bg-background text-muted-foreground hover:border-primary/50'}`}>
                      <Wallet className="w-5 h-5" /> Tunai
                    </button>
                    <button onClick={() => {setPaymentMethod('qris'); setPaymentDetected(false);}} className={`py-3 px-1 border-2 text-xs rounded-xl font-bold flex flex-col items-center gap-2 transition-all cursor-pointer ${paymentMethod === 'qris' ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-border bg-background text-muted-foreground hover:border-primary/50'}`}>
                      <QrCode className="w-5 h-5" /> QRIS
                    </button>
                    <button onClick={() => {setPaymentMethod('transfer'); setPaymentDetected(false);}} className={`py-3 px-1 border-2 text-xs rounded-xl font-bold flex flex-col items-center gap-2 transition-all cursor-pointer ${paymentMethod === 'transfer' ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-border bg-background text-muted-foreground hover:border-primary/50'}`}>
                      <CreditCard className="w-5 h-5" /> Bank/TF
                    </button>
                    <button onClick={() => {setPaymentMethod('ewallet'); setPaymentDetected(false);}} className={`py-3 px-1 border-2 text-xs rounded-xl font-bold flex flex-col items-center gap-2 transition-all cursor-pointer ${paymentMethod === 'ewallet' ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-border bg-background text-muted-foreground hover:border-primary/50'}`}>
                      <CreditCard className="w-5 h-5" /> E-Wallet
                    </button>
                  </div>
                </div>

                {paymentMethod === 'qris' && (
                  <div className="bg-muted/30 p-6 rounded-xl border border-border flex flex-col items-center justify-center text-center animate-in fade-in">
                    {paymentConfig?.qris_url ? (
                      <img src={formatImageUrl(paymentConfig.qris_url)} alt="QRIS" className="w-48 h-48 object-contain mb-3 rounded-lg border border-border bg-white p-2 shadow-sm" />
                    ) : (
                      <QrCode className="w-24 h-24 text-foreground mb-3 opacity-40" />
                    )}
                    <p className="text-sm text-muted-foreground font-medium max-w-[200px]">Silakan arahkan pembeli untuk scan QRIS menggunakan aplikasi Bank / E-Wallet.</p>
                  </div>
                )}

                {(paymentMethod === 'transfer' || paymentMethod === 'ewallet') && (
                  <div className="bg-muted/30 p-4 rounded-xl border border-border text-center animate-in fade-in">
                    <h3 className="font-bold text-foreground mb-3 text-sm">
                      {paymentMethod === 'transfer' ? 'Tujuan Transfer Bank' : 'Tujuan Pengiriman E-Wallet'}
                    </h3>
                    <div className="bg-card p-4 rounded-xl border border-border mx-auto max-w-sm text-left shadow-sm">
                       {((paymentMethod === 'transfer' && paymentConfig?.bank?.provider) || (paymentMethod === 'ewallet' && paymentConfig?.ewallet?.provider)) ? (
                          <div className="space-y-1.5">
                             <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <span>{paymentMethod === 'transfer' ? 'Bank' : 'Platform'}</span>
                                <span className="font-bold text-foreground">
                                  {paymentMethod === 'transfer' ? paymentConfig.bank.provider : paymentConfig.ewallet.provider}
                                </span>
                             </div>
                             <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <span>No. Rekening / HP</span>
                                <span className="font-mono font-bold text-foreground text-sm tracking-widest">
                                  {paymentMethod === 'transfer' ? paymentConfig.bank.number : paymentConfig.ewallet.number}
                                </span>
                             </div>
                             <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <span>Nama Akun</span>
                                <span className="font-bold text-foreground uppercase text-[10px]">
                                  {paymentMethod === 'transfer' ? paymentConfig.bank.name : paymentConfig.ewallet.name}
                                </span>
                             </div>
                          </div>
                       ) : (
                          <div className="text-center text-xs text-muted-foreground py-2">Informasi pembayaran belum dikonfigurasi.</div>
                       )}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-2">Diskon / Voucher Khusus</label>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-bold px-2">Rp</span>
                    <input 
                      type="number" 
                      min="0"
                      value={discount || ''}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      placeholder="Masukan potongan harga..."
                      className="w-full bg-background border border-border px-4 py-2.5 rounded-xl font-bold text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-2">
                  <div className="flex justify-between text-sm font-medium text-muted-foreground">
                     <span>Subtotal pesanan</span>
                     <span>Rp {subtotalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  {discount > 0 && (
                      <div className="flex justify-between text-sm font-medium text-red-500">
                         <span>Potongan diskon</span>
                         <span>- Rp {discount.toLocaleString('id-ID')}</span>
                      </div>
                  )}
                  <div className="border-t border-border pt-2 mt-2 flex justify-between items-center">
                     <span className="font-bold text-foreground">Total Pembayaran</span>
                     <span className="font-black text-xl text-primary tracking-tight">Rp {totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                
                <button 
                  disabled={isProcessing || isDetecting}
                  onClick={handleCheckout} 
                  className={`w-full py-4 text-primary-foreground font-bold rounded-xl shadow-lg transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer ${paymentMethod !== 'cash' && paymentDetected ? 'bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-500' : 'bg-primary shadow-primary/20 hover:bg-primary/90'}`}
                >
                  {isProcessing ? "Mencatat Transaksi..." : 
                   isDetecting ? "Mendeteksi Pembayaran Masuk..." : 
                   (paymentMethod !== 'cash' && paymentDetected) ? "Pembayaran Terdeteksi! Cetak Struk" :
                   (paymentMethod !== 'cash') ? "Konfirmasi Tunai & Cetak Struk" : "Konfirmasi Tunai & Cetak Struk"}
                </button>
             </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
