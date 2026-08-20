import { useForm, Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CommonInput from "@/Components/CommonInput";
import SearchableSelect from "@/Components/SearchableSelect";
import CommonButton from "@/Components/CommonButton";
import { useState, useEffect } from "react";
import axios from "axios";

export default function EmployeeForm() {
    const [designationOptions, setDesignationOptions] = useState([]);

    const fetchDesignations = () => {
        axios.get(route('api.designations'))
            .then(res => setDesignationOptions(res.data || []))
            .catch(err => console.error("Error fetching designations", err));
    };

    useEffect(() => {
        fetchDesignations();
    }, []);

    const { data, setData, post, processing, errors } = useForm({
        name: "",
        email: "",
        designation: "",
        salary: "",
        salary_type: "Fixed",
        hours_per_day: "",
        sales_commission_rate: "",
        join_date: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("employees.store"));
    };

    return (
        <AuthenticatedLayout>
            <Head title="New Employee" />
            <div className="max-w-2xl mx-auto py-10 px-6">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">New Employee</h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Register a new employee and create their system account.</p>
                    </div>
                    
                    <form onSubmit={submit} className="p-8 space-y-6">
                        <CommonInput 
                            label="Full Name" 
                            value={data.name} 
                            onChange={e => setData('name', e.target.value)} 
                            required
                            error={errors.name}
                            placeholder="e.g. John Doe"
                        />
                        <CommonInput 
                            label="Email Address" 
                            type="email"
                            value={data.email} 
                            onChange={e => setData('email', e.target.value)} 
                            required
                            error={errors.email}
                            placeholder="john@example.com"
                        />
                        <SearchableSelect 
                            label="Designation" 
                            placeholder="Select or type a designation..."
                            value={data.designation} 
                            onChange={(val) => setData('designation', val)} 
                            options={designationOptions}
                            allowCustom={true}
                            required
                            error={errors.designation}
                        />
                        <div className="grid grid-cols-2 gap-6">
                            <CommonInput
                                type="select"
                                label="Salary Type"
                                value={data.salary_type}
                                onChange={e => setData('salary_type', e.target.value)}
                                options={[
                                    { label: 'Fixed', value: 'Fixed' },
                                    { label: 'Hourly', value: 'Hourly' }
                                ]}
                                error={errors.salary_type}
                            />
                            <CommonInput 
                                label="Salary Amount" 
                                type="number"
                                value={data.salary} 
                                onChange={e => setData('salary', e.target.value)} 
                                error={errors.salary}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <CommonInput
                                label="Hours per Day"
                                type="number"
                                step="0.1"
                                value={data.hours_per_day}
                                onChange={e => setData('hours_per_day', e.target.value)}
                                error={errors.hours_per_day}
                            />
                            <CommonInput
                                label="Sales Comm. Rate (%)"
                                type="number"
                                step="0.01"
                                value={data.sales_commission_rate}
                                onChange={e => setData('sales_commission_rate', e.target.value)}
                                error={errors.sales_commission_rate}
                            />
                        </div>
                        <CommonInput 
                            label="Join Date" 
                            type="date"
                            value={data.join_date} 
                            onChange={e => setData('join_date', e.target.value)} 
                            error={errors.join_date}
                        />
                        

                        <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
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
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
