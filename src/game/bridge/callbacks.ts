// The one-way gate between the imperative game engine and React
// The engine calls these (never imports React / router / any store)
export interface GameCallbacks {
  // Ask the app to open a tool window (see tools/registry)
  onOpenTool: (toolId: string) => void;
  // Report the interaction prompt to show, or null when nothing is in reach
  onPromptChange: (prompt: string | null) => void;
  // Whether the current user is allowed to open a tool (mirroring the menu and deep-link guards)
  canOpenTool: (toolId: string) => boolean;
}
