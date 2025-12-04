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
  status: 'present' | 'absent' | 'half_day' | 'leave';
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
  { value: 'present', label: 'Present', color: '#28a745' },
  { value: 'absent', label: 'Absent', color: '#dc3545' },
  { value: 'half_day', label: 'Half Day', color: '#ffc107' },
  { value: 'leave', label: 'Leave', color: '#17a2b8' }
];
