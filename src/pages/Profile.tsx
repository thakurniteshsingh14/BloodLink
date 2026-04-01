import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { User, Mail, Phone, MapPin, Droplets, CheckCircle, AlertCircle, Save, Camera } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const Profile: React.FC = () => {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
    location: userProfile?.location || '',
    bloodGroup: userProfile?.bloodGroup || 'A+',
    lastDonationDate: userProfile?.lastDonationDate || '',
    latitude: userProfile?.latitude || null as number | null,
    longitude: userProfile?.longitude || null as number | null,
  });
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
    if (!userProfile?.uid) return;
    setLoading(true);
    setMessage(null);
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="space-y-4">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight transition-colors duration-300">Your Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium max-w-2xl leading-relaxed transition-colors duration-300">
          Manage your personal information, blood group, and track your donation eligibility.
        </p>
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

      <div className="grid md:grid-cols-3 gap-12">
        {/* Profile Card */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 text-center space-y-6 transition-colors duration-300">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                <User className="h-16 w-16 text-red-600 dark:text-red-500" />
              </div>
              <button className="absolute bottom-0 right-0 bg-red-600 dark:bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">{userProfile?.name}</h2>
              <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">{userProfile?.role}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl flex items-center justify-between transition-colors duration-300">
              <div className="text-left">
                <div className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Blood Group</div>
                <div className="text-2xl font-black text-red-900 dark:text-red-100">{userProfile?.bloodGroup}</div>
              </div>
              <Droplets className="h-8 w-8 text-red-600 dark:text-red-500 opacity-20" />
            </div>
          </div>

          <div className="bg-gray-900 dark:bg-black rounded-3xl p-8 text-white space-y-4 transition-colors duration-300">
            <h3 className="font-bold text-lg">Donation Status</h3>
            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Last Donation</div>
              <div className="text-xl font-bold">{userProfile?.lastDonationDate || 'No records found'}</div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <div className="text-xs font-bold text-green-400 uppercase tracking-widest">Eligibility</div>
              <div className="text-lg font-bold text-green-500">Eligible to Donate</div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 space-y-8 transition-colors duration-300">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Personal Information</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent dark:border-gray-700 rounded-2xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
                    placeholder="Full Name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Email (Read-only)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="email"
                    readOnly
                    value={userProfile?.email}
                    className="w-full pl-12 pr-4 py-4 bg-gray-100 dark:bg-gray-800/50 border-2 border-transparent rounded-2xl text-gray-400 dark:text-gray-500 font-medium outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent dark:border-gray-700 rounded-2xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
                    placeholder="+91 12345 67890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Location</label>
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent dark:border-gray-700 rounded-2xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
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
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent dark:border-gray-700 rounded-2xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium appearance-none"
                >
                  {BLOOD_GROUPS.map((group) => (
                    <option key={group} value={group} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{group}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Last Donation Date</label>
                <input
                  type="date"
                  value={formData.lastDonationDate}
                  onChange={(e) => setFormData({ ...formData, lastDonationDate: e.target.value })}
                  className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent dark:border-gray-700 rounded-2xl focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50 dark:border-gray-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 dark:bg-red-500 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-red-700 dark:hover:bg-red-600 transition-all shadow-lg hover:shadow-red-200/50 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? 'Saving...' : <><Save className="h-5 w-5" /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
