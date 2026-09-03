import React from 'react';
import HRSettingsLayout from './HRSettingsLayout';

export default function AttendanceLocation() {
    return (
        <HRSettingsLayout activeTab="attendance-location">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Attendance Location</h2>
                <p className="text-sm text-slate-500">Settings for attendance location will be merged here.</p>
            </div>
        </HRSettingsLayout>
    );
}
