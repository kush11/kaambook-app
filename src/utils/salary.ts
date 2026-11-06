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

  // Resolve the staff member's weekly off days (supports multiple).
  // Prefer the new list column, fall back to the legacy single day.
  const weekOffSet = new Set<number>(
    (staffMember.weekOffDays ?? '')
      .split(',')
      .map(s => parseInt(s, 10))
      .filter(n => !isNaN(n))
  );
  if (weekOffSet.size === 0 && staffMember.weekOff >= 0) {
    weekOffSet.add(staffMember.weekOff);
  }

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
  // Hourly staff: worked hours (present / half day) plus paid leave at shift length.
  let paidHours = 0;
  let lateDays = 0;
  const shiftHours = staffMember.shiftHours > 0 ? staffMember.shiftHours : 8;

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
          paidHours += record.hoursWorked ?? shiftHours;
          break;
        case 'absent':
          absentDays++;
          workingDays++;
          break;
        case 'half_day':
          halfDays++;
          workingDays++;
          paidHours += record.hoursWorked ?? shiftHours / 2;
          break;
        case 'paid_leave':
          paidLeaves++;
          paidHours += shiftHours;
          break;
        case 'unpaid_leave':
          unpaidLeaves++;
          break;
        case 'holiday':
          holidays++;
          break;
        case 'week_off':
          weekOffs++;
          break;
      }
      overtimeHours += record.overtimeHours || 0;
      if (record.isLate && (record.status === 'present' || record.status === 'half_day')) lateDays++;
    } else {
      // No record - check if it's a weekly off
      if (weekOffSet.has(dayOfWeek)) {
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
      // Daily: salary * (present + half*0.5 + paid_leaves)
      earnedSalary = salaryAmount * (presentDays + (halfDays * 0.5) + paidLeaves);
      break;
    }
    case 'weekly': {
      // Weekly: salary / 7 * payable days (including holidays and week offs)
      const payableDays = presentDays + (halfDays * 0.5) + paidLeaves + holidays + weekOffs;
      const dailyRate = salaryAmount / 7;
      earnedSalary = dailyRate * payableDays;
      break;
    }
    case 'hourly': {
      // Hourly: rate * hours worked (+ paid leave at shift length). Holidays and week offs unpaid.
      earnedSalary = salaryAmount * paidHours;
      break;
    }
  }

  // Add overtime pay (use staff overtime rate if set, else 1.5x calculated rate)
  if (overtimeHours > 0) {
    let hourlyRate = staffMember.overtimeRate;
    if (hourlyRate <= 0) {
      // Fallback: 1.5x the calculated hourly rate (day = shift hours, 8 by default)
      switch (salaryType) {
        case 'monthly':
          hourlyRate = (salaryAmount / totalDays / shiftHours) * 1.5;
          break;
        case 'daily':
          hourlyRate = (salaryAmount / shiftHours) * 1.5;
          break;
        case 'weekly':
          hourlyRate = (salaryAmount / 7 / shiftHours) * 1.5;
          break;
        case 'hourly':
          hourlyRate = salaryAmount * 1.5;
          break;
      }
    }
    earnedSalary += hourlyRate * overtimeHours;
  }

  earnedSalary = Math.round(earnedSalary);

  // Penalties and late fines are deductions from what the worker earned (they reduce the amount owed).
  const lateFine = Math.round(lateDays * Math.max(0, staffMember.lateFine || 0));
  const totalPenalty = paymentsInMonth
    .filter(p => p.type === 'penalty')
    .reduce((sum, p) => sum + p.amount, 0);
  if (totalPenalty + lateFine > 0) {
    earnedSalary = Math.max(0, earnedSalary - totalPenalty - lateFine);
  }

  // Total money actually handed to the worker (salary, advance, bonus).
  const totalPaid = paymentsInMonth
    .filter(p => p.type !== 'penalty')
    .reduce((sum, p) => sum + p.amount, 0);

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
    paidHours: Math.round(paidHours * 100) / 100,
    lateDays,
    lateFine,
    earnedSalary,
    totalPaid,
    balanceDue,
  };
}
