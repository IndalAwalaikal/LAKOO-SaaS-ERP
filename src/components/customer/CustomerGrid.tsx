import { Trash, Phone, Mail, MapPin, Users, Pencil } from 'lucide-react'
import { useDeleteCustomer, type Customer } from '../../hooks/useCustomers'

export default function CustomerGrid({ items, onEdit }: { items: Customer[], onEdit?: (customer: Customer) => void }) {
  const deleteCustomer = useDeleteCustomer()
  if (items.length === 0) {
    return (
       <div className="col-span-full py-16 flex flex-col items-center justify-center bg-muted/30 rounded-2xl border border-dashed border-border">
          <Users className="h-12 w-12 text-muted-foreground opacity-20 mb-3" />
          <p className="text-muted-foreground font-medium">Tidak ada pelanggan yang ditemukan</p>
       </div>
    )
  }

  return (
    <>
      {items.map(customer => (
         <div key={customer.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative group animate-in fade-in">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
              {onEdit && (
                <button 
                  onClick={() => onEdit(customer)}
                  className="text-muted-foreground hover:text-primary p-2 bg-background rounded-md shadow-sm border border-border"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              <button 
                onClick={() => confirm('Hapus pelanggan kontak ini?') && deleteCustomer.mutateAsync(customer.id)}
                disabled={deleteCustomer.isPending}
                className="text-muted-foreground hover:text-red-500 p-2 bg-background rounded-md shadow-sm border border-border"
                title="Hapus"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
           
           <div className="flex items-start gap-4 mb-4">
             <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
               {customer.name.charAt(0).toUpperCase()}
             </div>
             <div>
               <h3 className="font-bold text-foreground text-lg">{customer.name}</h3>
               {customer.is_member && (
                 <div className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 mt-1">
                   MEMBER
                 </div>
               )}
             </div>
           </div>

           <div className="space-y-3 mt-5 border-t border-border pt-5">
             <div className="flex items-center text-sm text-muted-foreground">
               <Phone className="h-4 w-4 text-muted-foreground opacity-50 mr-3 shrink-0" />
               <span className="font-mono text-foreground">{customer.phone || '-'}</span>
             </div>
             <div className="flex items-center text-sm text-muted-foreground truncate">
               <Mail className="h-4 w-4 text-muted-foreground opacity-50 mr-3 shrink-0" />
               <span className="text-foreground">{customer.email || '-'}</span>
             </div>
             <div className="flex items-start text-sm text-muted-foreground">
               <MapPin className="h-4 w-4 text-muted-foreground opacity-50 mr-3 shrink-0 mt-0.5" />
               <span className="line-clamp-2 leading-relaxed text-foreground">{customer.address || '-'}</span>
             </div>
           </div>
         </div>
      ))}
    </>
  )
}
