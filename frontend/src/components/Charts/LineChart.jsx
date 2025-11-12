import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);
export default function LineChart({ data=[] }){
  const labels = (data||[]).map(r=> new Date(r.month).toLocaleString('default',{month:'short',year:'numeric'}));
  const income = (data||[]).map(r=>Number(r.income));
  const expense = (data||[]).map(r=>Number(r.expense));
  return <Line data={{ labels, datasets: [{ label:'Income', data:income }, { label:'Expense', data:expense }] }} />;
}
