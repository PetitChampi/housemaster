import { createContext, useContext } from 'react';

export type UserRole = 'GUEST' | 'MEMBER' | 'ADMIN';

export interface User {
  name: string;
  role: UserRole;
  avatarUrl: string;
}

export interface AppContextType {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
  user: User;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}