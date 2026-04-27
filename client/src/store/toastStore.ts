import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'success', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({ toasts: [...state.toasts, { id, message, type, duration }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, duration)
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

// Helper constant for manual usage
export const toast = {
  success: (msg: string, duration?: number) => useToastStore.getState().addToast(msg, 'success', duration),
  error: (msg: string, duration?: number) => useToastStore.getState().addToast(msg, 'error', duration),
  info: (msg: string, duration?: number) => useToastStore.getState().addToast(msg, 'info', duration),
  warning: (msg: string, duration?: number) => useToastStore.getState().addToast(msg, 'warning', duration),
}
