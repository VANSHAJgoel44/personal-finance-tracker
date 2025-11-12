import React, { createContext, useState, useEffect } from 'react';
import api, { setToken } from '../api';
export const AuthContext = createContext();
export function AuthProvider({ children }){
  const [user, setUser] = useState(()=>JSON.parse(localStorage.getItem('user')));
  useEffect(()=>{ const t = localStorage.getItem('token'); if(t) setToken(t); },[]);
  function login(token,userObj){ localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(userObj)); setToken(token); setUser(userObj); }
  function logout(){ localStorage.removeItem('token'); localStorage.removeItem('user'); setToken(null); setUser(null); }
  return <AuthContext.Provider value={{ user, login, logout, api }}>{children}</AuthContext.Provider>;
}
