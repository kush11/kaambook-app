import dayjs from 'dayjs';
import type { Staff, Attendance, Payment, SalaryBreakdown, AttendanceStatus } from '../types';
import { getDaysInMonth, getDayOfWeek } from './date';

export function calculateSalary(
  staffMember: Staff,
  attendanceRecords: Attendance[],
  paymentsInMonth: Payment[],
  year: number,
  month: number,
): SalaryBreakdown {
  const days = getDaysInMonth(year, month);
  const today = dayjs();
  const joiningDate = dayjs(staffMember.joiningDate);

  // Build attendance map
  const attendanceMap = new Map<string, Attendance>();
  attendanceRecords.forEach(a => attendanceMap.set(a.date, a));

  let totalDays = days.length;
  let workingDays = 0;
  let presentDays = 0;
  let absentDays = 0;
  let halfDays = 0;
  let paidLeaves = 0;
  let unpaidLeaves = 0;
  let holidays = 0;
  let weekOffs = 0;
  let overtimeHours = 0;

  days.forEach(date => {
    const d = dayjs(date);
    // Skip future days
    if (d.isAfter(today, 'day')) return;
    // Skip days before joining
    if (d.isBefore(joiningDate, 'day')) return;

    const dayOfWeek = getDayOfWeek(date);
    const record = attendanceMap.get(date);

    if (record) {
      switch (record.status) {
        case 'present':
          presentDays++;
          workingDays++;
          break;
        case 'absent':
          absentDays++;
          workingDays++;
          break;
        case 'half_day':
          halfDays++;
          workingDays++;
          break;
        case 'paid_leave':
          paidLeaves++;
          break;
        case 'unpaid_leave':
          unpaidLeaves++;
          workingDays++;
          break;
        case 'holiday':
          holidays++;
          break;
        case 'week_off':
          weekOffs++;
          break;
      }
      overtimeHours += record.overtimeHours || 0;
    } else {
      // No record - check if it's a weekly off
      if (staffMember.weekOff === dayOfWeek) {
        weekOffs++;
      } else {
        // Unmarked past days count as absent
        absentDays++;
        workingDays++;
      }
    }
  });

  // Calculate earned salary
  let earnedSalary = 0;
  const { salaryType, salaryAmount } = staffMember;

  switch (salaryType) {
    case 'monthly': {
      // Monthly: salary / total calendar days * payable days
      // Payable days = present + half_day*0.5 + paid_leaves + holidays + week_offs
      const payableDays = presentDays + (halfDays * 0.5) + paidLeaves + holidays + weekOffs;
      const dailyRate = salaryAmount / totalDays;
      earnedSalary = dailyRate * payableDays;
      break;
    }
    case 'daily': {
      // Daily: salary * (present + half*0.5)
      earnedSalary = salaryAmount * (presentDays + (halfDays * 0.5));
      break;
    }
    case 'weekly': {
      // Weekly: salary / 7 * payable days
      const payableDays = presentDays + (halfDays * 0.5) + paidLeaves;
      const dailyRate = salaryAmount / 7;
      earnedSalary = dailyRate * payableDays;
      break;
    }
  }

  // Add overtime pay (use staff overtime rate if set, else 1.5x calculated rate)
  if (overtimeHours > 0) {
    let hourlyRate = staffMember.overtimeRate;
    if (hourlyRate <= 0) {
      // Fallback: 1.5x calculated daily rate / 8 hours
      switch (salaryType) {
        case 'monthly':
          hourlyRate = (salaryAmount / 30 / 8) * 1.5;
          break;
        case 'daily':
          hourlyRate = (salaryAmount / 8) * 1.5;
          break;
        case 'weekly':
          hourlyRate = (salaryAmount / 7 / 8) * 1.5;
          break;
      }
    }
    earnedSalary += hourlyRate * overtimeHours;
  }

  earnedSalary = Math.round(earnedSalary);

  // Calculate total paid
  const totalPaid = paymentsInMonth.reduce((sum, p) => {
    if (p.type === 'penalty') return sum - p.amount;
    return sum + p.amount;
  }, 0);

  const balanceDue = earnedSalary - totalPaid;

  return {
    totalDays,
    workingDays,
    presentDays,
    absentDays,
    halfDays,
    paidLeaves,
    unpaidLeaves,
    holidays,
    weekOffs,
    overtimeHours,
    earnedSalary,
    totalPaid,
    balanceDue,
  };
}
