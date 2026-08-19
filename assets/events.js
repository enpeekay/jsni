
function esc2(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function fmt(iso, opts) { return new Intl.DateTimeFormat('en-GB', opts).format(new Date(iso)); }

function ics(e) {
  const clean = s => String(s || '').replace(/[\\,;]/g, ' ').replace(/\n/g, ' ');
  const stamp = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const start = new Date(e.start), end = new Date(e.end || e.start);
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//JSNI//Events//EN\r\nBEGIN:VEVENT\r\nUID:${clean(e.id)}@jsni\r\nDTSTAMP:${stamp(new Date())}\r\nDTSTART:${stamp(start)}\r\nDTEND:${stamp(end)}\r\nSUMMARY:${clean(e.title)}\r\nLOCATION:${clean((e.venue?.name || '') + ', ' + (e.venue?.address || ''))}\r\nDESCRIPTION:${clean(e.details || e.description)}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;
}

(async () => {
  const events = await loadJSON('data/events.json'), id = new URLSearchParams(location.search).get('id'), e = events.find(x => x.id === id), el = document.getElementById('event-detail');
  if (!e) { el.innerHTML = '<h1>Event not found</h1><p><a href="events.html">Return to our events »</a></p>'; return }
  if (e.detailUrl) { location.replace(e.detailUrl); return }
  document.title = e.title + ' | JSNI';
  const venue = e.venue || {}, price = e.price || {}, booking = e.booking || {}, organiser = e.organiser || {};

  el.innerHTML = `<h1>${esc2(e.title)}<br>${e.titleJapanese ? `<span class="japanese">${esc2(e.titleJapanese)}</span>` : ''}</h1>
 ${e.featured ? '<span class="event-status upcoming">Featured event</span>' : ''}
 <div class="notice">
 ${organiser.name ? `<strong>Organiser : </strong>${organiser.url ? `<a href="${esc2(organiser.url)}" target="_blank" rel="noopener">${esc2(organiser.name)}</a>` : esc2(organiser.name)}<br>` : ''}
 <strong>Date : </strong>${fmt(e.start, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}<br>
 <strong>Time : </strong>${fmt(e.start, { hour: '2-digit', minute: '2-digit' })}${e.end ? ' – ' + fmt(e.end, { hour: '2-digit', minute: '2-digit' }) : ''}<br>
 <strong>Location : </strong>${esc2(venue.name || '')}, ${esc2(venue.address) || ''}</div>

 <h2>About</h2><p>${esc2(e.description || '')}</p>${e.details ? `<p>${esc2(e.details)}</p>` : ''}

 ${price.label ? `<h2>Cost</h2><p>${esc2(price.label)}</p>` : ''}
 
 ${venue.mapUrl ? `<p><a class="button" href="${esc2(venue.mapUrl)}" target="_blank" rel="noopener">View map</a></p>` : ''}
 
 ${booking.required && booking.url ? `<p><a class="button" href="${esc2(booking.url)}" target="_blank" rel="noopener">${esc2(booking.label || 'Book / Register')}</a></p>` : ''}

 ${e.ical ? '<p><button class="button" id="add-calendar" type="button">Add to calendar</button></p>' : ''}

 <p><a href="events.html">← Back to all events</a></p>`;
  if (e.ical) document.getElementById('add-calendar').onclick = () => {
    const blob = new Blob([ics(e)], { type: 'text/calendar;charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${e.id}.ics`; a.click(); URL.revokeObjectURL(a.href);
  };
})().catch(err => { console.error(err); document.getElementById('event-detail').innerHTML = '<p>Event information is temporarily unavailable.</p>' });
