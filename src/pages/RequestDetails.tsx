import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Calendar, MapPin, User, Info, CheckCircle, AlertCircle, ArrowLeft, Droplets, Phone, Mail, Clock } from 'lucide-react';

export const RequestDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, 'bloodRequests', id));
        if (docSnap.exists()) {
          setRequest({ id: docSnap.id, ...docSnap.data() });
        } else {
          navigate('/requests');
        }
      } catch (error) {
        console.error("Error fetching request:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id, navigate]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!id || !isAdmin) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'bloodRequests', id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      setRequest((prev: any) => ({ ...prev, status: newStatus }));
      setMessage({ type: 'success', text: `Request marked as ${newStatus}` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update status' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const isUrgent = request.urgency === 'urgent';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 font-bold transition-colors"
      >
        <ArrowLeft className="h-5 w-5" /> Back to Requests
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">
        <div className={`p-8 md:p-12 border-b-8 ${isUrgent ? 'border-red-600' : 'border-blue-600'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                  isUrgent ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                }`}>
                  {request.urgency} Request
                </span>
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                  request.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                }`}>
                  {request.status}
                </span>
              </div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Blood Needed: {request.bloodGroup}</h1>
              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 font-bold">
                <Clock className="h-5 w-5" />
                Posted on {new Date(request.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center justify-center bg-red-50 dark:bg-red-900/20 w-24 h-24 rounded-3xl">
              <span className="text-4xl font-black text-red-600 dark:text-red-500">{request.bloodGroup}</span>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-12">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-red-600 dark:text-red-500" /> Patient Information
                </h2>
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl space-y-4 transition-colors duration-300">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Name</span>
                    <span className="font-bold text-gray-900 dark:text-white">{request.patientName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Hospital</span>
                    <span className="font-bold text-gray-900 dark:text-white">{request.hospitalName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Location</span>
                    <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-600 dark:text-red-500" /> {request.location}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Phone className="h-5 w-5 text-red-600 dark:text-red-500" /> Contact Details
                </h2>
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl space-y-4 transition-colors duration-300">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Phone</span>
                    <a href={`tel:${request.contactNumber}`} className="font-bold text-red-600 dark:text-red-500 hover:underline">
                      {request.contactNumber}
                    </a>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Email</span>
                    <span className="font-bold text-gray-900 dark:text-white">{request.contactEmail || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Info className="h-5 w-5 text-red-600 dark:text-red-500" /> Requirement Details
                </h2>
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl space-y-6 transition-colors duration-300">
                  <div className="space-y-2">
                    <span className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Reason / Notes</span>
                    <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                      {request.reason || "Urgent blood requirement for medical procedure. Please contact as soon as possible if you can donate."}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-700 dark:text-red-400">
                    <AlertCircle className="h-6 w-6 shrink-0" />
                    <p className="text-sm font-bold">Please verify the identity and hospital details before proceeding with donation.</p>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-red-600 dark:text-red-500" /> Admin Actions
                  </h2>
                  <div className="flex flex-col gap-3">
                    {request.status === 'pending' ? (
                      <button 
                        onClick={() => handleStatusUpdate('fulfilled')}
                        disabled={updating}
                        className="w-full bg-green-600 dark:bg-green-500 text-white py-4 rounded-2xl font-bold hover:bg-green-700 dark:hover:bg-green-600 transition-all shadow-lg hover:shadow-green-200/50 dark:shadow-none disabled:opacity-50"
                      >
                        {updating ? 'Updating...' : 'Mark as Fulfilled'}
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleStatusUpdate('pending')}
                        disabled={updating}
                        className="w-full bg-yellow-600 dark:bg-yellow-500 text-white py-4 rounded-2xl font-bold hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-all shadow-lg hover:shadow-yellow-200/50 dark:shadow-none disabled:opacity-50"
                      >
                        {updating ? 'Updating...' : 'Mark as Pending'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {message && (
            <div className={`p-6 rounded-2xl flex items-center gap-4 text-lg font-bold border ${
              message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30'
            }`}>
              {message.type === 'success' ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
              {message.text}
            </div>
          )}

          <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-center gap-6">
            <a 
              href={`tel:${request.contactNumber}`}
              className="w-full sm:w-auto bg-red-600 dark:bg-red-500 text-white px-12 py-4 rounded-2xl font-bold text-xl hover:bg-red-700 dark:hover:bg-red-600 transition-all shadow-xl hover:shadow-red-200/50 dark:shadow-none flex items-center justify-center gap-3"
            >
              <Phone className="h-6 w-6" /> Contact Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
