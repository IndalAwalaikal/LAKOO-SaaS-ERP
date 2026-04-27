import { useToastStore, type ToastType } from '../store/toastStore'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  const icons: Record<ToastType, any> = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  }

  const colors: Record<ToastType, string> = {
    success: 'border-emerald-500/20 bg-card/90 shadow-emerald-500/10',
    error: 'border-red-500/20 bg-card/90 shadow-red-500/10',
    info: 'border-blue-500/20 bg-card/90 shadow-blue-500/10',
    warning: 'border-amber-500/20 bg-card/90 shadow-amber-500/10',
  }

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm sm:max-w-md">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`
            flex items-center gap-3 p-4 pr-12 rounded-2xl border backdrop-blur-xl shadow-2xl 
            animate-in slide-in-from-right-10 fade-in duration-500 pointer-events-auto
            ${colors[t.type]}
          `}
        >
           <div className={`p-2 rounded-xl bg-muted/50`}>
              {icons[t.type]}
           </div>
           <div className="flex-1">
              <p className="text-sm font-bold text-foreground leading-tight">{t.message}</p>
           </div>
           <button 
              onClick={() => removeToast(t.id)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-xl transition-all"
           >
              <X className="w-4 h-4 text-muted-foreground" />
           </button>
        </div>
      ))}
    </div>
  )
}
