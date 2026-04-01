import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, Users, Calendar, MapPin, ArrowRight, Droplets, Bell, CheckCircle } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export const Home: React.FC = () => {
  const [stats, setStats] = useState({
    activeDonors: 0,
    totalCamps: 0,
    bloodRequests: 0,
    fulfilledRequests: 0,
    bloodUnits: 0
  });

  useEffect(() => {
    // Real-time listeners for counts
    const unsubDonors = onSnapshot(query(collection(db, 'users'), where('role', '==', 'donor')), (snap) => {
      setStats(prev => ({ ...prev, activeDonors: snap.size }));
    });

    const unsubCamps = onSnapshot(collection(db, 'camps'), (snap) => {
      setStats(prev => ({ ...prev, totalCamps: snap.size }));
    });

    const unsubRequests = onSnapshot(collection(db, 'bloodRequests'), (snap) => {
      const fulfilled = snap.docs.filter(doc => doc.data().status === 'fulfilled').length;
      setStats(prev => ({ 
        ...prev, 
        bloodRequests: snap.size,
        fulfilledRequests: fulfilled
      }));
    });

    const unsubDonations = onSnapshot(query(collection(db, 'donations'), where('status', '==', 'donated')), (snap) => {
      setStats(prev => ({ ...prev, bloodUnits: snap.size }));
    });

    return () => {
      unsubDonors();
      unsubCamps();
      unsubRequests();
      unsubDonations();
    };
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-16 shadow-xl border border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-500 px-4 py-2 rounded-full text-sm font-semibold tracking-wide uppercase">
              <Droplets className="h-4 w-4" />
              <span>Save a Life Today</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
              Your Blood Can <span className="text-red-600">Give Life</span> to Others.
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed">
              Connect with local blood donation camps, track your donations, and respond to urgent requests in your community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/register" className="bg-red-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-red-200/50 flex items-center justify-center gap-2 group">
                Become a Donor <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/camps" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 px-8 py-4 rounded-2xl font-bold text-lg hover:border-red-600 dark:hover:border-red-500 hover:text-red-600 dark:hover:border-red-500 transition-all flex items-center justify-center gap-2">
                Find Camps
              </Link>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src="https://picsum.photos/seed/blood-donation/800/800" 
                alt="Blood Donation" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex items-center gap-4 transition-colors duration-300">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-xl">
                <Heart className="h-8 w-8 text-red-600 fill-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.fulfilledRequests > 0 ? stats.fulfilledRequests.toLocaleString() : "1,200+"}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Lives Saved This Month</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        {[
          { icon: Users, title: "Donor Network", desc: "Join a growing community of heroes dedicated to saving lives through regular donation." },
          { icon: Calendar, title: "Easy Scheduling", desc: "Find and register for donation camps near you with just a few clicks." },
          { icon: MapPin, title: "Real-time Alerts", desc: "Get notified immediately when there's an urgent need for your blood type in your area." }
        ].map((feature, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-gray-900 p-10 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <feature.icon className="h-8 w-8 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{feature.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Stats Section */}
      <section className="bg-gray-900 dark:bg-black rounded-3xl p-12 md:p-20 text-white overflow-hidden relative transition-colors duration-300">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-red-600/10 blur-3xl -z-0"></div>
        <div className="relative z-10 grid md:grid-cols-4 gap-12 text-center">
          {[
            { label: "Active Donors", value: stats.activeDonors > 0 ? stats.activeDonors.toLocaleString() : "5,000+" },
            { label: "Blood Units", value: stats.bloodUnits > 0 ? stats.bloodUnits.toLocaleString() : "12,500+" },
            { label: "Camps Organized", value: stats.totalCamps > 0 ? stats.totalCamps.toLocaleString() : "450+" },
            { label: "Requests Fulfilled", value: stats.fulfilledRequests > 0 ? stats.fulfilledRequests.toLocaleString() : "1,100+" }
          ].map((stat, i) => (
            <div key={i} className="space-y-2">
              <div className="text-4xl md:text-5xl font-black text-red-500">{stat.value}</div>
              <div className="text-gray-400 font-medium uppercase tracking-widest text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
