import React from 'react';
import { Link } from '@inertiajs/react';

const EmployeeTabs = ({ employeeId, activeTab }) => {
    return (
        <div className="flex border-b border-slate-200 bg-slate-50/50 overflow-x-auto">
            <Link
                href={route('employees.edit', employeeId)}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                    activeTab === 'general'
                        ? 'border-indigo-600 text-indigo-700 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
            >
                General Info
            </Link>
            <Link
                href={route('employees.attendance.edit', employeeId)}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                    activeTab === 'attendance'
                        ? 'border-indigo-600 text-indigo-700 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
            >
                Attendance Settings
            </Link>
            <Link
                href={route('employees.salary.edit', employeeId)}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                    activeTab === 'salary'
                        ? 'border-indigo-600 text-indigo-700 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
            >
                Salary Structure
            </Link>
            <Link
                href={route('employees.documents.edit', employeeId)}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                    activeTab === 'documents'
                        ? 'border-indigo-600 text-indigo-700 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
            >
                Documents Registry
            </Link>
            <Link
                href={route('employees.security.edit', employeeId)}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                    activeTab === 'security'
                        ? 'border-indigo-600 text-indigo-700 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
            >
                Security Settings
            </Link>
        </div>
    );
};

export default EmployeeTabs;
