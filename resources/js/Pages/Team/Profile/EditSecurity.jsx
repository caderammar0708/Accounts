import React, { useState } from 'react';
import { useForm, usePage, Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonInput from '@/Components/CommonInput';
import CommonButton from '@/Components/CommonButton';
import EmployeeTabs from '@/Components/EmployeeTabs';

const EditSecurityPage = ({ auth }) => {
    const { employee } = usePage().props;
    const [isSendingReset, setIsSendingReset] = useState(false);
        
    const { data, setData, put, processing, errors, reset, isDirty } = useForm({
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('employees.security.update', employee.id), {
            onSuccess: () => reset(),
            preserveScroll: true,
        });
    };

    const handleSendMailRequest = () => {
        if (!employee.email) {
            alert('This employee does not have an email address configured. Please set an email in the General Info tab first.');
            return;
        }

        if (confirm(`Send password reset instructions to ${employee.email}?`)) {
            setIsSendingReset(true);
            router.post(route('employees.security.send-reset', employee.id), {}, {
                onFinish: () => setIsSendingReset(false),
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout
            user={auth?.user || {}}
            header={<h2 className="font-bold text-lg text-slate-800 tracking-tight">Edit Employee</h2>}
        >
            <Head title={`Edit Security - ${employee.name}`} />

            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div>
                    <div className="mb-3">
                        <Link 
                            href={route('employees.index')} 
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-wider"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Employees
                        </Link>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edit Employee: {employee.name}</h1>
                            <p className="text-xs text-slate-500 mt-0.5">Manage portal credentials and password recovery options.</p>
                        </div>
                    </div>
                </div>

                <EmployeeTabs employeeId={employee.id} activeTab="security" isDirty={isDirty} />

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Access Credentials & Security</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Set a new access password or trigger an email password reset link.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-xl">
                        <div className="space-y-4">
                            <CommonInput
                                label="New Password"
                                type="password"
                                value={data.password}
                                name="password"
                                onChange={(e) => setData('password', e.target.value)}
                                error={errors.password}
                                placeholder="Enter at least 4 characters"
                                required
                            />

                            <CommonInput
                                label="Confirm New Password"
                                type="password"
                                value={data.password_confirmation}
                                name="password_confirmation"
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="Re-type password"
                                required
                            />

                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 text-[11px] text-slate-500 space-y-1">
                                <p className="font-semibold text-slate-700">Account Information:</p>
                                <p>
                                    Associated Email: <span className="font-mono text-slate-800 font-bold">{employee.email || 'None configured'}</span>
                                </p>
                                <p className="text-[10px] text-slate-400">
                                    This email is used as the primary login identifier for mobile and web self-service portals.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                            <CommonButton 
                                type="button"
                                variant="secondary" 
                                onClick={handleSendMailRequest}
                                disabled={isSendingReset || !employee.email}
                                processing={isSendingReset}
                            >
                                Send Reset Email
                            </CommonButton>

                            <div className="flex items-center gap-3">
                                <CommonButton 
                                    variant="secondary" 
                                    href={route('employees.index')}
                                >
                                    Cancel
                                </CommonButton>
                                <CommonButton
                                    type="submit"
                                    variant="primary"
                                    processing={processing}
                                    disabled={!data.password || processing}
                                >
                                    {processing ? 'Updating...' : 'Update Password'}
                                </CommonButton>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default EditSecurityPage;
