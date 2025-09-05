import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GuestLayout from './layout/GuestLayout';
import MainLayout from './layout/MainLayout';
import Hero from './pages/Hero';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Weather from './pages/Weather';
import Home from './pages/Home';
import V2V from './pages/V2V';
import AR from './pages/AR';
import Settings from './pages/Settings';
import './App.css';

function App() {
  const [isAuthenticated] = useState(false);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Guest Routes - for unauthenticated users */}
          <Route path="/" element={
            <GuestLayout>
              <Hero />
            </GuestLayout>
          } />
          <Route path="/login" element={
            <GuestLayout>
              <Login />
            </GuestLayout>
          } />
          <Route path="/register" element={
            <GuestLayout>
              <Register />
            </GuestLayout>
          } />
          
          {/* Main Routes - for authenticated users */}
          <Route path="/home" element={
            <MainLayout>
              <Home />
            </MainLayout>
          } />
          <Route path="/v2v" element={
            <MainLayout>
              <V2V />
            </MainLayout>
          } />
          <Route path="/ar" element={
            <MainLayout>
              <AR />
            </MainLayout>
          } />
          <Route path="/settings" element={
            <MainLayout>
              <Settings />
            </MainLayout>
          } />
          <Route path="/weather" element={
            <MainLayout>
              <Weather />
            </MainLayout>
          } />
          
          {/* Redirect to home for authenticated users, hero for guests */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App
