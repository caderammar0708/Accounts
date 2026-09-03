const fs = require('fs');
const glob = require('glob');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        if (fs.statSync(dirFile).isDirectory()) {
            filelist = walkSync(dirFile, filelist);
        } else if (dirFile.endsWith('.tsx') || dirFile.endsWith('.jsx')) {
            filelist.push(dirFile);
        }
    });
    return filelist;
};

const dirs = [
    'C:/develop/xampp/htdocs/jbooks-client/resources/js/Pages/Payroll',
    'C:/develop/xampp/htdocs/jbooks-client/resources/js/Pages/Admin/Approvals'
];

dirs.forEach(dir => {
    walkSync(dir).forEach(f => {
        let content = fs.readFileSync(f, 'utf-8');
        let changed = false;

        if (content.includes('@inertiajs/inertia-react')) {
            content = content.replace(/@inertiajs\/inertia-react/g, '@inertiajs/react');
            changed = true;
        }

        if (content.includes('@inertiajs/inertia')) {
            content = content.replace(/import\s*\{\s*Inertia(.*)\s*\}\s*from\s*['"]@inertiajs\/inertia['"];?/g, 'import { router as Inertia$1 } from \'@inertiajs/react\';');
            content = content.replace(/import\s*\{\s*Page.*?\}\s*from\s*['"]@inertiajs\/inertia['"];?/g, '');
            content = content.replace(/import\s*\{\s*Inertia,\s*Page.*?\}\s*from\s*['"]@inertiajs\/inertia['"];?/g, 'import { router as Inertia } from \'@inertiajs/react\';');
            content = content.replace(/import\s*\{\s*Page,\s*Inertia.*?\}\s*from\s*['"]@inertiajs\/inertia['"];?/g, 'import { router as Inertia } from \'@inertiajs/react\';');
            content = content.replace(/@inertiajs\/inertia/g, '@inertiajs/react');
            changed = true;
        }
        
        // Let's also fix multiple imports from @inertiajs/react if any occur
        if (content.includes("import { useForm, usePage } from '@inertiajs/react';\nimport { router as Inertia } from '@inertiajs/react';")) {
             content = content.replace(
                "import { useForm, usePage } from '@inertiajs/react';\nimport { router as Inertia } from '@inertiajs/react';",
                "import { useForm, usePage, router as Inertia } from '@inertiajs/react';"
             );
        }
        if (content.includes("import { Link, usePage } from '@inertiajs/react';\nimport { router as Inertia } from '@inertiajs/react';")) {
             content = content.replace(
                "import { Link, usePage } from '@inertiajs/react';\nimport { router as Inertia } from '@inertiajs/react';",
                "import { Link, usePage, router as Inertia } from '@inertiajs/react';"
             );
        }

        if (changed) {
            fs.writeFileSync(f, content, 'utf-8');
        }
    });
});
