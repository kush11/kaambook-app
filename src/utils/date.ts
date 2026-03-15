import dayjs, { Dayjs } from 'dayjs';

export const formatDate = (date: string | Dayjs, format = 'DD MMM YYYY') => {
  return dayjs(date).format(format);
};

export const formatDateShort = (date: string | Dayjs) => {
  return dayjs(date).format('DD/MM/YY');
};

export const today = () => dayjs().format('YYYY-MM-DD');

export const getDaysInMonth = (year: number, month: number): string[] => {
  const start = dayjs().year(year).month(month).startOf('month');
  const days: string[] = [];
  const daysInMonth = start.daysInMonth();
  for (let i = 0; i < daysInMonth; i++) {
    days.push(start.add(i, 'day').format('YYYY-MM-DD'));
  }
  return days;
};

export const getMonthName = (month: number): string => {
  return dayjs().month(month).format('MMMM');
};

export const getMonthYear = (year: number, month: number): string => {
  return dayjs().year(year).month(month).format('MMMM YYYY');
};

export const getDayOfWeek = (date: string): number => {
  return dayjs(date).day(); // 0=Sun, 6=Sat
};

export const isToday = (date: string): boolean => {
  return dayjs(date).isSame(dayjs(), 'day');
};

export const isFuture = (date: string): boolean => {
  return dayjs(date).isAfter(dayjs(), 'day');
};

export const isBeforeDate = (date: string, before: string): boolean => {
  return dayjs(date).isBefore(dayjs(before), 'day');
};
