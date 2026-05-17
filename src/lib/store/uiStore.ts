'use client'
import { create } from 'zustand'

interface UIStore {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
  activeTripId: string | null
  setActiveTripId: (id: string | null) => void
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  chatOpen: false,
  setChatOpen: (open) => set({ chatOpen: open }),
  activeTripId: null,
  setActiveTripId: (id) => set({ activeTripId: id }),
}))
