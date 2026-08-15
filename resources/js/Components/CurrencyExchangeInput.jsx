import React, { useEffect, useState } from 'react';
import CommonInput from "@/Components/CommonInput";
import axios from 'axios';

export default function CurrencyExchangeInput({
    auth,
    selectedAccount,
    exchangeRate,
    onExchangeRateChange,
    error,
    transactionDate,
    isEdit = false
}) {
    const { multi_enabled, home_id } = auth?.currency || {};
    const [currencies, setCurrencies] = useState([]);
    const [isFetching, setIsFetching] = useState(false);

    const getFlagEmoji = (currencyCode) => {
        if (!currencyCode || currencyCode.length < 2) return '';
        const code = currencyCode.substring(0, 2).toUpperCase();
        return String.fromCodePoint(...[...code].map(c => c.charCodeAt(0) + 127397));
    };

    useEffect(() => {
        if (multi_enabled) {
            axios.get(route('api.currencies'))
                .then(res => setCurrencies(res.data))
                .catch(err => console.error("Error fetching currencies", err));
        }
    }, [multi_enabled]);

    const isForeignCurrency = selectedAccount?.currency_id && selectedAccount?.currency_id !== home_id;
    const homeCurrency = currencies.find(c => String(c.id) === String(home_id));
    const foreignCurrency = currencies.find(c => String(c.id) === String(selectedAccount?.currency_id));

    const homeCode = homeCurrency?.code || auth?.company?.home_currency || 'Base';
    const foreignCode = foreignCurrency?.code || selectedAccount?.currency_code || 'Foreign';

    const isInitialMount = React.useRef(true);

    useEffect(() => {
        if (multi_enabled && isForeignCurrency && homeCode !== 'Base' && foreignCode !== 'Foreign') {
            if (isEdit && isInitialMount.current) {
                isInitialMount.current = false;
                return;
            }
            isInitialMount.current = false;

            setIsFetching(true);
            const queryParams = new URLSearchParams({
                base: foreignCode,
                quote: homeCode,
            });
            if (transactionDate) {
                queryParams.append('date', transactionDate);
            }

            axios.get(`/api/exchange-rate?${queryParams.toString()}`)
                .then(res => {
                    if (res.data?.rate) {
                        onExchangeRateChange(res.data.rate);
                    }
                })
                .catch(err => console.error("Error fetching exchange rate:", err))
                .finally(() => setIsFetching(false));
        }
    }, [multi_enabled, isForeignCurrency, homeCode, foreignCode, transactionDate, isEdit]);

    if (!multi_enabled || !isForeignCurrency) {
        return null;
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500 whitespace-nowrap">
                        <span className="mr-1">{getFlagEmoji(foreignCode)}</span>
                        1 {foreignCode} =
                    </span>
                    <div className="w-[120px]">
                        <CommonInput
                            type="number"
                            step="0.000001"
                            min="0.000001"
                            value={exchangeRate || ''}
                            onChange={(e) => onExchangeRateChange(e.target.value)}
                            error={error}
                            placeholder="Rate"
                            size="sm"
                            disabled={isFetching}
                        />
                    </div>
                    <span className="text-sm font-medium text-slate-500">
                        <span className="mr-1">{getFlagEmoji(homeCode)}</span>
                        {homeCode}
                    </span>
                </div>
            </div>
            {isFetching && (
                <div className="text-xs text-blue-500 font-medium">Fetching latest exchange rate...</div>
            )}
        </div>
    );
}
