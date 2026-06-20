import { Routes, Route, useLocation } from "react-router-dom";
import Menu from "@/components/Menu";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import QuoteOfTheDay from "@/pages/Bathroom/QuoteOfTheDay";
import SnoozeBuddy from "@/pages/Bedroom/SnoozeBuddy";
import CraftLog from "@/pages/HobbyRoom/CraftLog";
import TravelLog from "@/pages/HobbyRoom/TravelLog";
import GroceryManager from "@/pages/Kitchen/GroceryManager";
import Calendar from "@/pages/LivingRoom/Calendar";
import TaskHub from "@/pages/LivingRoom/TaskHub";
import AccountingLinks from "@/pages/Study/AccountingLinks";
import TaskBoard from "@/pages/Study/TaskBoard";
import ToolLayout from "@/components/ToolLayout";
import { useApp } from "@/context/AppContext";

function App() {
  const { isFullscreen } = useApp();
  const isAuthPage = useLocation().pathname === "/auth";

  return (
    <>
      {!isAuthPage && <Menu />}
      <main className={isFullscreen ? "fullscreen" : undefined}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Dashboard />} />
          
          {/* Living room */}
          <Route
            path="/living-room/task-hub"
            element={<ToolLayout><TaskHub /></ToolLayout>}
          />
          <Route
            path="/living-room/calendar"
            element={<ToolLayout><Calendar /></ToolLayout>}
          />

          {/* Kitchen */}
          <Route
            path="/kitchen/grocery-manager"
            element={<ToolLayout><GroceryManager /></ToolLayout>}
          />

          {/* Bathroom */}
          <Route
            path="/bathroom/quote-of-the-day"
            element={<ToolLayout><QuoteOfTheDay /></ToolLayout>}
          />

          {/* Bedroom */}
          <Route
            path="/bedroom/snooze-buddy"
            element={<ToolLayout><SnoozeBuddy /></ToolLayout>}
          />

          {/* Study */}
          <Route
            path="/study/accounting-links"
            element={<ToolLayout><AccountingLinks /></ToolLayout>}
          />
          <Route
            path="/study/task-board"
            element={<ToolLayout><TaskBoard /></ToolLayout>}
          />

          {/* Hobby room */}
          <Route
            path="/hobby-room/craft-log"
            element={<ToolLayout><CraftLog /></ToolLayout>}
          />
          <Route
            path="/hobby-room/travel-log"
            element={<ToolLayout><TravelLog /></ToolLayout>}
          />
        </Routes>
      </main>
    </>
  );
}

export default App;
