import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/hi';
import 'dayjs/locale/gu';
import 'dayjs/locale/mr';
import 'dayjs/locale/pa-in';
import 'dayjs/locale/bn';
import 'dayjs/locale/ta';
import 'dayjs/locale/te';
import 'dayjs/locale/kn';
import i18n from '../i18n';

// App language code -> dayjs locale. dayjs has no Odia locale, so its month names are listed below.
const DAYJS_LOCALES: Record<string, string> = {
  hi: 'hi', gu: 'gu', mr: 'mr', pa: 'pa-in', bn: 'bn', ta: 'ta', te: 'te', kn: 'kn',
};
const ODIA_MONTHS = [
  'ଜାନୁଆରୀ', 'ଫେବୃଆରୀ', 'ମାର୍ଚ୍ଚ', 'ଅପ୍ରେଲ', 'ମଇ', 'ଜୁନ',
  'ଜୁଲାଇ', 'ଅଗଷ୍ଟ', 'ସେପ୍ଟେମ୍ବର', 'ଅକ୍ଟୋବର', 'ନଭେମ୍ବର', 'ଡିସେମ୍ବର',
];

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

// Month names follow the app language by default; pass 'en' for English-only output such as the PDF slip.
export const getMonthName = (month: number, lang: string = i18n.locale): string => {
  if (lang === 'od') return ODIA_MONTHS[month];
  return dayjs().month(month).locale(DAYJS_LOCALES[lang] ?? 'en').format('MMMM');
};

export const getMonthYear = (year: number, month: number, lang: string = i18n.locale): string => {
  return `${getMonthName(month, lang)} ${year}`;
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
