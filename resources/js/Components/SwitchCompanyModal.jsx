import { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';
import { Link } from '@inertiajs/react';
import axios from 'axios';

export default function SwitchCompanyModal({ isOpen, onClose }) {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setError(null);
            axios.get(route('sso.companies'))
                .then(response => {
                    setCompanies(response.data.companies || []);
                })
                .catch(err => {
                    setError('Failed to load companies.');
                    console.error(err);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [isOpen]);

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <h2 className="text-lg font-medium text-slate-900 mb-4">
                    Switch Company
                </h2>
                <p className="text-sm text-slate-600 mb-6">
                    Select a company to switch your active session to.
                </p>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="text-red-600 text-sm py-4 text-center">
                        {error}
                    </div>
                ) : companies.length === 0 ? (
                    <div className="text-slate-500 text-sm py-4 text-center">
                        No other companies available to switch to.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {companies.map((company, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="font-medium text-slate-900 flex items-center gap-2 text-sm">
                                    🏢 {company.name}
                                </div>
                                <Link
                                    as="button"
                                    method="post"
                                    href={route('sso.switch')}
                                    data={{ target_domain: company.domain }}
                                    className="px-3 py-1.5 bg-slate-800 text-white rounded text-xs font-semibold hover:bg-slate-700 transition-colors"
                                >
                                    Switch
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
}
