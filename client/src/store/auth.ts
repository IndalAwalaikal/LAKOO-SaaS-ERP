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
  token: string | null
  user: User | null
  tenant: Tenant | null
  setCreds: (token: string, user: User, tenant: Tenant) => void
  updateUser: (user: Partial<User>) => void
  updateTenant: (tenant: Partial<Tenant>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      tenant: null,
      setCreds: (token, user, tenant) => set({ token, user, tenant }),
      updateUser: (attrs) => set((state) => ({ user: state.user ? { ...state.user, ...attrs } : null })),
      updateTenant: (attrs) => set((state) => ({ tenant: state.tenant ? { ...state.tenant, ...attrs } : null })),
      logout: () => set({ token: null, user: null, tenant: null }),
    }),
    {
      name: 'lakoo-auth-storage',
    }
  )
)
