import React from 'react';
import { useForm, usePage, Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';
import EmployeeTabs from '@/Components/EmployeeTabs';

const EditDocumentsPage = ({ auth }) => {
    const { employee } = usePage().props;
        
    const { data, setData, post, processing, errors, isDirty } = useForm({
        _method: 'PUT',
        photo: null,
        cv: null,
        id_copy: null,
        certificate: null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('employees.documents.update', employee.id), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            user={auth?.user || {}}
            header={<h2 className="font-bold text-lg text-slate-800 tracking-tight">Edit Employee</h2>}
        >
            <Head title={`Edit Documents - ${employee.name}`} />

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
                            <p className="text-xs text-slate-500 mt-0.5">Upload identity proofs, credentials, and curriculum vitae.</p>
                        </div>
                    </div>
                </div>

                <EmployeeTabs employeeId={employee.id} activeTab="documents" isDirty={isDirty} />

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Documents & Credentials Registry</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Upload verified documents. Supported formats include PDF, PNG, JPG, and DOCX.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Profile Photo */}
                            <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Profile Photo
                                    </label>
                                    {employee.photo && (
                                        <a 
                                            href={`/storage/${employee.photo}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            View Current Photo
                                        </a>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400">JPEG, PNG, or WEBP up to 2MB.</p>
                                <input 
                                    type="file" 
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={e => setData('photo', e.target.files?.[0] || null)} 
                                    className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary hover:file:bg-primary-100 cursor-pointer border border-slate-300 rounded-md bg-white p-1" 
                                />
                                {(errors.photo || errors.photo_file) && (
                                    <p className="text-red-500 text-xs mt-1 font-semibold">{errors.photo || errors.photo_file}</p>
                                )}
                            </div>

                            {/* CV / Resume */}
                            <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        CV / Resume
                                    </label>
                                    {employee.cv_path && (
                                        <a 
                                            href={`/storage/${employee.cv_path}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            View Current CV
                                        </a>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400">PDF, DOC, or DOCX up to 5MB.</p>
                                <input 
                                    type="file" 
                                    accept=".pdf,.doc,.docx"
                                    onChange={e => setData('cv', e.target.files?.[0] || null)} 
                                    className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary hover:file:bg-primary-100 cursor-pointer border border-slate-300 rounded-md bg-white p-1" 
                                />
                                {(errors.cv || errors.cv_file) && (
                                    <p className="text-red-500 text-xs mt-1 font-semibold">{errors.cv || errors.cv_file}</p>
                                )}
                            </div>

                            {/* National ID Copy */}
                            <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        National ID / Passport Copy
                                    </label>
                                    {employee.id_copy_path && (
                                        <a 
                                            href={`/storage/${employee.id_copy_path}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            View Current ID Copy
                                        </a>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400">PDF, JPG, or PNG up to 5MB.</p>
                                <input 
                                    type="file" 
                                    accept=".pdf,image/jpeg,image/png"
                                    onChange={e => setData('id_copy', e.target.files?.[0] || null)} 
                                    className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary hover:file:bg-primary-100 cursor-pointer border border-slate-300 rounded-md bg-white p-1" 
                                />
                                {(errors.id_copy || errors.id_copy_file) && (
                                    <p className="text-red-500 text-xs mt-1 font-semibold">{errors.id_copy || errors.id_copy_file}</p>
                                )}
                            </div>

                            {/* Academic Certificates */}
                            <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Academic / Professional Certificates
                                    </label>
                                    {employee.certificate_path && (
                                        <a 
                                            href={`/storage/${employee.certificate_path}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            View Current Certificate
                                        </a>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400">PDF, JPG, or PNG up to 5MB.</p>
                                <input 
                                    type="file" 
                                    accept=".pdf,image/jpeg,image/png"
                                    onChange={e => setData('certificate', e.target.files?.[0] || null)} 
                                    className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary hover:file:bg-primary-100 cursor-pointer border border-slate-300 rounded-md bg-white p-1" 
                                />
                                {(errors.certificate || errors.certificate_file) && (
                                    <p className="text-red-500 text-xs mt-1 font-semibold">{errors.certificate || errors.certificate_file}</p>
                                )}
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
                                {processing ? 'Uploading...' : 'Update Documents'}
                            </CommonButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default EditDocumentsPage;
