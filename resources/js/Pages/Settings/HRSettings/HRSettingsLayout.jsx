import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link, usePage } from '@inertiajs/react';

export default function HRSettingsLayout({ children, activeTab }) {
    const tabs = [
        { name: 'Remote Check-in', key: 'remote-checkin', routeName: 'settings.hr.remote-checkin' },
        { name: 'Leave Notification', key: 'leave-notification', routeName: 'settings.hr.leave-notification' },
        { name: 'Payroll', key: 'payroll', routeName: 'settings.hr.payroll' },
        { name: 'QR Settings', key: 'qr', routeName: 'settings.hr.qr' },
        { name: 'Attendance Location', key: 'attendance-location', routeName: 'settings.hr.attendance-locations.index' },
        { name: 'Shift Configuration', key: 'shift', routeName: 'settings.hr.shifts.index' },
        { name: 'Leave Types', key: 'leave-types', routeName: 'settings.hr.leave-types.index' },
    ];

    return (
        <AuthenticatedLayout header="HR Settings">
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">HR Settings</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Manage HR, attendance, leave, and payroll configurations.</p>
                    </div>
                </div>

                <div className="mb-6 border-b border-gray-200 overflow-x-auto">
                    <nav className="-mb-px flex space-x-6 min-w-max" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <Link
                                key={tab.key}
                                href={route(tab.routeName)}
                                className={`${
                                    activeTab === tab.key
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                {tab.name}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Main Content Area */}
                    <main className="flex-1">
                        <div className="rounded-2xl min-h-[500px]">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
