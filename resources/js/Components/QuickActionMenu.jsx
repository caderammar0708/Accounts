import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

/**
 * A QuickBooks-style categorized mega-menu for quick global actions.
 */
export default function QuickActionMenu({ isOpen, onClose, onOpenQuickAdd }) {
    const menuRef = useRef(null);
    const page = usePage();
    const displayAsButtons = page.props.auth.reports_display_as_buttons ?? true;

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const categories = [
        {
            title: "Customers",
            links: [
                { name: "Add Customer", action: 'customer', isSolid: true },
                ...(page.props.auth.pos_layout_enabled ? [{ name: "POS Billing", href: route('pos.index') }] : []),
                { name: "Sales Invoice", href: route('sales-invoice.create') },
                { name: "Credit Invoice", href: route('credit-invoice.create') },
                { name: "Receive Payment", href: route('receive-payment.create') },
                { name: "Invoice Return", href: route('invoice-return.create') },
            ]
        },
        {
            title: "Suppliers",
            links: [
                { name: "Add Supplier", action: 'supplier', isSolid: true },
                { name: "Payment", href: route('payment.create') },
                { name: "Bill", href: route('bill.create') },
                { name: "Pay Bill", href: route('pay-bill.create') },
                { name: "Bill Return", href: route('bill-return.create') },
                { name: "Cheque", href: route('cheque.create') },
            ]
        },
        {
            title: "Other",
            links: [
                { name: "Add Account", action: 'account', isSolid: true },
                { name: "Bank Deposit", href: route('bank-deposit.create') },
                { name: "Cheque Deposit", href: route('cheque-deposit.create') },
                { name: "Transfer", href: route('transfer.create') },
                { name: "Journal entry", href: route('journal') },
                { name: "Inventory Qty Adj", href: route('inventory-adjustment.create') },
            ]
        }
    ];

    // Style helpers — behaviour is identical; only appearance changes
    const getLinkClass = (isSolid) => {
        if (displayAsButtons) {
            return `block w-full text-left px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors ${isSolid
                ? 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 mb-2'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                }`;
        }
        return `block w-full text-left text-xs font-medium transition-colors py-1 ${isSolid
            ? 'text-primary-700 hover:text-primary-900 font-semibold mb-1'
            : 'text-slate-600 hover:text-slate-900 hover:underline underline-offset-2'
            }`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-start pl-4 pt-4 lg:pl-6 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div
                ref={menuRef}
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[600px] overflow-hidden animate-in zoom-in-95 duration-200"
            >
                {/* Content Grid */}
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="flex flex-col space-y-1.5">
                            {cat.links.map((link, lIdx) => (
                                link.href ? (
                                    <Link
                                        key={lIdx}
                                        href={link.href}
                                        onClick={onClose}
                                        className={getLinkClass(link.isSolid)}
                                    >
                                        {link.isSolid && <span className="mr-1.5 font-bold">+</span>}
                                        {link.name}
                                    </Link>
                                ) : (
                                    <button
                                        key={lIdx}
                                        type="button"
                                        onClick={() => {
                                            if (link.action && onOpenQuickAdd) {
                                                onOpenQuickAdd(link.action);
                                            } else {
                                                onClose();
                                            }
                                        }}
                                        className={getLinkClass(link.isSolid)}
                                    >
                                        {link.isSolid && <span className="mr-1.5 font-bold">+</span>}
                                        {link.name}
                                    </button>
                                )
            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
