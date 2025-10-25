import { createContext, useContext } from 'react';

interface AppContextType {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
  user: {
    name: string;
    role: string;
    avatar: string;
  };
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}