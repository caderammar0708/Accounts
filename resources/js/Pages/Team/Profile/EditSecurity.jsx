import React, { useEffect } from 'react';
import { useForm, usePage, Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonInput from '@/Components/CommonInput';

import PrimaryButton from '@/Components/PrimaryButton';
import EmployeeTabs from '@/Components/EmployeeTabs';

const EditSecurityPage= () => {
    const { employee } = usePage().props ;
        
    const { data, setData, put, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    
    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/employees/${employee.id}/security`);
    };

    const handleSendMailRequest = () => {
        if (confirm('Are you sure you want to send a password reset mail request?')) {
            router.post(`/employee/${employee.id}/send-password-reset`);
        }
    };

    return (
<AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Employee Profile</h2>}>
<Head title="Employee Profile" />
<div className="max-w-5xl mx-auto pb-12">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200">
                    <h3 className="text-base font-bold text-white tracking-wide">Modify Staff Profile</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Manage personal profiles, corporate designations, and status logs.</p>
                </div>
                
                <EmployeeTabs employeeId={employee.id} activeTab="security" />
                
                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    <div className="max-w-2xl space-y-6 bg-slate-50/50 p-6 rounded-xl border border-slate-200/60">
                        <div className="border-b border-slate-200 pb-3">
                            <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Account Security</h4>
                            <p className="text-slate-400 text-xs mt-0.5">Change the mobile access password for this employee.</p>
                        </div>

                        <div className="space-y-4">
                            <CommonInput
                                label="New Access Password"
                                type="password"
                                value={data.password}
                                name="password"
                                onChange={(e) => setData(e.target.name, e.target.value)}
                                error={errors.password}
                                placeholder="Minimum 8 characters"
                                required
                            />
                            <CommonInput
                                label="Confirm New Password"
                                type="password"
                                value={data.password_confirmation}
                                name="password_confirmation"
                                onChange={(e) => setData(e.target.name, e.target.value)}
                                placeholder="Re-enter password"
                                required
                            />
                            <p className="text-[11px] text-slate-400 font-medium italic">
                                * Note: The login identifier for mobile secure access matches the primary employee email address.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Link 
                            href="/employee" 
                            className="flex items-center justify-center px-8 py-2.5 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition duration-150 active:scale-[0.98]"
                        >
                            Cancel
                        </Link>
                        <PrimaryButton
                            type="button"
                            variant="secondary"
                            onClick={handleSendMailRequest}
                        >
                            Send Reset Mail
                        </PrimaryButton>
                        <PrimaryButton
                            type="submit"
                            loading={processing}
                            loadingText="Updating..."
                        >
                            Update Password
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
</AuthenticatedLayout>
);
};

export default EditSecurityPage;
