
function escCal(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

// Colour per event category, so different kinds of JSNI events are easy to
// tell apart at a glance. Falls back to the site accent colour.
const CATEGORY_COLORS = {
  festival: '#e16e5e',
  social: '#2f6f6f',
  cooking: '#b98900',
  volunteering: '#4a6fa5',
  workshop: '#7a4fa0'
};

(function(){
  const calendarEl = document.getElementById('fc-calendar');
  if (!calendarEl || typeof FullCalendar === 'undefined') return;

  const searchEl = document.getElementById('event-search');
  const catEl = document.getElementById('event-category');
  const clearBtn = document.getElementById('clear-filters');

  let allEvents = [];

  function toFcEvent(e) {
    return {
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end || e.start,
      url: e.detailUrl || `event.html?id=${encodeURIComponent(e.id)}`,
      color: CATEGORY_COLORS[e.category] || 'var(--accent)',
      extendedProps: {
        category: e.category,
        venue: e.venue,
        description: e.description || e.details || ''
      }
    };
  }

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,listMonth' },
    height: 'auto',
    firstDay: 1,
    eventDisplay: 'block',
    events: function (info, successCallback, failureCallback) {
      try {
        const q = (searchEl.value || '').trim().toLowerCase();
        const c = catEl.value;
        const filtered = allEvents.filter(e =>
          (!q || JSON.stringify(e).toLowerCase().includes(q)) &&
          (!c || e.category === c)
        );
        successCallback(filtered.map(toFcEvent));
      } catch (err) {
        failureCallback(err);
      }
    },
    eventDidMount: function (info) {
      const venue = info.event.extendedProps.venue || {};
      const bits = [info.event.title, venue.name].filter(Boolean);
      info.el.setAttribute('title', bits.join(' — '));
    }
  });

  calendar.render();
  window.jsniCalendar = calendar;

  (async () => {
    allEvents = await loadJSON('data/events.json');
    [...new Set(allEvents.map(e => e.category).filter(Boolean))].sort().forEach(c =>
      catEl.insertAdjacentHTML('beforeend', `<option value="${escCal(c)}">${escCal(c)}</option>`)
    );
    calendar.refetchEvents();
  })().catch(err => {
    console.error(err);
    calendarEl.innerHTML = '<p>Event information is temporarily unavailable.</p>';
  });

  [searchEl, catEl].forEach(el => el.addEventListener('input', () => calendar.refetchEvents()));
  clearBtn.addEventListener('click', () => {
    searchEl.value = '';
    catEl.value = '';
    calendar.refetchEvents();
  });
})();
