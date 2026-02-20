'use client';

import { useState, useEffect, useMemo } from 'react';
import { userService } from '@/services/dataService';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  LockClosedIcon,
  LockOpenIcon,
  PencilIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  CpuChipIcon,
  CogIcon,
  CurrencyDollarIcon,
  MegaphoneIcon,
  VideoCameraIcon,
  ServerIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  AcademicCapIcon,
  IdentificationIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import LayoutWrapper from '@/components/LayoutWrapper';

// Department configuration with icons and colors
const DEPARTMENTS = [
  {
    name: 'Administration',
    code: 'ADM',
    focusAreas: 'System Master, Root Access, Security',
    icon: ShieldCheckIcon,
    color: 'bg-red-500',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/20',
  },
  {
    name: 'Executive',
    code: 'EX',
    focusAreas: 'Founders, Strategy, Decision Making',
    icon: BriefcaseIcon,
    color: 'bg-purple-500',
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  {
    name: 'Engineering (R&D)',
    code: 'EN',
    focusAreas: 'Embedded Systems, Auralis CORE/PRO, Firmware',
    icon: CpuChipIcon,
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  {
    name: 'Operations',
    code: 'OP',
    focusAreas: 'Supply Chain, Logistics, Hardware Procurement',
    icon: CogIcon,
    color: 'bg-orange-500',
    textColor: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
  },
  {
    name: 'Finance',
    code: 'FI',
    focusAreas: 'Budgeting, DgenBooks Management, Payroll',
    icon: CurrencyDollarIcon,
    color: 'bg-green-500',
    textColor: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  {
    name: 'Marketing',
    code: 'MK',
    focusAreas: 'Branding, Sales, Client Relations',
    icon: MegaphoneIcon,
    color: 'bg-pink-500',
    textColor: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
  },
  {
    name: 'Creative Media',
    code: 'CM',
    focusAreas: 'YouTube Channels, Digital Shorts',
    icon: VideoCameraIcon,
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
  {
    name: 'Information Tech',
    code: 'IT',
    focusAreas: 'AuralisView Development, Local DB, Cloud Infrastructure',
    icon: ServerIcon,
    color: 'bg-cyan-500',
    textColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
  },
  {
    name: 'Internships',
    code: 'INT',
    focusAreas: 'Temporary student developers or engineers',
    icon: AcademicCapIcon,
    color: 'bg-indigo-500',
    textColor: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
  },
  {
    name: 'Guests',
    code: 'GST',
    focusAreas: 'One-time visitors, investors, or partners',
    icon: IdentificationIcon,
    color: 'bg-teal-500',
    textColor: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
  },
  {
    name: 'Contractors',
    code: 'CON',
    focusAreas: 'External vendors or freelance workers',
    icon: WrenchScrewdriverIcon,
    color: 'bg-amber-500',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
  },
];

// Constants for employee ID format and sorting
const DEPT_SERIAL_LENGTH = 2;
const COMPANY_SERIAL_LENGTH = 3;
const MAX_SERIAL_FALLBACK = 999999;

// Precompiled regex patterns for employee ID parsing (compiled once at module load)
const DEPT_PATTERN = new RegExp(`DGEN-([A-Z]+)-(\\d{${DEPT_SERIAL_LENGTH}})\\d{${COMPANY_SERIAL_LENGTH}}`);
const COMPANY_PATTERN = new RegExp(`DGEN-[A-Z]+-\\d{${DEPT_SERIAL_LENGTH}}(\\d{${COMPANY_SERIAL_LENGTH}})`);

export default function Employees() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [rfidCopied, setRfidCopied] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: '',
    department: '',
    isAdmin: false,
    email: '',
    mobile: '+91 ',
    dob: '',
    address: '',
    emergencyContact: '',
  });
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    role: '',
    department: '',
    status: '',
    email: '',
    mobile: '+91 ',
    dob: '',
    address: '',
    emergencyContact: '',
    isAdmin: false,
    requireLocationCheck: false,
  });
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Generate next employee ID based on new format: DGEN-{DEPT}-{DEPT_SERIAL}{COMPANY_SERIAL}
  const generateEmployeeId = (deptCode) => {
    if (!deptCode) return '';
    
    // Find all users
    const allUsers = users;
    
    // Calculate department serial (find max serial in this department)
    let maxDeptSerial = 0;
    const deptUsers = allUsers.filter(user => {
      const match = user.id.match(DEPT_PATTERN);
      if (match && match[1] === deptCode) {
        const deptSerial = parseInt(match[2], 10);
        if (deptSerial > maxDeptSerial) maxDeptSerial = deptSerial;
        return true;
      }
      return false;
    });
    const deptSerial = String(maxDeptSerial + 1).padStart(DEPT_SERIAL_LENGTH, '0');
    
    // Calculate company serial (find max company serial across all users)
    let maxCompanySerial = 0;
    allUsers.forEach(user => {
      const match = user.id.match(COMPANY_PATTERN);
      if (match) {
        const companySerial = parseInt(match[1], 10);
        if (companySerial > maxCompanySerial) maxCompanySerial = companySerial;
      }
    });
    const companySerial = String(maxCompanySerial + 1).padStart(COMPANY_SERIAL_LENGTH, '0');
    
    // Format: DGEN-{DEPT}-{DEPT_SERIAL}{COMPANY_SERIAL}
    return `DGEN-${deptCode}-${deptSerial}${companySerial}`;
  };

  // Handle department selection
  const handleDepartmentChange = (deptCode) => {
    setFormData({
      ...formData,
      department: deptCode,
      id: generateEmployeeId(deptCode),
    });
  };

  // Get department info by code
  const getDepartmentByCode = (code) => {
    return DEPARTMENTS.find(d => d.code === code);
  };

  // Extract department code from employee ID
  const extractDepartmentCode = (employeeId) => {
    const match = employeeId.match(/DGEN-([A-Z]+)-/);
    return match ? match[1] : null;
  };

  const fetchUsers = async () => {
    try {
      const response = await userService.getAll();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await userService.add({
        id: formData.id,
        name: formData.name,
        role: formData.role,
        department: formData.department,
        isAdmin: formData.isAdmin,
      });
      if (response.success) {
        toast.success('Employee added successfully');
        setShowAddModal(false);
        setFormData({ id: '', name: '', role: '', department: '', isAdmin: false, email: '', mobile: '+91 ', dob: '', address: '', emergencyContact: '' });
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add employee');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const response = await userService.update(editFormData.id, {
        name: editFormData.name,
        role: editFormData.role,
        email: editFormData.email,
        mobile: editFormData.mobile,
        dob: editFormData.dob,
        address: editFormData.address,
        emergencyContact: editFormData.emergencyContact,
        isAdmin: editFormData.isAdmin,
        requireLocationCheck: editFormData.requireLocationCheck,
      });
      if (response.success) {
        toast.success('Employee updated successfully');
        setShowEditModal(false);
        setEditFormData({ id: '', name: '', role: '', department: '', status: '', email: '', mobile: '+91 ', dob: '', address: '', emergencyContact: '', isAdmin: false, requireLocationCheck: false });
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update employee');
    }
  };

  const handleOpenEditModal = (user) => {
    const deptCode = extractDepartmentCode(user.id);
    setEditFormData({
      id: user.id,
      name: user.name,
      role: user.role,
      department: deptCode,
      status: user.status,
      email: user.email || '',
      mobile: user.mobile || '+91 ',
      dob: user.dob || '',
      address: user.address || '',
      emergencyContact: user.emergencyContact || '',
      isAdmin: user.isAdmin || false,
      requireLocationCheck: user.requireLocationCheck || false,
    });
    setRfidCopied(false);
    setShowEditModal(true);
  };

  const handleToggleStatusInEdit = async () => {
    try {
      const response = await userService.toggleStatus(editFormData.id);
      if (response.success) {
        toast.success(`Employee ${editFormData.status === 'Active' ? 'banned' : 'unbanned'} successfully`);
        // Refetch to get accurate data from server
        await fetchUsers();
        // Update local state based on toggle
        const newStatus = editFormData.status === 'Active' ? 'Banned' : 'Active';
        setEditFormData({ ...editFormData, status: newStatus });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }
    try {
      const response = await userService.delete(userId);
      if (response.success) {
        toast.success('Employee deleted successfully');
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete employee');
    }
  };

  // Check if user is Super Admin (only DGEN-ADM-00000)
  const isSuperAdmin = (userId) => {
    return userId === 'DGEN-ADM-00000';
  };

  // Generate RFID card text
  const getRfidCardText = (name, id, role) => {
    if (!name || !id || !role) return '';
    return `Name: ${name} | ID: ${id} | Role: ${role}`;
  };

  // Copy RFID card text to clipboard
  const handleCopyRfid = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setRfidCopied(true);
      setTimeout(() => setRfidCopied(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  // Open view modal
  const handleOpenViewModal = (user) => {
    setViewUser(user);
    setShowViewModal(true);
  };

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(query) ||
        user.id?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query)
      );
    }

    // Apply department filter
    if (departmentFilter !== 'All') {
      filtered = filtered.filter(user => {
        const deptCode = extractDepartmentCode(user.id);
        return deptCode === departmentFilter;
      });
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Sort by ID (company serial number - last digits)
    filtered.sort((a, b) => {
      const matchA = a.id.match(COMPANY_PATTERN);
      const matchB = b.id.match(COMPANY_PATTERN);
      const serialA = matchA ? parseInt(matchA[1], 10) : MAX_SERIAL_FALLBACK;
      const serialB = matchB ? parseInt(matchB[1], 10) : MAX_SERIAL_FALLBACK;
      return serialA - serialB;
    });

    return filtered;
  }, [users, searchQuery, departmentFilter, statusFilter]);

  // Calculate department statistics
  const departmentStats = useMemo(() => {
    const stats = {};
    DEPARTMENTS.forEach(dept => {
      const deptUsers = users.filter(u => {
        const code = extractDepartmentCode(u.id);
        return code === dept.code;
      });
      stats[dept.code] = {
        total: deptUsers.length,
        active: deptUsers.filter(u => u.status === 'Active').length,
        banned: deptUsers.filter(u => u.status === 'Banned').length,
      };
    });
    return stats;
  }, [users]);

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
        <div className="flex flex-col sm:flex-row sm:items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Employees</h1>
            <p className="text-sm sm:text-base text-gray-400">Manage employee access and permissions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center sm:justify-start px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm sm:text-base"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Employee
          </button>
        </div>

        {/* Department Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {DEPARTMENTS.map((dept) => {
            const DeptIcon = dept.icon;
            const stats = departmentStats[dept.code] || { total: 0, active: 0, banned: 0 };
            return (
              <motion.div
                key={dept.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border ${dept.textColor} border-opacity-30 p-4 shadow-lg hover:shadow-xl transition-shadow cursor-pointer`}
                onClick={() => setDepartmentFilter(departmentFilter === dept.code ? 'All' : dept.code)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${dept.bgColor}`}>
                    <DeptIcon className={`w-6 h-6 ${dept.textColor}`} />
                  </div>
                  {departmentFilter === dept.code && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-full">
                      Filtered
                    </span>
                  )}
                </div>
                <h3 className={`text-sm font-semibold ${dept.textColor} mb-1`}>{dept.name}</h3>
                <p className="text-2xl font-bold text-white mb-2">{stats.total}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-400">{stats.active} Active</span>
                  <span className="text-red-400">{stats.banned} Banned</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-xl border border-gray-700 p-4"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, ID, or role..."
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
              {(departmentFilter !== 'All' || statusFilter !== 'All') && (
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
                  {/* Department Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Department
                    </label>
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="All">All Departments</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept.code} value={dept.code}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Status
                    </label>
                    <div className="flex gap-2">
                      {['All', 'Active', 'Banned'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            statusFilter === status
                              ? status === 'Active'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                : status === 'Banned'
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
                </div>

                {/* Clear Filters */}
                {(departmentFilter !== 'All' || statusFilter !== 'All' || searchQuery) && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => {
                        setDepartmentFilter('All');
                        setStatusFilter('All');
                        setSearchQuery('');
                      }}
                      className="text-sm text-purple-400 hover:text-purple-300 font-medium"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-400">
          <span>
            Showing {filteredAndSortedUsers.length} of {users.length} employees
          </span>
          <span className="hidden sm:inline">
            Sorted by ID (Sequential)
          </span>
        </div>

        {/* Users Table - Desktop View */}
        <div className="hidden md:block bg-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredAndSortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <UserGroupIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No employees match your filters</p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setDepartmentFilter('All');
                          setStatusFilter('All');
                        }}
                        className="mt-4 text-purple-400 hover:text-purple-300 text-sm font-medium"
                      >
                        Clear filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedUsers.map((user) => {
                    const deptCode = extractDepartmentCode(user.id);
                    const dept = getDepartmentByCode(deptCode);
                    const DeptIcon = dept?.icon || UserGroupIcon;
                    const isUserSuperAdmin = isSuperAdmin(user.id);
                    
                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">
                          {user.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full ${dept?.color || 'bg-purple-500'} flex items-center justify-center text-white font-semibold mr-3`}>
                              {user.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-white">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {dept ? (
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${dept.bgColor} ${dept.textColor}`}>
                              <DeptIcon className="w-3 h-3 mr-1" />
                              {dept.name}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {user.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.status === 'Active'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isUserSuperAdmin && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400">
                              <ShieldCheckIcon className="w-3 h-3 mr-1" />
                              Super Admin
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenViewModal(user)}
                              className="p-2 rounded-lg hover:bg-purple-500/20 text-purple-400 transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                            {!isUserSuperAdmin && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(user)}
                                  className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                                  title="Edit User"
                                >
                                  <PencilIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                  title="Delete User"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users Cards - Mobile View */}
        <div className="md:hidden space-y-3">
          {filteredAndSortedUsers.length === 0 ? (
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-12 text-center">
              <UserGroupIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No employees match your filters</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDepartmentFilter('All');
                  setStatusFilter('All');
                }}
                className="mt-4 text-purple-400 hover:text-purple-300 text-sm font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredAndSortedUsers.map((user) => {
              const deptCode = extractDepartmentCode(user.id);
              const dept = getDepartmentByCode(deptCode);
              const DeptIcon = dept?.icon || UserGroupIcon;
              const isUserSuperAdmin = isSuperAdmin(user.id);
              
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 rounded-xl border border-gray-700 p-4 shadow-lg"
                >
                  {/* Header: Avatar, Name, Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-full ${dept?.color || 'bg-purple-500'} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                        {user.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-white truncate">{user.name}</h3>
                        <p className="text-xs font-mono text-gray-400">{user.id}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                        user.status === 'Active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Department</span>
                      {dept ? (
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${dept.bgColor} ${dept.textColor}`}>
                          <DeptIcon className="w-3 h-3 mr-1" />
                          {dept.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Role</span>
                      <span className="text-white font-medium">{user.role}</span>
                    </div>
                    {isUserSuperAdmin && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Type</span>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400">
                          <ShieldCheckIcon className="w-3 h-3 mr-1" />
                          Super Admin
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-700">
                    <button
                      onClick={() => handleOpenViewModal(user)}
                      className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-colors text-sm"
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View
                    </button>
                    {!isUserSuperAdmin && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors text-sm"
                        >
                          <PencilIcon className="w-4 h-4 mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors text-sm"
                        >
                          <TrashIcon className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Add Employee Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-2xl font-bold text-white mb-4">Add New Employee</h2>
                <form onSubmit={handleAddUser} className="space-y-4">
                  {/* Department Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Department *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {DEPARTMENTS.map((dept) => {
                        const DeptIcon = dept.icon;
                        const isSelected = formData.department === dept.code;
                        return (
                          <button
                            key={dept.code}
                            type="button"
                            onClick={() => handleDepartmentChange(dept.code)}
                            className={`flex items-center p-3 rounded-lg border-2 transition-all ${
                              isSelected
                                ? `${dept.color} border-transparent text-white`
                                : `bg-gray-800 border-gray-700 ${dept.textColor} hover:border-gray-600`
                            }`}
                          >
                            <DeptIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                            <div className="text-left flex-1">
                              <div className="font-semibold text-sm">{dept.name}</div>
                              <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                {dept.code}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {formData.department && (
                      <div className="mt-2 p-2 bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-400">
                          Focus: {DEPARTMENTS.find(d => d.code === formData.department)?.focusAreas}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Employee ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Employee ID * (Auto-generated, editable)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono focus:border-purple-500 focus:outline-none"
                      placeholder="Select Department First"
                      disabled={!formData.department}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Format: DGEN-{'{'}DEPT{'}'}-{'{'}SERIAL{'}'} • Serial is company-wide sequential
                    </p>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role/Position *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      placeholder="e.g., Senior Engineer, Marketing Manager"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      placeholder="employee@company.com"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Street address, city, state, zip code"
                      rows="2"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Emergency Contact
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Name: John Doe | Phone: +91 XXXXX XXXXX"
                    />
                  </div>

                  {/* RFID Card Preview */}
                  {getRfidCardText(formData.name, formData.id, formData.role) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        RFID Card Data
                      </label>
                      <div className="relative bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl p-4 shadow-inner">
                        <div className="absolute top-3 left-3 w-8 h-6 rounded bg-yellow-500/30 border border-yellow-500/50" />
                        <p className="pl-11 pr-10 text-sm font-mono text-green-300 break-all leading-relaxed">
                          {getRfidCardText(formData.name, formData.id, formData.role)}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopyRfid(getRfidCardText(formData.name, formData.id, formData.role))}
                          title="Copy RFID data"
                          className="absolute top-3 right-3 p-1.5 rounded-lg bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white transition-colors"
                        >
                          {rfidCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Admin Checkbox */}
                  <div className="flex items-center p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <input
                      type="checkbox"
                      id="isAdmin"
                      checked={formData.isAdmin}
                      onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                      className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <label htmlFor="isAdmin" className="ml-3 flex-1">
                      <div className="text-sm font-medium text-white">Administrator Access</div>
                      <div className="text-xs text-gray-400">
                        Grant full access to dashboard, employee management, and all features
                      </div>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setFormData({ id: '', name: '', role: '', department: '', isAdmin: false, email: '', mobile: '+91 ', dob: '', address: '', emergencyContact: '' });
                      }}
                      className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!formData.department}
                      className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                        formData.department
                          ? 'bg-purple-500 hover:bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Add Employee
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Employee Modal */}
        <AnimatePresence>
          {showEditModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-2xl font-bold text-white mb-4">Edit Employee</h2>
                <form onSubmit={handleEditUser} className="space-y-4">
                  {/* Employee ID (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={editFormData.id}
                      disabled
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 font-mono cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Employee ID cannot be changed
                    </p>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role/Position *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      placeholder="e.g., Senior Engineer, Marketing Manager"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      placeholder="employee@company.com"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={editFormData.mobile}
                      onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={editFormData.dob}
                      onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Address
                    </label>
                    <textarea
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Street address, city, state, zip code"
                      rows="2"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Emergency Contact
                    </label>
                    <input
                      type="text"
                      value={editFormData.emergencyContact}
                      onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Name: John Doe | Phone: +91 XXXXX XXXXX"
                    />
                  </div>

                  {/* RFID Card Preview */}
                  {getRfidCardText(editFormData.name, editFormData.id, editFormData.role) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        RFID Card Data
                      </label>
                      <div className="relative bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl p-4 shadow-inner">
                        <div className="absolute top-3 left-3 w-8 h-6 rounded bg-yellow-500/30 border border-yellow-500/50" />
                        <p className="pl-11 pr-10 text-sm font-mono text-green-300 break-all leading-relaxed">
                          {getRfidCardText(editFormData.name, editFormData.id, editFormData.role)}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopyRfid(getRfidCardText(editFormData.name, editFormData.id, editFormData.role))}
                          title="Copy RFID data"
                          className="absolute top-3 right-3 p-1.5 rounded-lg bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white transition-colors"
                        >
                          {rfidCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Department (Read-only display) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Department
                    </label>
                    {editFormData.department && (
                      <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                        {(() => {
                          const dept = getDepartmentByCode(editFormData.department);
                          const DeptIcon = dept?.icon || UserGroupIcon;
                          return dept ? (
                            <div className="flex items-center">
                              <div className={`p-2 rounded-lg ${dept.bgColor} mr-3`}>
                                <DeptIcon className={`w-5 h-5 ${dept.textColor}`} />
                              </div>
                              <div>
                                <div className="text-white font-medium">{dept.name}</div>
                                <div className="text-xs text-gray-400">{dept.focusAreas}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Unknown Department</span>
                          );
                        })()}
                      </div>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Department cannot be changed. Create a new employee to assign a different department.
                    </p>
                  </div>

                  {/* Admin Access Toggle */}
                  <div className="border-t border-gray-700 pt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Administrator Access
                    </label>
                    <div className="flex items-center p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <input
                        type="checkbox"
                        id="isAdminEdit"
                        checked={editFormData.isAdmin}
                        onChange={(e) => setEditFormData({ ...editFormData, isAdmin: e.target.checked })}
                        className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <label htmlFor="isAdminEdit" className="ml-3 flex-1">
                        <div className="text-sm font-medium text-white">Grant Administrator Access</div>
                        <div className="text-xs text-gray-400">
                          Allow full access to dashboard, employee management, and all admin features
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Location Check Toggle */}
                  <div className="border-t border-gray-700 pt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Location Verification
                    </label>
                    <div className="flex items-center p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <input
                        type="checkbox"
                        id="requireLocationCheckEdit"
                        checked={editFormData.requireLocationCheck}
                        onChange={(e) => setEditFormData({ ...editFormData, requireLocationCheck: e.target.checked })}
                        className="w-5 h-5 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                      />
                      <label htmlFor="requireLocationCheckEdit" className="ml-3 flex-1">
                        <div className="text-sm font-medium text-white">Require Office Location to Unlock</div>
                        <div className="text-xs text-gray-400">
                          Employee must be within the configured office radius to use remote unlock
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <div className="border-t border-gray-700 pt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Employee Status
                    </label>
                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full mr-3 ${
                            editFormData.status === 'Active'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {editFormData.status}
                        </span>
                        <span className="text-gray-300">
                          {editFormData.status === 'Active'
                            ? 'Employee has active access'
                            : 'Employee access is banned'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleStatusInEdit}
                        className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                          editFormData.status === 'Active'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20'
                            : 'bg-green-500/10 text-green-400 border border-green-500/50 hover:bg-green-500/20'
                        }`}
                      >
                        {editFormData.status === 'Active' ? (
                          <>
                            <LockClosedIcon className="w-5 h-5 mr-2" />
                            Ban
                          </>
                        ) : (
                          <>
                            <LockOpenIcon className="w-5 h-5 mr-2" />
                            Unban
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setRfidCopied(false);
                        setEditFormData({ id: '', name: '', role: '', department: '', status: '', email: '', mobile: '+91 ', dob: '', address: '', emergencyContact: '', isAdmin: false, requireLocationCheck: false });
                      }}
                      className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Employee Modal */}
        <AnimatePresence>
          {showViewModal && viewUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowViewModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const deptCode = extractDepartmentCode(viewUser.id);
                      const dept = getDepartmentByCode(deptCode);
                      return (
                        <div className={`w-12 h-12 rounded-xl ${dept?.color || 'bg-purple-500'} flex items-center justify-center text-white font-bold text-lg`}>
                          {viewUser.name?.charAt(0) || '?'}
                        </div>
                      );
                    })()}
                    <div>
                      <h2 className="text-xl font-bold text-white">{viewUser.name}</h2>
                      <p className="text-sm font-mono text-gray-400">{viewUser.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* RFID Card */}
                {getRfidCardText(viewUser.name, viewUser.id, viewUser.role) && (
                  <div className="mb-5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">RFID Card Data</p>
                    <div className="relative bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl p-4 shadow-inner">
                      <div className="absolute top-3 left-3 w-8 h-6 rounded bg-yellow-500/30 border border-yellow-500/50" />
                      <p className="pl-11 pr-10 text-sm font-mono text-green-300 break-all leading-relaxed">
                        {getRfidCardText(viewUser.name, viewUser.id, viewUser.role)}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopyRfid(getRfidCardText(viewUser.name, viewUser.id, viewUser.role))}
                        title="Copy RFID data"
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white transition-colors"
                      >
                        {rfidCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2">
                  {[
                    { icon: BriefcaseIcon, label: 'Role', value: viewUser.role },
                    {
                      icon: ShieldCheckIcon,
                      label: 'Department',
                      value: (() => {
                        const deptCode = extractDepartmentCode(viewUser.id);
                        return getDepartmentByCode(deptCode)?.name || deptCode || '—';
                      })(),
                    },
                    {
                      icon: viewUser.status === 'Active' ? LockOpenIcon : LockClosedIcon,
                      label: 'Status',
                      value: viewUser.status,
                      badge: viewUser.status === 'Active' ? 'green' : 'red',
                    },
                    { icon: EnvelopeIcon, label: 'Email', value: viewUser.email },
                    { icon: PhoneIcon, label: 'Mobile', value: viewUser.mobile },
                    {
                      icon: CalendarDaysIcon,
                      label: 'Date of Birth',
                      value: viewUser.dob
                        ? (() => {
                            try {
                              const d = new Date(viewUser.dob);
                              return isNaN(d.getTime()) ? viewUser.dob : d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
                            } catch {
                              return viewUser.dob;
                            }
                          })()
                        : null,
                    },
                    { icon: MapPinIcon, label: 'Address', value: viewUser.address },
                    { icon: ExclamationTriangleIcon, label: 'Emergency Contact', value: viewUser.emergencyContact },
                    { icon: LockClosedIcon, label: 'Admin Access', value: viewUser.isAdmin ? 'Yes' : 'No' },
                    { icon: MapPinIcon, label: 'Location Check Required', value: viewUser.requireLocationCheck ? 'Yes' : 'No' },
                  ]
                    .filter((row) => row.value)
                    .map((row) => {
                      const RowIcon = row.icon;
                      return (
                        <div key={row.label} className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                          <div className="p-1.5 rounded-lg bg-purple-500/10 shrink-0">
                            <RowIcon className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-400 mb-0.5">{row.label}</p>
                            {row.badge ? (
                              <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${row.badge === 'green' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {row.value}
                              </span>
                            ) : (
                              <p className="text-sm text-white font-medium break-words">{row.value}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="mt-5 text-center">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutWrapper>
  );
}
