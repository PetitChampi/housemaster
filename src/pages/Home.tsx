import { lazy, Suspense } from "react";
import Menu from "@/components/Menu";
import ToolWindow from "@/components/ToolWindow";
import { useUiStore } from "@/store/uiStore";
import { useCurrentUser } from "@/store/authStore";
import { useActiveTool } from "@/tools/useActiveTool";
import { canAccess } from "@/lib/roles";

// three.js loads as its own chunk and stays out of the auth screen's bundle
// fetched once then stays mounted (tool opening never reloads it)
const HouseBackdrop = lazy(() => import("@/components/HouseBackdrop"));

const Home = () => {
  const isFullscreen = useUiStore((s) => s.isFullscreen);
  const user = useCurrentUser();
  const { tool, closeTool } = useActiveTool();

  // tool only opens if the URL exists + current user is allowed
  const openTool =
    tool && user && canAccess(user.role, tool.minRole) ? tool : null;

  return (
    <>
      <Menu />
      <main className={`app-main ${isFullscreen ? "fullscreen" : undefined}`}>
        <Suspense fallback={<div className="house-backdrop" />}>
          <HouseBackdrop />
        </Suspense>
        {openTool && (
          <ToolWindow key={openTool.id} tool={openTool} onClose={closeTool} />
        )}
      </main>
    </>
  );
};

export default Home;
