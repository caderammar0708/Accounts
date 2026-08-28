import { router, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import MoreOptionsMenu from '@/Components/MoreOptionsMenu';
import RecentTransactionHistory from '@/Components/RecentTransactionHistory';
import CommonButton from '@/Components/CommonButton';

export default function TransactionHeader({ title, amount, historyType = null, dirty = false, onClose, moreOptions = null }) {
    const { auth } = usePage().props;
    const company = auth.company;
    const currencyPrefix = company?.home_currency_prefix || company?.home_currency || '';

    return (
        <div className="flex items-center justify-between border-b px-6 py-1.5 bg-white">

            {/* LEFT SIDE */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    {historyType ? (
                        <RecentTransactionHistory historyType={historyType} dirty={dirty}>
                            <ApplicationLogo className="h-7 w-auto hover:opacity-80 transition-opacity" />
                        </RecentTransactionHistory>
                    ) : (
                        <ApplicationLogo className="h-7 w-auto" />
                    )}
                    <div className="h-6 w-px bg-slate-200 mx-1" />
                    <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        {title}
                        {moreOptions?.isVoided && (
                            <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20 uppercase tracking-wider">
                                Voided
                            </span>
                        )}
                    </h1>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-6">
                {/* Icons */}
                <div className="flex items-center gap-4 text-gray-500 text-sm">
                    <CommonButton
                        onClick={onClose || (() => router.get(route('dashboard')))}
                        variant="ghost"
                        className="!p-2 hover:bg-slate-100 !rounded-lg"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </CommonButton>
                </div>
            </div>
        </div>
    );
}
