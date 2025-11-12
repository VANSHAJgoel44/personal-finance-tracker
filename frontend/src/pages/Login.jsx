import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
export default function Login(){
  const [email,setEmail]=useState(''),[password,setPassword]=useState('');
  const { login, api } = useContext(AuthContext);
  const nav = useNavigate();
  async function submit(e){ e.preventDefault(); const r = await api.post('/auth/login',{ email,password }); login(r.data.token, r.data.user); nav('/dashboard'); }
  return (
    <div className="center-card">
      <form onSubmit={submit} className="card">
        <h2>Sign in</h2>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} type="password" />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
