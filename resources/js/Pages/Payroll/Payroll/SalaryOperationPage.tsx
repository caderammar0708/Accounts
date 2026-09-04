import React, { useState } from 'react';
import { usePage, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SalaryRevisionPage from './SalaryRevisionPage';
import AdvanceSalaryPage from '../AdvanceSalary/IndexPage';

const SalaryOperationPage: React.FC = () => {
    const { auth } = usePage().props as any;
    const [activeTab, setActiveTab] = useState<'revisions' | 'advances'>('revisions');

    return (
        <AuthenticatedLayout
            user={auth?.user || {}}
            header={<h2 className="font-bold text-lg text-slate-800 tracking-tight">Salary Operations</h2>}
        >
            <Head title="Salary Operations" />

            <div className="p-6 max-w-7xl mx-auto space-y-6">
                {/* Tab Bar */}
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Salary Operations Tabs">
                        <button 
                            onClick={() => setActiveTab('revisions')}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                                activeTab === 'revisions'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            Salary Revisions
                        </button>
                        <button 
                            onClick={() => setActiveTab('advances')}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                                activeTab === 'advances'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            Advance Salaries
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'revisions' && <SalaryRevisionPage />}
                    {activeTab === 'advances' && <AdvanceSalaryPage isEmbedded={true} />}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default SalaryOperationPage;
