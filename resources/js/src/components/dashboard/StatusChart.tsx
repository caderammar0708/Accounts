import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Candidate, CandidateStatus } from '@/src/types';

interface StatusChartProps {
    data: { name: string, count: number }[];
}

const StatusChart: React.FC<StatusChartProps> = ({ data }) => {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm" style={{ height: '28rem' }}>
            <h3 className="text-base font-bold text-slate-800 mb-4 tracking-wide">Active Staff by Department</h3>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
                    <Legend />
                    <Bar dataKey="count" fill="#0d9488" name="Active Staff Count" radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default StatusChart;