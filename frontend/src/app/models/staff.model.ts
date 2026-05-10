export interface Staff {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  position: string;
  salary: number;
  joining_date: string;
  status: 'active' | 'inactive';
  address?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Attendance {
  id?: number;
  staff_id: number;
  date: string;
  check_in: string;
  check_out?: string;
  status: 'present' | 'absent' | 'half_day' | 'leave' | 'week_off' | 'holiday';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceWithStaff extends Attendance {
  staff_name?: string;
  staff_position?: string;
}

export const STAFF_POSITIONS = [
  'Manager',
  'Sales Executive',
  'Cashier',
  'Store Keeper',
  'Delivery Person',
  'Security Guard',
  'Cleaner',
  'Accountant',
  'Other'
];

export const ATTENDANCE_STATUS = [
  { value: 'present', label: 'Present', color: '#28a745', icon: '✓' },
  { value: 'absent', label: 'Absent', color: '#dc3545', icon: '✗' },
  { value: 'half_day', label: 'Half Day', color: '#ffc107', icon: '◐' },
  { value: 'leave', label: 'Leave', color: '#17a2b8', icon: 'L' },
  { value: 'week_off', label: 'Week Off', color: '#6c757d', icon: 'W' },
  { value: 'holiday', label: 'Holiday', color: '#e83e8c', icon: 'H' }
];

export interface AdvanceSalary {
  id?: number;
  staff_id: number;
  amount: number;
  date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SalaryCalculation {
  staff_id: number;
  month: string;
  year: number;
  monthly_salary: number;
  daily_salary: number;
  total_days: number;
  present_days: number;
  half_days: number;
  absent_days: number;
  leave_days: number;
  week_off_days: number;
  holiday_days: number;
  payable_days: number;
  gross_salary: number;
  total_advance: number;
  net_salary: number;
  created_at?: string;
}

export interface SalarySummary {
  staff: Staff;
  calculation: SalaryCalculation;
  advances: AdvanceSalary[];
}
