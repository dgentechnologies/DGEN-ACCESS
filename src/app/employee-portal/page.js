'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/services/api';
import {
  LockOpenIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

export default function EmployeePortal() {
  const { user, logout, loading } = useAuth();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Redirect if not logged in or if user is admin
    if (!loading) {
      if (!user) {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const handleRemoteUnlock = async () => {
    if (isUnlocking) return;
    
    setIsUnlocking(true);
    
    try {
      // Send unlock request with employee ID
      const response = await api.post('/api/remote-open', {
        employeeId: user?.id,
        employeeName: user?.name,
      });
      
      if (response.data.success) {
        toast.success('✓ Unlock Command Sent Successfully', {
          duration: 3000,
          style: {
            background: '#10b981',
            color: '#fff',
          },
        });
      } else {
        toast.error('Failed to send unlock command');
      }
    } catch (error) {
      console.error('Error sending unlock command:', error);
      toast.error('Error: Unable to send unlock command');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-purple-500/20 rounded-full">
              <ShieldCheckIcon className="w-16 h-16 text-purple-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Employee Portal</h1>
          <p className="text-gray-400">Welcome to DGEN Access Control System</p>
        </div>

        {/* User Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900 border border-gray-700 rounded-xl p-8 mb-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Profile Information</h2>
            <button
              onClick={logout}
              className="flex items-center px-4 py-2 text-sm bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div className="flex items-center p-4 bg-gray-800 rounded-lg">
              <UserCircleIcon className="w-6 h-6 text-purple-400 mr-3" />
              <div>
                <p className="text-sm text-gray-400">Name</p>
                <p className="text-white font-medium">{user?.name || 'N/A'}</p>
              </div>
            </div>

            {/* Employee ID */}
            <div className="flex items-center p-4 bg-gray-800 rounded-lg">
              <ShieldCheckIcon className="w-6 h-6 text-purple-400 mr-3" />
              <div>
                <p className="text-sm text-gray-400">Employee ID</p>
                <p className="text-white font-medium font-mono">{user?.id || 'N/A'}</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center p-4 bg-gray-800 rounded-lg">
              <BriefcaseIcon className="w-6 h-6 text-purple-400 mr-3" />
              <div>
                <p className="text-sm text-gray-400">Role</p>
                <p className="text-white font-medium">{user?.role || 'N/A'}</p>
              </div>
            </div>

            {/* Department */}
            {user?.department && (
              <div className="flex items-center p-4 bg-gray-800 rounded-lg">
                <BuildingOfficeIcon className="w-6 h-6 text-purple-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-400">Department</p>
                  <p className="text-white font-medium">{user.department}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Remote Unlock Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-green-900/30 to-gray-900 border border-green-700/50 rounded-xl p-8 shadow-2xl"
        >
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-500/20 rounded-full">
                <LockOpenIcon className="w-12 h-12 text-green-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Remote Door Unlock</h3>
            <p className="text-gray-400 mb-6">
              Trigger remote unlock to open the door
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRemoteUnlock}
              disabled={isUnlocking}
              className={`w-full py-4 px-6 rounded-lg text-lg font-medium transition-all duration-200 ${
                isUnlocking
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/50'
              }`}
            >
              {isUnlocking ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <LockOpenIcon className="w-6 h-6 mr-2" />
                  Unlock Door
                </span>
              )}
            </motion.button>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> This action will be logged with your employee ID
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
