import { Head } from '@inertiajs/react';
import SettingsLayout from './Layout/SettingsLayout';
import CompanySettings from './Partials/CompanySettings';
import PrintSettings from './Partials/PrintSettings';

export default function Index({ auth, tab, settings, currencies }) {
    const pageTitle = tab === 'print' ? 'Print Settings' : 'Company Settings';
    
    return (
        <SettingsLayout activeTab={tab}>
            <Head title={pageTitle} />
            {tab === 'company' && <CompanySettings settings={settings} currencies={currencies} />}
            {tab === 'print' && <PrintSettings settings={settings} />}
            {/* Fallback code remains same */}
        </SettingsLayout>
    );
}
