import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    const page = usePage();
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {/* Switch Company Section */}
                    {page.props.sso_companies && page.props.sso_companies.length > 0 && (
                        <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                            <section className="max-w-xl">
                                <header>
                                    <h2 className="text-lg font-medium text-gray-900">
                                        Switch Company
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Access your account on a different company domain without logging in again.
                                    </p>
                                </header>
                                <div className="mt-6 space-y-4">
                                    {page.props.sso_companies.map((company, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                                            <div className="font-medium text-gray-900 flex items-center gap-2">
                                                🏢 {company.name}
                                            </div>
                                            <Link
                                                as="button"
                                                method="post"
                                                href={route('sso.switch')}
                                                data={{ target_domain: company.domain }}
                                                className="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                            >
                                                Switch
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
