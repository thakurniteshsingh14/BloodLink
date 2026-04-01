/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DonorDashboard } from './pages/DonorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Camps } from './pages/Camps';
import { BloodRequests } from './pages/BloodRequests';
import { Profile } from './pages/Profile';
import { AdminCamps } from './pages/AdminCamps';
import { AdminRequests } from './pages/AdminRequests';
import { AdminUsers } from './pages/AdminUsers';
import { AdminCampDonations } from './pages/AdminCampDonations';
import { CampDetails } from './pages/CampDetails';
import { RequestDetails } from './pages/RequestDetails';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DonorDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/camps" element={
              <ProtectedRoute>
                <Camps />
              </ProtectedRoute>
            } />
            
            <Route path="/camps/:id" element={
              <ProtectedRoute>
                <CampDetails />
              </ProtectedRoute>
            } />
            
            <Route path="/requests" element={
              <ProtectedRoute>
                <BloodRequests />
              </ProtectedRoute>
            } />
            
            <Route path="/requests/:id" element={
              <ProtectedRoute>
                <RequestDetails />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/camps" element={
              <ProtectedRoute adminOnly>
                <AdminCamps />
              </ProtectedRoute>
            } />
            <Route path="/admin/camps/:id/donations" element={
              <ProtectedRoute adminOnly>
                <AdminCampDonations />
              </ProtectedRoute>
            } />
            <Route path="/admin/requests" element={
              <ProtectedRoute adminOnly>
                <AdminRequests />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/users" element={
              <ProtectedRoute adminOnly>
                <AdminUsers />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  </ThemeProvider>
  );
}
