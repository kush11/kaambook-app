import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';
import type { Staff, SalaryBreakdown, Payment } from '../types';
import { formatCurrency } from './formatters';
import { getMonthYear } from './date';
import dayjs from 'dayjs';

function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
  return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
}

function generateSalarySlipHTML(
  businessName: string,
  staffMember: Staff,
  breakdown: SalaryBreakdown,
  payments: Payment[],
  year: number,
  month: number,
): string {
  const period = getMonthYear(year, month);
  const generatedDate = dayjs().format('DD MMM YYYY');

  const salaryLabel = staffMember.salaryType === 'monthly' ? 'Monthly Salary'
    : staffMember.salaryType === 'daily' ? 'Daily Wage'
    : 'Weekly Wage';

  const salaryPayments = payments.filter(p => p.type === 'salary').reduce((s, p) => s + p.amount, 0);
  const advancePayments = payments.filter(p => p.type === 'advance').reduce((s, p) => s + p.amount, 0);
  const bonusPayments = payments.filter(p => p.type === 'bonus').reduce((s, p) => s + p.amount, 0);
  const penaltyPayments = payments.filter(p => p.type === 'penalty').reduce((s, p) => s + p.amount, 0);

  const netPayable = breakdown.balanceDue;
  const amountInWords = numberToWords(Math.abs(Math.round(breakdown.earnedSalary))) + ' Rupees Only';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @page { margin: 24px; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #1C1C1C; background: #fff; }
  .container { max-width: 595px; margin: 0 auto; border: 2px solid #16A34A; }
  .header { background: #16A34A; color: #fff; padding: 16px 20px; text-align: center; }
  .header h1 { font-size: 20px; margin-bottom: 4px; letter-spacing: 1px; }
  .header p { font-size: 12px; opacity: 0.9; }
  .sub-header { background: #F0FDF4; padding: 10px 20px; display: flex; justify-content: space-between; border-bottom: 1px solid #E5E7EB; }
  .sub-header div { font-size: 12px; }
  .sub-header strong { color: #16A34A; }
  .section { padding: 12px 20px; }
  .section-title { font-size: 13px; font-weight: bold; color: #16A34A; border-bottom: 2px solid #16A34A; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-grid { display: flex; flex-wrap: wrap; }
  .info-item { width: 50%; padding: 4px 0; }
  .info-label { color: #6B7280; font-size: 11px; }
  .info-value { font-weight: 600; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #F0FDF4; color: #16A34A; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; text-align: left; border-bottom: 2px solid #E5E7EB; }
  td { padding: 6px 12px; border-bottom: 1px solid #F3F4F6; font-size: 13px; }
  td:last-child, th:last-child { text-align: right; }
  .total-row td { font-weight: bold; border-top: 2px solid #E5E7EB; background: #F9FAFB; }
  .two-col { display: flex; }
  .two-col > div { flex: 1; }
  .two-col > div:first-child { border-right: 1px solid #E5E7EB; }
  .net-pay { background: #16A34A; color: #fff; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; }
  .net-pay .label { font-size: 14px; font-weight: 600; }
  .net-pay .amount { font-size: 22px; font-weight: bold; }
  .amount-words { background: #F0FDF4; padding: 8px 20px; font-size: 11px; color: #6B7280; border-top: 1px solid #D1FAE5; }
  .footer { padding: 10px 20px; font-size: 10px; color: #9CA3AF; text-align: center; border-top: 1px solid #E5E7EB; }
  .payment-table { margin-top: 4px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
  .badge-green { background: #D1FAE5; color: #16A34A; }
  .badge-red { background: #FEE2E2; color: #DC2626; }
  .badge-yellow { background: #FEF3C7; color: #92400E; }
  .badge-blue { background: #DBEAFE; color: #2563EB; }
</style>
</head>
<body>
<div class="container">
  <!-- Header -->
  <div class="header">
    <h1>${businessName}</h1>
    <p>Salary Slip — ${period}</p>
  </div>

  <!-- Sub Header -->
  <div class="sub-header">
    <div>Generated: <strong>${generatedDate}</strong></div>
    <div>Pay Period: <strong>${period}</strong></div>
  </div>

  <!-- Employee Info -->
  <div class="section">
    <div class="section-title">Employee Details</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Name</div>
        <div class="info-value">${staffMember.name}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Phone</div>
        <div class="info-value">${staffMember.phone || '—'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Salary Type</div>
        <div class="info-value">${salaryLabel}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Rate</div>
        <div class="info-value">${formatCurrency(staffMember.salaryAmount)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Joining Date</div>
        <div class="info-value">${dayjs(staffMember.joiningDate).format('DD MMM YYYY')}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Status</div>
        <div class="info-value"><span class="badge badge-green">${staffMember.status.toUpperCase()}</span></div>
      </div>
    </div>
  </div>

  <!-- Attendance Summary -->
  <div class="section">
    <div class="section-title">Attendance Summary</div>
    <table>
      <tr>
        <th>Category</th>
        <th>Days</th>
      </tr>
      <tr><td>Total Days in Month</td><td>${breakdown.totalDays}</td></tr>
      <tr><td><span class="badge badge-green">Present</span></td><td>${breakdown.presentDays}</td></tr>
      <tr><td><span class="badge badge-red">Absent</span></td><td>${breakdown.absentDays}</td></tr>
      <tr><td><span class="badge badge-yellow">Half Day</span></td><td>${breakdown.halfDays}</td></tr>
      <tr><td><span class="badge badge-blue">Paid Leave</span></td><td>${breakdown.paidLeaves}</td></tr>
      <tr><td>Week Offs</td><td>${breakdown.weekOffs}</td></tr>
      <tr><td>Holidays</td><td>${breakdown.holidays}</td></tr>
      ${breakdown.overtimeHours > 0 ? `<tr><td>Overtime Hours</td><td>${breakdown.overtimeHours}</td></tr>` : ''}
    </table>
  </div>

  <!-- Earnings & Payments -->
  <div class="section">
    <div class="two-col">
      <div style="padding-right: 10px;">
        <div class="section-title">Earnings</div>
        <table>
          <tr><td>Earned Salary</td><td>${formatCurrency(breakdown.earnedSalary)}</td></tr>
        </table>
      </div>
      <div style="padding-left: 10px;">
        <div class="section-title">Payments Made</div>
        <table>
          ${salaryPayments > 0 ? `<tr><td>Salary Paid</td><td>${formatCurrency(salaryPayments)}</td></tr>` : ''}
          ${advancePayments > 0 ? `<tr><td>Advance</td><td>${formatCurrency(advancePayments)}</td></tr>` : ''}
          ${bonusPayments > 0 ? `<tr><td>Bonus</td><td>${formatCurrency(bonusPayments)}</td></tr>` : ''}
          ${penaltyPayments > 0 ? `<tr><td>Penalty</td><td style="color:#DC2626">-${formatCurrency(penaltyPayments)}</td></tr>` : ''}
          <tr class="total-row"><td>Total Paid</td><td>${formatCurrency(breakdown.totalPaid)}</td></tr>
        </table>
      </div>
    </div>
  </div>

  <!-- Net Pay -->
  <div class="net-pay">
    <span class="label">${netPayable >= 0 ? 'Balance Due' : 'Overpaid'}</span>
    <span class="amount">${formatCurrency(Math.abs(netPayable))}</span>
  </div>
  <div class="amount-words">
    Amount Earned: ${amountInWords}
  </div>

  <!-- Payment History -->
  ${payments.length > 0 ? `
  <div class="section">
    <div class="section-title">Payment History</div>
    <table class="payment-table">
      <tr>
        <th>Date</th>
        <th>Type</th>
        <th>Mode</th>
        <th>Amount</th>
      </tr>
      ${payments.map(p => `
      <tr>
        <td>${dayjs(p.date).format('DD MMM')}</td>
        <td><span class="badge ${p.type === 'penalty' ? 'badge-red' : 'badge-green'}">${p.type.toUpperCase()}</span></td>
        <td>${p.mode.toUpperCase()}</td>
        <td${p.type === 'penalty' ? ' style="color:#DC2626"' : ''}>${p.type === 'penalty' ? '-' : ''}${formatCurrency(p.amount)}</td>
      </tr>`).join('')}
    </table>
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    This is a computer-generated salary slip from KaamBook. No signature required.
  </div>
</div>
</body>
</html>`;
}

export async function generateAndShareReport(
  businessName: string,
  staffMember: Staff,
  breakdown: SalaryBreakdown,
  payments: Payment[],
  year: number,
  month: number,
): Promise<void> {
  const html = generateSalarySlipHTML(businessName, staffMember, breakdown, payments, year, month);

  const { uri } = await Print.printToFileAsync({ html });

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Salary Slip - ${staffMember.name}`,
    UTI: 'com.adobe.pdf',
  });
}

export async function generateReport(
  businessName: string,
  staffMember: Staff,
  breakdown: SalaryBreakdown,
  payments: Payment[],
  year: number,
  month: number,
): Promise<string> {
  const html = generateSalarySlipHTML(businessName, staffMember, breakdown, payments, year, month);
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

export async function shareReportWhatsApp(
  uri: string,
  staffMember: Staff,
  year: number,
  month: number,
): Promise<void> {
  const period = getMonthYear(year, month);
  const message = `Salary Slip for ${staffMember.name} - ${period}`;

  // Share the PDF file - WhatsApp will be available in the share sheet
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: message,
    UTI: 'com.adobe.pdf',
  });
}
