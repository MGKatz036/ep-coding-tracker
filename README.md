# EP Coding Tracker

A personal web app for logging EP procedures and tracking CPT codes, wRVUs, and revenue. No patient information is ever stored.

## How to open it (before it's hosted online)
Double-click `index.html` — it opens in Safari and works entirely on this device. Data is saved in the browser (IndexedDB) and survives closing/reopening the page.

## What each file does (plain English)
- `index.html` — the page itself: header, tabs, and the three screens (Log / History / Settings)
- `styles.css` — all colors, sizes, and layout
- `data/referenceData.js` — **the CPT code / wRVU lookup table.** This is the file Claude edits when CMS values need updating.
- `js/sessionForm.js` — the procedure picker and the "Current Session" cart
- `js/historyView.js` — the History tab: filters, totals, session list
- `js/settingsView.js` — the Settings tab: $/wRVU rate, reference-data status
- `js/db.js` — saves/loads data from browser storage
- `js/app.js` — glue that starts everything and handles tab switching

## Asking for changes
Open Claude Code in this folder and describe the change in plain English, e.g. "make the Save button green" or "add a note field to each session." Mention the file if you know it, but you don't have to.

## Important: wRVU values are unverified
The values in `data/referenceData.js` are estimates. Before relying on totals, ask Claude: **"Verify the wRVU values against the current CMS Medicare Physician Fee Schedule and update referenceData.js."** Once verified, the yellow warning banner disappears.

## Build status
- ✅ Phase 0–1: local app (this)
- ✅ UI extras: ×2 counters for 93655/93657, automatic bundling gray-outs (2023 rules), leadless PM section (Aveir crosswalk values, 0795T = 12.8 per user's comp plan)
- ✅ Phase 5 (partial): CSV export (Settings tab). iOS Share Sheet still to do.
- ✅ Phase 2: Google Sheets connection — CONFIRMED WORKING (user connected via Chrome on Mac, localhost:8642; entries appear in SessionLog tab)
- ⬜ Phase 3: offline sync queue + cross-device merge
- ⬜ Phase 4: reporting polish
- ⬜ Phase 6: settings/reference maintenance UX
- ⬜ Phase 7: deployment (GitHub Pages + Google Cloud setup, done together step-by-step)
- ⬜ wRVU verification pass against current CMS MPFS (ablation codes are 2023 values; leadless are 2025; device implant/check codes are still estimates)

Full plan: see `BUILD_PLAN.md`.
Source documents used so far (in this folder + user's Downloads): 2023 Biosense/Avania ablation coding webinar PDF, Abbott Aveir AR + DR physician crosswalk guides.
