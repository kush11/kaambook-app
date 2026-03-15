import { I18n } from 'i18n-js';
import en from './en.json';
import hi from './hi.json';
import gu from './gu.json';
import mr from './mr.json';
import pa from './pa.json';
import bn from './bn.json';
import ta from './ta.json';
import te from './te.json';
import kn from './kn.json';
import od from './od.json';

const i18n = new I18n({ en, hi, gu, mr, pa, bn, ta, te, kn, od });
i18n.defaultLocale = 'en';
i18n.locale = 'en';
i18n.enableFallback = true;

export default i18n;
export const setLocale = (locale: string) => {
  i18n.locale = locale;
};
