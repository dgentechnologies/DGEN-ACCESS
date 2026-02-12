'use client';

import { useState, useEffect, useMemo } from 'react';
import { logService } from '@/services/dataService';
import { firestoreDb } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ClockIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import LayoutWrapper from '@/components/LayoutWrapper';

const MAX_LOGS = 500;

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('time-desc'); // time-desc, time-asc, name-asc, name-desc
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const unsubscribe = setupRealtimeListener();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const setupRealtimeListener = () => {
    try {
      const logsRef = collection(firestoreDb, 'logs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(MAX_LOGS));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logsArray = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLogs(logsArray);
        setRealtimeEnabled(true);
        setLoading(false);
      }, (error) => {
        console.error('Realtime listener error:', error);
        setRealtimeEnabled(false);
        setLoading(false);
        // Fallback to API fetch
        fetchLogs();
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up realtime listener:', error);
      setRealtimeEnabled(false);
      setLoading(false);
      // Fallback to API fetch
      fetchLogs();
      return null;
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await logService.getAll(MAX_LOGS);
      if (response.success) {
        setLogs(response.data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load logs');
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

  // Export logs as CSV
  const handleExportLogs = () => {
    // Proper CSV escaping function
    const escapeCSV = (value) => {
      if (value == null) return '';
      const str = String(value);
      // If value contains comma, quote, or newline, wrap in quotes and escape quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      ['Name', 'ID', 'Status', 'Time'],
      ...filteredAndSortedLogs.map(log => [
        escapeCSV(log.name || 'Unknown'),
        escapeCSV(log.id || 'N/A'),
        escapeCSV(log.status || 'Unknown'),
        escapeCSV(log.time || 'Unknown time')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `access-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Logs exported successfully');
  };

  // Filter and sort logs
  const filteredAndSortedLogs = useMemo(() => {
    let filtered = [...logs];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.name?.toLowerCase().includes(query) ||
        log.id?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'time-desc':
          return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
        case 'time-asc':
          return new Date(a.timestamp || 0) - new Date(b.timestamp || 0);
        case 'name-asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name-desc':
          return (b.name || '').localeCompare(a.name || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [logs, searchQuery, statusFilter, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: logs.length,
      granted: logs.filter(l => l.status === 'Granted').length,
      denied: logs.filter(l => l.status === 'Denied').length,
    };
  }, [logs]);

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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Access Logs</h1>
            <p className="text-gray-400">Monitor all access attempts in real-time</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {realtimeEnabled && (
              <div className="flex items-center text-green-500 px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                <span className="text-sm font-medium">Live</span>
              </div>
            )}
            <button
              onClick={handleExportLogs}
              className="flex items-center px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all duration-200"
              disabled={logs.length === 0}
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Export
            </button>
            <button
              onClick={handleClearLogs}
              className="flex items-center px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all duration-200"
            >
              <TrashIcon className="w-5 h-5 mr-2" />
              Clear
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1 font-medium">Total Attempts</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">All time records</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <ClockIcon className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-900/30 to-gray-800 rounded-xl border border-green-700/50 p-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1 font-medium">Access Granted</p>
                <p className="text-3xl font-bold text-green-400">{stats.granted}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total > 0 ? Math.round((stats.granted / stats.total) * 100) : 0}% success rate
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-xl">
                <CheckCircleIcon className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-red-900/30 to-gray-800 rounded-xl border border-red-700/50 p-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1 font-medium">Access Denied</p>
                <p className="text-3xl font-bold text-red-400">{stats.denied}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total > 0 ? Math.round((stats.denied / stats.total) * 100) : 0}% denied
                </p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-xl">
                <XCircleIcon className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900 rounded-xl border border-gray-700 p-4"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2.5 rounded-lg border transition-all duration-200 ${
                showFilters
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
              }`}
            >
              <FunnelIcon className="w-5 h-5 mr-2" />
              Filters
              {(statusFilter !== 'All' || sortBy !== 'time-desc') && (
                <span className="ml-2 w-2 h-2 bg-purple-400 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Filter Options */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Status
                    </label>
                    <div className="flex gap-2">
                      {['All', 'Granted', 'Denied'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            statusFilter === status
                              ? status === 'Granted'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                : status === 'Denied'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                                : 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                              : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      <ArrowsUpDownIcon className="w-4 h-4 inline mr-1" />
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="time-desc">Newest First</option>
                      <option value="time-asc">Oldest First</option>
                      <option value="name-asc">Name (A-Z)</option>
                      <option value="name-desc">Name (Z-A)</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Live Data - Logs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-lg"
        >
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-gray-700 bg-gray-800/50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <ClockIcon className="w-5 h-5 mr-2 text-purple-400" />
                Live Access Data
              </h2>
              <span className="text-sm text-gray-400">
                Showing {filteredAndSortedLogs.length} of {logs.length} logs
              </span>
            </div>
          </div>

          {/* Logs Content */}
          {filteredAndSortedLogs.length === 0 ? (
            <div className="p-12 text-center">
              {searchQuery || statusFilter !== 'All' ? (
                <>
                  <FunnelIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No logs match your filters</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('All');
                    }}
                    className="mt-4 text-purple-400 hover:text-purple-300 text-sm font-medium"
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <ClockIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No access logs yet</p>
                  <p className="text-gray-500 text-sm mt-2">Logs will appear here when access attempts are made</p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-700 max-h-[600px] overflow-y-auto custom-scrollbar">
              {filteredAndSortedLogs.map((log, index) => {
                // Only animate new items (first 10) to avoid recalculating delays
                const shouldAnimate = index < 10;
                return (
                  <motion.div
                    key={log.id || index}
                    initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
                    animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
                    transition={shouldAnimate ? { delay: index * 0.05 } : undefined}
                    className="p-4 hover:bg-gray-800/50 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-2.5 rounded-xl transition-all duration-200 group-hover:scale-110 ${
                            log.status === 'Granted'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {log.status === 'Granted' ? (
                            <CheckCircleIcon className="w-6 h-6" />
                          ) : (
                            <XCircleIcon className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{log.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-400 font-mono">{log.id || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold px-3 py-1 rounded-full ${
                            log.status === 'Granted'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {log.status}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{log.time || 'Unknown time'}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(107, 114, 128, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.7);
        }
      `}</style>
    </LayoutWrapper>
  );
}
