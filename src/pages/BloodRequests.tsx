import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Bell, MapPin, Phone, Droplets, Plus, Search, Filter, AlertCircle, CheckCircle, Info, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDistance } from '../lib/utils';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS = ['low', 'medium', 'high', 'critical'];
const NOTIFICATION_RADIUS_KM = 50;

export const BloodRequests: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [formData, setFormData] = useState({
    bloodGroup: 'A+',
    units: 1,
    urgency: 'medium',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    contact: '',
    description: ''
  });

  useEffect(() => {
    const q = query(
      collection(db, 'bloodRequests'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const detectLocation = () => {
    setDetecting(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          setDetecting(false);
        },
        (err) => {
          console.error("Error detecting location:", err);
          setMessage({ type: 'error', text: "Failed to detect location. Please enter manually." });
          setDetecting(false);
        }
      );
    } else {
      setMessage({ type: 'error', text: "Geolocation is not supported by your browser." });
      setDetecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const requestDoc = await addDoc(collection(db, 'bloodRequests'), {
        ...formData,
        requestedBy: currentUser.uid,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Notify matching donors within radius
      if (formData.latitude && formData.longitude) {
        const donorsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'donor'),
          where('bloodGroup', '==', formData.bloodGroup)
        );
        const donorsSnap = await getDocs(donorsQuery);
        
        const notifications = donorsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((donor: any) => {
            if (donor.uid === currentUser.uid) return false;
            if (!donor.latitude || !donor.longitude) return false;
            const distance = getDistance(
              formData.latitude!,
              formData.longitude!,
              donor.latitude,
              donor.longitude
            );
            return distance <= NOTIFICATION_RADIUS_KM;
          })
          .map((donor: any) => ({
            userId: donor.uid,
            title: 'Urgent Blood Request Nearby!',
            message: `A request for ${formData.bloodGroup} blood has been posted within ${NOTIFICATION_RADIUS_KM}km of your location.`,
            type: 'urgent_request',
            relatedId: requestDoc.id,
            read: false,
            createdAt: new Date().toISOString()
          }));

        // Create notifications in batch (simulated with Promise.all)
        await Promise.all(notifications.map(n => addDoc(collection(db, 'notifications'), n)));
      }

      setMessage({ type: 'success', text: 'Request posted successfully! Matching donors have been notified.' });
      setShowForm(false);
      setFormData({
        bloodGroup: 'A+',
        units: 1,
        urgency: 'medium',
        location: '',
        latitude: null,
        longitude: null,
        contact: '',
        description: ''
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to post request' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight transition-colors duration-300">Blood Requests</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium max-w-2xl leading-relaxed transition-colors duration-300">
            Respond to urgent blood needs in your community or post a request for someone in need.
          </p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 dark:bg-red-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-red-700 dark:hover:bg-red-600 transition-all shadow-lg hover:shadow-red-200/50 dark:shadow-none flex items-center justify-center gap-2 group"
        >
          <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" /> Post Request
        </button>
      </header>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border transition-colors duration-300 ${
            message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {message.text}
        </motion.div>
      )}

      {showForm && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 space-y-8 overflow-hidden transition-colors duration-300"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Post Urgent Request</h2>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Blood Group</label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-2xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium appearance-none"
              >
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Units Needed</label>
              <input
                type="number"
                min="1"
                required
                value={formData.units}
                onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) })}
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-2xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Urgency Level</label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-2xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium appearance-none"
              >
                {URGENCY_LEVELS.map((level) => (
                  <option key={level} value={level}>{level.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Location / Hospital</label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-2xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
                    placeholder="City Hospital, New York"
                  />
                </div>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={detecting}
                  className={`px-4 py-4 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
                    formData.latitude ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-2 border-green-100 dark:border-green-900/30' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Detect current location"
                >
                  {detecting ? '...' : <MapPin className="h-5 w-5" />}
                  {formData.latitude ? 'Detected' : 'Detect'}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Contact Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="tel"
                  required
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-2xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>
            <div className="md:col-span-3 flex justify-end gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="px-8 py-4 rounded-2xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="bg-red-600 dark:bg-red-500 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-red-700 dark:hover:bg-red-600 transition-all shadow-lg hover:shadow-red-200/50 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Posting...' : 'Post Request'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Requests Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 h-64 rounded-3xl animate-pulse border border-gray-100 dark:border-gray-800 transition-colors duration-300"></div>
          ))
        ) : (
          requests.map((req) => (
            <motion.div 
              key={req.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6 hover:shadow-xl transition-all relative overflow-hidden group duration-300"
            >
              <div className={`absolute top-0 right-0 w-2 h-full ${
                req.urgency === 'critical' ? 'bg-red-600' : 
                req.urgency === 'high' ? 'bg-orange-500' : 'bg-blue-500'
              }`}></div>
              
              <div className="flex justify-between items-start">
                <div className="bg-red-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-red-200 dark:shadow-none">
                  {req.bloodGroup}
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  req.urgency === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 
                  req.urgency === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                }`}>
                  {req.urgency} Urgency
                </span>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{req.units} Units Needed</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 font-medium">
                    <MapPin className="h-5 w-5 text-red-600 dark:text-red-500" />
                    {req.location}
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 font-medium">
                    <Phone className="h-5 w-5 text-red-600 dark:text-red-500" />
                    {req.contact}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  {new Date(req.createdAt).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Link 
                    to={`/requests/${req.id}`}
                    className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-4 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    Details
                  </Link>
                  <a 
                    href={`tel:${req.contact}`}
                    className="bg-gray-900 dark:bg-black text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-600 dark:hover:bg-red-500 transition-all flex items-center gap-2"
                  >
                    Contact
                  </a>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {!loading && requests.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-colors duration-300">
            <Bell className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">No active requests</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium transition-colors duration-300">Everything seems stable. Check back later.</p>
        </div>
      )}
    </div>
  );
};
