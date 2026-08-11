import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import ParticleBackground from "./components/ParticleBackground";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import TestCaseDetailsPage from "./pages/TestCaseDetailsPage";
import AdminActivityPage from "./pages/admin/AdminActivityPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminProjectsPage from "./pages/admin/AdminProjectsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import DeveloperAnalyticsPage from "./pages/developer/DeveloperAnalyticsPage";
import DeveloperProjectPage from "./pages/developer/DeveloperProjectPage";
import DeveloperProjectsPage from "./pages/developer/DeveloperProjectsPage";
import TesterAnalyticsPage from "./pages/tester/TesterAnalyticsPage";
import TesterProjectPage from "./pages/tester/TesterProjectPage";
import TesterProjectsPage from "./pages/tester/TesterProjectsPage";

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-night text-slate-100">
      <ParticleBackground />
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Navigate to="/admin/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/projects"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/activity"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminActivityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer"
              element={
                <ProtectedRoute allowedRoles={["developer"]}>
                  <Navigate to="/developer/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/dashboard"
              element={
                <ProtectedRoute allowedRoles={["developer"]}>
                  <DeveloperAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/projects"
              element={
                <ProtectedRoute allowedRoles={["developer"]}>
                  <DeveloperProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/project/:id"
              element={
                <ProtectedRoute allowedRoles={["developer"]}>
                  <DeveloperProjectPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/project/:id/testcases/:testCaseId"
              element={
                <ProtectedRoute allowedRoles={["developer"]}>
                  <TestCaseDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tester"
              element={
                <ProtectedRoute allowedRoles={["tester"]}>
                  <Navigate to="/tester/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tester/dashboard"
              element={
                <ProtectedRoute allowedRoles={["tester"]}>
                  <TesterAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tester/projects"
              element={
                <ProtectedRoute allowedRoles={["tester"]}>
                  <TesterProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tester/project/:id"
              element={
                <ProtectedRoute allowedRoles={["tester"]}>
                  <TesterProjectPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tester/project/:id/testcases/:testCaseId"
              element={
                <ProtectedRoute allowedRoles={["tester"]}>
                  <TestCaseDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
