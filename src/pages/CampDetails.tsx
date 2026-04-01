import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, User, Info, CheckCircle, AlertCircle, ArrowLeft, Droplets, X } from 'lucide-react';

export const CampDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [camp, setCamp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [donationId, setDonationId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchCamp = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, 'camps', id));
        if (docSnap.exists()) {
          setCamp({ id: docSnap.id, ...docSnap.data() });
          
          // Check if user is already registered
          if (currentUser) {
            const q = query(
              collection(db, 'donations'),
              where('campId', '==', id),
              where('userId', '==', currentUser.uid),
              where('status', '==', 'registered')
            );
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              setIsRegistered(true);
              setDonationId(querySnap.docs[0].id);
            } else {
              setIsRegistered(false);
              setDonationId(null);
            }
          }
        } else {
          navigate('/camps');
        }
      } catch (error) {
        console.error("Error fetching camp:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCamp();
  }, [id, currentUser, navigate]);

  const handleRegister = async () => {
    if (!currentUser || !id || !camp) return;
    setRegistering(true);
    setMessage(null);
    setShowConfirm(false);
    try {
      const docRef = await addDoc(collection(db, 'donations'), {
        userId: currentUser.uid,
        campId: id,
        date: camp.date,
        status: 'registered',
        createdAt: new Date().toISOString()
      });
      setIsRegistered(true);
      setDonationId(docRef.id);
      setMessage({ type: 'success', text: 'Successfully registered for this camp!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to register' });
    } finally {
      setRegistering(false);
    }
  };

  const handleCancel = async () => {
    if (!donationId) return;
    setCancelling(true);
    setMessage(null);
    try {
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });
      setIsRegistered(false);
      setDonationId(null);
      setMessage({ type: 'success', text: 'Registration cancelled successfully.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to cancel registration' });
    } finally {
      setCancelling(false);
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
    <div className="max-w-4xl mx-auto space-y-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 font-bold transition-colors"
      >
        <ArrowLeft className="h-5 w-5" /> Back to Camps
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">
        <div className="aspect-video relative">
          <img 
            src={`https://picsum.photos/seed/${id}/1200/600`} 
            alt={camp.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
            <h1 className="text-4xl font-black text-white tracking-tight">{camp.title}</h1>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Date</div>
              <div className="flex items-center gap-3 text-gray-900 dark:text-white font-bold text-lg">
                <Calendar className="h-6 w-6 text-red-600 dark:text-red-500" />
                {new Date(camp.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Location</div>
              <div className="flex items-center gap-3 text-gray-900 dark:text-white font-bold text-lg">
                <MapPin className="h-6 w-6 text-red-600 dark:text-red-500" />
                {camp.location}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Organizer</div>
              <div className="flex items-center gap-3 text-gray-900 dark:text-white font-bold text-lg">
                <User className="h-6 w-6 text-red-600 dark:text-red-500" />
                {camp.organizer}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Info className="h-6 w-6 text-red-600 dark:text-red-500" /> About this Camp
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
              {camp.description || "Join us for this vital blood donation drive. Every unit of blood donated can save up to three lives. We ensure a safe, clean, and comfortable environment for all our donors. Please bring a valid ID and ensure you are well-hydrated before donating."}
            </p>
          </div>

          {message && (
            <div className={`p-6 rounded-2xl flex items-center gap-4 text-lg font-bold border ${
              message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30'
            }`}>
              {message.type === 'success' ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
              {message.text}
            </div>
          )}

          <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl">
                <Droplets className="h-8 w-8 text-red-600 dark:text-red-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">Eligibility Check</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ensure you haven't donated in the last 3 months.</div>
              </div>
            </div>
            
            {isRegistered ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-2">
                  <CheckCircle className="h-6 w-6" /> You are Registered
                </div>
                <button 
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="text-red-600 dark:text-red-500 font-bold hover:underline disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Registration'}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowConfirm(true)}
                disabled={registering}
                className="w-full sm:w-auto bg-red-600 text-white px-12 py-4 rounded-2xl font-bold text-xl hover:bg-red-700 transition-all shadow-xl hover:shadow-red-200/50 dark:shadow-none disabled:opacity-50"
              >
                {registering ? 'Registering...' : 'Register to Donate'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Confirm Registration</h2>
                  <button 
                    onClick={() => setShowConfirm(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  </button>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl space-y-4 transition-colors duration-300">
                  <div className="space-y-1">
                    <div className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Camp Title</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{camp.title}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Date</div>
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                        <Calendar className="h-4 w-4" />
                        {new Date(camp.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Location</div>
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                        <MapPin className="h-4 w-4" />
                        {camp.location}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  By confirming, you agree to participate in this blood donation camp. Please ensure you meet the eligibility criteria before attending.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button 
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 px-8 py-4 rounded-2xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleRegister}
                    className="flex-1 bg-red-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-200/50 dark:shadow-none"
                  >
                    Confirm & Register
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
