'use client';

import { useState, useEffect } from 'react';
import { LockOpenIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/services/api';

const Header = () => {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const updateDateTime = () => {
    const now = new Date();
    
    // Format time with AM/PM
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeString = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
    
    // Format date
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    const dateString = now.toLocaleDateString('en-US', options);
    
    setCurrentTime(timeString);
    setCurrentDate(dateString);
  };

  const handleRemoteUnlock = async () => {
    if (isUnlocking) return;
    
    setIsUnlocking(true);
    
    try {
      const response = await api.post('/api/remote-open');
      
      if (response.data.success) {
        toast.success('✓ Unlock Command Sent Successfully', {
          duration: 3000,
          style: {
            background: '#10b981',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10b981',
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
    <header className="bg-gray-900 border-b border-gray-700 px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Page info (can be passed as prop if needed) */}
        <div>
          <h1 className="text-xl font-semibold text-white">Access Control</h1>
        </div>

        {/* Right side - Clock, Calendar, and Remote Unlock */}
        <div className="flex items-center space-x-6">
          {/* Date */}
          <div className="flex items-center space-x-2 text-gray-300">
            <CalendarIcon className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium">{currentDate}</span>
          </div>

          {/* Time */}
          <div className="flex items-center space-x-2 text-gray-300">
            <ClockIcon className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium">{currentTime}</span>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-700"></div>

          {/* Remote Unlock Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRemoteUnlock}
            disabled={isUnlocking}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isUnlocking
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/50'
            }`}
          >
            <LockOpenIcon className={`w-5 h-5 ${isUnlocking ? 'animate-pulse' : ''}`} />
            <span>{isUnlocking ? 'Processing...' : 'Remote Unlock'}</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default Header;
