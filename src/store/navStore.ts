import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NavState {
  isCollapsed: boolean
  toggleCollapsed: () => void
  setCollapsed: (val: boolean) => void
}

export const useNavStore = create<NavState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setCollapsed: (val) => set({ isCollapsed: val }),
    }),
    {
      name: 'lakoo-nav-storage',
    }
  )
)
