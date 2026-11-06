/** HTML for the monthly register PDF (pure: no device APIs, so it can be previewed in Node). */
import dayjs from 'dayjs';
import { formatCurrency } from './formatters';
import type { Attendance, SalaryBreakdown, Staff, AttendanceStatus } from '../types';

const CODES: Record<AttendanceStatus, string> = {
  present: 'P', absent: 'A', half_day: 'H', paid_leave: 'PL', unpaid_leave: 'UL', holiday: 'HO', week_off: 'WO',
};
const CODE_COLORS: Record<string, string> = {
  P: '#15803D', A: '#B91C1C', H: '#B45309', PL: '#2563EB', UL: '#B91C1C', HO: '#7C3AED', WO: '#6B7280',
};
const RATE_SUFFIX = { monthly: '/mo', daily: '/day', weekly: '/wk', hourly: '/hr' } as const;

function weekOffDays(s: Staff): Set<number> {
  const set = new Set((s.weekOffDays ?? '').split(',').map((x) => parseInt(x, 10)).filter((n) => !isNaN(n)));
  if (set.size === 0 && s.weekOff >= 0) set.add(s.weekOff);
  return set;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export interface RegisterRow { staff: Staff; records: Map<string, Attendance>; breakdown: SalaryBreakdown }

export function buildRegisterHtml(businessName: string, rows: RegisterRow[], year: number, month: number): string {
  const first = dayjs().year(year).month(month).startOf('month');
  const dayCount = first.daysInMonth();
  const days = Array.from({ length: dayCount }, (_, i) => first.add(i, 'day'));
  const today = dayjs();
  const period = first.locale('en').format('MMMM YYYY');

  const head = days.map((d) => `<th class="d${d.day() === 0 ? ' sun' : ''}">${d.date()}<br><span>${d.locale('en').format('dd')[0]}</span></th>`).join('');
  const muster = rows.map(({ staff, records, breakdown }) => {
    const weekOffs = weekOffDays(staff);
    const cells = days.map((d) => {
      const r = records.get(d.format('YYYY-MM-DD'));
      if (!r) {
        // Same rule as the salary maths: an unmarked weekly-off day is a week off, otherwise absent.
        if (d.isAfter(today, 'day') || d.isBefore(staff.joiningDate, 'day')) return '<td class="d"></td>';
        return weekOffs.has(d.day()) ? `<td class="d" style="color:${CODE_COLORS.WO}">WO</td>` : '<td class="d">·</td>';
      }
      const code = CODES[r.status as AttendanceStatus] ?? '';
      const late = r.isLate && (r.status === 'present' || r.status === 'half_day') ? '<sup>L</sup>' : '';
      return `<td class="d" style="color:${CODE_COLORS[code] ?? '#111'}">${code}${late}</td>`;
    }).join('');
    return `<tr><td class="name">${esc(staff.name)}</td>${cells}<td class="n">${breakdown.presentDays + breakdown.halfDays * 0.5}</td><td class="n">${breakdown.absentDays}</td></tr>`;
  }).join('');

  let totEarned = 0, totPaid = 0, totDue = 0;
  const salaryRows = rows.map(({ staff, breakdown: b }) => {
    totEarned += b.earnedSalary; totPaid += b.totalPaid; totDue += b.balanceDue;
    const rate = `${formatCurrency(staff.salaryAmount)}${RATE_SUFFIX[staff.salaryType]}`;
    return `<tr>
      <td class="name">${esc(staff.name)}</td><td>${rate}</td>
      <td class="n">${b.presentDays}</td><td class="n">${b.absentDays}</td><td class="n">${b.halfDays}</td>
      <td class="n">${b.paidLeaves}</td><td class="n">${staff.salaryType === 'hourly' ? b.paidHours : '–'}</td>
      <td class="n">${b.overtimeHours || '–'}</td><td class="n">${b.lateDays ? (b.lateFine ? `${b.lateDays} (−${formatCurrency(b.lateFine)})` : String(b.lateDays)) : '–'}</td>
      <td class="m">${formatCurrency(b.earnedSalary)}</td><td class="m">${formatCurrency(b.totalPaid)}</td>
      <td class="m ${b.balanceDue > 0 ? 'due' : ''}">${formatCurrency(b.balanceDue)}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page { size: A4 landscape; margin: 16px; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1C1C1C; font-size: 10px; }
  h1 { font-size: 16px; margin: 0; color: #C2410C; }
  .sub { color: #6B635B; margin: 2px 0 10px; font-size: 11px; }
  h2 { font-size: 12px; margin: 14px 0 6px; color: #9A3412; text-transform: uppercase; letter-spacing: .5px; }
  table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
  tr { page-break-inside: avoid; }
  th, td { border: 1px solid #E8E2D6; padding: 3px 4px; text-align: center; }
  th { background: #FFEDD5; font-size: 9px; }
  th.d span { font-weight: normal; color: #6B635B; }
  th.sun { background: #FDE2CF; }
  td.d { font-weight: bold; font-size: 9px; padding: 3px 1px; }
  td.name { text-align: left; font-weight: 600; white-space: nowrap; max-width: 140px; overflow: hidden; }
  td.n { font-size: 10px; }
  td.m { text-align: right; white-space: nowrap; }
  td.due { color: #B91C1C; font-weight: bold; }
  sup { font-size: 6px; color: #B45309; }
  tfoot td { font-weight: bold; background: #FAF7F0; }
  .legend { color: #6B635B; font-size: 9px; margin-top: 6px; }
  .foot { color: #9CA3AF; font-size: 9px; margin-top: 12px; text-align: right; }
</style></head><body>
  <h1>${esc(businessName)}</h1>
  <div class="sub">Attendance &amp; Salary Register — ${period} · ${rows.length} staff</div>

  <h2>Attendance</h2>
  <table>
    <thead><tr><th>Name</th>${head}<th>Days</th><th>Abs</th></tr></thead>
    <tbody>${muster}</tbody>
  </table>
  <div class="legend">P Present · A Absent · H Half day · PL Paid leave · UL Unpaid leave · HO Holiday · WO Week off · L Late · · not marked (counted absent)</div>

  <h2>Salary</h2>
  <table>
    <thead><tr><th>Name</th><th>Rate</th><th>Present</th><th>Absent</th><th>Half</th><th>Paid leave</th><th>Hours</th><th>OT hrs</th><th>Late (fine)</th><th>Earned</th><th>Paid</th><th>Balance</th></tr></thead>
    <tbody>${salaryRows}</tbody>
    <tfoot><tr><td class="name" colspan="9">Total</td><td class="m">${formatCurrency(totEarned)}</td><td class="m">${formatCurrency(totPaid)}</td><td class="m">${formatCurrency(totDue)}</td></tr></tfoot>
  </table>
  <div class="foot">Generated by Hisab Pagar on ${dayjs().locale('en').format('DD MMM YYYY')}</div>
</body></html>`;
}
