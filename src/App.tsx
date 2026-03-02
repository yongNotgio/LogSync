import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/common/Layout";
import { Home } from "./pages/Home";
import { Dashboard } from "./pages/Dashboard";
import { JournalPage } from "./pages/JournalPage";
import { History } from "./pages/History";
import { AuthCallback } from "./pages/AuthCallback";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="journal/:date?" element={<JournalPage />} />
        <Route path="history" element={<History />} />
      </Route>
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  );
}

export default App;
