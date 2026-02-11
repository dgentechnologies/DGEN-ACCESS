'use client';

import { useState, useEffect } from 'react';
import { logService } from '@/services/dataService';
import { realtimeDb } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ClockIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);

  useEffect(() => {
    fetchLogs();
    setupRealtimeListener();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await logService.getAll(100);
      if (response.success) {
        setLogs(response.data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListener = () => {
    try {
      const logsRef = ref(realtimeDb, 'logs');
      const unsubscribe = onValue(logsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const logsArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          logsArray.sort((a, b) => b.timestamp - a.timestamp);
          setLogs(logsArray);
          setRealtimeEnabled(true);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Realtime listener error:', error);
      setRealtimeEnabled(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all logs?')) {
      return;
    }
    try {
      const response = await logService.clearAll();
      if (response.success) {
        toast.success('Logs cleared successfully');
        setLogs([]);
      }
    } catch (error) {
      toast.error('Failed to clear logs');
    }
  };

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Access Logs</h1>
            <p className="text-gray-400">Monitor all access attempts in real-time</p>
          </div>
          <div className="flex items-center space-x-4">
            {realtimeEnabled && (
              <div className="flex items-center text-green-500">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Real-time Updates
              </div>
            )}
            <button
              onClick={handleClearLogs}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <TrashIcon className="w-5 h-5 mr-2" />
              Clear Logs
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <ClockIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No access logs yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700 max-h-[calc(100vh-300px)] overflow-y-auto">
              {logs.map((log, index) => (
                <motion.div
                  key={log.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="p-4 hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-lg ${
                          log.status === 'Granted'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {log.status === 'Granted' ? (
                          <CheckCircleIcon className="w-6 h-6" />
                        ) : (
                          <XCircleIcon className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{log.name}</p>
                        <p className="text-sm text-gray-400 font-mono">{log.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          log.status === 'Granted' ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {log.status}
                      </p>
                      <p className="text-xs text-gray-400">{log.time}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Attempts</p>
                <p className="text-2xl font-bold text-white">{logs.length}</p>
              </div>
              <ClockIcon className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Access Granted</p>
                <p className="text-2xl font-bold text-green-400">
                  {logs.filter((l) => l.status === 'Granted').length}
                </p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Access Denied</p>
                <p className="text-2xl font-bold text-red-400">
                  {logs.filter((l) => l.status === 'Denied').length}
                </p>
              </div>
              <XCircleIcon className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
