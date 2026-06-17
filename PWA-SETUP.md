# Installing Neon Hockey on your phone (PWA)

Neon Hockey is a **Progressive Web App**: once it's served over HTTPS you can
install it to your home screen on Android and iPhone, launch it fullscreen with
its own icon, and play **offline**.

## 1. Host it over HTTPS (one-time)

A service worker (offline support) and "Add to Home Screen" only work over
`https://` (or `http://localhost`), not from a `file://` path.

The easiest free option is **GitHub Pages**:

1. Push this repo to GitHub (already done if you're reading this there).
2. On GitHub: **Settings → Pages**.
3. Under **Build and deployment → Source**, pick **Deploy from a branch**.
4. Choose the branch (e.g. `claude/air-hockey-game-uwceu2` or `main`) and folder
   `/ (root)`, then **Save**.
5. After a minute your game is live at
   `https://<your-user>.github.io/<repo>/` — open that URL on your phone.

(Any static host works too: Netlify, Vercel, Cloudflare Pages, itch.io, etc.
Just serve the repo root so `index.html`, `manifest.webmanifest`, `sw.js` and
the `icons/` folder sit next to each other.)

## 2. Install on a phone

**Android (Chrome):** open the URL → tap the **⋮** menu → **Install app** /
**Add to Home screen**. You may also get an automatic install banner.

**iPhone / iPad (Safari):** open the URL → tap the **Share** button →
**Add to Home Screen** → **Add**.

The app now has its own neon icon and launches without the browser UI.

## Notes

- **Offline:** after the first load the whole game is cached, so it runs with no
  connection. Your settings, ranks, skills and stats are stored on-device.
- **Updates:** when you change `index.html` or the icons, bump the `CACHE`
  version string in `sw.js` so phones fetch the new version.
- **iOS limitations:** Apple ignores the manifest's `display`/`orientation` (the
  iOS meta tags handle fullscreen instead), and `navigator.vibrate` haptics are
  not supported by iOS Safari — everything else works on both platforms.

## Want it in the App Store / Play Store?

A PWA isn't store-listed. To publish a real native app, wrap this with
[Capacitor](https://capacitorjs.com): it produces Xcode/Android Studio projects
you can submit. That needs a Google Play account (one-time fee) for Android and a
Mac + Apple Developer account for iPhone. Ask and I can scaffold the Capacitor
project for you.

## Regenerating the icons

The app icons in `icons/` are generated with zero dependencies:

```
node tools/gen-icons.js
```
