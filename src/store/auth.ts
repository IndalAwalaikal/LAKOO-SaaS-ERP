import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Tenant {
  id: string
  name: string
  slug: string
  payment_config?: string | null
  logo_url?: string | null
}

interface AuthState {
  user: User | null
  tenant: Tenant | null
  token: string | null
  setCreds: (user: User, tenant: Tenant, token: string) => void
  updateUser: (user: Partial<User>) => void
  updateTenant: (tenant: Partial<Tenant>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      token: null,
      setCreds: (user, tenant, token) => set({ user, tenant, token }),
      updateUser: (attrs) => set((state) => ({ user: state.user ? { ...state.user, ...attrs } : null })),
      updateTenant: (attrs) => set((state) => ({ tenant: state.tenant ? { ...state.tenant, ...attrs } : null })),
      logout: () => set({ user: null, tenant: null, token: null }),
    }),
    {
      name: 'lakoo-auth-storage',
    }
  )
)
