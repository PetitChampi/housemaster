import { useState, type ReactNode } from "react";
import { AppContext } from "@/context/AppContext";

interface AppProviderProps {
  children: ReactNode;
}

const AppProvider = ({ children }: AppProviderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = { name: 'Reginald', role: 'GUEST', avatar: '🐧' };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const value = {
    isMenuOpen,
    toggleMenu,
    closeMenu,
    user,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppProvider;
