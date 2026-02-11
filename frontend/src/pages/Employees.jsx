import React, { useState, useEffect } from 'react';
import { userService } from '../services/dataService';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  LockClosedIcon,
  LockOpenIcon,
  PencilIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const Employees = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

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
      const response = await userService.add(formData);
      if (response.success) {
        toast.success('Employee added successfully');
        setShowAddModal(false);
        setFormData({ id: '', name: '', role: '' });
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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Employees</h1>
          <p className="text-dark-400">Manage employee access and permissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Employee
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-800 border-b border-dark-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {users.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-dark-800 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-dark-300">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold mr-3">
                        {user.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
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
              ))}
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
              className="bg-dark-900 rounded-xl border border-dark-700 p-6 w-full max-w-md"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Add New Employee</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                    placeholder="DGEN-XX-XX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                    placeholder="Engineer"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
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
  );
};

export default Employees;
