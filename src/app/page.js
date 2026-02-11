'use client';

import { useState, useEffect } from 'react';
import { userService } from '@/services/dataService';
import { firestoreDb } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  ClockIcon,
  ShieldCheckIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function Home() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    superAdmins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);

  useEffect(() => {
    setupRealtimeListener();
  }, []);

  const setupRealtimeListener = () => {
    try {
      const usersRef = collection(firestoreDb, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setStats({
          totalUsers: users.length,
          activeUsers: users.filter(u => u.status === 'Active').length,
          bannedUsers: users.filter(u => u.status === 'Banned').length,
          superAdmins: users.filter(u => u.isSuperAdmin).length,
        });
        
        setRealtimeEnabled(true);
        setLoading(false);
      }, (error) => {
        console.error('Realtime listener error:', error);
        setRealtimeEnabled(false);
        setLoading(false);
        // Fallback to API fetch
        fetchStats();
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up realtime listener:', error);
      setRealtimeEnabled(false);
      setLoading(false);
      // Fallback to API fetch
      fetchStats();
    }
  };

  const fetchStats = async () => {
    try {
      const response = await userService.getAll();
      if (response.success) {
        const users = response.data;
        setStats({
          totalUsers: users.length,
          activeUsers: users.filter(u => u.status === 'Active').length,
          bannedUsers: users.filter(u => u.status === 'Banned').length,
          superAdmins: users.filter(u => u.isSuperAdmin).length,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard statistics');
    }
  };

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalUsers,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: ShieldCheckIcon,
      color: 'bg-green-500',
      gradient: 'from-green-500 to-green-600',
    },
    {
      title: 'Banned Users',
      value: stats.bannedUsers,
      icon: ClockIcon,
      color: 'bg-red-500',
      gradient: 'from-red-500 to-red-600',
    },
    {
      title: 'Super Admins',
      value: stats.superAdmins,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-600',
    },
  ];

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-gray-400">Welcome to DGEN Access Control System</p>
            </div>
            {realtimeEnabled && (
              <div className="flex items-center text-green-500">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Live Data
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900 rounded-xl border border-gray-700 p-6 hover:border-purple-500 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* System Status */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">API Status</span>
              <span className="flex items-center text-green-500">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Firestore Connection</span>
              <span className="flex items-center text-green-500">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">ESP32 Endpoint</span>
              <span className="flex items-center text-green-500">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <h2 className="text-xl font-semibold mb-2">ESP32 Verification Endpoint</h2>
          <p className="text-purple-100 mb-4">
            Your ESP32 device can verify RFID cards using the following endpoint:
          </p>
          <div className="bg-white/10 rounded-lg p-4 font-mono text-sm">
            POST {typeof window !== 'undefined' ? window.location.origin : ''}/api/verify
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
