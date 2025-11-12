import React, { useEffect, useState } from 'react';
import api from '../api';
export default function UsersAdmin(){
  const [users,setUsers]=useState([]);
  useEffect(()=>{ (async ()=>{ const r = await api.get('/users'); setUsers(r.data); })(); },[]);
  return (
    <div style={{padding:20}}>
      <h2>All Users</h2>
      <div className="card">
        {users.map(u=> <div key={u.id} className="user-row">{u.id} {u.name} {u.email} {u.role}</div>)}
      </div>
    </div>
  );
}
