import React from 'react';
import { Link } from '@inertiajs/react';

interface StaffTabsProps {
    staffId: number;
    activeTab: 'general' | 'attendance' | 'salary' | 'documents' | 'security';
}

const StaffTabs: React.FC<StaffTabsProps> = ({ staffId, activeTab }) => {
    return (
        <div className="flex border-b border-slate-200 bg-slate-50/50 overflow-x-auto">
            <Link
                href={`/staff/${staffId}/edit`}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                    activeTab === 'general'
                        ? 'border-teal-600 text-teal-700 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
            >
                General Info
            </Link>
            <Link
                href={`/staff/${staffId}/attendance`}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                    activeTab === 'attendance'
                        ? 'border-teal-600 text-teal-700 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
            >
                Attendance Settings
            </Link>
            <Link
                href={`/staff/${staffId}/salary`}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                    activeTab === 'salary'
                        ? 'border-teal-600 text-teal-700 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
            >
                Salary Structure
            </Link>
            <Link
                href={`/staff/${staffId}/documents`}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                    activeTab === 'documents'
                        ? 'border-teal-600 text-teal-700 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
            >
                Documents Registry
            </Link>
            <Link
                href={`/staff/${staffId}/security`}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                    activeTab === 'security'
                        ? 'border-teal-600 text-teal-700 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
            >
                Security Settings
            </Link>
        </div>
    );
};

export default StaffTabs;
