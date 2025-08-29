import { Navbar } from "@/components/landing/Navbar";
import { CandidateHero } from "@/components/candidate/CandidateHero";
import { PrepChecklist } from "@/components/candidate/PrepChecklist";
import { Steps } from "@/components/candidate/Steps";
import { VacancyPicker } from "@/components/candidate/VacancyPicker";
import { MicTest } from "@/components/candidate/MicTest";
import { FAQ } from "@/components/candidate/FAQ";
import { Footer } from "@/components/landing/Footer";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import LoginPage from '@/pages/Login';
import SignupPage from '@/pages/Signup';
import AdminDashboard from '@/pages/AdminDashboard';
import HRDashboard from '@/pages/HRDashboard';
import UserDashboard from '@/pages/UserDashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Toaster } from 'sonner';
import { TopProgress } from '@/components/ui/top-progress';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex min-h-svh flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={
                <>
                  <CandidateHero />
                  <PrepChecklist />
                  <Steps />
                  <VacancyPicker />
                  <MicTest />
                  <FAQ />
                </>
              } />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route element={<ProtectedRoute allow={["hr"]} />}>
                <Route path="/hr" element={<HRDashboard />} />
              </Route>
              <Route element={<ProtectedRoute allow={["candidate"]} />}>
                <Route path="/user" element={<UserDashboard />} />
              </Route>
              <Route element={<ProtectedRoute allow={["admin"]} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <Toaster richColors position="top-center" />
          <TopProgress />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
