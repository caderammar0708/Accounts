import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';
import SearchableSelect from '@/Components/SearchableSelect';
import EmployeeTabs from '@/Components/EmployeeTabs';

const EditAttendance = ({ auth }) => {
    const { employee, shifts } = usePage().props;
    
    const { data, setData, put, processing, errors, isDirty } = useForm({
        shift_id: employee?.shift_id || '',
        is_auto_attendance: !!employee?.is_auto_attendance,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('employees.attendance.update', employee.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            user={auth?.user || {}}
            header={<h2 className="font-bold text-lg text-slate-800 tracking-tight">Edit Employee</h2>}
        >
            <Head title={`Edit Attendance - ${employee.name}`} />

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
                            <p className="text-xs text-slate-500 mt-0.5">Configure shifts, check-in rules, and automated attendance policies.</p>
                        </div>
                    </div>
                </div>

                <EmployeeTabs employeeId={employee.id} activeTab="attendance" isDirty={isDirty} />

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Attendance Settings</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Assign regular shifts and enable automated timekeeping rules.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-2xl">
                        <div className="space-y-4">
                            <SearchableSelect
                                label="Assigned Shift"
                                name="shift_id"
                                value={data.shift_id}
                                onChange={val => setData('shift_id', val)}
                                options={shifts}
                                placeholder="Select Shift (Default / Flexible)"
                                error={errors.shift_id}
                            />

                            <div className="flex items-center justify-between p-4 bg-slate-50/60 rounded-lg border border-slate-100">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800">Automated Attendance</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Automatically mark check-in and check-out based on scheduled shift hours.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer scale-90 shrink-0 ml-4">
                                    <input
                                        type="checkbox"
                                        checked={data.is_auto_attendance}
                                        onChange={e => setData('is_auto_attendance', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
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
                            >
                                {processing ? 'Updating...' : 'Update Attendance'}
                            </CommonButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default EditAttendance;
