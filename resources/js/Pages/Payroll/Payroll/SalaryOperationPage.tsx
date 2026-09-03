import React, { useState, useEffect } from 'react';
import SalaryRevisionPage from './SalaryRevisionPage';
import AdvanceSalaryPage from '../AdvanceSalary/IndexPage';
import { usePageHeader } from '@/src/App';

const SalaryOperationPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'revisions' | 'advances'>('revisions');
    const { setTitle } = usePageHeader();

    useEffect(() => {
        setTitle('Salary Operations');
    }, [setTitle]);

    return (
        <div className="space-y-6">
            {/* Tab Bar */}
            <div className="flex border-b border-slate-200 bg-white px-6 py-2 rounded-xl shadow-sm border">
                <button 
                    onClick={() => setActiveTab('revisions')}
                    className={`px-5 py-3 text-sm font-bold border-b-2 transition-all duration-150 ${activeTab === 'revisions' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Salary Revisions
                </button>
                <button 
                    onClick={() => setActiveTab('advances')}
                    className={`px-5 py-3 text-sm font-bold border-b-2 transition-all duration-150 ${activeTab === 'advances' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Advance Salaries
                </button>
            </div>

            {/* Tab Content */}
            <div className="mt-4">
                {activeTab === 'revisions' && <SalaryRevisionPage />}
                {activeTab === 'advances' && <AdvanceSalaryPage />}
            </div>
        </div>
    );
};

export default SalaryOperationPage;
