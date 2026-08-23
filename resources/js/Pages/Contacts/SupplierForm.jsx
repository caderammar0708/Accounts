import { useState } from "react";
import { useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function SupplierForm() {
    const { data, setData, post, processing, errors } = useForm({
        display_name: "",
        company_name: "",
        supplier_type: "",
        email: "",
        phone_number: "",
        mobile: "",
        fax: "",
        website: "",
        address: "",
        opening_balance: "",
        opening_balance_date: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("suppliers.store"));
    };

    return (
        <AuthenticatedLayout header="New Supplier">
            <div className="max-w-2xl mx-auto py-10 px-6">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="p-8 border-b border-slate-100">
                        <h2 className="text-xl font-bold text-slate-800">Supplier Details</h2>
                        <p className="text-sm text-slate-500 mt-1">Add a new supplier to your contact list.</p>
                    </div>

                    <form onSubmit={submit} className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Supplier Display Name *</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                    value={data.display_name}
                                    onChange={(e) => setData("display_name", e.target.value)}
                                />
                                {errors.display_name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.display_name}</p>}
                            </div>

                            <div className="col-span-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Company Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                    value={data.company_name}
                                    onChange={(e) => setData("company_name", e.target.value)}
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Supplier Type</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                    value={data.supplier_type}
                                    onChange={(e) => setData("supplier_type", e.target.value)}
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Website</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                    value={data.website}
                                    onChange={(e) => setData("website", e.target.value)}
                                />
                            </div>

                            <div className="col-span-2 grid grid-cols-3 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Phone</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                        value={data.phone_number}
                                        onChange={(e) => setData("phone_number", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Mobile</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                        value={data.mobile}
                                        onChange={(e) => setData("mobile", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Fax</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                        value={data.fax}
                                        onChange={(e) => setData("fax", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Address</label>
                                <textarea
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all font-sans text-sm leading-snug"
                                    rows="3"
                                    value={data.address}
                                    onChange={(e) => setData("address", e.target.value)}
                                ></textarea>
                            </div>

                            <div className="col-span-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Opening Balance</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                    value={data.opening_balance}
                                    onChange={(e) => setData("opening_balance", e.target.value)}
                                />
                                {errors.opening_balance && <p className="text-red-500 text-xs mt-1 font-bold">{errors.opening_balance}</p>}
                            </div>

                            <div className="col-span-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Opening Balance Date</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                    value={data.opening_balance_date}
                                    onChange={(e) => setData("opening_balance_date", e.target.value)}
                                />
                                {errors.opening_balance_date && <p className="text-red-500 text-xs mt-1 font-bold">{errors.opening_balance_date}</p>}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-8 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {processing ? "Saving..." : "Create Supplier"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
