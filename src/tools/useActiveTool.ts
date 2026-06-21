import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toolsById, type ToolDef } from "@/tools/registry";

const TOOL_PARAM = "tool";

// Which tool is open lives in the URL (`?tool=kitchen_grocery-manager`) rather than in a store.
// That keeps the house backdrop mounted while tools come and go, makes a tool deep-linkable, and lets the browser back button close a window.
export function useActiveTool() {
  const [params, setParams] = useSearchParams();
  const id = params.get(TOOL_PARAM);
  const tool: ToolDef | null = id ? toolsById[id] ?? null : null;

  const openTool = useCallback(
    (toolId: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(TOOL_PARAM, toolId);
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const closeTool = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(TOOL_PARAM);
        return next;
      },
      { replace: true }
    );
  }, [setParams]);

  return { tool, openTool, closeTool };
}
