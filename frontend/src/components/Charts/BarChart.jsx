import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
export default function BarChart({ data=[] }){
  const labels = (data||[]).map(r=> new Date(r.month).toLocaleString('default',{month:'short'}));
  const income = (data||[]).map(r=>Number(r.income));
  const expense = (data||[]).map(r=>Number(r.expense));
  return <Bar data={{ labels, datasets:[{ label:'Income', data:income }, { label:'Expense', data:expense }] }} />;
}
