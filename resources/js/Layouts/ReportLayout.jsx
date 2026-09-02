import React, { useState, useRef, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link } from '@inertiajs/react';

export default function ReportLayout({ children, title, filters, onFilterChange, onExportExcel, onExportPDF }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleExportPDF = () => {
        if (onExportPDF) {
            onExportPDF();
            return;
        }

        // Default Client-Side PDF Generation
        const loadScript = () => {
            return new Promise((resolve, reject) => {
                if (window.html2pdf) {
                    resolve(window.html2pdf);
                    return;
                }
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
                script.onload = () => resolve(window.html2pdf);
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };

        loadScript().then((html2pdf) => {
            const element = document.getElementById('report-content');
            const cleanTitle = title ? title.replace(/[^a-z0-9]/gi, '_') : 'Report';
            const opt = {
                margin: [0.4, 0.4, 0.4, 0.4],
                filename: `${cleanTitle}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
            };
            html2pdf().set(opt).from(element).save();
        }).catch(err => {
            console.error('Failed to load html2pdf library:', err);
        });
    };

    return (
        <AuthenticatedLayout
            header={title}
        >
            <div className="min-h-screen bg-[#f4f5f8]">
                {/* Report Controls - QuickBooks Style */}
                <div className="bg-[#f4f5f8] border-b border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-6 print:hidden">
                    <div className="flex items-center gap-4">
                        {filters}
                    </div>

                    <div className="flex items-center gap-4 text-[13px] font-medium text-gray-700">
                        {/* <button className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            Columns
                        </button>
                        <button className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                            Filter
                        </button>
                        <button className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                            General options
                        </button> */}

                        <div className="flex gap-2 ml-4 pl-4 border-l border-gray-300">


                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsOpen(!isOpen)}
                                    className="flex items-center gap-1.5 hover:text-gray-900 transition-colors"
                                    title="Export"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isOpen && (
                                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 shadow-lg z-50 py-1">
                                        <button
                                            onClick={() => { setIsOpen(false); handleExportPDF(); }}
                                            className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-100"
                                        >
                                            Export to PDF
                                        </button>
                                        {onExportExcel && (
                                            <button
                                                onClick={() => { setIsOpen(false); onExportExcel(); }}
                                                className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-100 border-t border-gray-100"
                                            >
                                                Export to Excel
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Report Content */}
                <div id="report-content" className="p-4 sm:p-8 w-full max-w-full mx-auto print:p-0 print:max-w-none">
                    <div className="bg-white border border-gray-200 shadow-sm p-4 sm:p-10 pt-12 min-h-[800px]">
                        {children}
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                        #report-content table {
                            page-break-inside: auto;
                            break-inside: auto;
                            border-collapse: collapse;
                        }

                        #report-content thead {
                            display: table-header-group;
                        }

                        #report-content tfoot {
                            display: table-footer-group;
                        }

                        #report-content tr,
                        #report-content td,
                        #report-content th {
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }

                        @media print {
                            body { background: white !important; }
                            .no-print { display: none !important; }
                            header { display: none !important; }
                            .fixed { position: static !important; }
                            main { padding: 0 !important; }
                        }
                    `
                }} />
            </div>
        </AuthenticatedLayout>
    );
}
