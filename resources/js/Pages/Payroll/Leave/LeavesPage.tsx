import React, { useState, useEffect } from 'react';
import LeaveRequestsPage from './Requests/IndexPage';
import LeaveBalancesPage from './Balances/IndexPage';
import { usePageHeader } from '@/src/App';

const LeavesPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'requests' | 'balances'>('requests');
    const { setTitle } = usePageHeader();

    useEffect(() => {
        setTitle('Leaves Management');
    }, [setTitle]);

    return (
        <div className="space-y-6">
            {/* Tab Bar */}
            <div className="flex border-b border-slate-200 bg-white px-6 py-2 rounded-xl shadow-sm border">
                <button 
                    onClick={() => setActiveTab('requests')}
                    className={`px-5 py-3 text-sm font-bold border-b-2 transition-all duration-150 ${activeTab === 'requests' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Leave Requests
                </button>
                <button 
                    onClick={() => setActiveTab('balances')}
                    className={`px-5 py-3 text-sm font-bold border-b-2 transition-all duration-150 ${activeTab === 'balances' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Leave Balances
                </button>
            </div>

            {/* Tab Content */}
            <div className="mt-4">
                {activeTab === 'requests' && <LeaveRequestsPage />}
                {activeTab === 'balances' && <LeaveBalancesPage />}
            </div>
        </div>
    );
};

export default LeavesPage;
