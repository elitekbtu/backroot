import React from 'react';
import { Outlet } from 'react-router-dom';
import MainNavbar from '../components/MainNavbar';
import BottomBar from '../components/BottomBar';
import { FlickeringGrid } from '../components/ui/flickering-grid';

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Flickering Grid Background */}
      <div className="fixed inset-0 z-0">
        <FlickeringGrid
          className="w-full h-full"
          squareSize={3}
          gridGap={4}
          color="rgb(107, 114, 128)"
          maxOpacity={0.15}
          flickerChance={0.05}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <MainNavbar />
        <main className="flex-1 pb-16">
          {children || <Outlet />}
        </main>
        <BottomBar />
      </div>
    </div>
  );
};

export default MainLayout; 
