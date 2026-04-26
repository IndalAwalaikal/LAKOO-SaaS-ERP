import { useState, useRef, useEffect } from 'react'
import { Bell, Package, ShoppingCart, Info, X } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import type { Notification } from '../hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: notifications = [], isLoading } = useNotifications()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all relative group"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-background animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl z-[70] animate-in fade-in zoom-in-95 overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <h3 className="text-sm font-bold text-foreground">Notifikasi Operasional</h3>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
               <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Memperbarui...</div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center gap-3">
                 <div className="p-3 bg-muted rounded-full">
                    <Info className="w-6 h-6 text-muted-foreground/30" />
                 </div>
                 <p className="text-xs text-muted-foreground font-medium">Belum ada notifikasi baru hari ini.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n: Notification) => (
                  <div key={n.id} className="p-4 hover:bg-muted/30 transition-colors flex gap-3 cursor-default">
                    <div className={`p-2 rounded-xl h-fit ${n.type === 'low_stock' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                       {n.type === 'low_stock' ? <Package className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                    </div>
                    <div>
                       <div className="text-xs font-bold text-foreground leading-tight">{n.title}</div>
                       <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">{n.message}</p>
                       <div className="text-[9px] text-muted-foreground/60 mt-1.5 font-medium">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: id })}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-border bg-muted/5">
                <button className="w-full py-1.5 text-[10px] font-black text-primary hover:underline uppercase tracking-widest">
                   Lihat Semua Log
                </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
