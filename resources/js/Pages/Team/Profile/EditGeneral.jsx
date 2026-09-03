import React, { useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';
import SearchableSelect from '@/Components/SearchableSelect';
import CommonInput from '@/Components/CommonInput';
import EmployeeTabs from '@/Components/EmployeeTabs';

const EditGeneral = ({ auth }) => {
    const { employee, departments, designations, managers } = usePage().props;
    
    const { data, setData, put, processing, errors } = useForm({
        name: employee?.name || '',
        email: employee?.email || '',
        phone: employee?.phone || '',
        mobile: employee?.mobile || '',
        calling_name: employee?.calling_name || '',
        nic: employee?.nic || '',
        dob: employee?.dob || '',
        address: employee?.address || '',
        department: employee?.department || '',
        designation: employee?.designation || '',
        employment_type: employee?.employment_type || 'Active',
        manager_ids: employee?.manager_ids || [],
        is_manager: employee?.is_manager || false,
        join_date: employee?.join_date || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
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
            <Head title={`Edit Employee - ${employee.name}`} />

            <div className="py-8 max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                    
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200">
                        <h3 className="text-base font-bold text-white tracking-wide">Modify Employee Profile</h3>
                        <p className="text-slate-400 text-xs mt-0.5">Manage personal profiles, corporate designations, and status logs.</p>
                    </div>
                    
                    <EmployeeTabs employeeId={employee.id} activeTab="general" />
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Basic Information */}
                            <div className="space-y-6">
                                <div className="border-b border-slate-100 pb-3">
                                    <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase">General Details</h4>
                                    <p className="text-slate-400 text-xs mt-0.5">Primary identification and contact information.</p>
                                </div>

                                <CommonInput
                                    label="Full Name"
                                    name="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    error={errors.name}
                                    required
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <CommonInput
                                        label="Calling Name"
                                        name="calling_name"
                                        value={data.calling_name}
                                        onChange={e => setData('calling_name', e.target.value)}
                                        error={errors.calling_name}
                                    />
                                    <CommonInput
                                        label="Email Address"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        error={errors.email}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <CommonInput
                                        label="Primary Telephone"
                                        name="phone"
                                        value={data.phone}
                                        onChange={e => setData('phone', e.target.value)}
                                        error={errors.phone}
                                        required
                                        placeholder="07XXXXXXXX"
                                    />
                                    <CommonInput
                                        label="Secondary Tel (Optional)"
                                        name="mobile"
                                        value={data.mobile}
                                        onChange={e => setData('mobile', e.target.value)}
                                        error={errors.mobile}
                                        placeholder="07XXXXXXXX"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <CommonInput
                                        label="NIC Number"
                                        name="nic"
                                        value={data.nic}
                                        onChange={e => setData('nic', e.target.value)}
                                        error={errors.nic}
                                        placeholder="e.g. 199XXXXXXXXV"
                                    />
                                    <CommonInput
                                        label="Date of Birth"
                                        type="date"
                                        name="dob"
                                        value={data.dob}
                                        onChange={e => setData('dob', e.target.value)}
                                        error={errors.dob}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2">Residential Address</label>
                                    <textarea
                                        className="w-full border-slate-200 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm resize-none"
                                        rows="3"
                                        value={data.address}
                                        onChange={e => setData('address', e.target.value)}
                                        placeholder="Enter home address details..."
                                    />
                                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                                </div>
                            </div>

                            {/* Employment Details */}
                            <div className="space-y-6">
                                <div className="border-b border-slate-100 pb-3">
                                    <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Employment Details</h4>
                                    <p className="text-slate-400 text-xs mt-0.5">Corporate hierarchy mapping and status logs.</p>
                                </div>

                                <SearchableSelect
                                    label="Associated Department"
                                    name="department"
                                    value={data.department}
                                    onChange={val => setData('department', val)}
                                    options={departments}
                                    error={errors.department}
                                />

                                <SearchableSelect
                                    label="Corporate Designation"
                                    name="designation"
                                    value={data.designation}
                                    onChange={val => setData('designation', val)}
                                    options={designations}
                                    error={errors.designation}
                                    required
                                />

                                <SearchableSelect
                                    label="Employment Status"
                                    name="employment_type"
                                    value={data.employment_type}
                                    onChange={val => setData('employment_type', val)}
                                    options={[
                                        { value: 'Active', label: 'Active' },
                                        { value: 'Resigned', label: 'Resigned' },
                                        { value: 'Terminated', label: 'Terminated' },
                                        { value: 'On Leave', label: 'On Leave' },
                                    ]}
                                    error={errors.employment_type}
                                    required
                                />

                                <SearchableSelect
                                    label="Reporting Manager(s)"
                                    name="manager_ids"
                                    multiple
                                    value={data.manager_ids}
                                    onChange={val => setData('manager_ids', val)}
                                    options={managers}
                                    placeholder="Select Reporting Managers"
                                    error={errors.manager_ids}
                                />

                                <div className="flex items-center space-x-3 pt-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.is_manager}
                                            onChange={e => setData('is_manager', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        <span className="ml-3 text-sm font-bold text-slate-700 select-none">
                                            This employee is a Manager
                                        </span>
                                    </label>
                                </div>

                                <CommonInput
                                    label="Join Date"
                                    type="date"
                                    name="join_date"
                                    value={data.join_date}
                                    onChange={e => setData('join_date', e.target.value)}
                                    error={errors.join_date}
                                />
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
                                {processing ? 'Updating...' : 'Update General Info'}
                            </CommonButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default EditGeneral;
