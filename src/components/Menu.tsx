import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUiStore } from "@/store/uiStore";
import { useAuthStore, useCurrentUser } from "@/store/authStore";
import { useActiveTool } from "@/tools/useActiveTool";
import { rooms } from "@/tools/registry";
import { canAccess } from "@/lib/roles";
import { IconX, IconChevronDown, IconArrowNarrowRight, IconLogout } from "@tabler/icons-react";

const Menu = () => {
  const isMenuOpen = useUiStore((s) => s.isMenuOpen);
  const toggleMenu = useUiStore((s) => s.toggleMenu);
  const closeMenu = useUiStore((s) => s.closeMenu);
  const user = useCurrentUser();
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const { tool: activeTool, openTool } = useActiveTool();

  const [isMounted, setIsMounted] = useState(isMenuOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [wasOpen, setWasOpen] = useState(isMenuOpen);

  // Respond to isMenuOpen changing during render rather than in an effect, the way react.dev's "You Might Not Need an Effect" suggests for state derived from a prop or store value.
  // Opening mounts the menu at once; closing keeps it mounted and flags the closing animation, which then unmounts it from handleAnimationEnd.
  if (isMenuOpen !== wasOpen) {
    setWasOpen(isMenuOpen);
    if (isMenuOpen) {
      setIsMounted(true);
      setIsClosing(false);
    } else if (isMounted) {
      setIsClosing(true);
    }
  }

  const handleExit = () => {
    closeMenu();
    signOut();
    navigate("/auth");
  };

  const handleOpenTool = (toolId: string) => {
    openTool(toolId);
    closeMenu();
  };

  const handleAnimationEnd: React.AnimationEventHandler<HTMLDivElement> = () => {
    if (isClosing) {
      setIsMounted(false);
      setIsClosing(false);
    }
  };

  // Each room keeps only the tools this user may open, and a room with nothing left to show drops out of the menu.
  const visibleRooms = user
    ? rooms
        .map((room) => ({
          ...room,
          tools: room.tools.filter((tool) => canAccess(user.role, tool.minRole)),
        }))
        .filter((room) => room.tools.length > 0)
    : [];

  if (!user) return null;

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

      {isMounted && (
        <div
          className={`menu-container ${isClosing ? "is-closing" : ""}`}
          onAnimationEnd={handleAnimationEnd}
        >
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

              {visibleRooms.map((room) => {
                const Icon = room.Icon;
                return (
                  <details key={room.id} className="room-item">
                    <summary>
                      <div className="title">
                        {Icon && <Icon size={20} stroke="1" className="icon" />}
                        {room.title}
                      </div>
                      <span className="chevron">
                        <IconChevronDown size={20} stroke="1.5" className="icon" />
                      </span>
                    </summary>
                    <div className="menu-item-children">
                      {room.tools.map((tool) => (
                        <button
                          key={tool.id}
                          className={`tool-link ${activeTool?.id === tool.id ? "is-active" : ""}`}
                          onClick={() => handleOpenTool(tool.id)}
                        >
                          <IconArrowNarrowRight size={20} stroke="1" className="icon" />
                          <span className="title">{tool.title}</span>
                        </button>
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
      )}
    </>
  );
};

export default Menu;
