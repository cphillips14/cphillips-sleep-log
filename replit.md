# RestLog — Sleep Better, Understand Your Energy

A simple, calming sleep tracker designed for busy college students who want to understand their sleep patterns and improve their energy and focus.

## Project Structure

- `index.html` — Single-page app shell with all views (landing, log form, dashboard, history, edit modal)
- `style.css` — Calming soft-indigo/lavender design, mobile-first, WCAG 2.1 AA compliant
- `app.js` — All client-side logic: view routing, localStorage CRUD, form handling, dashboard calculations, insights engine

## Features

- **Landing page** — Headline, value description, feature chips, CTA
- **Sleep Log Form** — Date, bedtime, wake time (auto-calculates hours), 1–5 star quality rating, optional notes
- **Dashboard** — Average hours, average quality, total entries, dynamic pattern insights
- **Sleep History** — All entries with edit and delete support
- **Edit Modal** — Inline editing of any past entry

## Data Storage

Uses **localStorage** — no backend or database needed. Appropriate for a prototype; easy to migrate to a database later if multi-device sync is needed.

## Tech Stack

- Pure HTML5, CSS3, vanilla JavaScript
- No frameworks, no build step
- Ready for Azure Static Web App deployment (publicDir: ".")

## Running Locally

Workflow "Start application" runs:
```
python3 -m http.server 5000 --bind 0.0.0.0
```

## Deployment

Configured as a **static** deployment with `publicDir: "."`.
