import { create } from "zustand";

interface UiState {
  isMenuOpen: boolean;
  isFullscreen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  setFullscreen: (value: boolean) => void;
  toggleFullscreen: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isMenuOpen: false,
  isFullscreen: false,
  openMenu: () => set({ isMenuOpen: true }),
  closeMenu: () => set({ isMenuOpen: false }),
  toggleMenu: () => set((s) => ({ isMenuOpen: !s.isMenuOpen })),
  setFullscreen: (value) => set({ isFullscreen: value }),
  toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),
}));
