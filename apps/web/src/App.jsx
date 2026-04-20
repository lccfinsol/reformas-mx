
import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import { AuthProvider, useAuth } from '@/contexts/AuthContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import RealtimeNotificationToast from '@/components/RealtimeNotificationToast.jsx';
import { Toaster } from 'sonner';

// Pages
import HomePage from '@/pages/HomePage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import SignupPage from '@/pages/SignupPage.jsx';
import ReformasPage from '@/pages/ReformasPage.jsx';
import ReformaDetailPage from '@/pages/ReformaDetailPage.jsx';
import NotificationsPage from '@/pages/NotificationsPage.jsx';
import SubscriptionsPage from '@/pages/SubscriptionsPage.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';

function AppContent() {
  const { socket } = useAuth();

  return (
    <>
      <ScrollToTop />
      <Toaster position="top-right" />
      {socket && <RealtimeNotificationToast socket={socket} />}
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<SignupPage />} />
        <Route path="/reformas" element={<ReformasPage />} />
        <Route path="/reforma/:id" element={<ReformaDetailPage />} />
        
        {/* Fallback routes for uncompleted links */}
        <Route path="/buscar" element={<ReformasPage />} />
        <Route path="/acerca-de" element={<HomePage />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notificaciones" 
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/suscripciones" 
          element={
            <ProtectedRoute>
              <SubscriptionsPage />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<HomePage />} />
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
