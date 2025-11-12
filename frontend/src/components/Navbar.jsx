import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
export default function Navbar(){
  const { user, logout } = useContext(AuthContext);
  return (
    <nav className="nav">
      <div className="brand">PFT</div>
      <div className="links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/transactions">Transactions</Link>
        {user?.role==='admin' && <Link to="/users">Users</Link>}
        {!user ? <Link to="/login">Login</Link> : <button onClick={logout}>Logout</button>}
      </div>
    </nav>
  );
}
