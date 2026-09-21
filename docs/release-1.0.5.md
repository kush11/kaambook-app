# Hisab Pagar 1.0.5 — release sheet

- **Version:** 1.0.5 · **versionCode:** 10 (Play's highest so far is 9 / 1.0.4)
- **Bundle:** `android/app/build/outputs/bundle/release/app-release.aab`
- **Signed with:** upload key, SHA-256 `9D:A1:11:8B:3C:D9:19:2A:B0:47:B2:6A:43:7A:F0:21:A2:B8:3F:FD:AF:75:D7:73:97:BF:28:39:2D:5F:5E:9D`

## Order of operations

1. Publish `docs/privacy-policy.html` at the public privacy-policy URL. **Do this first** — the live page still says the app has no analytics.
2. Update the Data safety form (answers below) and the store listing line (below).
3. Upload the bundle to **Internal testing**, install it from Play on one phone, and check:
   - events arrive in PostHog (project 619592 → Activity);
   - the rating sheet appears after sharing a salary slip (it only shows for Play-installed builds);
   - a salary slip PDF shows the "Get Hisab Pagar on Google Play" link and it opens.
4. Promote to Production. A staged rollout (e.g. 20% → 100%) is sensible: this release touches startup, navigation and every language file.

## What's new (Play Console → Release notes)

**en-IN / en-US**
```
• Fresh new look for the home screen and attendance marking
• Share Hisab Pagar with other business owners in one tap
• Backup reminder so you never lose your staff records
• Add or change your mobile number from Settings
• Full app now in your language — screen titles, buttons and reminders translated
• Smoother app start and bug fixes
```

**hi-IN**
```
• होम स्क्रीन और हाज़िरी लगाने का नया, आसान डिज़ाइन
• एक टैप में हिसाब पगार दूसरे दुकानदारों के साथ शेयर करें
• बैकअप रिमाइंडर — ताकि स्टाफ का रिकॉर्ड कभी न खोए
• सेटिंग्स से अपना मोबाइल नंबर जोड़ें या बदलें
• अब पूरी ऐप आपकी भाषा में — स्क्रीन के नाम, बटन और रिमाइंडर भी
• ऐप अब और तेज़ी से खुलती है, कुछ गड़बड़ियाँ ठीक की गईं
```

## Store listing line to change

Replace "100% Offline — Your data stays on your phone…" with:

> Works Fully Offline — Your staff, attendance and salary records stay on your phone. No internet needed, no account required.

## Data safety form (Play Console → Policy and programmes → App content → Data safety)

**Overview questions**

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS to PostHog and to the AI proxy) |
| Do you provide a way for users to request that their data is deleted? | **Yes** — by email, as described in the privacy policy |

**Data types.** "Shared" stays **No** for the PostHog rows: Google does not count sending data to a service provider
that processes it on your behalf as sharing. See the note below for the Gemini row.

| Category → type | Collected | Shared | Processed ephemerally | Required / optional | Purposes |
|---|---|---|---|---|---|
| Personal info → Phone number (the owner's own number) | Yes | No | No | Optional | Analytics; Developer communications |
| Location → Approximate location (city/country derived from IP by PostHog) | Yes | No | No | Required | Analytics |
| App activity → App interactions (screens opened, actions taken) | Yes | No | No | Required | Analytics |
| App info and performance → Diagnostics (`error_occurred` events) | Yes | No | No | Required | Analytics |
| Device or other IDs (PostHog's per-install anonymous ID) | Yes | No | No | Required | Analytics |
| Personal info → Name (staff and business names, AI Summary only) | Yes | See note | Yes | Optional | App functionality |
| Financial info → Other financial info (salary figures, AI Summary only) | Yes | See note | Yes | Optional | App functionality |

**Not collected:** precise location, contacts (the contact picker reads one contact on the device and sends nothing),
photos, files, messages, email address, payment info, health, web history.

**Note on the AI Summary rows.** The proxy forwards staff names and salary figures to Google Gemini. If the Gemini key
is on the **free tier**, Google's terms allow prompts to be used to improve their products — that is closer to
"sharing" than "service provider", and the honest answer would be Shared = Yes. Two cleaner options: move the key to a
paid Gemini tier (no training on prompts), or stop sending real names (send "Staff 1, Staff 2…" and put the names back
on the device). Until one of those is done, declare these two rows as **Shared: Yes, purpose: App functionality**.

## What was tested on a real phone (Xiaomi, side-by-side test copy)

- Fresh install → onboarding → Home; returning-user launch; launch recorded frame-by-frame (no flicker, no remount).
- Analytics: events arrive in PostHog with app version, device and identity; phone number normalised to 10 digits.
- Phone number dialog, share sheet, salary slip PDF + share, review request reaching Play's review service,
  backup reminder card, backup button.
- Language switching English ↔ Hindi ↔ Tamil with no crash; tabs, headers, dialogs and forms follow the language.
- `npx tsx scripts/verify-salary.ts` → 14 passed, 0 failed. `npx tsc --noEmit` clean.

## Not tested

- The rating sheet actually appearing (needs a Play-installed build — step 3 above).
- The PDF footer link visually.
- Reminder notification text in non-English languages; six of the nine non-English languages were not viewed;
  no native-speaker review of the new strings.
- Backup card "Not Now" snooze; share-failure message; cashbook entry colours with real entries.
- Any phone other than the one Xiaomi device; iOS is not part of this release.
- The redesigned Home / attendance UI was exercised only lightly.
