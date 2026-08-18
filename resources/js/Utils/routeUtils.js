export const getEditRoute = (typeOrTx) => {
    const type = typeof typeOrTx === 'object' && typeOrTx !== null
        ? (typeOrTx.transaction_type || typeOrTx.type || '')
        : typeOrTx;

    if (!type) return 'journal-entries.edit';
    const normalized = String(type).toLowerCase().replace(/[-\s]/g, '_');

    switch (normalized) {
        case 'pos':
            return 'pos.edit';
        case 'sales_invoice':
        case 'sales_receipt':
        case 'sale':
            return 'sales-invoice.edit';
        case 'credit_invoice':
        case 'invoice':
            return 'credit-invoice.edit';
        case 'receive_payment':
            return 'receive-payment.edit';
        case 'invoice_return':
            return 'invoice-return.edit';

        case 'payment':
            return 'payment.edit';
        case 'bill':
            return 'bill.edit';
        case 'pay_bill':
            return 'pay-bill.edit';
        case 'bill_return':
            return 'bill-return.edit';
        case 'cheque':
            return 'cheque.edit';
        case 'cheque_deposit':
            return 'cheque-deposit.edit';

        case 'bank_deposit':
            return 'bank-deposit.edit';
        case 'transfer':
            return 'transfer.edit';
        case 'inventory_quantity_adjustment':
        case 'inventory_adjustment':
            return 'inventory-adjustment.edit';
        default:
            return 'journal-entries.edit';
    }
};

export const getTransactionUrl = (tx) => {
    if (!tx) return '#';
    const id = tx.journal_entry_id || tx.invoice_id || tx.id;
    if (!id) return '#';
    const routeName = getEditRoute(tx);
    try {
        return route(routeName, id);
    } catch (e) {
        console.error('Error generating route for transaction:', e, tx);
        return '#';
    }
};
