import React from 'react';
import { Link } from '@inertiajs/react';

interface Props {
    activeTab: 'profile' | 'leave_mail' | 'payroll' | 'qr' | 'locations';
    onTabChange?: (tab: 'profile' | 'leave_mail' | 'payroll' | 'qr') => void;
}

export const SettingsTabs: React.FC<Props> = ({ activeTab, onTabChange }) => {
    
    const getTabClass = (tabName: string) => {
        return `px-5 py-3 text-sm font-bold border-b-2 transition-all duration-150 whitespace-nowrap ${
            activeTab === tabName 
                ? 'border-slate-900 text-slate-900' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
        }`;
    };

    return (
        <div className="flex overflow-x-auto border-b border-slate-200 bg-white px-6 py-2 rounded-xl shadow-sm border mb-6 no-scrollbar">
            {onTabChange ? (
                <>
                    <button onClick={() => onTabChange('profile')} className={getTabClass('profile')}>Company Profile</button>
                    <button onClick={() => onTabChange('leave_mail')} className={getTabClass('leave_mail')}>Leave Email Settings</button>
                    <button onClick={() => onTabChange('payroll')} className={getTabClass('payroll')}>Payroll Settings</button>
                    <button onClick={() => onTabChange('qr')} className={getTabClass('qr')}>QR Settings</button>
                </>
            ) : (
                <>
                    <Link href="/settings?tab=profile" className={getTabClass('profile')}>Company Profile</Link>
                    <Link href="/settings?tab=leave_mail" className={getTabClass('leave_mail')}>Leave Email Settings</Link>
                    <Link href="/settings?tab=payroll" className={getTabClass('payroll')}>Payroll Settings</Link>
                    <Link href="/settings?tab=qr" className={getTabClass('qr')}>QR Settings</Link>
                </>
            )}
            
            <Link href="/location" className={getTabClass('locations')}>
                Locations
            </Link>
        </div>
    );
};
