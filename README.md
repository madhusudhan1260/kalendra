# Kalendra 📆

A clean, fast calendar for tracking **events**, **birthdays**, and **tasks** — built with plain HTML, CSS, and JavaScript. No build step, no dependencies, no backend. Everything is saved locally in your browser.

## Features

- **Month view** with color-coded chips for events, birthdays, and tasks
- **Agenda view** — a scrollable list of everything coming up in the next 45 days
- **Birthdays that repeat automatically** every year
- **Tasks with checkboxes** you can tick off right from the calendar or sidebar
- **Upcoming panel** showing your next items at a glance
- **Light & dark themes** (follows your system setting, with a manual toggle)
- **Fully responsive** — a three-pane layout on desktop, a bottom-tab + swipe-up day sheet on mobile
- Data persists locally via `localStorage` — nothing leaves your device

## Running it locally

No install required — it's a static site.

```bash
open index.html
```

Or serve it with any static server, e.g.:

```bash
npx serve .
```

## Deploying (GitHub Pages)

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Set the source to the `main` branch, root folder.
4. Your app will be live at `https://<username>.github.io/<repo>/`.

## Running it as a native iOS app

The `ios/` folder is a real Xcode project (via [Capacitor](https://capacitorjs.com)) that wraps this web app in a native shell — install it on your iPhone straight from Xcode, no App Store or paid developer account required.

**Requirements:** a Mac with the full **Xcode** app installed (Command Line Tools alone aren't enough — install Xcode from the App Store), and your iPhone connected by cable.

1. Open the project:
   ```bash
   open ios/App/App.xcodeproj
   ```
2. In Xcode, go to **Xcode → Settings → Accounts** and sign in with your Apple ID (a free personal account works for installing on your own device).
3. Select the **App** target → **Signing & Capabilities** tab → choose your Apple ID under **Team**, and adjust the **Bundle Identifier** if `com.madhusudhan.kalendra` is already taken (any unique reverse-domain string works, e.g. add your initials).
4. Plug in your iPhone, select it as the run destination (top toolbar, next to the Stop button), and press **Run (▶)**.
5. On the iPhone, the first launch will be blocked with an "Untrusted Developer" alert — go to **Settings → General → VPN & Device Management** and trust your Apple ID, then relaunch the app from the home screen.

A free Apple ID lets you install and run it this way indefinitely, but the app's signature expires after **7 days** — just re-run step 4 from Xcode to reinstall (only a real $99/year Apple Developer account removes that limit).

If you edit `index.html`, `styles.css`, `app.js`, `manifest.json`, or any icon, re-sync them into the iOS project before rebuilding:
```bash
npm run sync:ios
```

## Tech

- Vanilla JS (no frameworks, no build tools) for the web app
- CSS custom properties for theming
- `localStorage` for persistence
- [Capacitor](https://capacitorjs.com) wraps the same web assets into a native iOS project (`ios/`)

## License

MIT
