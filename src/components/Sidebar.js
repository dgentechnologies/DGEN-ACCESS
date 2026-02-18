'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Sidebar = ({ onClose }) => {
  const pathname = usePathname();
  
  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: HomeIcon },
    { name: 'Employees', path: '/employees', icon: UsersIcon },
    { name: 'Logs', path: '/logs', icon: ClipboardDocumentListIcon },
  ];

  const bottomNavItems = [
    { name: 'Settings', path: '/settings', icon: Cog6ToothIcon },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="w-8 h-8 text-purple-500" />
            <div>
              <h1 className="text-xl font-bold text-white">DGEN</h1>
              <p className="text-xs text-gray-400">Access Control</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.path}
            onClick={handleLinkClick}
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive(item.path)
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-gray-700">
        {bottomNavItems.map((item) => (
          <Link
            key={item.name}
            href={item.path}
            onClick={handleLinkClick}
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive(item.path)
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
