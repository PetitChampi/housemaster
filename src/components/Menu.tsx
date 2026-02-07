import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { IconX, IconSofa, IconToolsKitchen3, IconBath, IconBed, IconBriefcase, IconTriangleSquareCircle, IconChevronDown, IconArrowNarrowRight, IconLogout, Icon } from "@tabler/icons-react";

type MenuLink = {
  title: string;
  icon?: Icon;
  path: string;
  children?: { title: string; path: string }[];
};

const Menu = () => {
  const { isMenuOpen, toggleMenu, closeMenu, user } = useApp();
  const navigate = useNavigate();

  const menuLinks: MenuLink[] = [
    { title: "Living room", icon: IconSofa, path: "/living-room", children: [
      { title: "Task hub", path: "/living-room/task-hub" },
      { title: "Calendar", path: "/living-room/calendar" },
    ]},
    { title: "Kitchen", icon: IconToolsKitchen3, path: "/kitchen", children: [
      { title: "Grocery manager", path: "/kitchen/grocery-manager" },
    ]},
    { title: "Bathroom", icon: IconBath, path: "/bathroom", children: [
      { title: "Quote of the day", path: "/bathroom/quote-of-the-day" },
    ]},
    { title: "Bedroom", icon: IconBed, path: "/bedroom", children: [
      { title: "Snooze buddy", path: "/bedroom/snooze-buddy" },
    ]},
    { title: "Study", icon: IconBriefcase, path: "/study", children: [
      { title: "Accounting links", path: "/study/accounting-links" },
      { title: "Task board", path: "/study/task-board" },
    ]},
    { title: "Hobby room", icon: IconTriangleSquareCircle, path: "/hobby-room", children: [
      { title: "Craft log", path: "/hobby-room/craft-log" },
      { title: "Travel log", path: "/hobby-room/travel-log" },
    ]},
  ];

  const handleExit = () => {
    closeMenu();
    navigate('/auth');
  };

  return (
    <>
      <header className="app-header">
        <button className="menu-button" onClick={toggleMenu}>
          Menu
          <div className="burger">
            <div className="bars">
              <div className="bar"></div><div className="bar"></div><div className="bar"></div>
            </div>
          </div>
        </button>
      </header>
      {isMenuOpen &&
        <>
          <div className="menu-container">
            <div className="menu-header">
              <div className="user-profile">
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">{user.role}</span>
                </div>
                <span className="user-avatar">
                  <img src={user.avatarUrl} alt="User avatar" />
                </span>
              </div>
              <button className="close-button" onClick={closeMenu}>
                <IconX size={20} stroke={1.5} />
              </button>
            </div>
            
            <div className="rooms-list">
              <p className="rooms-title">Rooms</p>

              {menuLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <details key={link.path} className="room-item" open={index === 0}>
                    <summary>
                      <div className="title">
                        {Icon && <Icon size={20} stroke="1" className="icon" />}
                        {link.title}
                      </div>
                      <span className="chevron">
                        <IconChevronDown size={20} stroke="1.5" className="icon" />
                      </span>
                    </summary>
                    <div className="menu-item-children">
                      {link.children?.map((child) => (
                        <NavLink key={child.path} to={child.path} onClick={closeMenu}>
                          <p className="item">
                            <IconArrowNarrowRight size={20} stroke="1" className="icon" />
                            <span className="title">{child.title}</span>
                          </p>
                        </NavLink>
                      ))}
                    </div>
                  </details>
                );
              })}
            </div>

            <button className="exit-button" onClick={handleExit}>
              Exit house <IconLogout size={20} stroke="1.5" className="icon" />
            </button>
          </div>
        </>
      }
    </>
  );
};

export default Menu;
