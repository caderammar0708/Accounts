import React from 'react';
import ReportLayout from '@/Layouts/ReportLayout';
import { Head, router } from '@inertiajs/react';
import ReportDateFilter from '@/Components/ReportDateFilter';
import { useDateFormat, formatDate } from '@/Utils/dateFormat';
import ReportCurrency from '@/Components/ReportCurrency';

export default function VehicleHistory({ receipts, filters, auth }) {
    const dateFormat = useDateFormat();
    const homeCurrency = auth.company?.home_currency_prefix || auth.company?.home_currency || '';

    const Currency = ({ value, className = '' }) => (
        <ReportCurrency value={value} currency={homeCurrency} className={className} />
    );

    const handleFilterChange = (newFilters) => {
        router.get(route('reports.vehicle-history'), {
            start_date: newFilters.start_date,
            end_date: newFilters.end_date,
            type: newFilters.type,
            vehicle_id: filters.vehicle_id
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExportExcel = () => {
        const companyName = auth.company?.company_name || 'Company';
        let csvContent = `"${companyName}"\n"Vehicle History Report"\n`;
        csvContent += `"Date Range: ${filters.start_date} to ${filters.end_date}"\n\n`;
        csvContent += `"Vehicle No","Brand & Model","Service Date","Receipt No","Customer","Product/Service","Quantity","Rate","Amount (${homeCurrency})"\n`;

        receipts.forEach(receipt => {
            const vehicleStr = receipt.vehicle ? `${receipt.vehicle.vehicle_no} (${receipt.vehicle.brand} ${receipt.vehicle.model})` : 'Walk-in';
            const customerName = receipt.customer ? receipt.customer.first_name + ' ' + receipt.customer.last_name : '-';
            
            receipt.items.forEach(item => {
                const productName = item.item ? item.item.name : item.description;
                csvContent += `"${receipt.vehicle?.vehicle_no || ''}","${receipt.vehicle ? receipt.vehicle.brand + ' ' + receipt.vehicle.model : ''}","${receipt.receipt_date}","${receipt.receipt_no}","${customerName}","${productName}",${item.quantity},${item.rate},${item.amount}\n`;
            });
            csvContent += `"","","","","","Total for ${receipt.receipt_no}","",,"${receipt.total_amount}"\n\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Vehicle_History_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filterElements = (
        <ReportDateFilter
            currentFilter={{ start_date: filters.start_date, end_date: filters.end_date, type: filters.type }}
            onFilterChange={handleFilterChange}
        />
    );

    // Group receipts by vehicle
    const groupedReceipts = receipts.reduce((acc, receipt) => {
        const key = receipt.vehicle_id || 'unassigned';
        if (!acc[key]) {
            acc[key] = {
                vehicle: receipt.vehicle,
                receipts: []
            };
        }
        acc[key].receipts.push(receipt);
        return acc;
    }, {});

    const vehicleGroups = Object.values(groupedReceipts);

    return (
        <ReportLayout
            title="Vehicle History"
            filters={filterElements}
            onExportExcel={handleExportExcel}
        >
            <Head title="Vehicle History Report" />

            <div className="text-center mb-8 font-serif">
                <h2 className="text-xl font-bold text-gray-900">Vehicle History & Sales Report</h2>
                <h3 className="text-sm text-gray-700 mt-1">{auth.company?.company_name}</h3>
                <p className="text-[13px] text-gray-500 mt-1">
                    {filters.start_date ? formatDate(filters.start_date, dateFormat) : 'Beginning'} - {formatDate(filters.end_date, dateFormat)}
                </p>
            </div>

            <div className="w-full overflow-x-auto pb-10">
                <table className="min-w-full text-[13px] text-left border-collapse">
                    <thead>
                        <tr className="border-y-2 border-gray-300 bg-slate-50">
                            <th className="py-2.5 px-3 font-semibold text-gray-900 whitespace-nowrap min-w-[110px]">Service Date</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-900 whitespace-nowrap min-w-[120px]">Receipt No</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-900 min-w-[200px]">Product / Service</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-900 text-right whitespace-nowrap min-w-[120px]">Rate</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-900 text-center whitespace-nowrap min-w-[80px]">Qty</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-900 text-right whitespace-nowrap min-w-[130px]">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {vehicleGroups.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-gray-500">
                                    No records found for this period.
                                </td>
                            </tr>
                        ) : (
                            vehicleGroups.map((group, index) => (
                                <React.Fragment key={index}>
                                    <tr className="bg-primary-50">
                                        <td colSpan="6" className="py-2.5 px-3 font-bold text-primary-900 whitespace-nowrap">
                                            {group.vehicle 
                                                ? `Vehicle: ${group.vehicle.vehicle_no} - ${group.vehicle.brand} ${group.vehicle.model}` 
                                                : 'Walk-in / Unassigned'}
                                        </td>
                                    </tr>
                                    {group.receipts.map(receipt => (
                                        <React.Fragment key={receipt.id}>
                                            {receipt.items.map((item, itemIdx) => (
                                                <tr key={item.id} className="hover:bg-slate-50 transition-colors bg-white">
                                                    {itemIdx === 0 ? (
                                                        <>
                                                            <td className="py-2 px-3 text-gray-600 align-top whitespace-nowrap" rowSpan={receipt.items.length}>
                                                                {receipt.receipt_date}
                                                            </td>
                                                            <td className="py-2 px-3 text-gray-600 align-top whitespace-nowrap" rowSpan={receipt.items.length}>
                                                                {receipt.receipt_no}
                                                            </td>
                                                        </>
                                                    ) : null}
                                                    <td className="py-2 px-3 text-gray-800">
                                                        {item.item ? item.item.name : item.description}
                                                    </td>
                                                    <td className="py-2 px-3 text-right whitespace-nowrap text-gray-600">
                                                        {item.rate ? <Currency value={item.rate} /> : '-'}
                                                    </td>
                                                    <td className="py-2 px-3 text-center whitespace-nowrap text-gray-900">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="py-2 px-3 text-right whitespace-nowrap font-medium text-gray-900">
                                                        <Currency value={item.amount} />
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="border-b border-gray-200">
                                                <td colSpan="5" className="py-2 px-3 font-semibold text-gray-700 text-right bg-slate-50 whitespace-nowrap">
                                                    Total for {receipt.receipt_no}
                                                </td>
                                                <td className="py-2 px-3 text-right font-bold text-gray-900 whitespace-nowrap bg-slate-50">
                                                    <Currency value={receipt.total_amount} />
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                    <tr>
                                        <td colSpan="6" className="h-6"></td>
                                    </tr>
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </ReportLayout>
    );
}
