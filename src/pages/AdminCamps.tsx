import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { Calendar, MapPin, Plus, Trash2, CheckCircle, XCircle, Clock, Search, AlertCircle, Info, ExternalLink, Users, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const AdminCamps: React.FC = () => {
  const [camps, setCamps] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    location: '',
    organizer: '',
    description: '',
    status: 'pending'
  });

  useEffect(() => {
    const q = query(collection(db, 'camps'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setCamps(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'camps'), {
        ...formData,
        createdAt: new Date().toISOString()
      });
      setShowForm(false);
      setFormData({ title: '', date: '', location: '', organizer: '', description: '', status: 'pending' });
    } catch (error) {
      console.error('Error adding camp:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'camps', id), { status });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this camp?')) {
      try {
        await deleteDoc(doc(db, 'camps', id));
      } catch (error) {
        console.error('Error deleting camp:', error);
      }
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-all duration-300"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight transition-colors duration-300">Manage Donation Camps</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium transition-colors duration-300">Create, approve, and organize blood donation drives</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 dark:bg-red-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-red-700 dark:hover:bg-red-600 transition-all shadow-lg hover:shadow-red-200/50 dark:shadow-none flex items-center gap-2"
        >
          <Plus className="h-5 w-5" /> Create Camp
        </button>
      </header>

      {showForm && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 space-y-6 transition-colors duration-300"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Donation Camp</h2>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Camp Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-2xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
                placeholder="Annual Blood Drive 2026"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-2xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-2xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
                placeholder="Central Park, NY"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Organizer</label>
              <input
                type="text"
                required
                value={formData.organizer}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-2xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
                placeholder="Red Cross Society"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-2xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium h-32 resize-none"
                placeholder="Details about the camp..."
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 rounded-2xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="bg-red-600 dark:bg-red-500 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-red-700 dark:hover:bg-red-600 transition-all shadow-lg hover:shadow-red-200/50 dark:shadow-none">
                {submitting ? 'Creating...' : 'Create Camp'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
              <tr>
                <th className="px-8 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Camp Details</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Date & Location</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {camps.map((camp) => (
                <tr key={camp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="font-bold text-gray-900 dark:text-white">{camp.title}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">By {camp.organizer}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-gray-600 dark:text-gray-300">{new Date(camp.date).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {camp.location}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      camp.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                      camp.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {camp.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        to={`/admin/camps/${camp.id}/donations`}
                        className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-600 dark:hover:bg-purple-500 hover:text-white transition-all shadow-sm"
                        title="View Registrations"
                      >
                        <Users className="h-5 w-5" />
                      </Link>
                      <Link 
                        to={`/camps/${camp.id}`}
                        className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                        title="View Details"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </Link>
                      {camp.status === 'pending' && (
                        <>
                          <button onClick={() => handleStatus(camp.id, 'approved')} className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-600 dark:hover:bg-green-500 hover:text-white transition-all shadow-sm" title="Approve">
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleStatus(camp.id, 'rejected')} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 dark:hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Reject">
                            <XCircle className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDelete(camp.id)} className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-xl hover:bg-red-600 dark:hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Delete">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
