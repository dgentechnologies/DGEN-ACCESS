'use client';

import { useState, useEffect } from 'react';
import { userService } from '@/services/dataService';
import { firestoreDb } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  ClockIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  LockOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function Home() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    superAdmins: 0,
  });
  const [logs, setLogs] = useState([]);
  const [accessStats, setAccessStats] = useState({
    granted: 0,
    denied: 0,
    manualUnlock: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);

  useEffect(() => {
    const unsubscribeUsers = setupRealtimeListener();
    const unsubscribeLogs = setupLogsListener();
    return () => {
      if (unsubscribeUsers) {
        unsubscribeUsers();
      }
      if (unsubscribeLogs) {
        unsubscribeLogs();
      }
    };
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

  const setupLogsListener = () => {
    try {
      const logsRef = collection(firestoreDb, 'logs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logsArray = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLogs(logsArray);
        
        // Calculate access statistics
        const granted = logsArray.filter(l => l.status === 'Granted').length;
        const denied = logsArray.filter(l => l.status === 'Denied').length;
        const manualUnlock = logsArray.filter(l => l.status === 'Manual Unlock').length;
        
        setAccessStats({
          granted,
          denied,
          manualUnlock,
          total: logsArray.length,
        });
      }, (error) => {
        console.error('Logs listener error:', error);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up logs listener:', error);
      return null;
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

        {/* Activity Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-green-900/30 to-gray-900 rounded-xl border border-green-700/50 p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Access Granted</p>
                  <p className="text-2xl font-bold text-green-400">{accessStats.granted}</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                  style={{ width: `${accessStats.total > 0 ? (accessStats.granted / accessStats.total) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {accessStats.total > 0 ? Math.round((accessStats.granted / accessStats.total) * 100) : 0}% of total attempts
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-red-900/30 to-gray-900 rounded-xl border border-red-700/50 p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-500/20 rounded-lg mr-3">
                  <XCircleIcon className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Access Denied</p>
                  <p className="text-2xl font-bold text-red-400">{accessStats.denied}</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-500"
                  style={{ width: `${accessStats.total > 0 ? (accessStats.denied / accessStats.total) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {accessStats.total > 0 ? Math.round((accessStats.denied / accessStats.total) * 100) : 0}% of total attempts
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-blue-900/30 to-gray-900 rounded-xl border border-blue-700/50 p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                  <LockOpenIcon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Remote Unlocks</p>
                  <p className="text-2xl font-bold text-blue-400">{accessStats.manualUnlock}</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${accessStats.total > 0 ? (accessStats.manualUnlock / accessStats.total) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {accessStats.total > 0 ? Math.round((accessStats.manualUnlock / accessStats.total) * 100) : 0}% manual triggers
              </p>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-900 rounded-xl border border-gray-700 p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          {logs.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {logs.slice(0, 10).map((log, index) => (
                <div 
                  key={log.id || index} 
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      log.status === 'Granted' 
                        ? 'bg-green-500/20 text-green-400' 
                        : log.status === 'Manual Unlock'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {log.status === 'Granted' ? (
                        <CheckCircleIcon className="w-5 h-5" />
                      ) : log.status === 'Manual Unlock' ? (
                        <LockOpenIcon className="w-5 h-5" />
                      ) : (
                        <XCircleIcon className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{log.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{log.id || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      log.status === 'Granted' 
                        ? 'bg-green-500/10 text-green-400' 
                        : log.status === 'Manual Unlock'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {log.status}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(log.time).toLocaleTimeString() || 'Unknown'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

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
              <span className="text-gray-400">ESP8266 Remote Unlock</span>
              <span className="flex items-center text-green-500">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
