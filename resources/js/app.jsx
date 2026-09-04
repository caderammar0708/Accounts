import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const appName = import.meta.env.VITE_APP_NAME || 'JBooks';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: async (name) => {
        const page = await resolvePageComponent(
            [`./Pages/${name}.jsx`, `./Pages/${name}.tsx`], import.meta.glob('./Pages/**/*.{jsx,tsx}'),
        );
        if ((name.startsWith('Payroll/') || name.startsWith('Admin/')) && page.default.layout === undefined) {
            page.default.layout = (page) => <AuthenticatedLayout>{page}</AuthenticatedLayout>;
        }
        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
