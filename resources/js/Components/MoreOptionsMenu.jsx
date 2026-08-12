import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import PinPromptModal from './PinPromptModal';

export default function MoreOptionsMenu({
    copyRoute = null,
    deleteRoute = null,
    printRoute = null,
    recordId = null,
    listRoute = 'dashboard',
    label = 'More Options',
}) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    // Books Lock PIN Modal
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
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

        handleDeleteSubmit(booksPin);
    };

    const handlePrint = () => {
        setOpen(false);
        if (printRoute) {
            window.open(route(printRoute, recordId), '_blank');
        }
    };

    if (!recordId || (!copyRoute && !deleteRoute && !printRoute)) {
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
                    handleDeleteSubmit(pin);
                }}
                errorMessage={booksPinError}
            />
        </div>
    );
}
