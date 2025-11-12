import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
export default function Register(){
  const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState('');
  const nav = useNavigate();
  async function submit(e){ e.preventDefault(); await api.post('/auth/register',{ name,email,password }); nav('/login'); }
  return (
    <div className="center-card">
      <form onSubmit={submit} className="card">
        <h2>Create account</h2>
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} type="password" />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}
