import { Routes, Route } from "react-router-dom";
import Header from "@/components/Header";
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

function App() {
  return (
    <>
      <Header />
      <Menu />
      <main>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Dashboard />} />
          
          {/* Living Room */}
          <Route path="/living-room/task-hub" element={<TaskHub />} />
          <Route path="/living-room/calendar" element={<Calendar />} />

          {/* Kitchen */}
          <Route path="/kitchen/grocery-manager" element={<GroceryManager />} />

          {/* Bathroom */}
          <Route path="/bathroom/quote-of-the-day" element={<QuoteOfTheDay />} />

          {/* Bedroom */}
          <Route path="/bedroom/snooze-buddy" element={<SnoozeBuddy />} />

          {/* Study */}
          <Route path="/study/accounting-links" element={<AccountingLinks />} />
          <Route path="/study/task-board" element={<TaskBoard />} />

          {/* Hobby Room */}
          <Route path="/hobby-room/craft-log" element={<CraftLog />} />
          <Route path="/hobby-room/travel-log" element={<TravelLog />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
