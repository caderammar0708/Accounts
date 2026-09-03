const fs = require('fs');
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
    if (!fs.existsSync(dir)) return;
    walkSync(dir).forEach(f => {
        let content = fs.readFileSync(f, 'utf-8');
        let changed = false;

        if (!content.includes('.layout =')) {
            const exportMatch = content.match(/export default function ([A-Za-z0-9_]+)/);
            if (exportMatch) {
                const componentName = exportMatch[1];
                
                content += "\n\nimport AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';\n";
                content += `${componentName}.layout = (page: any) => <AuthenticatedLayout children={page} />;\n`;
                changed = true;
            }
        }

        if (changed) {
            fs.writeFileSync(f, content, 'utf-8');
        }
    });
});
