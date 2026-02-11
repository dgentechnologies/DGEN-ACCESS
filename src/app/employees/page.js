'use client';

import { useState, useEffect } from 'react';
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
];

export default function Employees() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: '',
    department: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // Generate next employee ID based on department
  const generateEmployeeId = (deptCode) => {
    if (!deptCode) return '';
    
    // Find all users in the same department
    const deptUsers = users.filter(u => u.id.startsWith(`DGEN-${deptCode}-`));
    
    // Extract serial numbers and find the highest
    let maxSerial = 0;
    deptUsers.forEach(user => {
      const match = user.id.match(/DGEN-[A-Z]+-(\d+)/);
      if (match) {
        const serial = parseInt(match[1], 10);
        if (serial > maxSerial) maxSerial = serial;
      }
    });
    
    // Generate next serial number (padded to 2 digits)
    const nextSerial = String(maxSerial + 1).padStart(2, '0');
    return `DGEN-${deptCode}-${nextSerial}`;
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
      });
      if (response.success) {
        toast.success('Employee added successfully');
        setShowAddModal(false);
        setFormData({ id: '', name: '', role: '', department: '' });
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add employee');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const response = await userService.toggleStatus(userId);
      if (response.success) {
        toast.success('Status updated successfully');
        fetchUsers();
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
            <h1 className="text-3xl font-bold text-white mb-2">Employees</h1>
            <p className="text-gray-400">Manage employee access and permissions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Employee
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
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
                {users.map((user) => {
                  const deptCode = extractDepartmentCode(user.id);
                  const dept = getDepartmentByCode(deptCode);
                  const DeptIcon = dept?.icon || UserGroupIcon;
                  
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
                        {user.isSuperAdmin && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400">
                            <ShieldCheckIcon className="w-3 h-3 mr-1" />
                            Super Admin
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.status === 'Active'
                                ? 'hover:bg-red-500/20 text-red-400'
                                : 'hover:bg-green-500/20 text-green-400'
                            }`}
                            title={user.status === 'Active' ? 'Ban User' : 'Unban User'}
                          >
                            {user.status === 'Active' ? (
                              <LockClosedIcon className="w-5 h-5" />
                            ) : (
                              <LockOpenIcon className="w-5 h-5" />
                            )}
                          </button>
                          {!user.isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                              title="Delete User"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
                      placeholder="Select department first"
                      disabled={!formData.department}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Format: DGEN-{'{'}DEPT{'}'}-{'{'}SERIAL{'}'}
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

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setFormData({ id: '', name: '', role: '', department: '' });
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
      </div>
    </LayoutWrapper>
  );
}
