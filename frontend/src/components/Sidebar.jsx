import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: HomeIcon },
    { name: 'Employees', path: '/employees', icon: UsersIcon },
    { name: 'Logs', path: '/logs', icon: ClipboardDocumentListIcon },
  ];

  const bottomNavItems = [
    { name: 'Settings', path: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-dark-700">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="w-8 h-8 text-primary-500" />
          <div>
            <h1 className="text-xl font-bold text-white">DGEN</h1>
            <p className="text-xs text-dark-400">Access Control</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500 text-white shadow-glow-sm'
                  : 'text-dark-300 hover:bg-dark-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-dark-700">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500 text-white shadow-glow-sm'
                  : 'text-dark-300 hover:bg-dark-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
