export const formatCurrency = (amount: number): string => {
  const absAmount = Math.abs(amount);
  // Indian number formatting (1,00,000)
  const formatted = absAmount.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  return `₹${amount < 0 ? '-' : ''}${formatted}`;
};

export const formatCurrencyShort = (amount: number): string => {
  const abs = Math.abs(amount);
  if (abs >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return formatCurrency(amount);
};

export const formatPhone = (phone: string | null): string => {
  if (!phone) return '';
  if (phone.length === 10) {
    return `${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return phone;
};
