import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Calendar, Bell, History, MapPin, Droplets, ArrowRight, X, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DonorDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [recentCamps, setRecentCamps] = useState<any[]>([]);
  const [urgentRequests, setUrgentRequests] = useState<any[]>([]);
  const [donationHistory, setDonationHistory] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch recent approved camps
    const campsQuery = query(
      collection(db, 'camps'),
      where('status', '==', 'approved'),
      orderBy('date', 'desc'),
      limit(3)
    );
    const unsubCamps = onSnapshot(campsQuery, (snap) => {
      setRecentCamps(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch urgent blood requests
    const requestsQuery = query(
      collection(db, 'bloodRequests'),
      where('status', '==', 'pending'),
      where('urgency', 'in', ['high', 'critical']),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const unsubRequests = onSnapshot(requestsQuery, (snap) => {
      setUrgentRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch user's donation history and notifications
    if (userProfile?.uid) {
      const historyQuery = query(
        collection(db, 'donations'),
        where('userId', '==', userProfile.uid),
        orderBy('date', 'desc'),
        limit(5)
      );
      const unsubHistory = onSnapshot(historyQuery, (snap) => {
        setDonationHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userProfile.uid),
        where('read', '==', false),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const unsubNotifications = onSnapshot(notificationsQuery, (snap) => {
        setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => {
        unsubCamps();
        unsubRequests();
        unsubHistory();
        unsubNotifications();
      };
    }

    return () => {
      unsubCamps();
      unsubRequests();
    };
  }, [userProfile?.uid]);

  const handleCancel = async (donationId: string) => {
    setCancellingId(donationId);
    try {
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error cancelling registration:", error);
    } finally {
      setCancellingId(null);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight transition-colors duration-300">Welcome, {userProfile?.name}!</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium transition-colors duration-300">Ready to save some lives today?</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-xl">
            <Droplets className="h-6 w-6 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <div className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Your Blood Group</div>
            <div className="text-xl font-black text-gray-900 dark:text-white">{userProfile?.bloodGroup}</div>
          </div>
        </div>
      </header>

      {/* Notifications Section */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
                <Bell className="h-5 w-5 text-red-600 dark:text-red-500" /> New Notifications
              </h2>
            </div>
            <div className="grid gap-4">
              {notifications.map((notification) => (
                <motion.div 
                  key={notification.id}
                  layout
                  className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border-l-4 border-l-red-600 dark:border-l-red-500 border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl">
                      <Bell className="h-6 w-6 text-red-600 dark:text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{notification.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{notification.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {notification.relatedId && (
                      <Link 
                        to={`/requests/${notification.relatedId}`}
                        onClick={() => markAsRead(notification.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition-all"
                      >
                        View Request
                      </Link>
                    )}
                    <button 
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400 dark:text-gray-500"
                      title="Mark as read"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Urgent Requests */}
        <div className="lg:col-span-2 space-y-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
                <Bell className="h-5 w-5 text-red-600 dark:text-red-500" /> Urgent Requests
              </h2>
              <Link to="/requests" className="text-sm font-bold text-red-600 dark:text-red-500 hover:underline">View All</Link>
            </div>
            <div className="grid gap-4">
              {urgentRequests.length > 0 ? urgentRequests.map((req) => (
                <div key={req.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="bg-red-600 text-white w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-red-200 dark:shadow-none">
                      {req.bloodGroup}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">{req.units} Units Needed</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {req.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      req.urgency === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                    }`}>
                      {req.urgency}
                    </span>
                    <Link to={`/requests/${req.id}`} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
                      <ArrowRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </Link>
                  </div>
                </div>
              )) : (
                <div className="bg-white dark:bg-gray-900 p-12 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-center space-y-2 transition-colors duration-300">
                  <div className="text-gray-400 dark:text-gray-500 font-medium">No urgent requests at the moment.</div>
                  <div className="text-sm text-gray-500 dark:text-gray-600">Check back later or browse all requests.</div>
                </div>
              )}
            </div>
          </section>

          {/* Upcoming Camps */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
                <Calendar className="h-5 w-5 text-red-600 dark:text-red-500" /> Nearby Camps
              </h2>
              <Link to="/camps" className="text-sm font-bold text-red-600 dark:text-red-500 hover:underline">View All</Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {recentCamps.map((camp) => (
                <div key={camp.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4 hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                      <Calendar className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      {new Date(camp.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{camp.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" /> {camp.location}
                    </p>
                  </div>
                  <Link 
                    to={`/camps/${camp.id}`}
                    className="block w-full text-center py-2 bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-500 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-bold transition-colors"
                  >
                    Details
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar: Stats & History */}
        <div className="space-y-8">
          <section className="bg-red-600 dark:bg-red-700 rounded-3xl p-8 text-white shadow-xl shadow-red-200 dark:shadow-none transition-colors duration-300">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Heart className="h-5 w-5" /> Your Impact
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="text-3xl font-black">{donationHistory.length}</div>
                <div className="text-xs font-bold uppercase tracking-wider opacity-60">Total Donations</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="text-3xl font-black">{donationHistory.length * 3}</div>
                <div className="text-xs font-bold uppercase tracking-wider opacity-60">Lives Saved</div>
              </div>
            </div>
            <Link to="/profile" className="mt-6 block w-full text-center py-3 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Update Profile
            </Link>
          </section>

          <section className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6 transition-colors duration-300">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <History className="h-5 w-5 text-red-600 dark:text-red-500" /> Recent History
            </h2>
            <div className="space-y-4">
              {donationHistory.length > 0 ? donationHistory.map((history) => (
                <div key={history.id} className="flex items-center justify-between py-4 border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors duration-300">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${
                      history.status === 'donated' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-500' : 
                      history.status === 'cancelled' ? 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500'
                    }`}>
                      <Droplets className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white capitalize">{history.status}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">{new Date(history.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  {history.status === 'registered' && (
                    <button 
                      onClick={() => handleCancel(history.id)}
                      disabled={cancellingId === history.id}
                      className="text-xs font-bold text-red-600 dark:text-red-500 hover:underline disabled:opacity-50"
                    >
                      {cancellingId === history.id ? '...' : 'Cancel'}
                    </button>
                  )}
                </div>
              )) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium text-center py-4">No donation history yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
