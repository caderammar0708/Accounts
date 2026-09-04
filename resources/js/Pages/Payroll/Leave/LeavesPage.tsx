import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import LeaveRequestsPage from './Requests/IndexPage';
import LeaveBalancesPage from './Balances/IndexPage';

const LeavesPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'requests' | 'balances'>('requests');

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-bold text-lg text-slate-800 tracking-tight">
                    Leaves Management
                </h2>
            }
        >
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    {/* Tab Navigation */}
                    <div className="border-b border-slate-200">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('requests')}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                                    activeTab === 'requests'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                Leave Requests
                            </button>
                            <button
                                onClick={() => setActiveTab('balances')}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                                    activeTab === 'balances'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                Leave Balances
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div>
                        {activeTab === 'requests' && <LeaveRequestsPage isEmbedded={true} />}
                        {activeTab === 'balances' && <LeaveBalancesPage isEmbedded={true} />}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default LeavesPage;

