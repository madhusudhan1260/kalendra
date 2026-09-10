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

## Tech

- Vanilla JS (no frameworks, no build tools)
- CSS custom properties for theming
- `localStorage` for persistence

## License

MIT
