import { useState } from 'react'
import { RotateCw, Store, User, Mail, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { apiClient } from '../lib/api'

export default function Register() {
  const [formData, setFormData] = useState({
    tenant_name: '',
    slug: '',
    owner_name: '',
    email: '',
    password: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({...formData, [e.target.name]: e.target.value})
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res: any = await apiClient.post('/auth/register', formData)
      if(res.data?.success || res.status === 200 || res.status === 201) {
        setSuccess(true)
      } else {
        setError(res.error?.message || 'Registration failed')
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Server error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-card max-w-md w-full mx-auto p-10 rounded-2xl shadow-xl text-center space-y-6 border border-border">
            <CheckCircle2 className="h-20 w-20 text-emerald-500 mx-auto" />
            <h2 className="text-3xl font-bold text-foreground">Tenant Created!</h2>
            <p className="text-muted-foreground">Your Lakoo ERP tenant space is ready.</p>
            <a href="/login" className="mt-8 block w-full py-3.5 px-4 rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 font-bold transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5">
              Proceed to Login
            </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-primary selection:text-primary-foreground">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground">
          Create Output
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Start your ERP journey or{' '}
          <a href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            log in to existing
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-card py-8 px-6 shadow-xl sm:rounded-2xl sm:px-10 border border-border">
          <form className="space-y-5" onSubmit={handleRegister}>
            {error && (
              <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm font-medium border border-red-500/20 animate-in fade-in">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Store Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Store className="h-5 w-5 opacity-50" />
                  </div>
                  <input type="text" name="tenant_name" required value={formData.tenant_name} onChange={handleChange}
                    className="pl-10 block w-full bg-background border border-border rounded-lg py-2.5 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="Toko Abc" />
                </div>
              </div>

               <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Subdomain / Slug</label>
                <div className="relative flex items-center">
                  <input type="text" name="slug" required value={formData.slug} onChange={handleChange}
                    className="block w-full bg-background border border-border rounded-l-lg py-2.5 px-3 text-right text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="toko-abc" />
                    <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-border bg-muted/50 text-muted-foreground text-xs font-bold py-3">
                       .lakoo.id
                    </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Owner Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <User className="h-5 w-5 opacity-50" />
                </div>
                <input type="text" name="owner_name" required value={formData.owner_name} onChange={handleChange}
                  className="pl-10 block w-full bg-background border border-border rounded-lg py-2.5 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="John Doe" />
              </div>
            </div>

            <div>
               <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Email address</label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                   <Mail className="h-5 w-5 opacity-50" />
                 </div>
                 <input type="email" name="email" required value={formData.email} onChange={handleChange}
                   className="pl-10 block w-full bg-background border border-border rounded-lg py-2.5 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="name@example.com" />
               </div>
            </div>

            <div>
               <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Password</label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                   <Lock className="h-5 w-5 opacity-50" />
                 </div>
                 <input type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange}
                   className="pl-10 pr-10 block w-full bg-background border border-border rounded-lg py-2.5 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="••••••••" />
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                 >
                   {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                 </button>
               </div>
            </div>

            <div>
              <button type="submit" disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg shadow-primary/20 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none">
                {loading ? <RotateCw className="animate-spin h-5 w-5" /> : 'Create Lakoo Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
