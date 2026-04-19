
import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import RealtimeNotificationToast from './components/RealtimeNotificationToast.jsx';
import HomePage from './pages/HomePage.jsx';
import ReformasPage from './pages/ReformasPage.jsx';
import ReformaDetailPage from './pages/ReformaDetailPage.jsx';
import SearchResults from './pages/SearchResults.jsx';
import AboutPage from './pages/AboutPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SubscriptionsPage from './pages/SubscriptionsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminSubscribersPage from './pages/AdminSubscribersPage.jsx';
import AdminExportPage from './pages/AdminExportPage.jsx';
import { Toaster } from 'sonner';

function AppContent() {
  const { socket } = useAuth();

  return (
    <>
      <ScrollToTop />
      <Toaster position="top-right" />
      {socket && <RealtimeNotificationToast socket={socket} />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/reformas" element={<ReformasPage />} />
        <Route path="/reforma/:id" element={<ReformaDetailPage />} />
        <Route path="/buscar" element={<SearchResults />} />
        <Route path="/acerca-de" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<SignupPage />} />
        
        {/* User Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute>
              <SubscriptionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/subscribers"
          element={
            <AdminRoute>
              <AdminSubscribersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/export"
          element={
            <AdminRoute>
              <AdminExportPage />
            </AdminRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
