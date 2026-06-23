import { useEffect, useRef, useState } from "react";
import { Engine } from "@/game/engine/Engine";
import { useActiveTool } from "@/tools/useActiveTool";
import { useCurrentUser } from "@/store/authStore";
import { canAccess } from "@/lib/roles";
import { toolsById } from "@/tools/registry";

// Mounts the 3D engine into a container and bridges it to the app.
// The engine owns its own loop, so React only boots it, feeds it the "is a tool open" flag and disposes it.
const GameCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const { tool, openTool } = useActiveTool();
  const user = useCurrentUser();
  const [prompt, setPrompt] = useState<string | null>(null);

  // The engine reads these through refs so it never has to be re-created when openTool or the user changes.
  const openToolRef = useRef(openTool);
  const canOpenRef = useRef<(toolId: string) => boolean>(() => false);
  useEffect(() => {
    openToolRef.current = openTool;
  }, [openTool]);
  useEffect(() => {
    canOpenRef.current = (toolId) => {
      const target = toolsById[toolId];
      return !!target && !!user && canAccess(user.role, target.minRole);
    };
  }, [user]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const engine = new Engine(container, {
      onOpenTool: (id) => openToolRef.current(id),
      onPromptChange: setPrompt,
      canOpenTool: (id) => canOpenRef.current(id),
    });
    engine.start();
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Pause the simulation whenever a tool window is open
  useEffect(() => {
    engineRef.current?.setActive(!tool);
  }, [tool]);

  return (
    <div className="game-canvas" ref={containerRef}>
      {prompt && <p className="game-prompt">{prompt}</p>}
    </div>
  );
};

export default GameCanvas;
