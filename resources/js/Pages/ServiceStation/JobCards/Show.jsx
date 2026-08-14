import React, { useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';

export default function Show({ auth, jobCard }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const { data, setData, put, processing } = useForm({
        customer_id: jobCard.customer_id,
        device_id: jobCard.device_id,
        service_date: jobCard.service_date.split('T')[0],
        complaint: jobCard.complaint,
        technician_assigned: jobCard.technician_assigned,
        estimated_delivery_date: jobCard.estimated_delivery_date,
        estimated_cost: jobCard.estimated_cost,
        status: jobCard.status,
        customer_signature: jobCard.customer_signature || ''
    });

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        ctx.beginPath();
        // Support for both mouse and touch
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        ctx.moveTo(clientX - rect.left, clientY - rect.top);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setData('customer_signature', '');
    };

    const saveSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const dataUrl = canvas.toDataURL();
            setData('customer_signature', dataUrl);

            // Immediately submit update
            setTimeout(() => {
                put(route('job-cards.update', jobCard.id));
            }, 100);
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} header="View Job Registration">
            <Head title={`Job Registration ${jobCard.job_card_number}`} />

            <div className="py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="flex justify-between items-center mb-6 print:hidden">
                        <Link href={route('job-cards.index')}>
                            <CommonButton variant="ghost">Back to List</CommonButton>
                        </Link>
                        <div className="flex gap-2">
                            <Link href={route('job-cards.edit', jobCard.id)}>
                                <CommonButton variant="ghost">Edit</CommonButton>
                            </Link>
                            <CommonButton variant="primary" onClick={() => window.print()}>Print</CommonButton>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200" id="print-area">
                        <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">JOB REGISTRATION</h1>
                                <p className="text-slate-500 mt-1">#{jobCard.job_card_number}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-slate-800">Date: {new Date(jobCard.service_date).toLocaleDateString()}</p>
                                <p className="text-slate-600">Status: <span className="font-semibold">{jobCard.status}</span></p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Customer Details</h3>
                                <p className="font-bold text-slate-800">{jobCard.customer?.display_name}</p>
                                <p className="text-sm text-slate-600">{jobCard.customer?.phone_number}</p>
                                <p className="text-sm text-slate-600">{jobCard.customer?.email}</p>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Device / Vehicle Details</h3>
                                {jobCard.device ? (
                                    <>
                                        <p className="font-bold text-slate-800">{jobCard.device.brand} {jobCard.device.model}</p>
                                        {jobCard.device.vehicle_number && <p className="text-sm text-slate-600">Reg: {jobCard.device.vehicle_number}</p>}
                                        {jobCard.device.chassis_number && <p className="text-sm text-slate-600">Chassis: {jobCard.device.chassis_number}</p>}
                                        {jobCard.device.serial_number && <p className="text-sm text-slate-600">Serial: {jobCard.device.serial_number}</p>}
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-500 italic">No device selected</p>
                                )}
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Complaint / Issue</h3>
                            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 whitespace-pre-wrap min-h-[100px]">
                                {jobCard.complaint || 'No details provided.'}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="block text-xs text-slate-500 uppercase">Technician</span>
                                <span className="font-semibold text-slate-800">{jobCard.technician_assigned || 'Unassigned'}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="block text-xs text-slate-500 uppercase">Est. Delivery</span>
                                <span className="font-semibold text-slate-800">{jobCard.estimated_delivery_date ? new Date(jobCard.estimated_delivery_date).toLocaleDateString() : 'TBD'}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="block text-xs text-slate-500 uppercase">Est. Cost</span>
                                <span className="font-semibold text-slate-800">{jobCard.estimated_cost ? `${jobCard.currency_prefix || ''} ${jobCard.estimated_cost}` : 'TBD'}</span>
                            </div>
                        </div>

                        {jobCard.photos && jobCard.photos.length > 0 && (
                            <div className="mb-8 print:hidden">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Photos Before Repair</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    {jobCard.photos.map((photo, index) => (
                                        <img key={index} src={`/storage/${photo}`} alt={`Before repair ${index + 1}`} className="w-full h-32 object-cover rounded-lg border border-slate-200" />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-12 pt-8 border-t border-slate-200">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-slate-500 mb-4">Customer Signature</p>

                                    {jobCard.customer_signature ? (
                                        <div className="border-b border-slate-400 pb-2 mb-2 w-[300px]">
                                            <img src={jobCard.customer_signature} alt="Customer Signature" className="h-[100px] object-contain" />
                                        </div>
                                    ) : (
                                        <div className="print:hidden">
                                            <div className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 mb-2">
                                                <canvas
                                                    ref={canvasRef}
                                                    width={300}
                                                    height={100}
                                                    onMouseDown={startDrawing}
                                                    onMouseMove={draw}
                                                    onMouseUp={stopDrawing}
                                                    onMouseOut={stopDrawing}
                                                    onTouchStart={startDrawing}
                                                    onTouchMove={draw}
                                                    onTouchEnd={stopDrawing}
                                                    className="cursor-crosshair bg-white w-full rounded-lg"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <CommonButton variant="ghost" size="xs" onClick={clearSignature} type="button">Clear</CommonButton>
                                                <CommonButton variant="primary" size="xs" onClick={saveSignature} processing={processing} type="button">Save Signature</CommonButton>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-sm font-bold text-slate-800">{jobCard.customer?.display_name}</p>
                                </div>

                                <div className="text-right">
                                    <div className="border-b border-slate-400 pb-2 mb-2 w-[250px] inline-block"></div>
                                    <p className="text-xs text-slate-500">Authorized Signature</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
