import { Share } from 'react-native';
import i18n from '../i18n';
import { playStoreUrl } from '../config/links';
import { track, trackError } from './analytics';

/** Opens the system share sheet with a ready-made message and the Play Store link. */
export async function shareApp(source: 'home_header' | 'settings'): Promise<void> {
  try {
    await Share.share({ message: `${i18n.t('share.message')}\n${playStoreUrl('share_app')}` });
    track('app_shared', { source });
  } catch (e) {
    trackError('app_share', e);
  }
}
