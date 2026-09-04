import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';
import SearchableSelect from '@/Components/SearchableSelect';
import CommonInput from '@/Components/CommonInput';
import EmployeeTabs from '@/Components/EmployeeTabs';

const EditGeneral = ({ auth }) => {
    const { employee, departments, designations, managers } = usePage().props;
    
    const { data, setData, put, processing, errors, isDirty } = useForm({
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
        put(route('employees.update', employee.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            user={auth?.user || {}}
            header={<h2 className="font-bold text-lg text-slate-800 tracking-tight">Edit Employee</h2>}
        >
            <Head title={`Edit Employee - ${employee.name}`} />

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
                            <p className="text-xs text-slate-500 mt-0.5">Manage personal details, employment designations, and organization hierarchy.</p>
                        </div>
                    </div>
                </div>

                <EmployeeTabs employeeId={employee.id} activeTab="general" isDirty={isDirty} />

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800 tracking-tight">General Information</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Primary identification, personal contact, and corporate details.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Basic Identification */}
                            <div className="space-y-5">
                                <div className="border-b border-slate-100 pb-2">
                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Identity & Contact</h4>
                                    <p className="text-slate-400 text-xs mt-0.5">Employee identification and reachability.</p>
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
                                        placeholder="e.g. Alex"
                                    />
                                    <CommonInput
                                        label="Email Address"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        error={errors.email}
                                        placeholder="alex@company.com"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <CommonInput
                                        label="Primary Telephone"
                                        name="phone"
                                        value={data.phone}
                                        onChange={e => setData('phone', e.target.value)}
                                        error={errors.phone}
                                        placeholder="07XXXXXXXX"
                                    />
                                    <CommonInput
                                        label="Secondary Phone (Optional)"
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
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Residential Address</label>
                                    <textarea
                                        className="w-full border border-slate-300 rounded-md shadow-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 text-xs text-slate-800 p-2.5 transition-all placeholder-slate-400 resize-none"
                                        rows="3"
                                        value={data.address}
                                        onChange={e => setData('address', e.target.value)}
                                        placeholder="Enter home address details..."
                                    />
                                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                                </div>
                            </div>

                            {/* Employment Details */}
                            <div className="space-y-5">
                                <div className="border-b border-slate-100 pb-2">
                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Corporate Structure</h4>
                                    <p className="text-slate-400 text-xs mt-0.5">Department hierarchy and employment terms.</p>
                                </div>

                                <SearchableSelect
                                    label="Associated Department"
                                    name="department"
                                    value={data.department}
                                    onChange={val => setData('department', val)}
                                    options={departments}
                                    error={errors.department}
                                    allowCustom={true}
                                    placeholder="Select or enter department..."
                                />

                                <SearchableSelect
                                    label="Corporate Designation"
                                    name="designation"
                                    value={data.designation}
                                    onChange={val => setData('designation', val)}
                                    options={designations}
                                    error={errors.designation}
                                    allowCustom={true}
                                    placeholder="Select or enter designation..."
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

                                <div className="flex items-center justify-between p-4 bg-slate-50/60 rounded-lg border border-slate-100">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-800">Managerial Role</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Mark this employee as a manager for reporting approvals.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer scale-90 shrink-0 ml-4">
                                        <input
                                            type="checkbox"
                                            checked={data.is_manager}
                                            onChange={e => setData('is_manager', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
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
