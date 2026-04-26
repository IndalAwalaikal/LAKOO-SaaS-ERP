import { useState } from 'react'
import { RotateCw, Mail, ArrowLeft, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiClient } from '../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res: any = await apiClient.post('/auth/forgot-password', { email })
      if(res.data?.success || res.status === 200 || res.status === 201) {
        setSuccess(true)
      } else {
        setError(res.error?.message || 'Gagal mengirim instruksi reset kata sandi')
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Terjadi kesalahan sistem internal')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="bg-card max-w-md w-full mx-auto p-10 rounded-2xl shadow-xl text-center space-y-6 border border-border">
            <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <Send className="h-10 w-10 ml-1" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Instruksi Terkirim!</h2>
            <p className="text-muted-foreground">
              Kami telah mengirimkan tautan pemulihan aman ke <strong>{email}</strong>. Silakan cek kotak masuk Anda (mungkin butuh beberapa menit).
            </p>
            <Link to="/login" className="mt-8 block w-full py-3.5 px-4 rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 font-bold transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5">
              Kembali ke Login
            </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-primary selection:text-primary-foreground">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground">
          Lupa Kata Sandi
        </h2>
        <p className="mt-3 text-sm text-muted-foreground px-4">
          Masukkan alamat email yang terdaftar pada ekosistem Lakoo. Kami akan membantu mengatur ulang kata sandi Anda.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-border">
          <form className="space-y-6" onSubmit={handleRequestToken}>
            {error && (
              <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm font-medium border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">
                Alamat Email Akun
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="h-5 w-5 opacity-50" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full bg-background border border-border rounded-lg py-3 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm"
                  placeholder="manager@example.com"
                />
              </div>
            </div>

            <div className="flex justify-between gap-4">
              <Link 
                to="/login"
                className="w-1/3 flex items-center justify-center py-3 px-4 rounded-xl font-bold text-foreground bg-muted hover:bg-muted/80 transition-all border border-border"
               >
                 <ArrowLeft className="h-5 w-5" />
              </Link>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-2/3 flex justify-center py-3 px-4 rounded-xl shadow-lg shadow-primary/20 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
              >
                {loading ? <RotateCw className="animate-spin h-5 w-5" /> : 'Reset Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
