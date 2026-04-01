import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { Droplets, LogOut, User, LayoutDashboard, Calendar, Bell, Mail, Phone, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const Navbar: React.FC = () => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Droplets className="h-8 w-8 text-red-600" />
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">BloodLink</span>
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <>
                {!isAdmin && (
                  <>
                    <Link to="/camps" className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Camps
                    </Link>
                    <Link to="/requests" className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1">
                      <Bell className="h-4 w-4" /> Requests
                    </Link>
                  </>
                )}
                <Link to={isAdmin ? "/admin" : "/dashboard"} className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1">
                  <LayoutDashboard className="h-4 w-4" /> {isAdmin ? "Admin" : "Dashboard"}
                </Link>
                <Link to="/profile" className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1">
                  <User className="h-4 w-4" /> Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 px-3 py-2 text-sm font-medium transition-colors">Login</Link>
                <Link to="/register" className="bg-red-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-red-700 transition-all shadow-md hover:shadow-lg">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus('error');
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setStatus('loading');
    try {
      await addDoc(collection(db, 'contactMessages'), {
        ...formData,
        createdAt: new Date().toISOString()
      });
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to send message. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans selection:bg-red-100 dark:selection:bg-red-900 selection:text-red-900 dark:selection:text-red-100 flex flex-col transition-colors duration-300">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        {children}
      </main>

      {/* Contact Us Section */}
      <section className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Get in Touch</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                Have questions about blood donation or our platform? We're here to help you save lives.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-all">
                    <Mail className="h-6 w-6 text-red-600 dark:text-red-500 group-hover:text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Email Us</div>
                    <div className="font-bold text-gray-900 dark:text-gray-200">nt964929@gmail.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-all">
                    <Phone className="h-6 w-6 text-red-600 dark:text-red-500 group-hover:text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Call Us</div>
                    <div className="font-bold text-gray-900 dark:text-gray-200">7000884197</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-all">
                    <MapPin className="h-6 w-6 text-red-600 dark:text-red-500 group-hover:text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Visit Us</div>
                    <div className="font-bold text-gray-900 dark:text-gray-200">south pateri, satna, MP, India</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Send a Message</h3>
              
              {status === 'success' ? (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-6 rounded-2xl flex flex-col items-center text-center gap-3 border border-green-100 dark:border-green-900/30">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <div>
                    <p className="font-black text-lg">Message Sent!</p>
                    <p className="text-sm font-medium opacity-80">Thank you for reaching out. We'll get back to you soon.</p>
                  </div>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {status === 'error' && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm font-bold border border-red-100 dark:border-red-900/30">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      {errorMessage}
                    </div>
                  )}
                  <input 
                    type="text" 
                    placeholder="Your Name" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none font-medium text-sm"
                  />
                  <input 
                    type="email" 
                    placeholder="Your Email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none font-medium text-sm"
                  />
                  <textarea 
                    placeholder="Your Message" 
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none font-medium text-sm resize-none"
                  ></textarea>
                  <button 
                    disabled={status === 'loading'}
                    className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} BloodLink. Connecting donors with those in need.
        </div>
      </footer>
    </div>
  );
};
