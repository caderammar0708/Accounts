import React, { useState, useEffect, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import CommonInput from '@/Components/CommonInput';
import CommonButton from '@/Components/CommonButton';
import { showToast } from '@/Components/ToastNotification';

export default function PrintSettings({ settings }) {
    const printSettings = settings?.settings_metadata?.print_settings || settings?.print_settings || [];
    const [selectedDocType, setSelectedDocType] = useState('invoice');
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [isCustomizingHtml, setIsCustomizingHtml] = useState(false);

    const documentTypes = [
        { id: 'invoice', label: 'Invoice' },
        { id: 'bill', label: 'Bill' },
        { id: 'invoice_return', label: 'Invoice Return' },
        { id: 'bill_return', label: 'Bill Return' },
        { id: 'payment_receipt', label: 'Receive Payment' },
    ];

    const templatesForCurrentType = printSettings.filter(s => s.document_type === selectedDocType);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        document_type: selectedDocType,
        template_name: '',
        custom_title: '',
        is_default: false,
        show_logo: true,
        static_footer_content: '',
        html_template: '',
        text_color: '#374151',
        letterhead_image: null,
        page_setup: { size: 'A4', margin_top: '0', margin_right: '0', margin_bottom: '0', margin_left: '0' }
    });

    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!editingTemplate) {
            reset();
            clearErrors();
            setData(prev => ({ ...prev, document_type: selectedDocType, letterhead_image: null, is_default: templatesForCurrentType.length === 0 }));
            setIsCustomizingHtml(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [selectedDocType]);

    const handleEdit = (template) => {
        setEditingTemplate(template);
        clearErrors();
        setData({
            document_type: template.document_type,
            template_name: template.template_name || '',
            custom_title: template.custom_title || '',
            is_default: !!template.is_default,
            show_logo: template.show_logo ?? true,
            static_footer_content: template.static_footer_content || '',
            html_template: template.html_template || '',
            text_color: template.text_color || '#374151',
            letterhead_image: null,
            page_setup: template.page_setup || { size: 'A4', margin_top: '0', margin_right: '0', margin_bottom: '0', margin_left: '0' }
        });
        setIsCustomizingHtml(!!template.html_template);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleCreateNew = () => {
        setEditingTemplate(null);
        clearErrors();
        setData({
            document_type: selectedDocType,
            template_name: '',
            custom_title: '',
            is_default: templatesForCurrentType.length === 0,
            show_logo: true,
            static_footer_content: '',
            html_template: '',
            text_color: '#374151',
            letterhead_image: null,
            page_setup: { size: 'A4', margin_top: '0', margin_right: '0', margin_bottom: '0', margin_left: '0' }
        });
        setIsCustomizingHtml(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this template?')) {
            router.delete(route('print.settings.destroy', id), {
                preserveScroll: true,
                onSuccess: () => {
                    showToast('success', 'Template deleted');
                    if (editingTemplate?.id === id) {
                        handleCreateNew();
                    }
                }
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const isUpdate = !!editingTemplate;
        const url = isUpdate 
            ? route('print.settings.update', editingTemplate.id) 
            : route('print.settings.store');

        post(url, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                showToast('success', isUpdate ? 'Template updated successfully.' : 'Template created successfully.');
                if (!isUpdate) {
                    handleCreateNew();
                }
            }
        });
    };

    return (
        <section className="bg-white shadow sm:rounded-lg p-6 max-w-5xl border border-gray-200 flex flex-col md:flex-row gap-8">
            {/* Left Sidebar - Template List */}
            <div className="w-full md:w-1/3 flex flex-col gap-4 border-r border-gray-100 pr-4">
                <header className="mb-2">
                    <h2 className="text-sm font-bold text-gray-800">Print Templates</h2>
                    <p className="mt-1 text-[10px] text-gray-400">Manage templates by document type.</p>
                </header>

                <CommonInput
                    type="select"
                    label="Document Type"
                    value={selectedDocType}
                    onChange={(e) => {
                        setSelectedDocType(e.target.value);
                    }}
                    options={documentTypes.map(doc => ({ value: doc.id, label: doc.label }))}
                />

                <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-600">Templates</span>
                        <button type="button" onClick={handleCreateNew} className="text-xs text-primary-600 font-semibold hover:underline">
                            + New
                        </button>
                    </div>
                    
                    {templatesForCurrentType.length === 0 ? (
                        <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-md">
                            <span className="text-xs text-slate-400">No templates found</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {templatesForCurrentType.map(template => (
                                <div 
                                    key={template.id} 
                                    className={`p-3 rounded-md border flex flex-col gap-1 cursor-pointer transition-colors ${editingTemplate?.id === template.id ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:bg-slate-50'}`}
                                    onClick={() => handleEdit(template)}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="text-sm font-semibold text-slate-800 break-all">{template.template_name || 'Unnamed Template'}</span>
                                        {template.is_default ? (
                                            <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Default</span>
                                        ) : (
                                            <button 
                                                type="button" 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }}
                                                className="text-red-500 hover:text-red-700 text-xs"
                                                title="Delete Template"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    {template.letterhead_image_path && (
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg> Has Letterhead
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full md:w-2/3">
                <header className="mb-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-bold text-gray-800">
                            {editingTemplate ? `Edit Template: ${editingTemplate.template_name || 'Unnamed'}` : `Create New Template`}
                        </h3>
                        <p className="mt-1 text-[10px] text-gray-400">For Document: {documentTypes.find(d => d.id === selectedDocType)?.label}</p>
                    </div>
                    {!editingTemplate && templatesForCurrentType.length > 0 && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded font-bold uppercase tracking-wider">New</span>
                    )}
                </header>

                <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <CommonInput
                            label="Template Name"
                            value={data.template_name}
                            onChange={(e) => setData('template_name', e.target.value)}
                            placeholder="e.g., Standard Invoice"
                            required
                            error={errors.template_name}
                        />
                        <CommonInput
                            label="Custom Title"
                            value={data.custom_title}
                            onChange={(e) => setData('custom_title', e.target.value)}
                            placeholder="e.g., TAX INVOICE"
                            error={errors.custom_title}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <CommonInput
                            type="color"
                            label="Text Color"
                            value={data.text_color}
                            onChange={(e) => setData('text_color', e.target.value)}
                        />
                        
                        <div className="flex flex-col gap-3 justify-center pt-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={data.is_default}
                                    onChange={(e) => setData('is_default', e.target.checked)}
                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                />
                                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Set as Default Template</span>
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={data.show_logo}
                                    onChange={(e) => setData('show_logo', e.target.checked)}
                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                />
                                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Show Company Logo</span>
                            </label>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-700 mb-3">Letterhead & Assets</h4>
                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Letterhead Image</label>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={(e) => setData('letterhead_image', e.target.files[0])}
                                accept="image/*"
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                            />
                            {errors.letterhead_image && <p className="text-xs text-red-500 mt-1">{errors.letterhead_image}</p>}
                            
                            {editingTemplate?.letterhead_image_path && !data.letterhead_image && (
                                <div className="mt-2 text-xs text-slate-500 bg-white p-2 rounded border border-slate-200 inline-block">
                                    Current letterhead is active. <a href={`/storage/${editingTemplate.letterhead_image_path}`} target="_blank" className="text-primary-600 hover:underline ml-1">View</a>
                                </div>
                            )}
                            <p className="text-[10px] text-slate-400">Upload a high-resolution image to appear as the full-page background (A4).</p>
                        </div>

                        <div className="mt-6">
                            <h4 className="text-xs font-bold text-slate-700 mb-3 border-t border-slate-200 pt-4">Page Margins (mm)</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <CommonInput
                                    type="number"
                                    label="Top"
                                    value={data.page_setup?.margin_top || 0}
                                    onChange={(e) => setData('page_setup', { ...data.page_setup, margin_top: e.target.value })}
                                />
                                <CommonInput
                                    type="number"
                                    label="Bottom"
                                    value={data.page_setup?.margin_bottom || 0}
                                    onChange={(e) => setData('page_setup', { ...data.page_setup, margin_bottom: e.target.value })}
                                />
                                <CommonInput
                                    type="number"
                                    label="Left"
                                    value={data.page_setup?.margin_left || 0}
                                    onChange={(e) => setData('page_setup', { ...data.page_setup, margin_left: e.target.value })}
                                />
                                <CommonInput
                                    type="number"
                                    label="Right"
                                    value={data.page_setup?.margin_right || 0}
                                    onChange={(e) => setData('page_setup', { ...data.page_setup, margin_right: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={isCustomizingHtml}
                                onChange={(e) => setIsCustomizingHtml(e.target.checked)}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                            />
                            <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Use Custom HTML Template</span>
                        </label>
                        <span className="text-[10px] text-slate-400">Advanced customization</span>
                    </div>

                    {isCustomizingHtml ? (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <CommonInput
                                type="textarea"
                                label="HTML Editor"
                                rows={10}
                                value={data.html_template}
                                onChange={(e) => setData('html_template', e.target.value)}
                                placeholder="<html><body><h1>Invoice {{ invoice_no }}</h1></body></html>"
                                className="font-mono text-xs bg-slate-900 text-slate-100 placeholder-slate-600"
                            />
                            <p className="mt-1.5 text-[10px] text-slate-500">You can use raw HTML and inline CSS. Use tokens like <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{"{{ invoice_no }}"}</code> to render data.</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <CommonInput
                                type="textarea"
                                label="Bottom Text (Tax/Footer)"
                                rows={4}
                                value={data.static_footer_content}
                                onChange={(e) => setData('static_footer_content', e.target.value)}
                                placeholder="Enter any tax information or custom message to display at the bottom of the document..."
                            />
                            <p className="mt-1.5 text-[10px] text-slate-500">This text will appear at the very bottom of the generated {documentTypes.find(d => d.id === selectedDocType)?.label}.</p>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end items-center gap-4 border-t border-gray-100 pt-5">
                        <CommonButton
                            type="button"
                            variant="ghost"
                            onClick={handleCreateNew}
                            disabled={processing}
                            className={!editingTemplate ? 'invisible' : ''}
                        >
                            Cancel
                        </CommonButton>
                        <CommonButton
                            type="submit"
                            disabled={processing}
                            variant="primary"
                        >
                            {processing ? 'Saving...' : editingTemplate ? 'Update Template' : 'Save New Template'}
                        </CommonButton>
                    </div>
                </form>
            </div>
        </section>
    );
}
