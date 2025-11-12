import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
const Login = lazy(()=>import('./pages/Login'));
const Register = lazy(()=>import('./pages/Register'));
const Dashboard = lazy(()=>import('./pages/Dashboard'));
const Transactions = lazy(()=>import('./pages/Transactions'));
const UsersAdmin = lazy(()=>import('./pages/UsersAdmin'));
export default function App(){
  return (
    <>
      <Navbar />
      <Suspense fallback={<div style={{padding:20}}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/users" element={<UsersAdmin />} />
        </Routes>
      </Suspense>
    </>
  );
}
