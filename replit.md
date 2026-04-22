# cphillips-sleep-log

A minimal static web application (sleep tracking log) served as a static site.

## Project Structure

- `index.html` — Main entry point (currently a placeholder "hello world" page)
- `.github/workflows/` — Azure Static Web Apps CI/CD configuration (not used in Replit)

## Tech Stack

- Plain HTML (static site, no build step required)
- Served via Python's built-in HTTP server in development

## Running Locally

The workflow "Start application" runs:
```
python3 -m http.server 5000 --bind 0.0.0.0
```
This serves the static files on port 5000.

## Deployment

Configured as a **static** deployment with `publicDir: "."`.
