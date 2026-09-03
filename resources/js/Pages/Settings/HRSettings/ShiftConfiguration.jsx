import React from 'react';
import HRSettingsLayout from './HRSettingsLayout';

export default function ShiftConfiguration() {
    return (
        <HRSettingsLayout activeTab="shift">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Shift Configuration</h2>
                <p className="text-sm text-slate-500">Settings for shift configuration will be merged here.</p>
            </div>
        </HRSettingsLayout>
    );
}
