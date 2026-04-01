import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, limit, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { Users, Calendar, Bell, CheckCircle, XCircle, Clock, Plus, ArrowRight, Droplets, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalDonors: 0,
    totalCamps: 0,
    totalRequests: 0,
    pendingCamps: 0,
    pendingRequests: 0,
    fulfilledRequests: 0
  });
  const [recentCamps, setRecentCamps] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    // Fetch counts
    const fetchStats = async () => {
      const donorsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'donor')));
      const campsSnap = await getDocs(collection(db, 'camps'));
      const requestsSnap = await getDocs(collection(db, 'bloodRequests'));
      const pendingCampsSnap = await getDocs(query(collection(db, 'camps'), where('status', '==', 'pending')));
      const pendingRequestsSnap = await getDocs(query(collection(db, 'bloodRequests'), where('status', '==', 'pending')));
      const fulfilledRequestsSnap = await getDocs(query(collection(db, 'bloodRequests'), where('status', '==', 'fulfilled')));

      setStats({
        totalDonors: donorsSnap.size,
        totalCamps: campsSnap.size,
        totalRequests: requestsSnap.size,
        pendingCamps: pendingCampsSnap.size,
        pendingRequests: pendingRequestsSnap.size,
        fulfilledRequests: fulfilledRequestsSnap.size
      });
    };
    fetchStats();

    // Fetch recent camps
    const campsQuery = query(collection(db, 'camps'), orderBy('createdAt', 'desc'), limit(5));
    const unsubCamps = onSnapshot(campsQuery, (snap) => {
      setRecentCamps(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch recent requests
    const requestsQuery = query(collection(db, 'bloodRequests'), orderBy('createdAt', 'desc'), limit(5));
    const unsubRequests = onSnapshot(requestsQuery, (snap) => {
      setRecentRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubCamps();
      unsubRequests();
    };
  }, []);

  const handleCampStatus = async (campId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'camps', campId), { status });
    } catch (error) {
      console.error('Error updating camp status:', error);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:text-red-600 dark:hover:text-red-500 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight transition-colors duration-300">Admin Control Panel</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium transition-colors duration-300">Overview of the blood donation network</p>
          </div>
        </div>
        <Link to="/admin/camps" className="bg-red-600 dark:bg-red-500 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-red-700 dark:hover:bg-red-600 transition-all shadow-lg hover:shadow-red-200/50 dark:shadow-none flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Manage Camps
        </Link>
      </header>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link to="/admin/camps" className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-red-100/50 transition-all group flex items-center gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calendar className="h-6 w-6 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Manage Camps</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Approve or reject drives</p>
          </div>
        </Link>
        <Link to="/admin/requests" className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-red-100/50 transition-all group flex items-center gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Droplets className="h-6 w-6 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Blood Requests</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Monitor requirements</p>
          </div>
        </Link>
        <Link to="/admin/users" className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-red-100/50 transition-all group flex items-center gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="h-6 w-6 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">User Management</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Manage donors & roles</p>
          </div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[
          { label: "Total Donors", value: stats.totalDonors, icon: Users, color: "blue" },
          { label: "Total Camps", value: stats.totalCamps, icon: Calendar, color: "purple" },
          { label: "Blood Requests", value: stats.totalRequests, icon: Bell, color: "red" },
          { label: "Pending Camps", value: stats.pendingCamps, icon: Clock, color: "orange" },
          { label: "Pending Req", value: stats.pendingRequests, icon: AlertCircle, color: "red" },
          { label: "Fulfilled Req", value: stats.fulfilledRequests, icon: CheckCircle, color: "green" }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 transition-colors duration-300">
            <div className={`bg-${stat.color}-50 dark:bg-${stat.color}-900/20 p-4 rounded-2xl`}>
              <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-500`} />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</div>
              <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Blood Request Summary Section */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6 transition-colors duration-300">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Bell className="h-5 w-5 text-red-600 dark:text-red-500" /> Blood Request Summary
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-red-900 dark:text-red-500">{stats.pendingRequests}</div>
              <div className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Pending Requests</div>
            </div>
            <Clock className="h-10 w-10 text-red-200 dark:text-red-900/40" />
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-green-900 dark:text-green-500">{stats.fulfilledRequests}</div>
              <div className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">Fulfilled Requests</div>
            </div>
            <CheckCircle className="h-10 w-10 text-green-200 dark:text-green-900/40" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Manage Camps */}
        <section className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-600 dark:text-red-500" /> Recent Camps
            </h2>
            <Link to="/admin/camps" className="text-sm font-bold text-red-600 dark:text-red-500 hover:underline">Manage All</Link>
          </div>
          <div className="space-y-4">
            {recentCamps.map((camp) => (
              <div key={camp.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl space-y-3 transition-colors duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{camp.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{camp.location} • {new Date(camp.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    camp.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    camp.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {camp.status}
                  </span>
                </div>
                {camp.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleCampStatus(camp.id, 'approved')}
                      className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" /> Approve
                    </button>
                    <button 
                      onClick={() => handleCampStatus(camp.id, 'rejected')}
                      className="flex-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2 rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-500 hover:border-red-200 dark:hover:border-red-500 transition-colors flex items-center justify-center gap-1"
                    >
                      <XCircle className="h-3 w-3" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Recent Blood Requests */}
        <section className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-red-600 dark:text-red-500" /> Blood Requests
            </h2>
            <Link to="/admin/requests" className="text-sm font-bold text-red-600 dark:text-red-500 hover:underline">Manage All</Link>
          </div>
          <div className="space-y-4">
            {recentRequests.map((req) => (
              <div key={req.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-red-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm">
                    {req.bloodGroup}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{req.units} Units Needed</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">{req.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    req.status === 'fulfilled' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                  }`}>
                    {req.status}
                  </span>
                  <Link to={`/admin/requests/${req.id}`} className="p-2 hover:bg-white dark:hover:bg-gray-900 rounded-xl transition-colors">
                    <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
