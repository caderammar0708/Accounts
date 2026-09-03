
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
        <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <div className="flex flex-1 flex-col overflow-x-hidden">
          <Header setSidebarCollapsed={setSidebarCollapsed} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
          </main>
          {/* <Footer /> */}
        </div>
    </div>
  );
};

export default MainLayout;
