# RestLog — Sleep Better, Understand Your Energy

A frontend-only sleep tracking web app for college students. Uses localStorage for data persistence — no backend or database required.

## File Structure

```
restlog/
├── index.html              # Main app — all views in one file
├── style.css               # All styles — calming indigo/lavender palette
├── app.js                  # All logic — routing, storage, form, insights
├── staticwebapp.config.json # Azure Static Web App routing config
└── replit.md
```

## Architecture

- Single-page app using vanilla HTML5, CSS3, and JavaScript
- View switching handled by toggling `.active` class and `hidden` attribute
- All data stored in `localStorage` under key `restlog_entries`
- No build step, no frameworks, no dependencies

## Semantic HTML Structure

```
<header>
  <nav> ... </nav>
</header>
<main>
  <section id="view-landing">  Landing page     </section>
  <section id="view-log">      Sleep log form   </section>
  <section id="view-dashboard"> Dashboard       </section>
  <section id="view-history">  Sleep history    </section>
</main>
<div role="dialog">  Edit modal  </div>
<div role="status">  Toast       </div>
```

## Accessibility (WCAG 2.1 AA)

- All form inputs have associated `<label>` elements
- Star widget uses `role="radiogroup"` with individual `aria-label` per star
- Color contrast: primary text (#2e2b3d) on background (#f4f2f8) — ~13:1; muted text (#6b6680) — ~4.5:1
- Focus indicators: visible 2px primary-color outline on all interactive elements
- `aria-live` regions for dynamic content (hours display, toast)
- `aria-current="page"` on active nav item
- Escape key closes modal; backdrop click closes modal

## Running Locally

Workflow "Start application":
```
python3 -m http.server 5000 --bind 0.0.0.0
```

## Azure Static Web App Deployment

Configured as a **static** deployment. `staticwebapp.config.json` handles SPA routing fallback.
