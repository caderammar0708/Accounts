import { useEffect, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import PinPromptModal from './PinPromptModal';
import Modal from './Modal';
import CommonButton from './CommonButton';

export default function MoreOptionsMenu({
    copyRoute = null,
    deleteRoute = null,
    printRoute = null,
    voidRoute = null,
    isVoided = false,
    recordId = null,
    listRoute = 'dashboard',
    label = 'More Options',
    documentType = null,
}) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    // Print Modal State
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [availableTemplates, setAvailableTemplates] = useState([]);

    // Books Lock PIN Modal
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pinAction, setPinAction] = useState('delete');
    const [booksPin, setBooksPin] = useState('');
    const [booksPinError, setBooksPinError] = useState(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCopy = () => {
        setOpen(false);

        if (copyRoute) {
            const params = recordId ? { copy: recordId } : {};
            router.get(route(copyRoute, params), {}, { replace: true });
            return;
        }

        window.alert('Copy is not available for this record type yet.');
    };

    const handleDeleteSubmit = (pin = '') => {
        // Use Inertia router for delete — the backend redirect determines where to go next
        const data = pin ? { books_pin: pin } : {};
        router.delete(route(deleteRoute, recordId), {
            data: data,
            preserveScroll: false,
            onError: (err) => {
                if (err.books_pin === 'BOOKS_LOCKED_PIN_REQUIRED' || err.books_pin) {
                    setBooksPinError(err.books_pin !== 'BOOKS_LOCKED_PIN_REQUIRED' ? err.books_pin : null);
                    setPinAction('delete');
                    setIsPinModalOpen(true);
                } else {
                    const message = err?.error || err?.message || 'This record cannot be deleted right now.';
                    window.alert(message);
                }
            },
            onSuccess: () => {
                setIsPinModalOpen(false);
                setBooksPin('');
                setBooksPinError(null);
            }
        });
    };

    const handleDelete = () => {
        if (!deleteRoute || !recordId) {
            window.alert('Delete is not available for this record type yet.');
            return;
        }

        const confirmed = window.confirm('Delete Record\n\nAre you sure you want to delete this record?');
        if (!confirmed) return;

        setOpen(false);
        setPinAction('delete');
        handleDeleteSubmit(booksPin);
    };

    const handleVoidSubmit = (pin = '') => {
        const data = pin ? { books_pin: pin } : {};
        router.post(route(voidRoute, recordId), data, {
            preserveScroll: false,
            onError: (err) => {
                if (err.books_pin === 'BOOKS_LOCKED_PIN_REQUIRED' || err.books_pin) {
                    setBooksPinError(err.books_pin !== 'BOOKS_LOCKED_PIN_REQUIRED' ? err.books_pin : null);
                    setPinAction('void');
                    setIsPinModalOpen(true);
                } else {
                    const message = err?.error || err?.message || 'This record cannot be voided right now.';
                    window.alert(message);
                }
            },
            onSuccess: () => {
                setIsPinModalOpen(false);
                setBooksPin('');
                setBooksPinError(null);
            }
        });
    };

    const handleVoid = () => {
        if (!voidRoute || !recordId) {
            window.alert('Void is not available for this record type yet.');
            return;
        }

        if (isVoided) {
            window.alert('This transaction is already voided.');
            return;
        }

        const confirmed = window.confirm(
            'Void Transaction\n\nAre you sure you want to void this transaction?\n\nVoiding will reverse its financial and ledger impact while preserving the record for audit trail purposes.'
        );
        if (!confirmed) return;

        setOpen(false);
        setPinAction('void');
        handleVoidSubmit(booksPin);
    };

    const handlePrint = async () => {
        setOpen(false);
        if (printRoute) {
            try {
                const response = await axios.get(route('print.settings.templates', { document_type: documentType }));
                const templates = response.data || [];
                
                if (templates.length > 1) {
                    setAvailableTemplates(templates);
                    setIsPrintModalOpen(true);
                } else {
                    window.open(route(printRoute, recordId), '_blank');
                }
            } catch (error) {
                console.error("Failed to fetch print templates", error);
                window.open(route(printRoute, recordId), '_blank'); // fallback
            }
        }
    };

    if (!recordId || (!copyRoute && !deleteRoute && !printRoute && !voidRoute)) {
        return null;
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-slate-300 hover:text-white transition focus:outline-none"
            >
                {label}
            </button>

            {open && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48 rounded-xl border border-slate-700 bg-slate-800 p-1 shadow-2xl">
                    {copyRoute && (
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-700"
                        >
                            Copy
                            <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400">New</span>
                        </button>
                    )}
                    {printRoute && (
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-700"
                        >
                            Print
                        </button>
                    )}
                    {voidRoute && (
                        <button
                            type="button"
                            onClick={handleVoid}
                            disabled={isVoided}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                                isVoided 
                                    ? 'text-slate-500 cursor-not-allowed' 
                                    : 'text-amber-400 hover:bg-slate-700 hover:text-amber-300'
                            }`}
                        >
                            {isVoided ? 'Voided' : 'Void'}
                            {isVoided && <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Voided</span>}
                        </button>
                    )}
                    {deleteRoute && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-rose-400 transition hover:bg-slate-700 border-t border-slate-700 mt-1 pt-2"
                        >
                            Delete
                        </button>
                    )}
                </div>
            )}

            <PinPromptModal
                isOpen={isPinModalOpen}
                onClose={() => {
                    setIsPinModalOpen(false);
                    setBooksPin('');
                    setBooksPinError(null);
                }}
                onSubmit={(pin) => {
                    setBooksPin(pin);
                    if (pinAction === 'void') {
                        handleVoidSubmit(pin);
                    } else {
                        handleDeleteSubmit(pin);
                    }
                }}
                errorMessage={booksPinError}
            />

            <Modal show={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} maxWidth="md">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Select Print Format</h3>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {availableTemplates.map(template => (
                            <button
                                key={template.id}
                                type="button"
                                onClick={() => {
                                    setIsPrintModalOpen(false);
                                    window.open(route(printRoute, recordId) + '?template_id=' + template.id, '_blank');
                                }}
                                className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-primary-500 hover:bg-primary-50 transition-colors flex items-center justify-between group"
                            >
                                <span className="font-semibold text-slate-700 group-hover:text-primary-700">{template.template_name || 'Standard Format'}</span>
                                {template.is_default && (
                                    <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Default</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="mt-6 flex justify-end">
                        <CommonButton variant="ghost" onClick={() => setIsPrintModalOpen(false)}>
                            Cancel
                        </CommonButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
