# Deep Linking — Approach

Deep links / web portal were an **optional stretch** in the brief. I didn't build them in the 6‑hour box. This doc is the plan — what the URL contract looks like for this app, how it plugs into the existing Command Router, and how Universal Links / App Links would be wired in an Expo app (from prior production work).

## What's in the repo today

- `"scheme": "permissiontask"` in `app.json` — custom URL scheme declared, both platforms.
- expo-router resolves file routes automatically, so `permissiontask://explore` already opens the Explore tab. Nothing else is wired yet.

## URL contract — the 3 targets from the brief

| Intent                           | URL                                                          |
| -------------------------------- | ------------------------------------------------------------ |
| Open Explore with filter applied | `permissiontask://explore?filter=popular&sort=asc`           |
| Open Profile                     | `permissiontask://profile`                                   |
| Open flyout with prefilled prompt| `permissiontask://flyout?prompt=dark%20mode`                 |

Same paths under the HTTPS host once Universal Links / App Links are hosted: `https://<host>/app/explore?filter=…` etc.

## The key design choice: links dispatch through the Command Router

The agent already forbids direct UI mutation — everything goes through `dispatch()` in `src/agent/router.ts` (allowlist → zod → confirm gate → log). Deep links must obey the same rules. The URL handler becomes a thin URL → command translator:

```ts
// rough shape
Linking.addEventListener('url', ({ url }) => {
  const { hostname, queryParams } = Linking.parse(url);

  switch (hostname) {
    case 'explore':
      dispatch({ type: 'applyExploreFilter', payload: {
        filter: String(queryParams.filter ?? ''),
        sort: queryParams.sort as 'asc' | 'desc' | undefined,
      }});
      break;
    case 'profile':
      dispatch({ type: 'navigate', payload: { screen: 'profile' }});
      break;
    case 'flyout':
      dispatch({ type: 'openFlyout', payload: {
        prefilledPrompt: queryParams.prompt ? String(queryParams.prompt) : undefined,
      }});
      break;
  }
});
```

Why this matters:
- A link with an unknown command → rejected by allowlist, logged with reason.
- A link with malformed params (e.g. `sort=lol`) → rejected by zod, logged.
- A link that would flip a preference → still shows the `ProposedActionCard`; no silent mutation from a URL.
- The Activity Log shows deep-link-sourced commands alongside chat-sourced ones — one audit trail.

Extend `CommandSource` (`'chat' | 'deepLink'`) on the log row so provenance is visible in the Activity Log.

## Expo config — declarative in `app.json`

```jsonc
{
  "expo": {
    "scheme": "permissiontask",
    "ios": {
      "associatedDomains": ["applinks:example.com"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [{ "scheme": "https", "host": "example.com", "pathPrefix": "/app" }],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

`expo prebuild` writes entitlements (iOS) and `intent-filter` (Android). No hand-edits to `Info.plist` / `AndroidManifest.xml`.

## iOS — Universal Links (from prior production work)

- `ios.associatedDomains` → app entitlements on prebuild.
- Host **AASA** at `https://example.com/.well-known/apple-app-site-association` — no redirects, `Content-Type: application/json`, list bundle ID + team ID under `applinks.details`.
- iOS delivers the URL via `application(_:continue:restorationHandler:)`; RN surfaces it through `Linking.getInitialURL()` (cold) and the `'url'` event (warm).
- The custom `permissiontask://` scheme stays as a dev fallback.

## Android — App Links (from prior production work)

- `intentFilters` with `"autoVerify": true` → verified App Links (no chooser sheet).
- Host **Digital Asset Links** at `https://example.com/.well-known/assetlinks.json` with the release SHA‑256 signing fingerprint. Verify:
  ```bash
  adb shell pm verify-app-links --re-verify com.anonymous.PermissionTask
  adb shell pm get-app-links      com.anonymous.PermissionTask
  ```
- A separate `intentFilter` with `{ "scheme": "permissiontask" }` keeps the custom scheme working.

## Testing

```bash
# iOS Simulator
xcrun simctl openurl booted "permissiontask://explore?filter=popular&sort=asc"
xcrun simctl openurl booted "permissiontask://flyout?prompt=dark%20mode"

# Android emulator
adb shell am start -W -a android.intent.action.VIEW \
  -d "permissiontask://explore?filter=popular&sort=asc" \
  com.anonymous.PermissionTask
```

A router-level test (`__tests__/router.test.ts` seam) would cover deep-link parsing too: an invalid `sort` value must be rejected and logged, not applied.

## Gotchas I've hit in production

- **AASA caching** — iOS CDNs it; bump path or wait ~24h. Validate with Apple's AASA validator before shipping.
- **assetlinks fingerprint** — must match the key actually used for the release; Play App Signing rewrites this, so grab the fingerprint from Play Console, not your local keystore.
- **`autoVerify` is all-or-nothing** — any failed host downgrades every App Link for that package to the chooser. Verify every host.
- **Cold vs. warm start** — always handle both `getInitialURL()` and the `'url'` event; missing cold-start handling is the #1 deep-link bug.
