import { useForm, Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CommonInput from "@/Components/CommonInput";
import SearchableSelect from "@/Components/SearchableSelect";
import CommonButton from "@/Components/CommonButton";
import { useState } from "react";

export default function EmployeeForm({ departments = [], designations = [], shifts = [] }) {
    const [activeTab, setActiveTab] = useState('basic');

    const { data, setData, post, processing, errors } = useForm({
        name: "",
        calling_name: "",
        email: "",
        phone: "",
        mobile: "",
        nic: "",
        dob: "",
        department: "",
        designation: "",
        employment_type: "",
        salary: "",
        salary_type: "Fixed",
        hours_per_day: "",
        sales_commission_rate: "",
        join_date: "",
        left_date: "",
        shift_id: "",
        is_field_staff: false,
        is_manager: false,
        is_auto_attendance: false,
        probation_duration_months: "",
        probation_status: "probation",
        probation_confirmed_date: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("employees.store"));
    };

    return (
        <AuthenticatedLayout>
            <Head title="New Employee" />
            <div className="max-w-4xl mx-auto py-10 px-6">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">New Employee</h2>
                            <p className="text-sm text-slate-500 mt-1 font-medium">Register a new employee and create their system account.</p>
                        </div>
                    </div>
                    
                    <div className="flex border-b border-slate-200">
                        <button type="button" onClick={() => setActiveTab('basic')} className={`px-6 py-4 text-sm font-bold border-b-2 ${activeTab === 'basic' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Basic Details</button>
                        <button type="button" onClick={() => setActiveTab('hr')} className={`px-6 py-4 text-sm font-bold border-b-2 ${activeTab === 'hr' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>HR & Payroll</button>
                        <button type="button" onClick={() => setActiveTab('more')} className={`px-6 py-4 text-sm font-bold border-b-2 ${activeTab === 'more' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>More Info</button>
                    </div>

                    <form onSubmit={submit} className="p-8 space-y-6 min-h-[400px]">
                        
                        {activeTab === 'basic' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <CommonInput label="Full Name" value={data.name} onChange={e => setData('name', e.target.value)} required error={errors.name} placeholder="e.g. John Doe" />
                                    <CommonInput label="Calling Name" value={data.calling_name} onChange={e => setData('calling_name', e.target.value)} error={errors.calling_name} placeholder="e.g. John" />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <CommonInput label="Email Address" type="email" value={data.email} onChange={e => setData('email', e.target.value)} required error={errors.email} placeholder="john@example.com" />
                                    <CommonInput label="NIC" value={data.nic} onChange={e => setData('nic', e.target.value)} error={errors.nic} />
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <CommonInput label="Phone" type="text" value={data.phone} onChange={e => setData('phone', e.target.value)} error={errors.phone} />
                                    <CommonInput label="Mobile" type="text" value={data.mobile} onChange={e => setData('mobile', e.target.value)} error={errors.mobile} />
                                    <CommonInput label="Date of Birth" type="date" value={data.dob} onChange={e => setData('dob', e.target.value)} error={errors.dob} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'hr' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <SearchableSelect 
                                        label="Department" 
                                        placeholder="Select or type a department..."
                                        value={data.department} 
                                        onChange={(val) => setData('department', val)} 
                                        options={departments}
                                        allowCustom={true}
                                        error={errors.department}
                                    />
                                    <SearchableSelect 
                                        label="Designation" 
                                        placeholder="Select or type a designation..."
                                        value={data.designation} 
                                        onChange={(val) => setData('designation', val)} 
                                        options={designations}
                                        allowCustom={true}
                                        required
                                        error={errors.designation}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <CommonInput label="Employment Type" value={data.employment_type} onChange={e => setData('employment_type', e.target.value)} error={errors.employment_type} placeholder="Full-time, Part-time, etc." />
                                    <CommonInput type="select" label="Salary Type" value={data.salary_type} onChange={e => setData('salary_type', e.target.value)} options={[{ label: 'Fixed', value: 'Fixed' }, { label: 'Hourly', value: 'Hourly' }]} error={errors.salary_type} />
                                    <CommonInput label="Salary Amount" type="number" value={data.salary} onChange={e => setData('salary', e.target.value)} error={errors.salary} placeholder="0.00" />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <CommonInput label="Hours per Day" type="number" step="0.1" value={data.hours_per_day} onChange={e => setData('hours_per_day', e.target.value)} error={errors.hours_per_day} />
                                    <CommonInput label="Sales Comm. Rate (%)" type="number" step="0.01" value={data.sales_commission_rate} onChange={e => setData('sales_commission_rate', e.target.value)} error={errors.sales_commission_rate} />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <SearchableSelect 
                                        label="Work Shift" 
                                        placeholder="Select a shift..."
                                        value={data.shift_id} 
                                        onChange={(val) => setData('shift_id', val)} 
                                        options={shifts}
                                        error={errors.shift_id}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <CommonInput label="Join Date" type="date" value={data.join_date} onChange={e => setData('join_date', e.target.value)} error={errors.join_date} />
                                    <CommonInput label="Left Date" type="date" value={data.left_date} onChange={e => setData('left_date', e.target.value)} error={errors.left_date} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'more' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-6">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={data.is_manager} onChange={e => setData('is_manager', e.target.checked)} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                        <span className="text-sm font-medium text-slate-700">Is Manager</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={data.is_field_staff} onChange={e => setData('is_field_staff', e.target.checked)} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                        <span className="text-sm font-medium text-slate-700">Field Staff</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={data.is_auto_attendance} onChange={e => setData('is_auto_attendance', e.target.checked)} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                        <span className="text-sm font-medium text-slate-700">Auto Attendance</span>
                                    </label>
                                </div>
                                
                                <div className="border-t border-slate-100 pt-6 mt-6">
                                    <h3 className="text-sm font-bold text-slate-900 mb-4">Probation Settings</h3>
                                    <div className="grid grid-cols-3 gap-6">
                                        <CommonInput label="Duration (Months)" type="number" value={data.probation_duration_months} onChange={e => setData('probation_duration_months', e.target.value)} error={errors.probation_duration_months} />
                                        <CommonInput type="select" label="Status" value={data.probation_status} onChange={e => setData('probation_status', e.target.value)} options={[{ label: 'Probation', value: 'probation' }, { label: 'Confirmed', value: 'confirmed' }]} error={errors.probation_status} />
                                        <CommonInput label="Confirmed Date" type="date" value={data.probation_confirmed_date} onChange={e => setData('probation_confirmed_date', e.target.value)} error={errors.probation_confirmed_date} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-6 border-t border-slate-100 flex justify-between gap-4">
                            <div>
                                {Object.keys(errors).length > 0 && (
                                    <span className="text-sm text-red-500 font-bold">Please check all tabs for errors.</span>
                                )}
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => window.history.back()}
                                    className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <CommonButton
                                    variant="primary"
                                    type="submit"
                                    processing={processing}
                                >
                                    {processing ? "Saving..." : "Save Employee"}
                                </CommonButton>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
