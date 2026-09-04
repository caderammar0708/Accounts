import React from 'react';
import { Link } from '@inertiajs/react';

const EmployeeTabs = ({ employeeId, activeTab, isDirty = false }) => {
    const tabs = [
        { key: 'general', name: 'General Info', href: route('employees.edit', employeeId) },
        { key: 'attendance', name: 'Attendance Settings', href: route('employees.attendance.edit', employeeId) },
        { key: 'salary', name: 'Salary Structure', href: route('employees.salary.edit', employeeId) },
        { key: 'documents', name: 'Documents Registry', href: route('employees.documents.edit', employeeId) },
        { key: 'security', name: 'Security Settings', href: route('employees.security.edit', employeeId) },
    ];

    const handleClick = (e, tabKey) => {
        if (tabKey === activeTab) {
            e.preventDefault();
            return;
        }
        if (isDirty) {
            const confirmLeave = window.confirm('You have unsaved changes on this tab. Are you sure you want to discard them and switch tabs?');
            if (!confirmLeave) {
                e.preventDefault();
            }
        }
    };

    return (
        <div className="border-b border-slate-200 overflow-x-auto overflow-y-hidden no-scrollbar [&::-webkit-scrollbar]:hidden">
            <nav className="-mb-px flex space-x-8 min-w-max pb-0.5" aria-label="Employee Profile Tabs">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <Link
                            key={tab.key}
                            href={tab.href}
                            onClick={(e) => handleClick(e, tab.key)}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                                isActive
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            {tab.name}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default EmployeeTabs;
