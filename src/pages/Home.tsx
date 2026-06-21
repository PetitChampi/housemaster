import Menu from "@/components/Menu";
import HouseBackdrop from "@/components/HouseBackdrop";
import ToolWindow from "@/components/ToolWindow";
import { useUiStore } from "@/store/uiStore";
import { useCurrentUser } from "@/store/authStore";
import { useActiveTool } from "@/tools/useActiveTool";
import { canAccess } from "@/lib/roles";

const Home = () => {
  const isFullscreen = useUiStore((s) => s.isFullscreen);
  const user = useCurrentUser();
  const { tool, closeTool } = useActiveTool();

  // A tool only opens if the URL names a real one and the current user is allowed in.
  // (guards against someone pasting a link to a room they can't enter)
  const openTool =
    tool && user && canAccess(user.role, tool.minRole) ? tool : null;

  return (
    <>
      <Menu />
      <main className={isFullscreen ? "fullscreen" : undefined}>
        <HouseBackdrop />
        {openTool && (
          <ToolWindow key={openTool.id} tool={openTool} onClose={closeTool} />
        )}
      </main>
    </>
  );
};

export default Home;
