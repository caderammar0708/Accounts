import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link, Head } from '@inertiajs/react';

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
        <AuthenticatedLayout header={<h2 className="font-bold text-lg text-slate-800 tracking-tight">HR Settings</h2>}>
            <Head title="HR Settings" />
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">HR Settings</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Manage HR, attendance, leave, and payroll configurations.</p>
                </div>

                <div className="border-b border-slate-200 overflow-x-auto overflow-y-hidden no-scrollbar [&::-webkit-scrollbar]:hidden">
                    <nav className="-mb-px flex space-x-8 min-w-max pb-0.5" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <Link
                                key={tab.key}
                                href={route(tab.routeName)}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                                    activeTab === tab.key
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                {tab.name}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="min-h-[500px]">
                    {children}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
