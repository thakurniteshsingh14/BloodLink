import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { Bell, MapPin, Phone, CheckCircle, XCircle, Trash2, Droplets, Search, Filter, AlertCircle, Info, ExternalLink, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const AdminRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'bloodRequests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'bloodRequests', id), { status });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await deleteDoc(doc(db, 'bloodRequests', id));
      } catch (error) {
        console.error('Error deleting request:', error);
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
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight transition-colors duration-300">Manage Blood Requests</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium transition-colors duration-300">Monitor and update the status of urgent blood needs</p>
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
              <tr>
                <th className="px-8 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Blood Group</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Units & Urgency</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Location & Contact</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="bg-red-600 text-white w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-red-200 dark:shadow-none">
                      {req.bloodGroup}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-bold text-gray-900 dark:text-white">{req.units} Units Needed</div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      req.urgency === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 
                      req.urgency === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    }`}>
                      {req.urgency}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-red-600 dark:text-red-500" /> {req.location}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {req.contact}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      req.status === 'fulfilled' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                      req.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        to={`/requests/${req.id}`}
                        className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                        title="View Details"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </Link>
                      {req.status === 'pending' && (
                        <button onClick={() => handleStatus(req.id, 'fulfilled')} className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-600 dark:hover:bg-green-500 hover:text-white transition-all shadow-sm" title="Mark Fulfilled">
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(req.id)} className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-xl hover:bg-red-600 dark:hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Delete">
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
