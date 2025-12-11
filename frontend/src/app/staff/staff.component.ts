import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Staff, Attendance, AttendanceWithStaff, STAFF_POSITIONS, ATTENDANCE_STATUS } from '../models/staff.model';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.css'
})
export class StaffComponent implements OnInit {
  // Tab management
  activeTab: 'staff' | 'attendance' = 'staff';

  // Staff data
  staffList: Staff[] = [];
  filteredStaff: Staff[] = [];
  positions = STAFF_POSITIONS;
  
  // Attendance data
  attendanceRecords: AttendanceWithStaff[] = [];
  attendanceStatuses = ATTENDANCE_STATUS;
  
  // Calendar view
  calendarView = true;
  currentMonth: Date = new Date();
  calendarDays: any[] = [];
  selectedStaffForCalendar: number | null = null;
  attendanceMap: Map<string, Attendance> = new Map();
  
  // Staff modals
  showAddStaffModal = false;
  showEditStaffModal = false;
  newStaff: Staff = {
    name: '',
    phone: '',
    email: '',
    position: '',
    salary: 0,
    joining_date: '',
    status: 'active',
    address: '',
    notes: ''
  };
  editStaff: Staff | null = null;

  // Attendance modals
  showMarkAttendanceModal = false;
  showBulkAttendanceModal = false;
  showEditAttendanceModal = false;
  newAttendance: Attendance = {
    staff_id: 0,
    date: '',
    check_in: '',
    check_out: '',
    status: 'present',
    notes: ''
  };
  editAttendance: AttendanceWithStaff | null = null;
  bulkAttendanceDate: string = '';
  bulkAttendanceRecords: { staff: Staff; check_in: string; status: string }[] = [];

  // Filters
  staffStatusFilter: 'all' | 'active' | 'inactive' = 'active';
  attendanceDateFilter: string = '';
  attendanceStaffFilter: number | null = null;

  // Statistics
  staffStats = {
    totalStaff: 0,
    totalSalary: 0,
    byPosition: [] as { position: string; count: number }[]
  };

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadStaffAndSelectFirst();
    this.loadAttendance();
    this.generateCalendar();
  }

  get isManager(): boolean {
    return this.authService.isManager();
  }

  setDefaultDates(): void {
    const today = new Date();
    this.attendanceDateFilter = this.formatDateForInput(today);
    this.bulkAttendanceDate = this.formatDateForInput(today);
    this.newAttendance.date = this.formatDateForInput(today);
    this.newStaff.joining_date = this.formatDateForInput(today);
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatTimeForInput(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Tab switching
  switchTab(tab: 'staff' | 'attendance'): void {
    this.activeTab = tab;
    if (tab === 'staff') {
      this.loadStaff();
    } else {
      this.loadAttendance();
    }
  }

  // Staff Management
  loadStaff(): void {
    const status = this.staffStatusFilter === 'all' ? undefined : this.staffStatusFilter;
    this.apiService.getStaff(status).subscribe({
      next: (staff) => {
        this.staffList = staff;
        this.filteredStaff = staff;
        this.loadStaffStats();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading staff:', err)
    });
  }

  loadStaffAndSelectFirst(): void {
    const status = this.staffStatusFilter === 'all' ? undefined : this.staffStatusFilter;
    this.apiService.getStaff(status).subscribe({
      next: (staff) => {
        this.staffList = staff;
        this.filteredStaff = staff;
        this.loadStaffStats();
        
        // Auto-select first active staff member for calendar
        if (this.calendarView && staff.length > 0) {
          const firstActiveStaff = staff.find(s => s.status === 'active');
          if (firstActiveStaff && firstActiveStaff.id) {
            this.selectedStaffForCalendar = firstActiveStaff.id;
            this.generateCalendar();
          }
        }
        
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading staff:', err)
    });
  }

  loadStaffStats(): void {
    this.apiService.getStaffStats().subscribe({
      next: (stats) => {
        this.staffStats = stats;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading stats:', err)
    });
  }

  onStaffFilterChange(): void {
    this.loadStaff();
  }

  openAddStaffModal(): void {
    this.newStaff = {
      name: '',
      phone: '',
      email: '',
      position: '',
      salary: 0,
      joining_date: this.formatDateForInput(new Date()),
      status: 'active',
      address: '',
      notes: ''
    };
    this.showAddStaffModal = true;
  }

  closeAddStaffModal(): void {
    this.showAddStaffModal = false;
  }

  openEditStaffModal(staff: Staff): void {
    this.editStaff = { ...staff };
    this.showEditStaffModal = true;
  }

  closeEditStaffModal(): void {
    this.showEditStaffModal = false;
    this.editStaff = null;
  }

  saveStaff(): void {
    if (!this.newStaff.name || !this.newStaff.phone || !this.newStaff.position || !this.newStaff.joining_date) {
      alert('Please fill in all required fields');
      return;
    }

    if (this.newStaff.salary < 0) {
      alert('Salary must be non-negative');
      return;
    }

    this.apiService.createStaff(this.newStaff).subscribe({
      next: () => {
        this.loadStaff();
        this.closeAddStaffModal();
      },
      error: (err) => {
        console.error('Error creating staff:', err);
        alert('Failed to create staff member. Please try again.');
      }
    });
  }

  updateStaffMember(): void {
    if (!this.editStaff || !this.editStaff.id) return;

    if (!this.editStaff.name || !this.editStaff.phone || !this.editStaff.position || !this.editStaff.joining_date) {
      alert('Please fill in all required fields');
      return;
    }

    if (this.editStaff.salary < 0) {
      alert('Salary must be non-negative');
      return;
    }

    this.apiService.updateStaff(this.editStaff.id, this.editStaff).subscribe({
      next: () => {
        this.loadStaff();
        this.closeEditStaffModal();
      },
      error: (err) => {
        console.error('Error updating staff:', err);
        alert('Failed to update staff member. Please try again.');
      }
    });
  }

  deleteStaff(staff: Staff): void {
    if (!staff.id) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete this staff member?\n\n` +
      `Name: ${staff.name}\n` +
      `Position: ${staff.position}\n\n` +
      `This will also delete all attendance records for this staff member.\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) return;

    this.apiService.deleteStaff(staff.id).subscribe({
      next: () => {
        this.loadStaff();
      },
      error: (err) => {
        console.error('Error deleting staff:', err);
        alert('Failed to delete staff member. Please try again.');
      }
    });
  }

  // Attendance Management
  loadAttendance(): void {
    const params: any = {};
    if (this.attendanceDateFilter) {
      params.date = this.attendanceDateFilter;
    }
    if (this.attendanceStaffFilter) {
      params.staff_id = this.attendanceStaffFilter;
    }

    this.apiService.getAttendance(params).subscribe({
      next: (records) => {
        this.attendanceRecords = records;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading attendance:', err)
    });
  }

  onAttendanceFilterChange(): void {
    this.loadAttendance();
  }

  openMarkAttendanceModal(): void {
    const now = new Date();
    this.newAttendance = {
      staff_id: 0,
      date: this.formatDateForInput(now),
      check_in: this.formatTimeForInput(now),
      check_out: '',
      status: 'present',
      notes: ''
    };
    this.showMarkAttendanceModal = true;
  }

  closeMarkAttendanceModal(): void {
    this.showMarkAttendanceModal = false;
  }

  openBulkAttendanceModal(): void {
    this.bulkAttendanceDate = this.formatDateForInput(new Date());
    this.bulkAttendanceRecords = this.staffList
      .filter(s => s.status === 'active')
      .map(staff => ({
        staff,
        check_in: '09:00',
        status: 'present'
      }));
    this.showBulkAttendanceModal = true;
  }

  closeBulkAttendanceModal(): void {
    this.showBulkAttendanceModal = false;
  }

  openEditAttendanceModal(attendance: AttendanceWithStaff): void {
    this.editAttendance = { ...attendance };
    this.showEditAttendanceModal = true;
  }

  closeEditAttendanceModal(): void {
    this.showEditAttendanceModal = false;
    this.editAttendance = null;
  }

  markAttendance(): void {
    if (!this.newAttendance.staff_id || !this.newAttendance.date || !this.newAttendance.check_in) {
      alert('Please fill in all required fields');
      return;
    }

    this.apiService.markAttendance(this.newAttendance).subscribe({
      next: () => {
        this.loadAttendance();
        if (this.calendarView && this.selectedStaffForCalendar) {
          this.loadMonthAttendance();
        }
        this.closeMarkAttendanceModal();
      },
      error: (err) => {
        console.error('Error marking attendance:', err);
        alert(err.error?.error || 'Failed to mark attendance. Please try again.');
      }
    });
  }

  bulkMarkAttendance(): void {
    if (!this.bulkAttendanceDate) {
      alert('Please select a date');
      return;
    }

    const records = this.bulkAttendanceRecords.map(record => ({
      staff_id: record.staff.id!,
      check_in: record.check_in,
      status: record.status as 'present' | 'absent' | 'half_day' | 'leave',
      notes: ''
    }));

    this.apiService.bulkMarkAttendance(this.bulkAttendanceDate, records).subscribe({
      next: (result) => {
        alert(`Attendance marked successfully!\nSuccess: ${result.success}\nFailed: ${result.failed}`);
        this.loadAttendance();
        this.closeBulkAttendanceModal();
      },
      error: (err) => {
        console.error('Error bulk marking attendance:', err);
        alert('Failed to mark attendance. Please try again.');
      }
    });
  }

  updateAttendanceRecord(): void {
    if (!this.editAttendance || !this.editAttendance.id) return;

    if (!this.editAttendance.check_in) {
      alert('Check-in time is required');
      return;
    }

    this.apiService.updateAttendance(this.editAttendance.id, {
      check_in: this.editAttendance.check_in,
      check_out: this.editAttendance.check_out,
      status: this.editAttendance.status,
      notes: this.editAttendance.notes
    }).subscribe({
      next: () => {
        this.loadAttendance();
        if (this.calendarView && this.selectedStaffForCalendar) {
          this.loadMonthAttendance();
        }
        this.closeEditAttendanceModal();
      },
      error: (err) => {
        console.error('Error updating attendance:', err);
        alert('Failed to update attendance. Please try again.');
      }
    });
  }

  deleteAttendance(attendance: AttendanceWithStaff): void {
    if (!attendance.id) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete this attendance record?\n\n` +
      `Staff: ${attendance.staff_name}\n` +
      `Date: ${attendance.date}\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) return;

    this.apiService.deleteAttendance(attendance.id).subscribe({
      next: () => {
        this.loadAttendance();
        if (this.calendarView && this.selectedStaffForCalendar) {
          this.loadMonthAttendance();
        }
      },
      error: (err) => {
        console.error('Error deleting attendance:', err);
        alert('Failed to delete attendance record. Please try again.');
      }
    });
  }

  getStatusColor(status: string): string {
    const statusObj = this.attendanceStatuses.find(s => s.value === status);
    return statusObj?.color || '#6c757d';
  }

  getStatusLabel(status: string): string {
    const statusObj = this.attendanceStatuses.find(s => s.value === status);
    return statusObj?.label || status;
  }

  getStatusIcon(status: string): string {
    const statusObj = this.attendanceStatuses.find(s => s.value === status);
    return statusObj?.icon || '';
  }

  // Calendar View Methods
  toggleView(): void {
    this.calendarView = !this.calendarView;
    if (this.calendarView) {
      this.generateCalendar();
    }
  }

  generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of week for first day (0 = Sunday)
    const startingDayOfWeek = firstDay.getDay();
    
    // Calculate total cells needed
    const daysInMonth = lastDay.getDate();
    
    this.calendarDays = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.calendarDays.push({ isEmpty: true });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = this.formatDateForInput(date);
      const dayOfWeek = date.getDay();
      
      this.calendarDays.push({
        date: date,
        day: day,
        dateStr: dateStr,
        isToday: this.isToday(date),
        isSunday: dayOfWeek === 0,
        isEmpty: false
      });
    }
    
    // Load attendance for current month if staff is selected
    if (this.selectedStaffForCalendar) {
      this.loadMonthAttendance();
    }
  }

  loadMonthAttendance(): void {
    if (!this.selectedStaffForCalendar) return;
    
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const params = {
      staff_id: this.selectedStaffForCalendar,
      startDate: this.formatDateForInput(startDate),
      endDate: this.formatDateForInput(endDate)
    };
    
    this.apiService.getAttendance(params).subscribe({
      next: (records) => {
        this.attendanceMap.clear();
        records.forEach(record => {
          this.attendanceMap.set(record.date, record);
        });
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading month attendance:', err)
    });
  }

  previousMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }

  onStaffSelectForCalendar(): void {
    this.generateCalendar();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  getAttendanceForDate(dateStr: string): Attendance | null {
    return this.attendanceMap.get(dateStr) || null;
  }

  onDateClick(calendarDay: any): void {
    if (calendarDay.isEmpty || !this.selectedStaffForCalendar) return;
    
    const existingAttendance = this.getAttendanceForDate(calendarDay.dateStr);
    
    if (existingAttendance) {
      // Edit existing attendance
      this.editAttendance = { ...existingAttendance } as AttendanceWithStaff;
      this.showEditAttendanceModal = true;
    } else {
      // Mark new attendance
      const defaultStatus = calendarDay.isSunday ? 'week_off' : 'present';
      this.newAttendance = {
        staff_id: this.selectedStaffForCalendar,
        date: calendarDay.dateStr,
        check_in: '09:00',
        check_out: '18:00',
        status: defaultStatus,
        notes: ''
      };
      this.showMarkAttendanceModal = true;
    }
  }

  getMonthYearDisplay(): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[this.currentMonth.getMonth()]} ${this.currentMonth.getFullYear()}`;
  }
}
