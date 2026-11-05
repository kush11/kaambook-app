export const formatCurrency = (amount: number): string => {
  const absAmount = Math.abs(amount);
  // Indian number formatting (1,00,000)
  const formatted = absAmount.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  return `${amount < 0 ? '-' : ''}₹${formatted}`;
};

export const formatCurrencyShort = (amount: number): string => {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  return formatCurrency(amount);
};

export const formatPhone = (phone: string | null): string => {
  if (!phone) return '';
  if (phone.length === 10) {
    return `${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return phone;
};

// Storage sizes in the units Google shows: "11.82 GB", "640 MB".
export const formatBytes = (bytes: number): string => {
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  return `${Math.round(bytes / 1024 ** 2)} MB`;
};
