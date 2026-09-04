import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";

import ErsList from "./pages/ops/ErsList";
import ErsForm from "./pages/ops/ErsForm";
import OpsTurnoverList from "./pages/ops/TurnoverList";

import ErTurnoverList from "./pages/er/TurnoverList";

import RecruitmentErsList from "./pages/recruitment/ErsList";
import RecruitmentTurnoverList from "./pages/recruitment/TurnoverList";
import InterviewList from "./pages/recruitment/InterviewList";
import InterviewForm from "./pages/recruitment/InterviewForm";
import CandidateList from "./pages/recruitment/CandidateList";

import TrainingTurnoverList from "./pages/training/TurnoverList";
import IdCardList from "./pages/training/IdCardList";

import PayrollTurnoverList from "./pages/payroll/TurnoverList";

import UserManagement from "./pages/admin/userManagement";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />

            {/* OPS */}
            <Route path="/ops/ers" element={<ErsList />} />
            <Route path="/ops/ers/new" element={<ErsForm />} />
            <Route path="/ops/turnover" element={<OpsTurnoverList />} />

            {/* Employee Relation */}
            <Route path="/er/turnover" element={<ErTurnoverList />} />

            {/* Recruitment */}
            <Route path="/recruitment/ers" element={<RecruitmentErsList />} />
            <Route path="/recruitment/turnover" element={<RecruitmentTurnoverList />} />
            <Route path="/recruitment/interview" element={<InterviewList />} />
            <Route path="/recruitment/interview/new" element={<InterviewForm />} />
            <Route path="/recruitment/peserta" element={<CandidateList />} />

            {/* Training */}
            <Route path="/training/turnover" element={<TrainingTurnoverList />} />
            <Route path="/training/idcard" element={<IdCardList />} />

            {/* Payroll */}
            <Route path="/payroll/turnover" element={<PayrollTurnoverList />} />

            {/* Super Admin */}
            <Route path="/admin/users" element={<UserManagement />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}