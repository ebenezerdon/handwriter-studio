# Handwriter Studio

Handwriter Studio is a beautiful web app for generating handwriting practice sheets for letters, words, and grid layouts with one-click PDF export. It is built by [Teda.dev](https://teda.dev), the simplest AI app builder for regular people, and designed to feel like a polished, production-ready tool.

## Features
- Letters, words, and blank/grid sheet modes
- Primary 3-line guides or square grid backgrounds
- Dotted, outline, or ghost tracing styles
- Adjustable paper size, orientation, margins, line height, and font size
- Live preview with zoom
- High quality PDF export using html2canvas and jsPDF
- Local persistence with `localStorage` so your settings stick across sessions
- Accessible, responsive UI that looks great on any device

## Tech stack
- HTML5 + Tailwind CSS (via CDN)
- jQuery 3.7.x
- Vanilla JS modules organized under `scripts/`
- html2canvas + jsPDF for PDF generation

## Project structure
- index.html: Landing page with marketing content and CTAs
- app.html: Main app that builds and exports worksheets
- styles/main.css: Custom CSS (no Tailwind directives)
- scripts/helpers.js: Utilities, storage, sizing, and PDF export helpers
- scripts/ui.js: App UI logic and rendering
- scripts/main.js: Entry point that boots the app

## Getting started
1. Open `index.html` to view the landing page.
2. Click "Create a Sheet" to go to `app.html`.
3. Choose your content type, tweak settings, and hit Export PDF when ready.

No build step is required. Everything runs locally in your browser.

## Accessibility
- Semantic HTML and labeled controls
- Keyboard navigable
- High-contrast color choices and focus states
- Respects reduced motion settings where applicable

## Notes
- PDF export captures the exact preview at print-ready resolution.
- If your preview looks scaled down for screen fit, the export temporarily removes the scale for crisp output.

## License
MIT
