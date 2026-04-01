import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { ArrowLeft, User, Calendar, MapPin, Droplets, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export const AdminCampDonations: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [camp, setCamp] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCamp = async () => {
      const docSnap = await getDoc(doc(db, 'camps', id));
      if (docSnap.exists()) {
        setCamp({ id: docSnap.id, ...docSnap.data() });
      } else {
        navigate('/admin/camps');
      }
    };
    fetchCamp();

    const q = query(collection(db, 'donations'), where('campId', '==', id));
    const unsubscribe = onSnapshot(q, async (snap) => {
      const donationList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch user details for each donation
      const donationsWithUsers = await Promise.all(donationList.map(async (donation: any) => {
        const userSnap = await getDoc(doc(db, 'users', donation.userId));
        return { ...donation, user: userSnap.exists() ? userSnap.data() : null };
      }));
      
      setDonations(donationsWithUsers);
      setLoading(false);
    });

    return unsubscribe;
  }, [id, navigate]);

  const handleStatus = async (donation: any, status: 'donated' | 'cancelled') => {
    setUpdating(donation.id);
    setMessage(null);
    try {
      // Update donation status
      await updateDoc(doc(db, 'donations', donation.id), {
        status,
        updatedAt: new Date().toISOString()
      });

      // If marked as donated, update user's lastDonationDate
      if (status === 'donated') {
        await updateDoc(doc(db, 'users', donation.userId), {
          lastDonationDate: new Date().toISOString()
        });
      }

      setMessage({ type: 'success', text: `Donation marked as ${status}` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update status' });
    } finally {
      setUpdating(null);
    }
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
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin/camps')}
          className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-all duration-300"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight transition-colors duration-300">Camp Registrations</h1>
          <p className="text-gray-500 dark:text-gray-400 font-bold transition-colors duration-300">{camp?.title} • {new Date(camp?.date).toLocaleDateString()}</p>
        </div>
      </div>

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
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
              <tr>
                <th className="px-8 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Donor</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Blood Group</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {donations.map((donation) => (
                <tr key={donation.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                        <User className="h-6 w-6 text-red-600 dark:text-red-500" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">{donation.user?.name || 'Unknown User'}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">{donation.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-red-600 dark:text-red-500" />
                      <span className="font-black text-lg text-gray-900 dark:text-white">{donation.user?.bloodGroup || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      donation.status === 'donated' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                      donation.status === 'registered' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                    }`}>
                      {donation.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {donation.status === 'registered' && (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleStatus(donation, 'donated')}
                          disabled={updating === donation.id}
                          className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-700 dark:hover:bg-green-600 transition-all disabled:opacity-50"
                        >
                          Mark Donated
                        </button>
                        <button 
                          onClick={() => handleStatus(donation, 'cancelled')}
                          disabled={updating === donation.id}
                          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {donations.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Clock className="h-12 w-12 text-gray-200 dark:text-gray-800" />
                      <p className="text-gray-400 dark:text-gray-500 font-bold text-lg">No registrations for this camp yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
