# Hisab Pagar X.Y.Z — release sheet

<!-- Copy to docs/release-X.Y.Z.md. Delete these comments. -->

- **Version:** X.Y.Z · versionCode XYYZZ (major×10000 + minor×100 + patch)
- **Release:** tag `vX.Y.Z` → GitHub Actions run `<run id>` → Play Internal testing (<date, time IST>)
- **Production:** promoted <date, time IST>, rollout <100% / staged %>
- **Why:** <the user problem or data that led to this release — PostHog numbers, Play warnings, user reports>

## What changed
- <change 1 — file/area, what the user sees>
- <change 2>
- New analytics events: <event names, or "none">

## Tested before tagging
<phone model, Android version, date. Flows run. logcat clean? What could NOT be tested and why.>

## Verify on Internal testing (before promoting)
1. <step-by-step check for each change, written so someone else could do it>
2. Smoke test: add staff → attendance → payment → PDF report → Google Drive backup.
3. PostHog: <events you expect to see from your phone>.

## Play Console → Release notes

**en-IN / en-GB**
```
• <user-facing change, plain words>
• <user-facing change>
• Bug fixes and improvements
```

**hi-IN**
```
• <हिंदी में वही बात>
• <...>
• बग सुधार और बेहतर अनुभव
```

## After release
- <date>: <PostHog / vitals / reviews observations>
