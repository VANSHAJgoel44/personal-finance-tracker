import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend);
export default function PieChart({ data=[] }){
  const labels = data.map(d=>d.category);
  const values = data.map(d=>d.total);
  return <Pie data={{ labels, datasets:[{ data: values }] }} />;
}
