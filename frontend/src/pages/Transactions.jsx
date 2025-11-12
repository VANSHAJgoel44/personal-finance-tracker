import React, { useEffect, useState } from 'react';
import api from '../api';
import { FixedSizeList as List } from 'react-window';
export default function Transactions(){
  const [items,setItems]=useState([]),[page,setPage]=useState(1);
  useEffect(()=>{ (async ()=>{ const r = await api.get('/transactions',{ params:{ page, per:100 }}); setItems(r.data); })(); },[page]);
  function Row({ index, style }){ const t = items[index]; if(!t) return <div style={style}></div>; return <div style={style} className="txn-row">{t.date} {t.category} {t.type} ₹{t.amount}</div>; }
  return (
    <div style={{padding:20}}>
      <h2>Transactions</h2>
      <List height={600} itemCount={items.length} itemSize={50} width="100%"><Row/></List>
      <div style={{marginTop:10}}>
        <button onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
        <span style={{margin:10}}>Page {page}</span>
        <button onClick={()=>setPage(p=>p+1)}>Next</button>
      </div>
    </div>
  );
}
