import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CompanySettings from './Partials/CompanySettings';

export default function Company({ auth, settings, currencies }) {
    return (
        <AuthenticatedLayout user={auth.user} header="Company Settings">
            <Head title="Company Settings" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Company Settings</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Manage your company preferences and configurations.</p>
                </div>
                <div className="flex flex-col gap-6">
                    <main className="flex-1">
                        <div className="rounded-2xl min-h-[500px]">
                            <CompanySettings settings={settings} currencies={currencies} />
                        </div>
                    </main>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
