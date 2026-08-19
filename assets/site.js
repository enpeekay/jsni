
const $ = (s, r=document) => r.querySelector(s);

async function loadJSON(path) {
  const res = await fetch(path, {cache: "no-cache"});
  if (!res.ok) throw new Error(`Could not load ${path}`);
  return res.json();
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[ch]));
}

function dateParts(e) {
  const start = new Date(e.start);
  const end = e.end ? new Date(e.end) : null;
  const dateOpts = {weekday:'short', day:'numeric', month:'short', year:'numeric'};
  const timeOpts = {hour:'2-digit', minute:'2-digit'};
  const startDate = new Intl.DateTimeFormat('en-GB', dateOpts).format(start);
  const startTime = new Intl.DateTimeFormat('en-GB', timeOpts).format(start);

  let dateDisplay = startDate;
  let timeDisplay = startTime;

  if (end && !isNaN(end)) {
    const endDate = new Intl.DateTimeFormat('en-GB', dateOpts).format(end);
    const endTime = new Intl.DateTimeFormat('en-GB', timeOpts).format(end);
    if (startDate !== endDate) {
      dateDisplay = `${startDate} – ${endDate}`;
      timeDisplay = `${startTime} – ${endTime}`;
    } else {
      timeDisplay = `${startTime} – ${endTime}`;
    }
  }
  return {dateDisplay, timeDisplay};
}

function eventMarkup(e) {
  const now = new Date();
  const start = new Date(e.start);
  const end = e.end ? new Date(e.end) : start;
  const isPast = end < now;
  const status = isPast ? 'past' : (e.status || 'upcoming');
  const parts = dateParts(e);
  const venue = e.venue || {};
  const organiser = e.organiser || {};
  const description = e.description || e.details || '';
  const href = e.detailUrl || `event.html?id=${encodeURIComponent(e.id)}`;

  return `<article class="event-card">
    <span class="event-status ${isPast ? 'past' : 'upcoming'}">${isPast ? 'Past event' : 'Upcoming'}</span>
    <h3><a href="${esc(href)}">${esc(e.title)}</a></h3>
    ${e.titleJapanese ? `<h4 class="japanese">${esc(e.titleJapanese)}</h4>` : ''}
    <div class="event-meta">
      <div><strong>Organiser : </strong>${organiser.url ? `<a href="${esc(organiser.url)}" target="_blank" rel="noopener">${esc(organiser.name)}</a>` : esc(organiser.name)}</div>
      <div><strong>Date : </strong>${esc(parts.dateDisplay)}</div>
      <div><strong>Time : </strong>${esc(parts.timeDisplay)}</div>
      <div><strong>Location : </strong>${esc(venue.name || 'TBC')}${venue.address ? `, ${esc(venue.address)}` : ''}</div>
      <div><strong>About : </strong>${esc(description)}</div>
    </div>
    ${e.booking?.required && e.booking?.url ? `<p><a class="more-link" href="${esc(e.booking.url)}" target="_blank" rel="noopener">${esc(e.booking.label || 'Register')}</a></p>` : ''}
  </article>`;
}

function futureEvents(events) {
  const now = new Date();
  return events
    .filter(e => new Date(e.end || e.start) >= now)
    .sort((a,b) => new Date(a.start) - new Date(b.start));
}

async function renderEvents() {
  const events = await loadJSON('data/events.json');
  const future = futureEvents(events);
  const next = future[0];

  document.querySelectorAll('[data-next-event]').forEach(el => {
    el.innerHTML = next
      ? eventMarkup(next)
      : '<p>No upcoming events are currently listed.</p>';
  });

  const list = $('[data-events="upcoming"]');
  if (list) {
    list.innerHTML = future.length
      ? future.map(eventMarkup).join('')
      : '<p>No upcoming events are currently listed.</p>';
  }

  const past = events
    .filter(e => new Date(e.end || e.start) < new Date())
    .sort((a,b) => new Date(b.start) - new Date(a.start));

  const pastList = $('[data-events="past"]');
  if (pastList) {
    pastList.innerHTML = past.length
      ? past.map(eventMarkup).join('')
      : '<p>No past events are currently listed.</p>';
  }
}

async function renderSite() {
  const site = await loadJSON('data/site.json');
  document.querySelectorAll('[data-site-name]').forEach(el => el.textContent = site.name);
  document.querySelectorAll('[data-facebook]').forEach(el => el.href = site.facebook);
  document.querySelectorAll('[data-application-form]').forEach(el => el.href = site.applicationForm);
}

function setupMenu() {
  const btn = $('.menu-toggle'), links = $('.nav-links');
  if (!btn || !links) return;
  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  setupMenu();
  try {
    await renderSite();
    await renderEvents();
  } catch (err) {
    console.error(err);
    document.querySelectorAll('[data-next-event],[data-events]').forEach(
      el => el.innerHTML = '<p>Event information is temporarily unavailable.</p>'
    );
  }
});
