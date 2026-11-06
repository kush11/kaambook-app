// Standalone verification of the real calculateSalary() engine. Run: npx tsx scripts/verify-salary.ts
// Uses a fully-past month (January 2025) so no "future day" skipping interferes.
// Jan 2025: 31 days, starts Wed Jan 1. Saturdays: 4,11,18,25 (4). Sundays: 5,12,19,26 (4).
import { calculateSalary } from '../src/utils/salary';
import type { Staff, Attendance, Payment, AttendanceStatus, SalaryType } from '../src/types';

const YEAR = 2025;
const MONTH = 0; // January (0-indexed)

function mkStaff(over: Partial<Staff>): Staff {
  return {
    id: 's1', businessId: 'b1', name: 'Test', phone: null, photoUri: null,
    salaryType: 'monthly', salaryAmount: 0, weekOff: -1, weekOffDays: null,
    overtimeRate: 0, shiftHours: 8, lateFine: 0, upiId: null, joiningDate: '2024-01-01', status: 'active', createdAt: '2024-01-01T00:00:00Z',
    ...over,
  };
}
function att(day: number, status: AttendanceStatus, overtimeHours = 0, extra: Partial<Attendance> = {}): Attendance {
  return { id: 'a' + day, staffId: 's1', date: `2025-01-${String(day).padStart(2, '0')}`,
    status, note: null, overtimeHours, hoursWorked: null, isLate: 0, createdAt: '', ...extra };
}
function pay(amount: number, type: Payment['type']): Payment {
  return { id: 'p' + Math.random(), staffId: 's1', amount, type, mode: 'cash', date: '2025-01-15', note: null, createdAt: '' };
}

const SAT_SUN = [4, 5, 11, 12, 18, 19, 25, 26]; // the 8 weekend days
const WEEKDAYS = Array.from({ length: 31 }, (_, i) => i + 1).filter(d => !SAT_SUN.includes(d)); // 23 days

let pass = 0, fail = 0;
function check(name: string, got: number, expected: number) {
  const ok = Math.abs(got - expected) < 0.01;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(48)} got=${got}  expected=${expected}`);
  ok ? pass++ : fail++;
}

// 1. Monthly, perfect attendance (23 present + 8 week_off marked) -> full salary
{
  const recs = [...WEEKDAYS.map(d => att(d, 'present')), ...SAT_SUN.map(d => att(d, 'week_off'))];
  const r = calculateSalary(mkStaff({ salaryType: 'monthly', salaryAmount: 31000 }), recs, [], YEAR, MONTH);
  check('Monthly perfect -> full salary', r.earnedSalary, 31000);
  check('Monthly perfect -> weekOffs counted', r.weekOffs, 8);
}

// 2. Monthly, all UNMARKED, weekOffDays = Sat+Sun -> only 8 paid week-offs, 23 absent
{
  const r = calculateSalary(mkStaff({ salaryType: 'monthly', salaryAmount: 31000, weekOffDays: '0,6' }), [], [], YEAR, MONTH);
  check('Monthly all-unmarked multi week-off', r.earnedSalary, 8000);
  check('  -> weekOffs auto-detected (Sat+Sun)', r.weekOffs, 8);
  check('  -> absent days', r.absentDays, 23);
}

// 3. Monthly, 20 present + 2 half + 1 absent + 8 week_off
{
  const recs = [
    ...WEEKDAYS.slice(0, 20).map(d => att(d, 'present')),
    ...WEEKDAYS.slice(20, 22).map(d => att(d, 'half_day')),
    att(WEEKDAYS[22], 'absent'),
    ...SAT_SUN.map(d => att(d, 'week_off')),
  ];
  const r = calculateSalary(mkStaff({ salaryType: 'monthly', salaryAmount: 31000 }), recs, [], YEAR, MONTH);
  // payable = 20 + 2*0.5 + 8 = 29 ; rate 1000 -> 29000
  check('Monthly 20P+2H+1A+8WO', r.earnedSalary, 29000);
}

// 4. Daily wage 500, 23 present, 8 week_off (week-offs NOT paid for daily)
{
  const recs = [...WEEKDAYS.map(d => att(d, 'present')), ...SAT_SUN.map(d => att(d, 'week_off'))];
  const r = calculateSalary(mkStaff({ salaryType: 'daily', salaryAmount: 500 }), recs, [], YEAR, MONTH);
  check('Daily 23 present', r.earnedSalary, 11500);
}

// 5. Weekly 3500, 23 present + 8 week_off -> (3500/7)*31
{
  const recs = [...WEEKDAYS.map(d => att(d, 'present')), ...SAT_SUN.map(d => att(d, 'week_off'))];
  const r = calculateSalary(mkStaff({ salaryType: 'weekly', salaryAmount: 3500 }), recs, [], YEAR, MONTH);
  check('Weekly 23P+8WO', r.earnedSalary, 15500);
}

// 6. Overtime: monthly perfect + 10 OT hours @ 50/hr
{
  const recs = [...WEEKDAYS.map((d, i) => att(d, 'present', i === 0 ? 10 : 0)), ...SAT_SUN.map(d => att(d, 'week_off'))];
  const r = calculateSalary(mkStaff({ salaryType: 'monthly', salaryAmount: 31000, overtimeRate: 50 }), recs, [], YEAR, MONTH);
  check('Monthly perfect + 10h OT @50', r.earnedSalary, 31500);
  check('  -> overtimeHours', r.overtimeHours, 10);
}

// 7. Joining mid-month (Jan 15): days 1-14 skipped, mark 15-31 present
{
  const present1531 = Array.from({ length: 17 }, (_, i) => att(i + 15, 'present'));
  const r = calculateSalary(mkStaff({ salaryType: 'monthly', salaryAmount: 31000, joiningDate: '2025-01-15' }), present1531, [], YEAR, MONTH);
  // 17 payable days * (31000/31) = 17000
  check('Monthly joined mid-month (17 days)', r.earnedSalary, 17000);
}

// 8. Payments incl. penalty (earned 31000)
{
  const recs = [...WEEKDAYS.map(d => att(d, 'present')), ...SAT_SUN.map(d => att(d, 'week_off'))];
  const payments = [pay(20000, 'salary'), pay(5000, 'advance'), pay(2000, 'bonus'), pay(1000, 'penalty')];
  const r = calculateSalary(mkStaff({ salaryType: 'monthly', salaryAmount: 31000 }), recs, payments, YEAR, MONTH);
  // gross earned 31000 - penalty 1000 = 30000 ; paid (salary+advance+bonus) = 27000 ; balance = 3000
  check('Penalty -> totalPaid excludes penalty', r.totalPaid, 27000);
  check('Penalty -> earned reduced by penalty', r.earnedSalary, 30000);
  check('Penalty -> balance DUE reduced (was bug)', r.balanceDue, 3000);
}

// 9. Hourly 100/hr, 8h shift: 20 present (one at 10h worked), 2 half days, 1 paid leave, weekends off
{
  const recs = [
    ...WEEKDAYS.slice(0, 20).map((d, i) => att(d, 'present', 0, i === 0 ? { hoursWorked: 10 } : {})),
    ...WEEKDAYS.slice(20, 22).map(d => att(d, 'half_day')),
    att(WEEKDAYS[22], 'paid_leave'),
    ...SAT_SUN.map(d => att(d, 'week_off')),
  ];
  const r = calculateSalary(mkStaff({ salaryType: 'hourly', salaryAmount: 100 }), recs, [], YEAR, MONTH);
  // hours = 19*8 + 10 + 2*4 + 8 (paid leave) = 178 -> 17800 ; week offs unpaid
  check('Hourly paid hours', r.paidHours, 178);
  check('Hourly earned', r.earnedSalary, 17800);
}

// 10. Hourly with a 6h shift + 4h overtime, no OT rate -> 1.5x hourly rate
{
  const recs = [att(WEEKDAYS[0], 'present', 4)];
  const r = calculateSalary(mkStaff({ salaryType: 'hourly', salaryAmount: 100, shiftHours: 6 }), recs, [], YEAR, MONTH);
  // 6h * 100 + 4h * 150 = 1200 (other weekdays unmarked = absent, unpaid)
  check('Hourly 6h shift + 4h OT', r.earnedSalary, 1200);
}

// 11. Late fine 50/day: monthly perfect, 3 present days late + 1 absent day flagged late (ignored)
{
  const recs = [
    ...WEEKDAYS.slice(0, 22).map((d, i) => att(d, 'present', 0, i < 3 ? { isLate: 1 } : {})),
    att(WEEKDAYS[22], 'absent', 0, { isLate: 1 }),
    ...SAT_SUN.map(d => att(d, 'week_off')),
  ];
  const r = calculateSalary(mkStaff({ salaryType: 'monthly', salaryAmount: 31000, lateFine: 50 }), recs, [pay(100, 'penalty')], YEAR, MONTH);
  // payable 30 days -> 30000 ; late 3*50 = 150 ; penalty 100 -> 29750
  check('Late days counted (present/half only)', r.lateDays, 3);
  check('Late fine amount', r.lateFine, 150);
  check('Earned after late fine + penalty', r.earnedSalary, 29750);
}

// 12. Late flag without a fine set -> no deduction
{
  const recs = [att(WEEKDAYS[0], 'present', 0, { isLate: 1 })];
  const r = calculateSalary(mkStaff({ salaryType: 'daily', salaryAmount: 500 }), recs, [], YEAR, MONTH);
  check('Late with no fine -> no deduction', r.earnedSalary, 500);
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
