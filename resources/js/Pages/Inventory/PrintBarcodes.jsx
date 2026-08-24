import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import Barcode from 'react-barcode';

export default function PrintBarcodes({ item, count }) {
    // Automatically trigger print dialog when component mounts
    useEffect(() => {
        // slight delay to allow rendering
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    // Create array of N elements
    const barcodes = Array.from({ length: count });

    return (
        <>
            <Head title={`Print Barcodes - ${item.name}`} />
            
            {/* Global styles specifically for 2" / 3" thermal printers */}
            <style>{`
                @page {
                    size: 80mm 50mm; /* approximate size of a common barcode label */
                    margin: 0;
                }
                body {
                    margin: 0;
                    padding: 0;
                    background: white;
                }
                .label-container {
                    width: 100%;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    page-break-after: always;
                    box-sizing: border-box;
                    padding: 2mm;
                }
                @media print {
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="no-print p-4 bg-yellow-50 text-yellow-800 text-center font-bold">
                Preparing to print {count} barcode(s) for {item.name}...
                <br />
                <button onClick={() => window.print()} className="mt-2 text-primary underline">Click here if print dialog doesn't open</button>
            </div>

            <div className="bg-white">
                {barcodes.map((_, index) => (
                    <div key={index} className="label-container">
                        <div className="text-[10px] font-bold text-center leading-tight mb-1 truncate w-full px-2" style={{ maxWidth: '100%' }}>
                            {item.name}
                        </div>
                        <Barcode 
                            value={item.sku}
                            width={1.5}
                            height={40}
                            fontSize={12}
                            margin={0}
                            displayValue={true}
                        />
                        {item.sale_price && (
                            <div className="text-[11px] font-black mt-1">
                                Rs. {Number(item.sale_price).toFixed(2)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </>
    );
}
