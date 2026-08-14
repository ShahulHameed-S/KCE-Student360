import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import DashboardLayout from "./layouts/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";

// Import all required pages
import LoginPage from "./pages/LoginPage";
import FacultyDashboard from "./pages/FacultyDashboard";
import StudentListPage from "./pages/StudentListPage";
import StudentProfilePage from "./pages/StudentProfilePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import RecommendationPage from "./pages/RecommendationPage";
import ScoreUploadPage from "./pages/ScoreUploadPage";
import MentorApprovalPage from "./pages/MentorApprovalPage";
import PortfolioPage from "./pages/PortfolioPage";

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Router>
          <Routes>
            {/* Public Auth Page */}
            <Route path="/login" element={<LoginPage />} />

            {/* Standalone Public Student Portfolio Page */}
            <Route path="/portfolio/:registerNo" element={<PortfolioPage />} />

            {/* Protected Dashboard Layout and Sub-pages */}
            <Route path="/" element={<DashboardLayout />}>
              {/* Redirect root to dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Pages inside layout */}
              <Route path="dashboard" element={<FacultyDashboard />} />
              <Route path="my-profile" element={<FacultyDashboard />} />
              <Route path="my-performance" element={<FacultyDashboard />} />
              <Route path="my-portfolio" element={<FacultyDashboard />} />
              <Route path="my-projects" element={<FacultyDashboard />} />
              <Route path="my-certifications" element={<FacultyDashboard />} />
              <Route path="my-achievements" element={<FacultyDashboard />} />
              <Route path="my-resume" element={<FacultyDashboard />} />
              <Route path="students" element={<StudentListPage />} />
              <Route path="students/me" element={<StudentProfilePage />} />
              <Route path="students/:id" element={<StudentProfilePage />} />
              <Route path="student/:id" element={<StudentProfilePage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="recommendations" element={<RecommendationPage />} />
              <Route path="upload-scores" element={<ScoreUploadPage />} />
              <Route path="mentor/upload-records" element={<ScoreUploadPage />} />
              <Route path="admin/upload-scores" element={<ScoreUploadPage />} />
              <Route path="mentor/approvals" element={<MentorApprovalPage />} />
            </Route>

            {/* Catch-all redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
