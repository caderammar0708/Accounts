import React, { useEffect } from 'react';
import { useForm, usePage, Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import EmployeeTabs from '@/Components/EmployeeTabs';

const EditDocumentsPage= () => {
    const { employee } = usePage().props ;
        
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        photo_file: null ,
        cv_file: null ,
        id_copy_file: null ,
        certificate_file: null ,
    });

    
    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/employees/${employee.id}/documents`, {
            forceFormData: true,
        });
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
                
                <EmployeeTabs employeeId={employee.id} activeTab="documents" />
                
                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    <div className="max-w-3xl">
                        {/* File Uploads */}
                        <div className="space-y-6 bg-slate-50/50 p-6 rounded-xl border border-slate-200/60">
                            <div className="border-b border-slate-200 pb-3">
                                <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Documents Registry (Optional)</h4>
                                <p className="text-slate-400 text-xs mt-0.5">Upload personal identifiers, academic certificates, and resumes.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2">Profile Photo</label>
                                    {employee.photo && (
                                        <div className="mb-2">
                                            <a href={`/storage/${employee.photo}`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">
                                                View Current Photo
                                            </a>
                                        </div>
                                    )}
                                    <input type="file" onChange={e => setData('photo_file', e.target.files?.[0] || null)} className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer" />
                                    {errors.photo_file && <p className="text-rose-500 text-xs mt-1">{errors.photo_file}</p>}
                                </div>

                                <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2">CV / Resume</label>
                                    {employee.cv_path && (
                                        <div className="mb-2">
                                            <a href={`/storage/${employee.cv_path}`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">
                                                View Current CV
                                            </a>
                                        </div>
                                    )}
                                    <input type="file" onChange={e => setData('cv_file', e.target.files?.[0] || null)} className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer" />
                                    {errors.cv_file && <p className="text-rose-500 text-xs mt-1">{errors.cv_file}</p>}
                                </div>

                                <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2">National ID Copy</label>
                                    {employee.id_copy_path && (
                                        <div className="mb-2">
                                            <a href={`/storage/${employee.id_copy_path}`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">
                                                View Current ID Copy
                                            </a>
                                        </div>
                                    )}
                                    <input type="file" onChange={e => setData('id_copy_file', e.target.files?.[0] || null)} className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer" />
                                    {errors.id_copy_file && <p className="text-rose-500 text-xs mt-1">{errors.id_copy_file}</p>}
                                </div>

                                <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2">Academic Certificates</label>
                                    {employee.certificate_path && (
                                        <div className="mb-2">
                                            <a href={`/storage/${employee.certificate_path}`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">
                                                View Current Certificate
                                            </a>
                                        </div>
                                    )}
                                    <input type="file" onChange={e => setData('certificate_file', e.target.files?.[0] || null)} className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer" />
                                    {errors.certificate_file && <p className="text-rose-500 text-xs mt-1">{errors.certificate_file}</p>}
                                </div>
                            </div>
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
                            type="submit"
                            loading={processing}
                            loadingText="Uploading..."
                        >
                            Update Documents
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
</AuthenticatedLayout>
);
};

export default EditDocumentsPage;
