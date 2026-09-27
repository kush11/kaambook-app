import { useEffect } from 'react';
import { router } from 'expo-router';

/**
 * Target of Google's OAuth redirect (`com.kaambook.app:/oauth2redirect?code=…`).
 *
 * expo-auth-session picks the URL up from the Linking event (warm start) or the
 * initial URL (cold start, see `completeColdStartAuth`). expo-router *also* sees
 * the URL and would render "Unmatched Route" for it, so this route exists only
 * to step out of the way: back to wherever the user was, or Home on cold start.
 */
export default function OAuthRedirect() {
  useEffect(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);
  return null;
}
