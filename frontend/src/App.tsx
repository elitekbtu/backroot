import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import GuestLayout from './layout/GuestLayout';
import MainLayout from './layout/MainLayout';
import Hero from './pages/Hero';
import Home from './pages/Home';
import Weather from './pages/Weather';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AR from './pages/AR';
import V2V from './pages/V2V';
import POICollector from './pages/POICollector';
import ARTest from './components/ARTest';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

import './App.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<GuestRoute><GuestLayout /></GuestRoute>}>
        <Route index element={<Hero />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>
      
      <Route path="/dashboard" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="weather" element={<Weather />} />
        <Route path="ar" element={<AR />} />
        <Route path="v2v" element={<V2V />} />
        <Route path="poi" element={<POICollector />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="/ar-test" element={<ARTest />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
};

export default App
