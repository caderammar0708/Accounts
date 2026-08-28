import React, { useState, useRef } from 'react';
import axios from 'axios';
import { showToast } from '@/Components/ToastNotification';

export default function AttachmentUpload({
    attachments = [],
    onChange,
    disabled = false,
    maxFileSizeMB = 10,
    allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'],
    compact = false,
    label = 'Attachments'
}) {
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState([]); // [{ id, name, size, progress, error }]
    const [isDeletingId, setIsDeletingId] = useState(null);

    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

    const formatBytes = (bytes, decimals = 1) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileName = '', mimeType = '') => {
        const ext = fileName.split('.').pop().toLowerCase();
        if (['pdf'].includes(ext) || mimeType.includes('pdf')) {
            return (
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                </div>
            );
        }
        if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || mimeType.startsWith('image/')) {
            return (
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                </div>
            );
        }
        if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType.includes('sheet') || mimeType.includes('csv')) {
            return (
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v1H4zm7 0v-1h5v1h-5zm5-3h-5V9h5v1zm-7-1v1H4V9h5zm0-2H4V6h5v1zm2 0V6h5v1h-5z" clipRule="evenodd" />
                    </svg>
                </div>
            );
        }
        if (['doc', 'docx'].includes(ext) || mimeType.includes('word') || mimeType.includes('document')) {
            return (
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                </div>
            );
        }
        return (
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
            </div>
        );
    };

    const handleFiles = async (files) => {
        if (!files || files.length === 0 || disabled) return;

        const validFiles = [];
        const currentUploading = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const ext = file.name.split('.').pop().toLowerCase();

            if (allowedExtensions.length > 0 && !allowedExtensions.includes(ext)) {
                showToast(`File "${file.name}" has an unsupported format. Allowed formats: ${allowedExtensions.join(', ')}`, 'error');
                continue;
            }

            if (file.size > maxFileSizeBytes) {
                showToast(`File "${file.name}" exceeds the ${maxFileSizeMB}MB size limit (${formatBytes(file.size)}).`, 'error');
                continue;
            }

            const uploadTempId = `temp-${Date.now()}-${i}`;
            validFiles.push({ file, tempId: uploadTempId });
            currentUploading.push({
                id: uploadTempId,
                name: file.name,
                size: file.size,
                progress: 0,
                error: null
            });
        }

        if (validFiles.length === 0) return;

        setUploadingFiles(prev => [...prev, ...currentUploading]);

        for (const { file, tempId } of validFiles) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await axios.post('/attachments', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const percent = progressEvent.total
                            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                            : 50;
                        setUploadingFiles(prev =>
                            prev.map(u => u.id === tempId ? { ...u, progress: percent } : u)
                        );
                    }
                });

                if (response.data?.success && response.data?.attachment) {
                    const newAttachment = response.data.attachment;
                    const nextAttachments = [...(attachments || []), newAttachment];
                    const nextIds = nextAttachments.map(a => a.id);

                    if (onChange) {
                        onChange(nextAttachments, nextIds);
                    }

                    // Remove from uploading queue
                    setUploadingFiles(prev => prev.filter(u => u.id !== tempId));
                    showToast(`"${file.name}" uploaded successfully`, 'success');
                } else {
                    throw new Error(response.data?.message || 'Upload failed');
                }
            } catch (err) {
                const msg = err.response?.data?.message || err.message || 'Error uploading file';
                setUploadingFiles(prev =>
                    prev.map(u => u.id === tempId ? { ...u, error: msg } : u)
                );
                showToast(`Failed to upload "${file.name}": ${msg}`, 'error');
            }
        }
    };

    const handleDelete = async (attachmentId, e) => {
        if (e) e.stopPropagation();
        if (disabled || isDeletingId) return;

        setIsDeletingId(attachmentId);
        try {
            await axios.delete(`/attachments/${attachmentId}`);
            const nextAttachments = (attachments || []).filter(a => a.id !== attachmentId);
            const nextIds = nextAttachments.map(a => a.id);
            if (onChange) {
                onChange(nextAttachments, nextIds);
            }
            showToast('Attachment deleted', 'success');
        } catch (err) {
            console.error('Delete attachment error:', err);
            // Even if server delete fails (e.g., draft not persisted yet), remove from UI list
            const nextAttachments = (attachments || []).filter(a => a.id !== attachmentId);
            const nextIds = nextAttachments.map(a => a.id);
            if (onChange) {
                onChange(nextAttachments, nextIds);
            }
        } finally {
            setIsDeletingId(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (disabled) return;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    return (
        <div className="w-full flex flex-col gap-2">
            {label && (
                <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {label}
                    </label>
                    <span className="text-[11px] font-medium text-slate-400">
                        Max {maxFileSizeMB}MB per file
                    </span>
                </div>
            )}

            {/* Dropzone Area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !disabled && fileInputRef.current?.click()}
                className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all cursor-pointer select-none ${
                    isDragging
                        ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
                        : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
                } ${compact ? 'p-3 min-h-[70px]' : 'p-4 min-h-[90px]'} ${
                    disabled ? 'opacity-60 cursor-not-allowed' : ''
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                        handleFiles(e.target.files);
                        e.target.value = '';
                    }}
                    accept={allowedExtensions.map(e => `.${e}`).join(',')}
                    disabled={disabled}
                />

                <div className="flex items-center gap-2 text-center text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                            Click to upload or drag & drop
                        </p>
                        <p className="text-[11px] text-slate-400">
                            PDF, Images, Word, Excel, CSV up to {maxFileSizeMB}MB
                        </p>
                    </div>
                </div>
            </div>

            {/* Uploading In-Progress Files */}
            {uploadingFiles.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                    {uploadingFiles.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg shadow-sm"
                        >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex justify-between items-center text-xs mb-1">
                                        <span className="font-medium text-slate-700 truncate max-w-[200px]" title={item.name}>
                                            {item.name}
                                        </span>
                                        <span className="text-[11px] text-slate-400 font-mono">
                                            {item.error ? (
                                                <span className="text-rose-500 font-medium">Failed</span>
                                            ) : (
                                                `${item.progress}%`
                                            )}
                                        </span>
                                    </div>
                                    {!item.error && (
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                                                style={{ width: `${item.progress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            {item.error && (
                                <button
                                    type="button"
                                    onClick={() => setUploadingFiles(prev => prev.filter(u => u.id !== item.id))}
                                    className="ml-2 text-slate-400 hover:text-slate-600 text-xs"
                                >
                                    Dismiss
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Attached Files List */}
            {attachments && attachments.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                    {attachments.map((file) => {
                        const fileUrl = file.url || (file.file_path ? `/storage/${file.file_path}` : '#');
                        const downloadUrl = file.download_url || `/attachments/${file.id}/download`;
                        const isDeleting = isDeletingId === file.id;

                        return (
                            <div
                                key={file.id || file.file_name}
                                className="group/item flex items-center justify-between p-2.5 bg-white border border-slate-200/80 rounded-lg shadow-sm hover:border-slate-300 hover:shadow transition-all"
                            >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                                    {getFileIcon(file.file_name, file.mime_type)}
                                    <div className="min-w-0 flex-1">
                                        <a
                                            href={fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-semibold text-slate-800 hover:text-blue-600 hover:underline truncate block"
                                            title={file.file_name}
                                        >
                                            {file.file_name}
                                        </a>
                                        <span className="text-[11px] text-slate-400 font-medium">
                                            {file.formatted_size || formatBytes(file.file_size)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    {/* Download button */}
                                    <a
                                        href={downloadUrl}
                                        title="Download attachment"
                                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </a>

                                    {/* Delete button */}
                                    {!disabled && (
                                        <button
                                            type="button"
                                            onClick={(e) => handleDelete(file.id, e)}
                                            disabled={isDeleting}
                                            title="Delete attachment"
                                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                                        >
                                            {isDeleting ? (
                                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
