import React, { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface ToolLayoutProps {
  children: ReactNode;
}

const ToolLayout: React.FC<ToolLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="tool-master-container">
      <div className="tool-bar">
        {/* magnify icon - placeholder */}
        <button className="magnify-btn" aria-label="Magnify">
          🔍
        </button>
        <button
          className="close-btn"
          aria-label="Close"
          onClick={() => navigate("/")}
        >
          ✕
        </button>
      </div>
      <div className="tool-content">{children}</div>
    </div>
  );
};

export default ToolLayout;
