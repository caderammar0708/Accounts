import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';
import SearchableSelect from '@/Components/SearchableSelect';
import EmployeeTabs from '@/Components/EmployeeTabs';

const EditAttendance = ({ auth }) => {
    const { employee, shifts } = usePage().props;
    
    const { data, setData, put, processing, errors } = useForm({
        shift_id: employee?.shift_id || '',
        is_auto_attendance: employee?.is_auto_attendance || false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Since jbooks-client uses a single update method, we send only the relevant fields
        put(route('employees.update', employee.id));
    };

    return (
        <AuthenticatedLayout
            user={auth?.user || {}}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Edit Employee: {employee.name}</h2>
                    <Link href={route('employees.index')} className="text-sm text-indigo-600 hover:text-indigo-900 font-medium">
                        &larr; Back to Directory
                    </Link>
                </div>
            }
        >
            <Head title={`Edit Attendance - ${employee.name}`} />

            <div className="py-8 max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                    
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200">
                        <h3 className="text-base font-bold text-white tracking-wide">Modify Employee Profile</h3>
                        <p className="text-slate-400 text-xs mt-0.5">Manage personal profiles, corporate designations, and status logs.</p>
                    </div>
                    
                    <EmployeeTabs employeeId={employee.id} activeTab="attendance" />
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                        <div className="max-w-2xl space-y-6 bg-slate-50/50 p-6 rounded-xl border border-slate-200/60">
                            <div className="border-b border-slate-200 pb-3">
                                <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Attendance Settings</h4>
                                <p className="text-slate-400 text-xs mt-0.5">Configure shifts and check-in methods for this staff member.</p>
                            </div>

                            <SearchableSelect
                                label="Assigned Shift (Optional)"
                                name="shift_id"
                                value={data.shift_id}
                                onChange={val => setData('shift_id', val)}
                                options={shifts}
                                error={errors.shift_id}
                            />

                            <div className="flex items-center space-x-3 pt-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.is_auto_attendance}
                                        onChange={e => setData('is_auto_attendance', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    <span className="ml-3 text-sm font-bold text-slate-700 select-none">
                                        Enable Auto Check-in/Check-out on Shift Time
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                            <Link 
                                href={route('employees.index')} 
                                className="flex items-center justify-center px-8 py-2.5 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition duration-150 active:scale-[0.98]"
                            >
                                Cancel
                            </Link>
                            <CommonButton
                                type="submit"
                                disabled={processing}
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
