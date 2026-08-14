import React, { useEffect, useState } from 'react';
import CommonInput from "@/Components/CommonInput";
import axios from 'axios';

export default function CurrencyExchangeInput({
    auth,
    selectedAccount,
    exchangeRate,
    onExchangeRateChange,
    error
}) {
    const { multi_enabled, home_id } = auth?.currency || {};
    const [currencies, setCurrencies] = useState([]);

    useEffect(() => {
        if (multi_enabled) {
            axios.get(route('api.currencies'))
                .then(res => setCurrencies(res.data))
                .catch(err => console.error("Error fetching currencies", err));
        }
    }, [multi_enabled]);

    if (!multi_enabled) {
        return null;
    }

    // Check if selectedAccount has currency details
    const isForeignCurrency = selectedAccount?.currency_id && selectedAccount?.currency_id !== home_id;

    if (!isForeignCurrency) {
        return null;
    }

    const homeCurrency = currencies.find(c => c.id === home_id);
    const foreignCurrency = currencies.find(c => c.id === selectedAccount?.currency_id);

    const homeCode = homeCurrency?.code || 'Base';
    const foreignCode = foreignCurrency?.code || selectedAccount?.currency_code || 'Foreign';

    return (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-4">
            <div className="text-sm text-slate-600">
                <p className="font-semibold text-slate-800">Foreign Currency Selected ({foreignCode})</p>
                <p>Please provide the exchange rate.</p>
            </div>
            
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-500 whitespace-nowrap">1 {foreignCode} =</span>
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
                    />
                </div>
                <span className="text-sm font-medium text-slate-500">{homeCode}</span>
            </div>
        </div>
    );
}
