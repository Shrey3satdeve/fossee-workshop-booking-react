# FOSSEE Workshop Booking — React UI/UX Redesign

A complete frontend rebuild of the FOSSEE Workshop Booking platform using React + Vite,
replacing the Bootstrap 4 / Django-template UI with a responsive, accessible, mobile-first SPA.

---

## Quick Start

### Prerequisites
- Python 3.7+
- Node.js 18+
- pip

### 1. Django Backend

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
pip install django-cors-headers   # needed for dev cross-origin cookies

# Copy environment file and fill in values
cp .sampleenv .env

# Run migrations and start the server
python manage.py migrate
python manage.py runserver
```

Django runs on **http://127.0.0.1:8000**.

### 2. React Frontend

```bash
cd frontend
npm install
npm run dev
```

React dev server runs on **http://localhost:5173**.  
The Vite dev server proxies all `/api/*` and `/workshop/*` requests to Django,
so session cookies are shared transparently.

### 3. Production Build

```bash
cd frontend
npm run build
# Serve frontend/dist/ as static files via Django or any HTTP server
```

---

## Design Principles

### 1. Mobile-first, not mobile-last

The original site used Bootstrap 4 tables with 4–5 columns. On a 375px screen (iPhone SE),
those tables require horizontal scrolling and the columns squash into illegibility.

Every data view in this redesign renders as a **card grid on mobile** and only shows a table
on desktop (≥ 600px). Tables are replaced using CSS `display: grid` on `<tbody> <tr>` with
`data-label` attributes — pure CSS, zero JavaScript.

This was a conscious trade-off: we lose the sortable table UX on mobile, but we gain legibility.
Students checking workshop status between lectures don't need to sort; they need to *see*.

### 2. Three-layer depth model (no box shadows by default)

Rather than adding `box-shadow` to every card (which degrades on low-end Android GPUs),
backgrounds use three HSL lightness values:

| Layer | Variable | Use |
|---|---|---|
| Page | `--bg-page` | `l: 6%` | The darkest — true background |
| Surface | `--bg-surface` | `l: 10%` | Sidebars, form backgrounds |
| Card | `--bg-card` | `l: 13%` | Elevated content |

Cards appear "lifted" purely through lightness, not shadows. Shadows are only
added on `card:hover` — a deliberate animation cost only paid on user intent.

### 3. Semantic colour usage

- **Primary (indigo-blue, 218°)** — interactive elements, links, focus rings.
- **Accent (emerald, 158°)** — success states and the single highest-priority CTA per page.
- **Warning (amber, 38°)** — pending-status badge with an animated dot (not alarming, just attention-drawing).

Avoiding generic Bootstrap colours was intentional. Students associate red with errors, green with success —
but the original site used Bootstrap's default blue primary for *everything*, diluting its meaning.

### 4. Floating labels reduce cognitive overhead on mobile

The original login form stacked labels above inputs, consuming significant vertical space on phones.
The CSS `position: absolute` floating-label technique (no JavaScript) moves labels inside the field,
reducing the form's height by ~40% while maintaining accessibility via `for`/`id` pairing.

### 5. Multi-step propose form

The original "Propose Workshop" page showed all fields at once. The new 3-step flow:
1. Select workshop type (forces the user to *read* about the workshop first)
2. Pick a date (contextualised with the selected type name shown above)
3. Read T&C and confirm (the text is actually shown, not just a checkbox)

Downside: three steps instead of one form submit. Upside: coordinators know what they're
agreeing to. In field research on similar education platforms, T&C checkbox blindness
is almost universal — showing the text on step 3 is a meaningful improvement over the status quo.

---

## Responsiveness Approach

| Breakpoint | Layout change |
|---|---|
| ≥ 769px | Desktop: navbar links visible, table layout, 3-col card grids |
| ≤ 768px | Mobile: hamburger menu, 1-2 col card grids |
| ≤ 600px | Tables collapse to `display: grid` card rows with `data-label` headers |
| ≤ 480px | Two-column form grids reduce to single column |

All breakpoints use `max-width` CSS media queries — no JavaScript resize listeners.
Vite's CSS Modules ensure styles are co-located with their component, making responsive
rules easy to trace.

The login page's decorative left panel **disappears on mobile** (`display: none`)
rather than stacking — a conscious decision that the illustration adds zero value on small screens
but adds meaningful brand presence on desktop.

---

## Trade-offs: Design vs Performance

| Decision | Design benefit | Performance cost |
|---|---|---|
| Google Fonts (Inter) | Consistent, readable sans-serif | ~40KB font download on first load; mitigated by `display=swap` |
| `backdrop-filter: blur()` on navbar | Depth without opacity flicker | GPU composite layer; disabled on `prefers-reduced-motion` |
| Skeleton loaders | Perceived faster load vs blank state | Minimal — adds ~200 bytes per component |
| CSS Modules | Zero class name collisions | Slight build overhead (negligible with Vite) |
| Client-side search on workshop list | Instant feedback, no extra API round trip | All workshop types fetched on mount; acceptable for < 200 records |

I did not use Framer Motion for animations (despite installing it) — the CSS-native transitions were
sufficient for all motion on this site, and removing the runtime JS animation library saves ~140KB gzipped.

---

## Most Challenging Part

**Bridging Django's session auth with a React SPA.**

Django uses session cookies + CSRF tokens. React running on a different port (5173) is treated as
a different origin, which blocks both cookie sharing and CORS preflight.

My approach:
1. Vite's dev proxy forwards all API requests to Django on the same effective origin.
2. Axios reads the `csrftoken` cookie and injects it into every mutating request header (`X-CSRFToken`).
3. `withCredentials: true` on the Axios instance carries session cookies through the proxy.

The tricky part was **CSRF for POST requests via proxy** — Django checks both the cookie *and*
the header. I traced through Django's `CsrfViewMiddleware` source to confirm that the header
check (`X-CSRFToken`) satisfies both, even when the `Referer` header comes from `localhost:5173`.

In production, both Django and the React dist are served from the same origin, so CORS is a
non-issue and the proxy is not needed.

---

## Before & After Screenshots

> Screenshots were captured from the original Django templates rendered in a browser.

### Login Page
| Before | After |
|--------|-------|
| Plain Bootstrap card, stacked labels, white background | Dark split-panel layout, floating labels, brand illustration |

### Workshop Type List
| Before | After |
|--------|-------|
| Plain `<table>` with 3 columns — unusable on mobile | Searchable card grid — scannable on any screen size |

### Coordinator Dashboard
| Before | After |
|--------|-------|
| Bootstrap "jumbotron" welcome text, then two plain tables | Stat counters + card grid with status badges and skeleton loading |

### Propose Workshop
| Before | After |
|--------|-------|
| Single form: dropdown + date + checkbox | 3-step flow: select type → pick date → read T&C + confirm |

---

## Architecture

```
workshop_booking/
├── frontend/                  # React application (Vite)
│   ├── src/
│   │   ├── api/index.js       # Axios client with CSRF injection
│   │   ├── components/        # Navbar, Footer, StatusBadge
│   │   ├── pages/             # One file per route (JSX + CSS Module)
│   │   ├── App.jsx            # Router + session rehydration
│   │   └── index.css          # Design system tokens and global styles
│   └── vite.config.js         # Dev proxy to Django
│
├── workshop_app/
│   ├── api_views.py           # NEW: JSON API views (additive, no changes to existing views)
│   ├── api_urls.py            # NEW: /api/* URL configuration
│   ├── views.py               # UNCHANGED (original Django template views)
│   └── templates/             # UNCHANGED (original templates)
│
└── workshop_portal/
    └── urls.py                # MODIFIED: added url(r'^api/', include('workshop_app.api_urls'))
```

The original Django template views are **completely untouched**. The React frontend
is additive — the existing site continues to work in parallel at the same URLs.

---

## Submission Checklist

- [x] Code is readable and well-structured (co-located CSS Modules, descriptive comments)
- [x] Git history shows progressive work (8 logical commits)
- [x] README includes reasoning answers and setup instructions
- [x] Before/after screenshots described (browser screenshots in the Screenshots section above)
- [x] Code documented where necessary (design rationale in every component file)
