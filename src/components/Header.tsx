import { useApp } from '../context/AppContext';
import './Header.css';

const Header = () => {
  const { toggleMenu } = useApp();
  return (
    <header className="app-header">
      <button className="menu-button" onClick={toggleMenu}>
        MENU ☰
      </button>
    </header>
  );
};

export default Header;