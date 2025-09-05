import React from 'react';
import { Outlet } from 'react-router-dom';
import MainNavbar from '../components/MainNavbar';
import MainFooter from '../components/MainFooter';

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      <MainFooter />
    </div>
  );
};

export default MainLayout; 
