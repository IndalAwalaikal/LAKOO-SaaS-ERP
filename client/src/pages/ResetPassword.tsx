import { useState, useEffect } from 'react'
import { RotateCw, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { apiClient } from '../lib/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Redirect if token missing
  useEffect(() => {
    if (!token) {
      setError('Token reset tidak valid atau tidak ditemukan di URL.')
    }
  }, [token])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== passwordConfirmation) {
      setError('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res: any = await apiClient.post('/auth/reset-password', { token, new_password: password })
      if(res.data?.success || res.status === 200) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setError(res.error?.message || 'Gagal mengatur ulang kata sandi.')
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Terjadi kesalahan internal. Token kadaluwarsa?')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="bg-card max-w-md w-full mx-auto p-10 rounded-2xl shadow-xl text-center space-y-6 border border-border">
            <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Berhasil Direset!</h2>
            <p className="text-muted-foreground">
              Kata sandi Anda telah diperbarui ke sistem kami. Anda akan dialihkan ke halaman masuk secara sinkron...
            </p>
            <Link to="/login" className="mt-8 block w-full py-3.5 px-4 rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 font-bold transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5">
              Masuk Sekarang
            </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-primary selection:text-primary-foreground">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground">
          Buat Kata Sandi Baru
        </h2>
        <div className="mt-3 text-sm text-muted-foreground px-4">
          Masukkan kata sandi perlindungan sekuritas baru untuk identitas token ini: <br />
          <span className="font-mono bg-muted px-2 py-0.5 mt-2 inline-block rounded text-[10px] border border-border">{token ? token.substring(0, 10) + '...' : 'INVALID_TOKEN'}</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-border">
          <form className="space-y-6" onSubmit={handleReset}>
            {error && (
              <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm font-medium border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-5 w-5 opacity-50" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 block w-full bg-background border border-border rounded-lg py-3 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm"
                  placeholder="••••••••"
                />
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
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <ShieldCheck className="h-5 w-5 opacity-50" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="pl-10 block w-full bg-background border border-border rounded-lg py-3 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !token}
                className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg shadow-primary/20 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
              >
                {loading ? <RotateCw className="animate-spin h-5 w-5" /> : 'Perbarui Kata Sandi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
