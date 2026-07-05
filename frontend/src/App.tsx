import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Theme Context Provider
import { ThemeProvider } from "./context/ThemeContext";

// Auth Provider & Guard
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Layout
import { DashboardLayout } from "./layouts/DashboardLayout";

// Pages
import { Workspace } from "./pages/Workspace";
import { AIAssistant } from "./pages/AIAssistant";
import { Tutor } from "./pages/Tutor";
import { StudyPlanner } from "./pages/StudyPlanner";
import { KnowledgeBase } from "./pages/KnowledgeBase";
import { KnowledgeSearch } from "./pages/KnowledgeSearch";
import { Placement } from "./pages/Placement";
import { Progress } from "./pages/Progress";
import { Profile } from "./pages/Profile";
import { Memory } from "./pages/Memory";
import { Settings } from "./pages/Settings";
import { NotFound } from "./pages/NotFound";
import { Landing } from "./pages/Landing";

// Auth Pages
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";

// Instantiate TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Marketing Landing Page */}
              <Route path="/landing" element={<Landing />} />

              {/* Public Authentication Pages */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected Learning Dashboard Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/" element={<Workspace />} />
                  <Route path="/assistant" element={<AIAssistant />} />
                  <Route path="/tutor" element={<Tutor />} />
                  <Route path="/planner" element={<StudyPlanner />} />
                  <Route path="/knowledge" element={<KnowledgeBase />} />
                  <Route path="/search" element={<KnowledgeSearch />} />
                  <Route path="/placement" element={<Placement />} />
                  <Route path="/progress" element={<Progress />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/memory" element={<Memory />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>

              {/* Catch-all 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
