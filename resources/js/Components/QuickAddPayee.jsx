import { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import SlideOver from './SlideOver';
import CommonInput from './CommonInput';
import SearchableSelect from './SearchableSelect';
import CommonButton from './CommonButton';
import axios from 'axios';

export default function QuickAddPayee({ isOpen, onClose, onSuccess, initialType = 'customer', hideEmployeeTab = false, initialName = '' }) {
    const [type, setType] = useState(initialType);
    const [designationOptions, setDesignationOptions] = useState([]);

    const fetchDesignations = () => {
        axios.get(route('api.designations'))
            .then(res => setDesignationOptions(res.data || []))
            .catch(err => console.error("Error fetching designations", err));
    };

    useEffect(() => {
        if (isOpen) {
            setType(initialType);
            reset();
            if (initialName) {
                setData(prev => ({
                    ...prev,
                    display_name: initialName,
                    name: initialName,
                }));
            }
            fetchDesignations();
        }
    }, [isOpen, initialType, initialName]);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        // Common fields
        display_name: "",
        name: "",
        email: "",
        phone_number: "",
        company_name: "",
        // Employee specific
        designation: "",
        salary: "",
        join_date: new Date().toISOString().split('T')[0],
        employee_id: "EMP-" + Math.floor(1000 + Math.random() * 9000),
        // Customer specific
        first_name: "",
        last_name: "",
    });

    const handleTypeChange = (newType) => {
        setType(newType);
        clearErrors();
    };

    const submit = (e) => {
        e.preventDefault();
        
        let url = "";
        let flashKey = "";
        
        if (type === 'customer') {
            url = route("customers.store");
            flashKey = "new_customer";
        } else if (type === 'supplier') {
            url = route("suppliers.store");
            flashKey = "new_supplier";
        } else {
            url = route("employees.store");
            flashKey = "new_employee";
        }

        // Map data based on type if needed
        const payload = { ...data };
        if (type === 'employee') {
            payload.name = data.display_name || data.name;
        } else {
            payload.display_name = data.display_name || data.name;
        }

        post(url, {
            onSuccess: (page) => {
                const newEntity = page.props.flash?.[flashKey];
                onSuccess && onSuccess(newEntity);
                onClose();
                reset();
            },
        });
    };

    const title = type === 'customer' ? "Add New Customer" : (type === 'supplier' ? "Add New Supplier" : "Add New Employee");

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title={title}
        >
            <div className="mb-8 flex p-1 bg-slate-100 rounded-lg">
                <button
                    type="button"
                    onClick={() => handleTypeChange('customer')}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${type === 'customer' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Customer
                </button>
                <button
                    type="button"
                    onClick={() => handleTypeChange('supplier')}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${type === 'supplier' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Supplier
                </button>
                {!hideEmployeeTab && (
                    <button
                        type="button"
                        onClick={() => handleTypeChange('employee')}
                        className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${type === 'employee' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Employee
                    </button>
                )}
            </div>

            <form onSubmit={submit} className="space-y-6">
                <CommonInput
                    label={type === 'employee' ? "Full Name" : "Display Name"}
                    value={data.display_name || data.name}
                    onChange={(e) => {
                        setData(type === 'employee' ? "name" : "display_name", e.target.value);
                        if (type !== 'employee') setData("display_name", e.target.value);
                        else setData("name", e.target.value);
                    }}
                    error={type === 'employee' ? errors.name : errors.display_name}
                    required
                />
                
                {type === 'customer' && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <CommonInput
                            label="First Name"
                            value={data.first_name}
                            onChange={(e) => setData("first_name", e.target.value)}
                            error={errors.first_name}
                        />
                        <CommonInput
                            label="Last Name"
                            value={data.last_name}
                            onChange={(e) => setData("last_name", e.target.value)}
                            error={errors.last_name}
                        />
                    </div>
                )}

                {(type === 'customer' || type === 'supplier') && (
                    <CommonInput
                        label="Company Name"
                        value={data.company_name}
                        onChange={(e) => setData("company_name", e.target.value)}
                        error={errors.company_name}
                        className="animate-in fade-in slide-in-from-top-2 duration-300"
                    />
                )}

                {type === 'employee' && (
                    <>
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <SearchableSelect
                                label="Designation"
                                placeholder="Select or type designation..."
                                value={data.designation}
                                onChange={(val) => setData("designation", val)}
                                options={designationOptions}
                                allowCustom={true}
                                error={errors.designation}
                            />
                            <CommonInput
                                label="Employee ID"
                                value={data.employee_id}
                                onChange={(e) => setData("employee_id", e.target.value)}
                                error={errors.employee_id}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <CommonInput
                                label="Joining Date"
                                type="date"
                                value={data.join_date}
                                onChange={(e) => setData("join_date", e.target.value)}
                                error={errors.join_date}
                            />
                            <CommonInput
                                label="Salary"
                                type="number"
                                value={data.salary}
                                onChange={(e) => setData("salary", e.target.value)}
                                error={errors.salary}
                            />
                        </div>
                    </>
                )}

                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CommonInput
                        label="Email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        error={errors.email}
                    />
                    {type !== 'employee' && (
                        <CommonInput
                            label="Phone"
                            value={data.phone_number}
                            onChange={(e) => setData("phone_number", e.target.value)}
                            error={errors.phone_number}
                        />
                    )}
                </div>

                <div className="sticky bottom-0 bg-white pt-6 flex items-center justify-end gap-3 border-t border-slate-100">
                    <CommonButton variant="ghost" onClick={onClose} size="sm">Cancel</CommonButton>
                    <CommonButton type="submit" variant="primary" processing={processing} size="sm">
                        Save {type.charAt(0).toUpperCase() + type.slice(1)}
                    </CommonButton>
                </div>
            </form>
        </SlideOver>
    );
}
