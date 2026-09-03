const fs = require('fs');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace react imports
    content = content.replace(/import \{.*usePage.*\} from '@inertiajs\/inertia-react';/g, 'import { useForm, usePage, Head, router } from \'@inertiajs/react\';');
    content = content.replace(/import \{.*Inertia.*\} from '@inertiajs\/inertia';/g, '');
    content = content.replace(/import \{.*Link.*\} from '@inertiajs\/inertia-react';/g, 'import { Link } from \'@inertiajs/react\';');
    content = content.replace(/Inertia\.post/g, 'router.post');
    content = content.replace(/Inertia\.put/g, 'router.put');
    
    // Replace components
    content = content.replace(/import \{ InputField \} from '@\/src\/components\/ui\/InputFeild';/g, 'import CommonInput from \'@/Components/CommonInput\';');
    content = content.replace(/import Button from '@\/src\/components\/ui\/Button';/g, 'import PrimaryButton from \'@/Components/PrimaryButton\';');
    content = content.replace(/import StaffTabs from '@\/src\/components\/ui\/StaffTabs';/g, 'import EmployeeTabs from \'@/Components/EmployeeTabs\';');
    
    // Replace tags
    content = content.replace(/<InputField/g, '<CommonInput');
    content = content.replace(/<StaffTabs staffId=\{staff\.id\}/g, '<EmployeeTabs employeeId={employee.id}');
    content = content.replace(/<Button/g, '<PrimaryButton');
    content = content.replace(/<\/Button>/g, '</PrimaryButton>');
    
    // Replace staff with employee
    content = content.replace(/\bstaff\b/g, 'employee');
    
    // Typescript specific
    content = content.replace(/: React\.FC\s*/g, '');
    content = content.replace(/: number/g, '');
    content = content.replace(/: React\.FormEvent/g, '');
    content = content.replace(/as any/g, '');
    content = content.replace(/as File \| null/g, '');
    content = content.replace(/as \w+/g, '');
    content = content.replace(/<Page<PageProps>>/g, '');
    content = content.replace(/<Page<any>>/g, '');
    content = content.replace(/:\s*string/g, '');
    content = content.replace(/:\s*any/g, '');
    
    // Layout wrapping
    content = content.replace(/import \{ usePageHeader \} from '@\/src\/App';\n/g, "import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';\n");
    content = content.replace(/const \{ setTitle \} = usePageHeader\(\);\n/g, '');
    content = content.replace(/React\.useEffect\(\(\) => \{\n.*?setTitle\(.*?\);\n.*?\}, \[.*?\]\);\n/s, '');
    content = content.replace(/useEffect\(\(\) => \{\n.*?setTitle\(.*?\);\n.*?\}, \[.*?\]\);\n/s, '');
    
    // Put inside layout
    content = content.replace(/return \(\n\s*<div/, 'return (\n<AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Employee Profile</h2>}>\n<Head title="Employee Profile" />\n<div');
    content = content.replace(/<\/div>\n\s*\);\n};/g, '</div>\n</AuthenticatedLayout>\n);\n};');

    // Put url updates
    content = content.replace(/\/employee\/\$\{employee\.id\}\/security/g, '/employees/${employee.id}/security');
    content = content.replace(/\/employee\/\$\{employee\.id\}\/salary/g, '/employees/${employee.id}/salary');
    content = content.replace(/\/employee\/\$\{employee\.id\}\/documents/g, '/employees/${employee.id}/documents');
    content = content.replace(/\/staff\/\$\{employee\.id\}\/security/g, '/employees/${employee.id}/security');
    content = content.replace(/\/staff\/\$\{employee\.id\}\/salary/g, '/employees/${employee.id}/salary');
    content = content.replace(/\/staff\/\$\{employee\.id\}\/documents/g, '/employees/${employee.id}/documents');
    
    // Form Helpers
    content = content.replace(/import \{ handleInputChange \} from '@\/src\/utils\/formHelpers';\n/g, '');
    content = content.replace(/onChange=\{\(e\) => handleInputChange\(e, setData\)\}/g, 'onChange={(e) => setData(e.target.name, e.target.value)}');

    // Clean up imports
    let lines = content.split('\n');
    lines = lines.filter(l => !l.startsWith('import { Staff, PageProps }'));
    lines = lines.filter(l => !l.startsWith('import { PageProps }'));
    lines = lines.filter(l => !l.startsWith('import { Page }'));
    content = lines.join('\n');
    
    fs.writeFileSync(filePath, content, 'utf8');
}

const files = [
    'C:/develop/xampp/htdocs/jbooks-client/resources/js/Pages/Team/Profile/EditSalary.jsx',
    'C:/develop/xampp/htdocs/jbooks-client/resources/js/Pages/Team/Profile/EditDocuments.jsx',
    'C:/develop/xampp/htdocs/jbooks-client/resources/js/Pages/Team/Profile/EditSecurity.jsx'
];

for (const file of files) {
    processFile(file);
}
console.log('Done');
