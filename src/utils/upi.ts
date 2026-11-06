/**
 * Paying staff by UPI from the app.
 *
 * We open the phone's UPI app (PhonePe, Google Pay, Paytm…) with the staff member's UPI ID
 * and the amount filled in, using the standard `upi://pay` link (NPCI's UPI deep-link spec).
 * The owner approves the payment with their own UPI PIN inside that app — this app never
 * touches money or bank details. Android does not reliably tell us whether the payment went
 * through, so the caller asks the owner afterwards before recording it.
 */
import { Linking } from 'react-native';

// handle@bank, e.g. ramesh.k@okaxis, 9876543210@ybl
const UPI_ID_PATTERN = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;

export function isValidUpiId(id: string): boolean {
  return UPI_ID_PATTERN.test(id.trim());
}

export function buildUpiPayUrl(opts: { upiId: string; name: string; amount: number; note: string }): string {
  const params = [
    ['pa', opts.upiId.trim()],
    ['pn', opts.name],
    ['am', opts.amount.toFixed(2)],
    ['cu', 'INR'],
    ['tn', opts.note.slice(0, 50)],
  ];
  return 'upi://pay?' + params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
}

/** Opens the UPI app chooser. Returns false when no UPI app can handle the link. */
export async function openUpiPayment(opts: { upiId: string; name: string; amount: number; note: string }): Promise<boolean> {
  try {
    await Linking.openURL(buildUpiPayUrl(opts));
    return true;
  } catch {
    return false;
  }
}
