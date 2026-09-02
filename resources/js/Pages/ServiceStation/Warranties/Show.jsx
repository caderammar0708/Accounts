import { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';
import Modal from '@/Components/Modal';
import SearchableSelect from '@/Components/SearchableSelect';
import CommonInput from '@/Components/CommonInput';

export default function Show({ auth, warranty, resolvedInvoices = [] }) {
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const [activeClaimId, setActiveClaimId] = useState(null);
    const [showResolutionModal, setShowResolutionModal] = useState(false);
    const isActiveWarranty = warranty.status === 'active';

    const { data: claimData, setData: setClaimData, post, processing, reset } = useForm({
        claim_date: new Date().toISOString().split('T')[0],
        odometer_at_claim: '',
        issue_description: '',
    });

    const { data: resolutionData, setData: setResolutionData, patch, processing: isResolutionProcessing, reset: resetResolution } = useForm({
        resolution: '',
        resolved_invoice_id: '',
    });

    const requiresOdometer = useMemo(() => {
        return warranty.warranty_policy?.expiry_rule && warranty.warranty_policy.expiry_rule !== 'days_only';
    }, [warranty.warranty_policy?.expiry_rule]);

    const openClaimModal = () => {
        reset('claim_date', 'odometer_at_claim', 'issue_description');
        setClaimData('claim_date', new Date().toISOString().split('T')[0]);
        setIsClaimModalOpen(true);
    };

    const submitClaim = (e) => {
        e.preventDefault();
        post(route('warranty-claims.store', { warranty: warranty.id }), {
            onSuccess: () => {
                setIsClaimModalOpen(false);
                reset();
            },
            preserveScroll: true,
        });
    };

    const openResolutionModal = (claim) => {
        setActiveClaimId(claim.id);
        setResolutionData('resolution', claim.resolution || '');
        setResolutionData('resolved_invoice_id', claim.resolved_invoice_id || '');
        setShowResolutionModal(true);
    };

    const submitResolution = (e) => {
        e.preventDefault();
        patch(route('warranty-claims.update', activeClaimId), {
            onSuccess: () => {
                setShowResolutionModal(false);
                setActiveClaimId(null);
                resetResolution();
            },
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout user={auth.user} header="Warranty Details">
            <Head title="Warranty Details" />

            <div className="py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 space-y-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">Warranty #{warranty.id}</h1>
                                    <p className="text-sm text-slate-500 mt-1">{warranty.warranty_policy?.name || 'No policy assigned'}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {isActiveWarranty && (
                                        <CommonButton variant="primary" onClick={openClaimModal}>File a Claim</CommonButton>
                                    )}
                                    <Link href={route('warranties.index')}>
                                        <CommonButton variant="secondary">Back to list</CommonButton>
                                    </Link>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Customer</h2>
                                    <p className="text-sm text-slate-800">{warranty.customer?.display_name || 'N/A'}</p>
                                    <p className="text-xs text-slate-500 mt-1">{warranty.customer?.email || ''}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Vehicle</h2>
                                    <p className="text-sm text-slate-800">{warranty.vehicle?.vehicle_no || 'Unassigned'}</p>
                                    <p className="text-xs text-slate-500 mt-1">{warranty.vehicle?.brand || ''} {warranty.vehicle?.model || ''}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 p-4">
                                    <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Warranty Period</div>
                                    <div className="text-sm text-slate-800">{warranty.start_date} to {warranty.end_date || 'Ongoing'}</div>
                                    <div className="text-xs text-slate-500 mt-1">Odometer: {warranty.start_odometer || 'N/A'} to {warranty.end_odometer || 'N/A'}</div>
                                </div>
                                <div className="rounded-xl border border-slate-200 p-4">
                                    <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Status</div>
                                    <div className="text-sm font-bold text-slate-800 capitalize">{warranty.status}</div>
                                    <div className="text-xs text-slate-500 mt-1">Policy: {warranty.warranty_policy?.expiry_rule?.replace('_', ' ')}</div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4">
                                <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">Policy Terms</h2>
                                <p className="text-sm text-slate-700 whitespace-pre-line">{warranty.warranty_policy?.terms_text || 'No terms provided.'}</p>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <div>
                                        <h2 className="text-xs uppercase tracking-widest text-slate-500">Claims History</h2>
                                        <p className="text-sm text-slate-500 mt-1">Recent claim activity for this warranty.</p>
                                    </div>
                                </div>

                                {warranty.claims?.length ? (
                                    <div className="space-y-3">
                                        {warranty.claims.slice().sort((a,b) => new Date(b.claim_date || b.created_at) - new Date(a.claim_date || a.created_at)).map((claim) => (
                                            <div key={claim.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-800">{claim.issue_description}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Claim date: {claim.claim_date || 'N/A'}</div>
                                                        {claim.odometer_at_claim ? <div className="text-xs text-slate-500">Odometer: {claim.odometer_at_claim}</div> : null}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <CommonButton variant="ghost" size="xs" onClick={() => openResolutionModal(claim)}>Add Resolution</CommonButton>
                                                    </div>
                                                </div>
                                                <div className="mt-3 text-sm text-slate-700">
                                                    <div><span className="font-semibold">Resolution:</span> {claim.resolution || 'Pending'}</div>
                                                    {claim.resolved_invoice ? (
                                                        <div className="mt-1 text-xs text-slate-500">Resolved invoice: {claim.resolved_invoice.receipt_no}</div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">No claims logged yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={isClaimModalOpen} onClose={() => setIsClaimModalOpen(false)} maxWidth="md">
                <form onSubmit={submitClaim} className="p-4 sm:p-5 space-y-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">File Warranty Claim</h3>
                        <p className="text-sm text-slate-500 mt-1">Record a customer issue and attach the claim to this warranty.</p>
                    </div>

                    <div>
                        <CommonInput
                            type="textarea"
                            label="Issue Description"
                            value={claimData.issue_description}
                            onChange={(e) => setClaimData('issue_description', e.target.value)}
                            rows={2}
                            required
                        />
                    </div>

                    {requiresOdometer && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Odometer at Claim</label>
                            <input
                                type="number"
                                value={claimData.odometer_at_claim}
                                onChange={(e) => setClaimData('odometer_at_claim', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                required={requiresOdometer}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Claim Date</label>
                        <input
                            type="date"
                            value={claimData.claim_date}
                            onChange={(e) => setClaimData('claim_date', e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <CommonButton variant="secondary" type="button" onClick={() => setIsClaimModalOpen(false)}>Cancel</CommonButton>
                        <CommonButton variant="primary" type="submit" processing={processing}>Save Claim</CommonButton>
                    </div>
                </form>
            </Modal>

            <Modal show={showResolutionModal} onClose={() => setShowResolutionModal(false)} maxWidth="md">
                <form onSubmit={submitResolution} className="p-4 sm:p-5 space-y-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Add Resolution</h3>
                        <p className="text-sm text-slate-500 mt-1">Record the outcome and link a resolved invoice if needed.</p>
                    </div>

                    <div>
                        <CommonInput
                            type="textarea"
                            label="Resolution"
                            value={resolutionData.resolution}
                            onChange={(e) => setResolutionData('resolution', e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Resolved Invoice</label>
                        <SearchableSelect
                            value={resolutionData.resolved_invoice_id}
                            onChange={(val) => setResolutionData('resolved_invoice_id', val)}
                            placeholder="Select resolved invoice"
                            fetchUrl={warranty.customer?.id ? route('api.customers.credit_invoices', { customer: warranty.customer.id }) : null}
                            hideLabel={true}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <CommonButton variant="secondary" type="button" onClick={() => setShowResolutionModal(false)}>Cancel</CommonButton>
                        <CommonButton variant="primary" type="submit" processing={isResolutionProcessing}>Save Resolution</CommonButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
