'use client';

import Sidebar from './Sidebar';

const LayoutWrapper = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="min-h-full p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default LayoutWrapper;
