import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrintSettings from './Partials/PrintSettings';

export default function Print({ auth, settings }) {
    return (
        <AuthenticatedLayout user={auth.user} header="Print Settings">
            <Head title="Print Settings" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Print Settings</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Manage document templates and print layouts.</p>
                </div>
                <div className="flex flex-col gap-6">
                    <main className="flex-1">
                        <div className="rounded-2xl min-h-[500px]">
                            <PrintSettings settings={settings} />
                        </div>
                    </main>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
