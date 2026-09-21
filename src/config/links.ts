export const PACKAGE = 'com.kaambook.app';

/**
 * Play Store link tagged with where it was shared from, so Play Console's
 * acquisition report shows installs per source (e.g. "salary_slip", "share_app").
 */
export function playStoreUrl(source: string): string {
  const referrer = encodeURIComponent(`utm_source=${source}&utm_medium=app`);
  return `https://play.google.com/store/apps/details?id=${PACKAGE}&referrer=${referrer}`;
}
