const fs = require('fs');
const path = require('path');

const fixFile = (f) => {
    let content = fs.readFileSync(f, 'utf-8');
    let changed = false;

    if (content.includes("'staff'")) {
        content = content.replace(/'staff'/g, "'employee'");
        changed = true;
    }
    if (content.includes('"staff"')) {
        content = content.replace(/"staff"/g, '"employee"');
        changed = true;
    }
    
    if (content.includes('->staff')) {
        content = content.replace(/->staff/g, '->employee');
        changed = true;
    }
    
    if (content.includes('Staff::')) {
        content = content.replace(/Staff::/g, 'Employee::');
        changed = true;
    }

    if (content.includes('staff_no')) {
        content = content.replace(/staff_no/g, 'employee_id'); 
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(f, content, 'utf-8');
    }
};

const controllers = fs.readdirSync('C:/develop/xampp/htdocs/jbooks-client/app/Http/Controllers/Payroll').map(f => path.join('C:/develop/xampp/htdocs/jbooks-client/app/Http/Controllers/Payroll', f));
const models = fs.readdirSync('C:/develop/xampp/htdocs/jbooks-client/app/Models').map(f => path.join('C:/develop/xampp/htdocs/jbooks-client/app/Models', f));

[...controllers, ...models].forEach(f => {
    if (f.endsWith('.php')) fixFile(f);
});
