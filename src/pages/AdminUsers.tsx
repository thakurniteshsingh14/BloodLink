import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { Users, Search, Trash2, Shield, User, Mail, Phone, MapPin, Droplets, ArrowLeft, AlertCircle, CheckCircle, Filter, X, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    bloodGroup: '',
    location: '',
    regStartDate: '',
    regEndDate: '',
    lastDonationStart: '',
    lastDonationEnd: ''
  });
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'toggleRole';
    user: any;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const querySnap = await getDocs(q);
        const usersList = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const executeDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      setUsers(prev => prev.filter(user => user.id !== id));
      setMessage({ type: 'success', text: 'User deleted successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete user' });
    } finally {
      setConfirmAction(null);
    }
  };

  const executeToggleRole = async (user: any) => {
    const newRole = user.role === 'admin' ? 'donor' : 'admin';
    setUpdating(user.id);
    setConfirmAction(null);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      setMessage({ type: 'success', text: `User role updated to ${newRole}` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update user role' });
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = (user: any) => {
    setConfirmAction({ type: 'delete', user });
  };

  const toggleRole = (user: any) => {
    setConfirmAction({ type: 'toggleRole', user });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.bloodGroup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBloodGroup = !filters.bloodGroup || user.bloodGroup === filters.bloodGroup;
    const matchesLocation = !filters.location || user.location?.toLowerCase().includes(filters.location.toLowerCase());
    
    const regDate = user.createdAt ? new Date(user.createdAt) : null;
    const matchesRegStart = !filters.regStartDate || (regDate && regDate >= new Date(filters.regStartDate));
    const matchesRegEnd = !filters.regEndDate || (regDate && regDate <= new Date(filters.regEndDate));

    const lastDonationDate = user.lastDonationDate ? new Date(user.lastDonationDate) : null;
    const matchesDonationStart = !filters.lastDonationStart || (lastDonationDate && lastDonationDate >= new Date(filters.lastDonationStart));
    const matchesDonationEnd = !filters.lastDonationEnd || (lastDonationDate && lastDonationDate <= new Date(filters.lastDonationEnd));

    return matchesSearch && matchesBloodGroup && matchesLocation && matchesRegStart && matchesRegEnd && matchesDonationStart && matchesDonationEnd;
  });

  const clearFilters = () => {
    setFilters({
      bloodGroup: '',
      location: '',
      regStartDate: '',
      regEndDate: '',
      lastDonationStart: '',
      lastDonationEnd: ''
    });
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-all duration-300"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight transition-colors duration-300">User Management</h1>
            <p className="text-gray-500 dark:text-gray-400 font-bold transition-colors duration-300">Manage all registered donors and administrators</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input 
              type="text"
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500 focus:border-transparent font-bold outline-none transition-all duration-300"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all justify-center ${
              showFilters ? 'bg-red-600 dark:bg-red-500 text-white shadow-lg shadow-red-200 dark:shadow-none' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 shadow-sm'
            }`}
          >
            <Filter className="h-5 w-5" /> {showFilters ? 'Hide Filters' : 'Filters'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 grid md:grid-cols-3 lg:grid-cols-4 gap-6 transition-colors duration-300">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Blood Group</label>
                <select
                  value={filters.bloodGroup}
                  onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent dark:border-gray-700 rounded-xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium text-sm"
                >
                  <option value="" className="bg-white dark:bg-gray-900">All Groups</option>
                  {BLOOD_GROUPS.map(group => <option key={group} value={group} className="bg-white dark:bg-gray-900">{group}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Location</label>
                <input
                  type="text"
                  placeholder="Filter by city..."
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent dark:border-gray-700 rounded-xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Reg. Start Date</label>
                <input
                  type="date"
                  value={filters.regStartDate}
                  onChange={(e) => setFilters({ ...filters, regStartDate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent dark:border-gray-700 rounded-xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Reg. End Date</label>
                <input
                  type="date"
                  value={filters.regEndDate}
                  onChange={(e) => setFilters({ ...filters, regEndDate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent dark:border-gray-700 rounded-xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Last Donation Start</label>
                <input
                  type="date"
                  value={filters.lastDonationStart}
                  onChange={(e) => setFilters({ ...filters, lastDonationStart: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent dark:border-gray-700 rounded-xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Last Donation End</label>
                <input
                  type="date"
                  value={filters.lastDonationEnd}
                  onChange={(e) => setFilters({ ...filters, lastDonationEnd: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent dark:border-gray-700 rounded-xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium text-sm"
                />
              </div>
              <div className="md:col-span-3 lg:col-span-2 flex items-end justify-end">
                <button 
                  onClick={clearFilters}
                  className="text-sm font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors mb-3"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {message && (
        <div className={`p-6 rounded-2xl flex items-center gap-4 text-lg font-bold border transition-colors duration-300 ${
          message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
          {message.text}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <th className="px-8 py-6 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">User</th>
                <th className="px-8 py-6 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Blood Group</th>
                <th className="px-8 py-6 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Contact</th>
                <th className="px-8 py-6 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Role</th>
                <th className="px-8 py-6 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredUsers.map((user) => (
                <motion.tr 
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                        <User className="h-6 w-6 text-red-600 dark:text-red-500" />
                      </div>
                      <div>
                        <div className="font-black text-gray-900 dark:text-white">{user.name}</div>
                        <div className="text-sm font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {user.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-red-600 dark:text-red-500" />
                      <span className="font-black text-lg text-gray-900 dark:text-white">{user.bloodGroup}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300">
                        <Mail className="h-4 w-4" /> {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300">
                        <Phone className="h-4 w-4" /> {user.phone}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-1">
                        <Calendar className="h-3 w-3" /> Registered: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        <Droplets className="h-3 w-3" /> Last Donation: {user.lastDonationDate ? new Date(user.lastDonationDate).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      user.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => toggleRole(user)}
                        disabled={updating === user.id}
                        className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all disabled:opacity-50"
                        title="Toggle Admin Role"
                      >
                        <Shield className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user)}
                        className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        title="Delete User"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Users className="h-12 w-12 text-gray-200 dark:text-gray-800" />
                      <p className="text-gray-400 dark:text-gray-500 font-bold text-lg">No users found matching your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 transition-colors duration-300"
            >
              <div className="flex items-center gap-4 text-red-600 dark:text-red-500">
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black tracking-tight">Confirm Action</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                {confirmAction.type === 'delete' ? (
                  <>Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">{confirmAction.user.name}</span>? This action cannot be undone.</>
                ) : (
                  <>Are you sure you want to change <span className="font-bold text-gray-900 dark:text-white">{confirmAction.user.name}</span>'s role to <span className="font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">{confirmAction.user.role === 'admin' ? 'donor' : 'admin'}</span>?</>
                )}
              </p>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmAction.type === 'delete' ? executeDelete(confirmAction.user.id) : executeToggleRole(confirmAction.user)}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 transition-all shadow-lg shadow-red-200 dark:shadow-none"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
