import { useState, type ReactNode } from "react";
import { AppContext } from "@/context/AppContext";
import { AppContextType, User} from "@/context/AppContext";

interface AppProviderProps {
  children: ReactNode;
}

const AppProvider = ({ children }: AppProviderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const user: User = { name: "Reginald", role: "GUEST", avatarUrl: "/img/reginald-penguin.jpg" };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const value: AppContextType = {
    isMenuOpen,
    toggleMenu,
    closeMenu,
    isFullscreen,
    setIsFullscreen,
    toggleFullscreen,
    user,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppProvider;
