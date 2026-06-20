import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { IconMaximize, IconMinimize, IconX } from "@tabler/icons-react";
import { useApp } from "@/context/AppContext";

interface ToolLayoutProps {
  children: ReactNode;
}

const ToolLayout: React.FC<ToolLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { isFullscreen, setIsFullscreen, toggleFullscreen } = useApp();

  useEffect(() => {
    return () => {
      setIsFullscreen(false);
    };
  }, [setIsFullscreen]);

  const closeTool = () => {
    setIsFullscreen(false);
    navigate("/");
  };

  return (
    <div className="tool-master-container">
      <div className="tool-bar">
        <button
          className="tool-bar-btn magnify-btn"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <IconMinimize size={20} stroke={1.5} />
          ) : (
            <IconMaximize size={20} stroke={1.5} />
          )}
        </button>
        <button
          className="tool-bar-btn"
          aria-label="Close"
          onClick={closeTool}
        >
          <IconX size={20} stroke={1.5} />
        </button>
      </div>
      <div className="tool-content">{children}</div>
    </div>
  );
};

export default ToolLayout;
