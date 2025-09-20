import React from 'react';
import { Outlet } from 'react-router-dom';
import GuestNavbar from '../components/GuestNavbar';

interface GuestLayoutProps {
  children?: React.ReactNode;
}

const GuestLayout: React.FC<GuestLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <GuestNavbar />
      <main className="flex-1">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default GuestLayout;