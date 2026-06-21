import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import Home from "@/pages/Home";
import { useCurrentUser } from "@/store/authStore";

function App() {
  const user = useCurrentUser();

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to="/" replace /> : <Auth />}
      />
      <Route
        path="/"
        element={user ? <Home /> : <Navigate to="/auth" replace />}
      />
      <Route path="*" element={<Navigate to={user ? "/" : "/auth"} replace />} />
    </Routes>
  );
}

export default App;
