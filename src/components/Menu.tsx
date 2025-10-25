import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";

const Menu = () => {
  const { isMenuOpen, closeMenu, user } = useApp();
  const navigate = useNavigate();

  if (!isMenuOpen) return null;

  const handleExit = () => {
    closeMenu();
    navigate('/auth');
  };

  return (
    <>
      <div className="menu-overlay" onClick={closeMenu}></div>
      <div className="menu-container">
        <div className="menu-header">
          <div className="user-profile">
            <span className="user-avatar">{user.avatar}</span>
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button className="close-button" onClick={closeMenu}>×</button>
        </div>
        
        <div className="rooms-list">
          <p className="rooms-title">ROOMS</p>
          
          <details open>
            <summary>🛋️ Living room</summary>
            <NavLink to="/living-room/task-hub" onClick={closeMenu}>→ To-do list</NavLink>
            <NavLink to="/living-room/calendar" onClick={closeMenu}>→ Calendar</NavLink>
          </details>

          <details>
            <summary>🍴 Kitchen</summary>
            <NavLink to="/kitchen/grocery-manager" onClick={closeMenu}>→ Grocery Manager</NavLink>
          </details>

          <details>
            <summary>🛁 Bathroom</summary>
            <NavLink to="/bathroom/quote-of-the-day" onClick={closeMenu}>→ Daily Quote</NavLink>
          </details>
          
          <details>
            <summary>🛏️ Bedroom</summary>
            <NavLink to="/bedroom/snooze-buddy" onClick={closeMenu}>→ Snooze Buddy</NavLink>
          </details>

          <details>
            <summary>💼 Study</summary>
            <NavLink to="/study/accounting-links" onClick={closeMenu}>→ Accounting Links</NavLink>
            <NavLink to="/study/task-board" onClick={closeMenu}>→ Task Board</NavLink>
          </details>

          <details>
            <summary>🎨 Hobby room</summary>
            <NavLink to="/hobby-room/craft-log" onClick={closeMenu}>→ Craft Log</NavLink>
            <NavLink to="/hobby-room/travel-log" onClick={closeMenu}>→ Travel Log</NavLink>
          </details>
        </div>

        <button className="exit-button" onClick={handleExit}>
          Exit house 🚪
        </button>
      </div>
    </>
  );
};

export default Menu;
