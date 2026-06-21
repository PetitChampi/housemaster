import { useState } from "react";
import { IconMaximize, IconMinimize, IconX } from "@tabler/icons-react";
import { useUiStore } from "@/store/uiStore";
import type { ToolDef } from "@/tools/registry";

interface ToolWindowProps {
  tool: ToolDef;
  onClose: () => void;
}

const ToolWindow = ({ tool, onClose }: ToolWindowProps) => {
  const isFullscreen = useUiStore((s) => s.isFullscreen);
  const toggleFullscreen = useUiStore((s) => s.toggleFullscreen);
  const setFullscreen = useUiStore((s) => s.setFullscreen);
  const [isClosing, setIsClosing] = useState(false);

  const Tool = tool.Component;

  // Close in two steps: flip on the closing animation, then drop tool from URL once played.
  const handleAnimationEnd: React.AnimationEventHandler<HTMLDivElement> = (event) => {
    if (isClosing && event.target === event.currentTarget) {
      setFullscreen(false);
      onClose();
    }
  };

  return (
    <div
      className={`tool-master-container ${isClosing ? "is-closing" : ""}`}
      onAnimationEnd={handleAnimationEnd}
    >
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
          onClick={() => setIsClosing(true)}
        >
          <IconX size={20} stroke={1.5} />
        </button>
      </div>
      <div className="tool-content">
        <Tool />
      </div>
    </div>
  );
};

export default ToolWindow;
