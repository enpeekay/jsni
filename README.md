# JSNI website

A responsive, dependency-free static site for the Japan Society of Northern Ireland. No build step, no database, no server-side code — every page is plain HTML/CSS/JS, and content lives in two JSON files.

Live at **japansociety-ni.org.uk** (see `CNAME`), published via GitHub Pages from the `master` branch.

## Structure

```
index.html, about.html, events.html, event.html,
matsuri.html, members.html, corporate.html, contact.html
calendar.html            redirect stub -> events.html?view=calendar (keeps old links working)
assets/
  style.css               all styling; CSS variables at the top
  site.js                 loads site.json/events.json, renders event cards, nav menu
  events.js               renders the individual event detail page (event.html)
  calendar.js             drives the FullCalendar month/list view on events.html
data/
  events.json             every event — the single source of truth
  site.json                site-wide settings (Facebook link, contact form, membership form)
docs/
  membership.pdf          membership application form, linked from site.json
images/
  DP*.jpg                  header banner images (920×218, pre-faded — see "Header banners" below)
  matsuri/                 Matsuri festival poster, programme and sponsor/club logos
fonts/                     Museo Slab, retained from the original site
```

## Updating events

Edit **`data/events.json` only** — no HTML editing needed for normal event changes. The same data automatically drives:

- the "Next Event" card on every page
- the Upcoming Events list and Past Events list (`events.html`)
- the Calendar view (`events.html?view=calendar`)
- individual event detail pages (`event.html?id=...`)
- `.ics` calendar export

To add an event, copy an existing object, give it a new unique `id`, and fill in the fields below.

### Event fields

| Field | Notes |
|---|---|
| `id` | Stable, unique, used in URLs (`event.html?id=...`) — don't change once published/shared |
| `title`, `titleJapanese` | Japanese title is optional |
| `category` | Drives calendar colour-coding — see "Calendar view" below |
| `status` | `confirmed` / `past` etc. |
| `featured` | `true` shows a "Featured event" badge on the detail page |
| `start`, `end` | ISO datetime; `end` can be blank for single-point events |
| `timezone` | Currently always `Europe/London` |
| `organiser` | `{ "name": "...", "url": "..." }` — shown above the date on both the event card and detail page, linked if `url` is set |
| `venue` | `{ "name", "address", "mapUrl" }` |
| `description` | Short summary, shown on cards |
| `details` | Longer text, shown only on the detail page |
| `price` | `{ "amount", "currency", "label" }` — `label` is what actually displays |
| `booking` | `{ "required", "url", "label" }` — shows a Register button when `required` is true and `url` is set |
| `image` | Optional, not yet used by any template but reserved |
| `detailUrl` | Optional — if set, both the card and calendar link straight to this page instead of `event.html` (used by the Matsuri event to point at `matsuri.html`) |
| `tags` | Free-form, not currently rendered anywhere |
| `ical` | `true` adds an "Add to calendar" button on the detail page |

### Recurring events

Not implemented. The data model has room for a future `recurrence` object (`frequency`, `interval`, `until`) if this becomes worth building later — for now each occurrence is its own entry.

## Site-wide settings — `data/site.json`

| Field | Used for |
|---|---|
| `facebook` | The "Join Our FB Group" link, site-wide |
| `contactForm` | Jotform embed on `contact.html` |
| `applicationForm` | Membership PDF link — currently `docs/membership.pdf` |

## Calendar view

`events.html` has a **List View / Calendar View** toggle. Calendar View is a real month grid powered by [FullCalendar](https://fullcalendar.io) (loaded from a CDN — requires internet access, there's no local/offline copy bundled). Events are colour-coded by `category`, set in `assets/calendar.js`:

```js
festival: '#e16e5e', social: '#2f6f6f', cooking: '#b98900',
volunteering: '#4a6fa5', workshop: '#7a4fa0'
```

Any category not listed falls back to the site accent colour. Search and category filters both work against the calendar via `refetchEvents()`. The view choice is reflected in the URL (`?view=calendar`) so it's linkable and bookmarkable.

## Header banner images

Each page's header uses one of ten pre-processed banner images (`hero-one` through `hero-ten` in `style.css`, each 920×218px), cropped from source photos with a white gradient fade on the left so the logo stays legible on top.

Two things specifically tuned for this:

- **`background-position: left center`** on `.site-header` — crops always eat into the right side of the image, never the white zone under the logo, regardless of screen size.
- **The logo's width shrinks at each responsive breakpoint** (`.logo img` rules in `style.css`) to stay within the safe/faded portion of the banner even on narrow phones, where a wide banner image gets cropped hardest.

If new banner images are ever needed, they should be generated with the same crop + fade treatment (920×218, left-anchored fade) to stay consistent — a standalone Python script for this was produced separately during development (not included in this repo) and can be regenerated if needed.

Note: `hero-three`/`hero-eight` and `hero-two`/`hero-ten` currently point at the same source image as each other — harmless since neither duplicate pair is both assigned to a live page at once, but worth swapping one of each pair to a different unused `DP*.jpg` if true visual variety across all ten slots is wanted.

## The Matsuri page

`matsuri.html` is a standalone, hand-built page (not driven by `events.json` templates) for the 30th Anniversary Matsuri Festival — poster images, programme table, sponsor and participating-club logos. The corresponding entry in `events.json` (`anniversary-30`) has `"detailUrl": "matsuri.html"`, so it still appears normally in the events list/calendar/next-event card, but links here instead of the generic event detail page.

This is the pattern to follow for any future one-off event that outgrows the standard template.

## Testing locally

Browsers block `fetch()` on local `file://` pages, so the site must be served over HTTP to test:

```
python -m http.server 8080
```

Then visit `http://localhost:8080/`.

## Publishing

The site is static — no build step. It publishes automatically via **GitHub Pages** whenever `master` is updated:

1. Commit changes (GitHub Desktop or `git add . && git commit -m "..."`)
2. Push to `master`
3. GitHub Pages rebuilds automatically, usually within a minute or two, and serves the result at the custom domain in `CNAME`

There's no separate staging step in this setup — pushing to `master` goes live. Test locally first (above) before pushing anything significant.

## Contact form

The Jotform contact form is embedded using its direct form endpoint rather than the `/jsform/` JavaScript endpoint. This avoids the form's JavaScript source being rendered as page content inside the iframe, and allows Jotform's `postMessage` resizing to work correctly.

## Possible future upgrades

- **Admin panel for events** — a git-backed headless CMS (e.g. Decap CMS) would put a proper form-based editor on top of `events.json` without changing the front end at all, so non-technical committee members could add/edit events without touching JSON or git.
- **SEO / social sharing** — event pages currently share one static `<title>`/description for every event since content is injected by JS; adding per-event Open Graph tags and JSON-LD structured data would improve both search visibility and link previews (Facebook/WhatsApp).
- **Image formats** — converting header/gallery JPGs to WebP (with JPG fallback) would reduce page weight with no visible quality loss.
- **Analytics** — no visibility currently into which pages/events get traffic; a cookie-free tool (e.g. Plausible, Fathom) would help without needing a cookie banner.
