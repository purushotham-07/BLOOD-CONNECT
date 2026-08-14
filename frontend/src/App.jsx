import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Loading from './components/Loading';
import EmergencyAlert from './components/EmergencyAlert';

// Lazy-load pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DonorProfile = lazy(() => import('./pages/DonorProfile'));
const BloodRequests = lazy(() => import('./pages/BloodRequests'));
const CreateBloodRequest = lazy(() => import('./pages/CreateBloodRequest'));
const BloodRequestDetails = lazy(() => import('./pages/BloodRequestDetails'));
const Notifications = lazy(() => import('./pages/Notifications'));

function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loading label="Loading…" />
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans antialiased selection:bg-brand-500 selection:text-white">
      <Navbar />
      <div className="flex-1">
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donor-profile"
              element={
                <ProtectedRoute role="DONOR">
                  <DonorProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/blood-requests"
              element={
                <ProtectedRoute>
                  <BloodRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-request"
              element={
                <ProtectedRoute role="REQUESTER">
                  <CreateBloodRequest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/blood-requests/:id"
              element={
                <ProtectedRoute>
                  <BloodRequestDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
      <Footer />
      <EmergencyAlert />
    </div>
  );
}