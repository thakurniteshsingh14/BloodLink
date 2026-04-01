import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { Droplets, User, Mail, Lock, Phone, MapPin, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    location: '',
    bloodGroup: 'A+',
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
          setError("Failed to detect location. Please enter manually.");
          setDetecting(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setDetecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      try {
        const isAdminEmail = formData.email.toLowerCase() === 'abhisingh.1419hhfgh@gmail.com';
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude,
          bloodGroup: formData.bloodGroup,
          role: isAdminEmail ? 'admin' : 'donor',
          createdAt: new Date().toISOString(),
        });
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      let message = 'Failed to register';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) message = parsed.error;
      } catch {
        message = err.message || 'Failed to register';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
            <Droplets className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Join the Network</h2>
          <p className="text-gray-500 font-medium">Create your donor profile today</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border border-red-100">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-red-600 focus:bg-white transition-all outline-none font-medium"
                placeholder="Full Name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-red-600 focus:bg-white transition-all outline-none font-medium"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-red-600 focus:bg-white transition-all outline-none font-medium"
                placeholder="+91 12345 67890"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Location / City</label>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-red-600 focus:bg-white transition-all outline-none font-medium"
                  placeholder="New York, NY"
                />
              </div>
              <button
                type="button"
                onClick={detectLocation}
                disabled={detecting}
                className={`px-4 py-4 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
                  formData.latitude ? 'bg-green-50 text-green-600 border-2 border-green-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
                title="Detect current location"
              >
                {detecting ? '...' : <MapPin className="h-5 w-5" />}
                {formData.latitude ? 'Detected' : 'Detect'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Blood Group</label>
            <select
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-red-600 focus:bg-white transition-all outline-none font-medium appearance-none"
            >
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-red-600 focus:bg-white transition-all outline-none font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="md:col-span-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-red-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? 'Creating Account...' : (
                <>Create Account <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-4">
          <p className="text-gray-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-red-600 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
