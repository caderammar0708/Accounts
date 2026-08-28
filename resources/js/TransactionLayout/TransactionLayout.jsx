import { useEffect, useState } from 'react';
import TransactionHeader from "./TransactionHeader";
import { router, usePage } from '@inertiajs/react';
import SplitSaveButton from "@/Components/SplitSaveButton";
import ToastNotification from "@/Components/ToastNotification";
import MoreOptionsMenu from "@/Components/MoreOptionsMenu";
import CommonButton from "@/Components/CommonButton";

export default function TransactionLayout({
    title,
    amount,
    children,
    onSave,
    onSaveAndClose,
    onSaveAndNew,
    onAddLine,
    onClearRows,
    processing = false,
    dirty = false,
    historyType = null,
    lastAction = 'save',
    moreOptions = null,
    resetDirty = null,
}) {
    const { props } = usePage();
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(dirty);

    const resolvedMoreOptions = moreOptions ?? (() => {
        const currentPath = window.location.pathname;

        if (currentPath.startsWith('/journal-entries/')) {
            return {
                copyRoute: 'journal-entries.create',
                deleteRoute: 'journal-entries.destroy',
                voidRoute: 'journal-entries.void',
                recordId: props.journalEntry?.id ?? props.journalEntry?.journalEntry?.id,
                listRoute: 'journal-entries.index',
                isVoided: (props.journalEntry?.status ?? props.journalEntry?.journalEntry?.status) === 'void'
            };
        }
        if (currentPath.startsWith('/invoice/')) {
            return {
                copyRoute: 'invoice',
                deleteRoute: 'invoice.destroy',
                voidRoute: 'credit-invoice.void',
                printRoute: 'invoice.print',
                documentType: 'invoice',
                recordId: props.invoice?.id,
                listRoute: 'dashboard',
                isVoided: (props.invoice?.status ?? props.journalEntry?.status) === 'void'
            };
        }
        if (currentPath.startsWith('/sales-invoice/')) {
            return {
                copyRoute: 'sales-invoice.create',
                deleteRoute: 'sales-invoice.destroy',
                voidRoute: 'sales-invoice.void',
                printRoute: 'sales-invoice.print',
                documentType: 'sales_invoice',
                recordId: props.receipt?.id,
                listRoute: 'dashboard',
                isVoided: (props.receipt?.status ?? props.journalEntry?.status) === 'void'
            };
        }
        if (currentPath.startsWith('/credit-invoice/')) {
            return {
                copyRoute: 'credit-invoice.create',
                deleteRoute: 'credit-invoice.destroy',
                voidRoute: 'credit-invoice.void',
                printRoute: 'credit-invoice.print',
                documentType: 'invoice',
                recordId: props.invoice?.id,
                listRoute: 'dashboard',
                isVoided: (props.invoice?.status ?? props.journalEntry?.status) === 'void'
            };
        }
        if (currentPath.startsWith('/bill/')) {
            return {
                copyRoute: 'bill',
                deleteRoute: 'bill.destroy',
                voidRoute: 'bill.void',
                printRoute: 'bill.print',
                documentType: 'bill',
                recordId: props.bill?.id,
                listRoute: 'dashboard',
                isVoided: (props.bill?.status ?? props.journalEntry?.status) === 'void'
            };
        }
        if (currentPath.startsWith('/chart-of-account/') && currentPath.includes('/history')) {
            const parts = currentPath.split('/');
            const coaid = parts[2] || null;
            return {
                copyRoute: null,
                deleteRoute: 'chart-of-account.destroy',
                recordId: coaid,
                listRoute: 'chart-of-account.index'
            };
        }
        if (currentPath.startsWith('/expense/')) {
            const expenseId = currentPath.split('/')[2];
            return {
                copyRoute: 'payment',
                deleteRoute: 'payment.destroy',
                voidRoute: 'payment.void',
                recordId: expenseId,
                listRoute: 'dashboard',
                isVoided: (props.payment?.status ?? props.expense?.status ?? props.journalEntry?.status) === 'void'
            };
        }
        if (currentPath.startsWith('/pay-bill/')) {
            return {
                copyRoute: null,
                deleteRoute: 'pay-bill.destroy',
                voidRoute: 'pay-bill.void',
                printRoute: 'pay-bill.print',
                documentType: 'payment_voucher',
                recordId: props.payment?.id || props.journalEntry?.id,
                listRoute: 'dashboard',
                isVoided: (props.payment?.status ?? props.journalEntry?.status) === 'void'
            };
        }
        if (currentPath.startsWith('/cheque/')) {
            const chequeId = currentPath.split('/')[2];
            return {
                copyRoute: 'cheque',
                deleteRoute: 'cheque.destroy',
                voidRoute: 'cheque.void',
                recordId: chequeId,
                listRoute: 'dashboard',
                isVoided: (props.cheque?.status ?? props.journalEntry?.status) === 'void'
            };
        }
        if (currentPath.startsWith('/payment/')) {
            return {
                copyRoute: 'receive_payment',
                deleteRoute: 'payment.destroy',
                voidRoute: 'payment.void',
                printRoute: 'payment.print',
                documentType: 'payment_receipt',
                recordId: props.payment?.id || props.expense?.id,
                listRoute: 'dashboard',
                isVoided: (props.payment?.status ?? props.expense?.status ?? props.journalEntry?.status) === 'void'
            };
        }
        if (currentPath.startsWith('/receipt/')) {
            return {
                copyRoute: 'receipt',
                deleteRoute: 'sales-invoice.destroy',
                voidRoute: 'sales-invoice.void',
                recordId: props.receipt?.id,
                listRoute: 'dashboard',
                isVoided: (props.receipt?.status ?? props.journalEntry?.status) === 'void'
            };
        }
        if (currentPath.startsWith('/invoice-return/')) {
            return {
                copyRoute: 'invoice-return',
                deleteRoute: 'invoice-return.destroy',
                voidRoute: 'invoice-return.void',
                printRoute: 'invoice-return.print',
                documentType: 'invoice_return',
                recordId: props.invoiceReturn?.id,
                listRoute: 'dashboard',
                isVoided: (props.invoiceReturn?.status ?? props.journalEntry?.status) === 'void'
            };
        }
        if (currentPath.startsWith('/bill-return/')) {
            return {
                copyRoute: 'bill-return',
                deleteRoute: 'bill-return.destroy',
                voidRoute: 'bill-return.void',
                printRoute: 'bill-return.print',
                documentType: 'bill_return',
                recordId: props.billReturn?.id,
                listRoute: 'dashboard',
                isVoided: (props.billReturn?.status ?? props.journalEntry?.status) === 'void'
            };
        }
        if (currentPath.startsWith('/deposit/')) {
            return {
                copyRoute: 'deposit',
                deleteRoute: 'deposit.destroy',
                voidRoute: 'bank-deposit.void',
                recordId: props.deposit?.id,
                listRoute: 'dashboard',
                isVoided: (props.deposit?.status ?? props.journalEntry?.status) === 'void'
            };
        }
        if (currentPath.startsWith('/bank-deposit/')) {
            return {
                copyRoute: 'bank-deposit',
                deleteRoute: 'bank-deposit.destroy',
                voidRoute: 'bank-deposit.void',
                recordId: props.deposit?.id,
                listRoute: 'dashboard',
                isVoided: (props.deposit?.status ?? props.journalEntry?.status) === 'void'
            };
        }
        if (currentPath.startsWith('/cheque-deposit/')) {
            return {
                copyRoute: 'cheque-deposit',
                deleteRoute: 'cheque-deposit.destroy',
                voidRoute: 'cheque-deposit.void',
                recordId: props.deposit?.id,
                listRoute: 'dashboard',
                isVoided: (props.deposit?.status ?? props.journalEntry?.status) === 'void'
            };
        }
        if (currentPath.startsWith('/transfer/')) {
            return {
                copyRoute: 'transfer',
                deleteRoute: 'transfer.destroy',
                voidRoute: 'transfer.void',
                recordId: props.transfer?.id || props.journalEntry?.id,
                listRoute: 'dashboard',
                isVoided: (props.transfer?.status ?? props.journalEntry?.status) === 'void'
            };
        }
        if (currentPath.startsWith('/receive-payment/')) {
            return {
                copyRoute: null,
                deleteRoute: 'receive-payment.destroy',
                voidRoute: 'receive-payment.void',
                printRoute: 'receive-payment.print',
                documentType: 'payment_receipt',
                recordId: props.payment?.id,
                listRoute: 'dashboard',
                isVoided: (props.payment?.status ?? props.journalEntry?.status) === 'void'
            };
        }
        if (currentPath.startsWith('/inventory-adjustment/')) {
            return {
                copyRoute: null,
                deleteRoute: 'inventory-adjustment.destroy',
                voidRoute: 'inventory-adjustment.void',
                recordId: props.adjustment?.id,
                listRoute: 'dashboard',
                isVoided: (props.adjustment?.status ?? props.journalEntry?.status) === 'void'
            };
        }
        if (currentPath.startsWith('/pos/')) {
            return {
                copyRoute: null,
                deleteRoute: 'pos.destroy',
                voidRoute: 'pos.void',
                recordId: props.journalEntry?.id,
                listRoute: 'pos.index',
                isVoided: props.journalEntry?.status === 'void'
            };
        }

        return null;
    })();

    useEffect(() => {
        setHasUnsavedChanges(dirty);
    }, [dirty]);

    useEffect(() => {
        if (props.flash?.close_window) {
            handleClose();
        }
    }, [props.flash?.close_window]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (document.querySelector('[role="dialog"]') || document.querySelector('.fixed.inset-0')) {
                    return; // a modal is open, let it handle the escape
                }

                // If it's focused in an input/textarea, blurring it or allowing form to cancel is better, 
                // but closing the whole page is what they asked for, so we call handleClose()
                const activeEl = document.activeElement;
                if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
                    // Let inputs lose focus first instead of instantly closing the whole form if they press ESC?
                    // Actually, standard behavior is to blur.
                    activeEl.blur();
                    return;
                }

                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasUnsavedChanges]);

    const handleClose = () => {
        const goBack = () => {
            if (window.history.length > 1) {
                window.history.back();
                setTimeout(() => {
                    router.reload();
                }, 50);
            } else {
                router.get(route(resolvedMoreOptions?.listRoute || 'dashboard'));
            }
        };

        if (hasUnsavedChanges) {
            if (confirm('You have unsaved changes. Are you sure you want to close?')) {
                goBack();
            }
        } else {
            goBack();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* HEADER */}
            <TransactionHeader
                title={title}
                amount={amount}
                historyType={historyType}
                dirty={hasUnsavedChanges}
                onClose={handleClose}
                moreOptions={resolvedMoreOptions}
            />

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </div>

            {/* FOOTER - DARK THEME */}
            <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 px-8 py-1 flex items-center justify-between shadow-2xl z-50">
                {/* Left - Actions */}
                <div className="flex items-center gap-4">
                    <CommonButton
                        variant="ghost"
                        onClick={handleClose}
                        className="!border-primary-600 !text-primary-100 hover:!bg-primary-600 hover:!text-white !rounded-lg !px-4 !py-2"
                    >
                        Cancel
                    </CommonButton>

                    <div className="h-4 w-[1px] bg-slate-700 mx-2"></div>

                    {onAddLine && (
                        <CommonButton
                            type="button"
                            variant="ghost"
                            onClick={onAddLine}
                            className="!border-primary-600 !text-primary-100 hover:!bg-primary-600 hover:!text-white !rounded-lg !px-4 !py-2"
                        >
                            Add lines
                        </CommonButton>
                    )}
                    {onClearRows && (
                        <CommonButton
                            type="button"
                            variant="ghost"
                            onClick={onClearRows}
                            className="!border-primary-600 !text-primary-100 hover:!bg-primary-600 hover:!text-white !rounded-lg !px-4 !py-2"
                        >
                            Clear all lines
                        </CommonButton>
                    )}
                </div>

                {/* Middle - More Options */}
                <div className="flex items-center justify-center">
                    {resolvedMoreOptions && (
                        <MoreOptionsMenu
                            copyRoute={resolvedMoreOptions.copyRoute}
                            deleteRoute={resolvedMoreOptions.deleteRoute}
                            printRoute={resolvedMoreOptions.printRoute}
                            voidRoute={resolvedMoreOptions.voidRoute}
                            isVoided={resolvedMoreOptions.isVoided}
                            documentType={resolvedMoreOptions.documentType}
                            recordId={resolvedMoreOptions.recordId}
                            listRoute={resolvedMoreOptions.listRoute}
                        />
                    )}
                </div>

                {/* Right - Unified Save Button */}
                <div className="flex items-center gap-4">
                    <SplitSaveButton
                        onSave={onSave}
                        onSaveAndClose={onSaveAndClose}
                        onSaveAndNew={onSaveAndNew}
                        processing={processing}
                        lastAction={lastAction}
                    />
                </div>
            </div>
            <ToastNotification />
        </div>
    );
}
