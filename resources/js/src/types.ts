export interface Paginated<T> {
    map<U>(callback: (item: T) => U): U[];
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    current_page: number;
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}


// --- Enums based on PHP Enums ---
export enum Complexion {
    Fair = 0,
    Medium = 1,
    Dark = 2,
}

export enum Gender {
    Male = 1,
    Female = 2,
    Other = 3,
}

export enum MaritalStatus {
    Single = 1,
    Married = 2,
    Divorced = 3,
    Widowed = 4,
}

export enum Religion {
    Buddhism = 'Buddhism',
    Hinduism = 'Hinduism',
    Islam = 'Islam',
    Christianity = 'Christianity',
    Catholicism = 'Catholicism',
    Other = 'Other',
}
// --- Detailed Interfaces ---

export interface AuthUser {
    name: string;
}

export interface User {
    id: string;
    name: string; // Added to match backend and usages
    fullName: string;
    email: string;
    status: 'Active' | 'Inactive';
}

export interface CompanyProfile {
    logo: string;
    companyName: string;
    contactNo: string;
    hotlineNo: string;
    whatsappNo: string;
    location: string;
}

export interface Role {
    id: string;
    name: string;
    permissions: string[];
}

export interface DashboardSummary {
    totalStaff: number;
    activeStaff: number;
    pendingLeaves: number;
    todayAttendance: number;
}

export interface PageProps {
    [key: string]: unknown;
    auth: {
        user: User;
        permissions: string[];
        roles: string[];
    };
    filters?: Record<string, string>;
    summary?: DashboardSummary;
    flash?: {
        success?: string;
        error?: string;
        info?: string;
        status?: string;
    };
    users?: Paginated<User>;
    user?: User;
    roles?: Paginated<Role>;
    role?: Role;
    profile?: CompanyProfile;

    // HR & Payroll
    staffs?: Paginated<Staff>;
    staff?: Staff;
    departments?: Department[];
    department?: Department;
    designations?: Designation[];
    designation?: Designation;
    shifts?: Paginated<Shift>;
    shift?: Shift;
    attendances?: Attendance[];
    leaveTypes?: LeaveType[];
    leaveRequests?: Paginated<LeaveRequest>;
    payrolls?: Paginated<Payroll>;
}

export interface Shift {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
}

export interface Department {
    id: string;
    name: string;
}

export interface Designation {
    id: string;
    name: string;
    department_id: string;
    department?: Department;
}

export interface Staff {
    id: number;
    staff_no: string;
    name: string;
    email: string;
    tel1: string;
    tel2?: string;
    nic: string;
    dob: string;
    address: string;
    department_id: string;
    department?: Department;
    designation_id: string;
    designation?: Designation;
    shift_id?: string;
    shift?: Shift;
    employment_status: 'Active' | 'Resigned' | 'Terminated' | 'On Leave';
    photo?: string;
    cv_path?: string;
    id_copy_path?: string;
    certificate_path?: string;
    join_date: string;
    left_date?: string;
    probation_duration_months?: number;
    probation_status?: 'Probation' | 'Confirmed';
    probation_confirmed_date?: string;
    manager_id?: string;
    is_manager?: boolean;
}

export interface Attendance {
    id: string;
    staff_id: string;
    staff?: Staff;
    date: string;
    check_in?: string;
    check_out?: string;
    status: 'Present' | 'Late' | 'Early Leave' | 'Absent';
    admin_note?: string;
    outside_out?: string;
    outside_in?: string;
    outside_reason?: string;
    is_remote?: boolean;
    remote_status?: 'pending' | 'approved' | 'rejected';
    remote_reason?: string;
}

export interface LeaveType {
    id: string;
    name: string;
    days_per_year: number;
    code?: string;
    applies_sl_joining_rules?: boolean;
    applies_probation_half_rate?: boolean;
}

export interface LeaveRequest {
    id: string;
    staff_id: string;
    staff?: Staff;
    leave_type_id: string;
    leaveType?: LeaveType;
    start_date: string;
    end_date: string;
    total_days: number;
    reason?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    approved_by?: string;
}

export interface LeaveBalance {
    id: number;
    staff_id: string;
    leave_type_id: string;
    year: number;
    remaining_days: number;
}

export interface SalaryStructure {
    staff_id: string;
    basic_salary: number;
    allowances: { label: string; amount: number }[];
    deductions: { label: string; amount: number }[];
    ot_rate_per_hour: number;
}

export interface Payroll {
    id: string;
    month: number;
    year: number;
    total_amount: number;
    status: 'Draft' | 'Processed' | 'Paid';
    payslips?: Payslip[];
}

export interface Payslip {
    id: string;
    payroll_id: string;
    staff_id: string;
    staff?: Staff;
    basic_salary: number;
    allowances: any;
    deductions: any;
    ot_amount: number;
    net_salary: number;
    epf_employee: number;
    epf_employer: number;
    etf: number;
    bonus?: number;
    loan_deduction?: number;
    leave_deduction?: number;
    income_tax?: number;
    advance_deduction?: number;
}

export interface PettyCashTransaction {
    id: string;
    date: string;
    amount: number;
    type: 'Credit' | 'Debit';
    description: string;
    invoice_no?: string;
    attachment?: string;
}

export interface CandidatePayment {
    id: number;
    candidate_id: string;
    amount: number;
    date: string;
    type: string;
    description?: string;
    payment_method?: string;
    created_at: string;
}
