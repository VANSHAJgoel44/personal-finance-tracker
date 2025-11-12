import React, { useEffect, useState, useContext } from 'react';
import api from '../api';
import PieChart from '../components/Charts/PieChart';
import LineChart from '../components/Charts/LineChart';
import BarChart from '../components/Charts/BarChart';
export default function Dashboard(){
  const [cat,setCat]=useState([]),[summary,setSummary]=useState({monthly:[]});
  useEffect(()=>{ (async ()=>{ const c = await api.get('/analytics/by-category'); setCat(c.data); const s = await api.get('/analytics/summary'); setSummary(s.data); })(); },[]);
  return (
    <div style={{padding:20}}>
      <h1>Dashboard</h1>
      <div className="grid">
        <div className="card"><h3>Category Breakdown</h3><PieChart data={cat} /></div>
        <div className="card"><h3>Monthly Trends</h3><LineChart data={summary.monthly} /></div>
        <div className="card"><h3>Income vs Expense</h3><BarChart data={summary.monthly} /></div>
      </div>
    </div>
  );
}
