import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, Search, Filter, Droplets, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Camps: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [camps, setCamps] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    location: '',
    organizer: ''
  });
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);
  const [confirmCamp, setConfirmCamp] = useState<any | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'camps'),
      where('status', '==', 'approved'),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setCamps(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleRegister = async () => {
    if (!currentUser || !confirmCamp) return;
    setRegistering(confirmCamp.id);
    setMessage(null);
    const campToRegister = confirmCamp;
    setConfirmCamp(null);
    try {
      await addDoc(collection(db, 'donations'), {
        userId: currentUser.uid,
        campId: campToRegister.id,
        date: campToRegister.date,
        status: 'registered',
        createdAt: new Date().toISOString()
      });
      setMessage({ type: 'success', text: 'Successfully registered for the camp!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to register' });
    } finally {
      setRegistering(null);
    }
  };

  const filteredCamps = camps.filter(camp => {
    const matchesSearch = camp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         camp.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const campDate = new Date(camp.date);
    const matchesStartDate = !filters.startDate || campDate >= new Date(filters.startDate);
    const matchesEndDate = !filters.endDate || campDate <= new Date(filters.endDate);
    const matchesLocation = !filters.location || camp.location.toLowerCase().includes(filters.location.toLowerCase());
    const matchesOrganizer = !filters.organizer || camp.organizer.toLowerCase().includes(filters.organizer.toLowerCase());

    return matchesSearch && matchesStartDate && matchesEndDate && matchesLocation && matchesOrganizer;
  });

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      location: '',
      organizer: ''
    });
    setSearchTerm('');
  };

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight transition-colors duration-300">Blood Donation Camps</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium max-w-2xl leading-relaxed transition-colors duration-300">
          Find and register for upcoming blood donation camps in your area. Your contribution can save up to three lives.
        </p>
      </header>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4 items-center transition-colors duration-300">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by title or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-2xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all w-full md:w-auto justify-center ${
              showFilters ? 'bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-none' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="h-5 w-5" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className="overflow-hidden"
            >
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 grid md:grid-cols-4 gap-6 transition-colors duration-300">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Location</label>
                  <input
                    type="text"
                    placeholder="Filter by city..."
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Organizer</label>
                  <input
                    type="text"
                    placeholder="Filter by organizer..."
                    value={filters.organizer}
                    onChange={(e) => setFilters({ ...filters, organizer: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium text-sm"
                  />
                </div>
                <div className="md:col-span-4 flex justify-end">
                  <button 
                    onClick={clearFilters}
                    className="text-sm font-bold text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {message.text}
        </motion.div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 h-64 rounded-3xl animate-pulse border border-gray-100 dark:border-gray-800 transition-colors duration-300"></div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCamps.map((camp) => (
            <motion.div 
              key={camp.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all duration-300 group"
            >
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={`https://picsum.photos/seed/${camp.id}/800/450`} 
                  alt={camp.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-xl text-xs font-black text-red-600 dark:text-red-500 uppercase tracking-widest shadow-sm">
                  {new Date(camp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight line-clamp-1">{camp.title}</h3>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-red-600 dark:text-red-500" />
                    {camp.location}
                  </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 leading-relaxed">
                  {camp.description || "Join us for our regular blood donation drive. Your contribution matters more than you think."}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
                  <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    By {camp.organizer}
                  </div>
                  <div className="flex gap-2">
                    <Link 
                      to={`/camps/${camp.id}`}
                      className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-4 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    >
                      Details
                    </Link>
                    <button 
                      onClick={() => setConfirmCamp(camp)}
                      disabled={registering === camp.id}
                      className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg hover:shadow-red-200/50 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {registering === camp.id ? 'Registering...' : 'Register Now'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredCamps.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-colors duration-300">
            <Droplets className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">No camps found</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium transition-colors duration-300">Try searching for a different location or check back later.</p>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmCamp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmCamp(null)}
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
                    onClick={() => setConfirmCamp(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  </button>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl space-y-4 transition-colors duration-300">
                  <div className="space-y-1">
                    <div className="text-xs font-black text-red-600 dark:text-red-500 uppercase tracking-widest">Camp Title</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{confirmCamp.title}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-black text-red-600 dark:text-red-500 uppercase tracking-widest">Date</div>
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                        <Calendar className="h-4 w-4" />
                        {new Date(confirmCamp.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-black text-red-600 dark:text-red-500 uppercase tracking-widest">Location</div>
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                        <MapPin className="h-4 w-4" />
                        {confirmCamp.location}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  By confirming, you agree to participate in this blood donation camp. Please ensure you meet the eligibility criteria before attending.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button 
                    onClick={() => setConfirmCamp(null)}
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
