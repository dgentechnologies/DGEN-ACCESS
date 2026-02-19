'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/services/api';
import {
  LockOpenIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  CakeIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  LockClosedIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';

function getDistanceMetres(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(metres) {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function EmployeePortal() {
  const { user, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const router = useRouter();

  // Location state
  const [userLocation, setUserLocation] = useState(null);
  const [officeLocation, setOfficeLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch office location once
  useEffect(() => {
    api
      .get('/api/settings/office-location')
      .then((res) => {
        if (res.data.success && res.data.data) {
          setOfficeLocation(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Get user GPS location and refresh every 30 s
  const fetchUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLoadingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationError(null);
        setIsLoadingLocation(false);
      },
      () => {
        setLocationError('Location access denied. Please allow location access.');
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    fetchUserLocation();
    const interval = setInterval(fetchUserLocation, 30000);
    return () => clearInterval(interval);
  }, [fetchUserLocation]);

  // Calculate distance whenever location updates
  useEffect(() => {
    if (userLocation !== null && officeLocation?.lat !== null && officeLocation?.lon !== null) {
      const d = getDistanceMetres(
        userLocation.lat,
        userLocation.lon,
        parseFloat(officeLocation.lat),
        parseFloat(officeLocation.lon)
      );
      setDistance(d);
    }
  }, [userLocation, officeLocation]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const officeRadius = officeLocation?.radius || 100;
  const isWithinRange = distance !== null && distance <= officeRadius;
  const requiresLocationCheck = user?.requireLocationCheck ?? false;
  const unlockDisabled =
    isUnlocking ||
    (requiresLocationCheck &&
      (locationError !== null || (distance !== null && !isWithinRange)));

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRemoteUnlock = async () => {
    if (unlockDisabled) return;
    setIsUnlocking(true);
    try {
      const payload = { employeeId: user?.id, employeeName: user?.name };
      if (userLocation) {
        payload.lat = userLocation.lat;
        payload.lon = userLocation.lon;
      }
      const response = await api.post('/api/remote-open', payload);
      if (response.data.success) {
        toast.success('✓ Door unlock command sent', {
          duration: 3000,
          style: { background: '#10b981', color: '#fff' },
        });
      } else {
        toast.error(response.data.message || 'Failed to send unlock command');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Unable to send unlock command';
      toast.error(msg);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await api.post('/api/auth/change-password', {
        employeeId: user?.id,
        currentPassword,
        newPassword,
      });
      if (res.data.success) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res.data.message || 'Failed to change password');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ── Sub-components ─────────────────────────────────────────────────────────
  const InfoRow = ({ icon: Icon, label, value }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
        <div className="p-2 rounded-lg bg-purple-500/10 shrink-0">
          <Icon className="w-4 h-4 text-purple-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">{label}</p>
          <p className="text-sm text-white font-medium break-words">{value}</p>
        </div>
      </div>
    );
  };

  const PwInput = ({ label, value, onChange, show, onToggle, placeholder }) => (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="w-full pr-10 pl-4 py-2.5 text-sm bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition"
        >
          {show ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  // ── Location status helpers ────────────────────────────────────────────────
  const locationStatusEl = () => {
    if (isLoadingLocation) {
      return (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
          Acquiring location…
        </div>
      );
    }
    if (locationError) {
      return (
        <div className="flex items-center gap-2 text-yellow-400 text-sm">
          <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
          {locationError}
        </div>
      );
    }
    if (!officeLocation) {
      return (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <MapPinIcon className="w-4 h-4 shrink-0" />
          Office location not configured
        </div>
      );
    }
    if (distance === null) {
      return (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
          Calculating distance…
        </div>
      );
    }

    const pct = Math.min((distance / officeRadius) * 100, 100);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isWithinRange ? (
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-red-400" />
            )}
            <span className={`text-sm font-semibold ${isWithinRange ? 'text-green-400' : 'text-red-400'}`}>
              {isWithinRange ? 'Within Office Range' : 'Outside Office Range'}
            </span>
          </div>
          <button
            onClick={fetchUserLocation}
            className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition"
            title="Refresh location"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Distance bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Distance to office</span>
            <span className="font-mono font-medium text-white">
              {formatDistance(distance)}
              <span className="text-gray-500"> / {formatDistance(officeRadius)}</span>
            </span>
          </div>
          <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${isWithinRange ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-orange-400'}`}
            />
          </div>
        </div>

        {!isWithinRange && requiresLocationCheck && (
          <p className="text-xs text-red-400/80">
            You must be within {formatDistance(officeRadius)} of the office to unlock the door.
          </p>
        )}
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'profile', label: 'My Profile', icon: UserCircleIcon },
    { id: 'access', label: 'Door Access', icon: LockOpenIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* ── Sticky top bar ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-gray-950/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-purple-500/20 rounded-lg">
              <ShieldCheckIcon className="w-5 h-5 text-purple-400" />
            </div>
            <span className="font-bold text-white text-sm tracking-wide">DGEN Access</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition"
          >
            <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* ── Hero card ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-purple-900/40 via-gray-900 to-gray-900 border border-purple-700/30 rounded-2xl p-6 shadow-xl"
        >
          {/* decorative glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xl font-bold shadow-lg shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white truncate">{user?.name || 'Employee'}</h1>
              <p className="text-sm text-purple-300 truncate">{user?.role || ''}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-mono bg-gray-800 border border-gray-700 text-gray-300 rounded-md">
                {user?.id}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Tab navigation ────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 bg-gray-900 border border-gray-800 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ───────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Profile info card */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
                <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
                  Profile Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow icon={UserCircleIcon} label="Full Name" value={user?.name} />
                  <InfoRow icon={BriefcaseIcon} label="Role" value={user?.role} />
                  <InfoRow icon={BuildingOfficeIcon} label="Department" value={user?.department} />
                  <InfoRow icon={EnvelopeIcon} label="Email" value={user?.email} />
                  <InfoRow icon={PhoneIcon} label="Mobile" value={user?.mobile} />
                  <InfoRow
                    icon={CakeIcon}
                    label="Date of Birth"
                    value={
                      user?.dob
                        ? (() => {
                            try {
                              const d = new Date(user.dob);
                              return isNaN(d.getTime())
                                ? user.dob
                                : d.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  });
                            } catch {
                              return user.dob;
                            }
                          })()
                        : null
                    }
                  />
                  <InfoRow icon={MapPinIcon} label="Address" value={user?.address} />
                  <InfoRow
                    icon={ExclamationTriangleIcon}
                    label="Emergency Contact"
                    value={user?.emergencyContact}
                  />
                </div>
              </div>

              {/* Change password card */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-1.5 bg-purple-500/10 rounded-lg">
                    <KeyIcon className="w-4 h-4 text-purple-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Change Password
                  </h2>
                </div>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <PwInput
                    label="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    show={showCurrentPw}
                    onToggle={() => setShowCurrentPw((v) => !v)}
                    placeholder="Your current password"
                  />
                  <PwInput
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    show={showNewPw}
                    onToggle={() => setShowNewPw((v) => !v)}
                    placeholder="Min. 8 characters"
                  />
                  <PwInput
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    show={showConfirmPw}
                    onToggle={() => setShowConfirmPw((v) => !v)}
                    placeholder="Repeat new password"
                  />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={isChangingPassword}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                      isChangingPassword
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
                    }`}
                  >
                    {isChangingPassword ? (
                      <span className="flex items-center justify-center gap-2">
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        Updating…
                      </span>
                    ) : (
                      'Update Password'
                    )}
                  </motion.button>
                </form>
                <p className="mt-3 text-xs text-gray-500 text-center">
                  First-time login uses your date of birth (DDMMYYYY) as the default password.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'access' && (
            <motion.div
              key="access"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Location status card */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <SignalIcon className="w-4 h-4 text-blue-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Location Status
                  </h2>
                </div>
                {locationStatusEl()}
              </div>

              {/* Remote unlock card */}
              <div
                className={`bg-gray-900 border rounded-2xl p-5 shadow-lg ${
                  unlockDisabled ? 'border-gray-800' : 'border-green-700/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={`p-1.5 rounded-lg ${
                      unlockDisabled ? 'bg-gray-700/40' : 'bg-green-500/10'
                    }`}
                  >
                    {unlockDisabled ? (
                      <LockClosedIcon className="w-4 h-4 text-gray-500" />
                    ) : (
                      <LockOpenIcon className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Remote Door Unlock
                  </h2>
                </div>

                <p className="text-sm text-gray-400 mb-5">
                  {unlockDisabled
                    ? 'You must be within the office range to unlock the door remotely.'
                    : 'Press the button below to trigger a remote door unlock.'}
                </p>

                <motion.button
                  whileHover={!unlockDisabled ? { scale: 1.02 } : {}}
                  whileTap={!unlockDisabled ? { scale: 0.97 } : {}}
                  onClick={handleRemoteUnlock}
                  disabled={unlockDisabled}
                  className={`w-full py-4 rounded-xl text-base font-semibold transition-all duration-200 ${
                    unlockDisabled
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-xl hover:shadow-green-500/30'
                  }`}
                >
                  {isUnlocking ? (
                    <span className="flex items-center justify-center gap-2">
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      Processing…
                    </span>
                  ) : unlockDisabled ? (
                    <span className="flex items-center justify-center gap-2">
                      <LockClosedIcon className="w-5 h-5" />
                      {requiresLocationCheck && locationError
                        ? 'Location Required'
                        : requiresLocationCheck && distance !== null && !isWithinRange
                        ? 'Out of Range'
                        : 'Unlock Door'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <LockOpenIcon className="w-5 h-5" />
                      Unlock Door
                    </span>
                  )}
                </motion.button>

                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-xs text-blue-300 text-center">
                    This action is logged with your employee ID and timestamp.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
