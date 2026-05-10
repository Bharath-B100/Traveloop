let trip, currentView = 'timeline';
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  renderNav('trips');
  const tripId = getParam('id');
  if (!tripId) { location.href = '/my-trips.html'; return; }
  try {
    trip = await api.getTrip(tripId);
    document.getElementById('viewHeader').innerHTML = `
      <h1>${trip.name}</h1>
      <p>${trip.description || ''}</p>
      <p style="margin-top:8px;color:var(--text-muted)">📅 ${formatDate(trip.start_date)} — ${formatDate(trip.end_date)} · 📍 ${trip.stops?.length || 0} stops</p>
      <div style="margin-top:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <a href="/itinerary-builder.html?id=${tripId}" class="btn btn-primary btn-sm">✏️ Edit</a>
        <a href="/budget.html?id=${tripId}" class="btn btn-secondary btn-sm">💰 Budget</a>
        <a href="/packing.html?id=${tripId}" class="btn btn-secondary btn-sm">🎒 Packing</a>
      </div>
    `;
    renderView();
  } catch (e) { location.href = '/my-trips.html'; }
});

function setView(v) {
  currentView = v;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  renderView();
}

function renderView() {
  const el = document.getElementById('viewContent');
  if (!trip.stops || trip.stops.length === 0) {
    el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><h3 class="empty-state-title">No stops added</h3></div>';
    return;
  }
  if (currentView === 'timeline') renderTimeline(el);
  else renderList(el);
}

function renderTimeline(el) {
  let dayNum = 1;
  el.innerHTML = trip.stops.map(stop => {
    const days = stop.arrival_date && stop.departure_date ? daysBetween(stop.arrival_date, stop.departure_date) : 1;
    let html = '';
    for (let d = 0; d < days; d++) {
      const date = stop.arrival_date ? new Date(new Date(stop.arrival_date).getTime() + d * 86400000) : null;
      const dayActs = (stop.activities || []).filter(a => {
        if (!a.planned_date) return d === 0;
        return a.planned_date === (date ? date.toISOString().split('T')[0] : '');
      });
      html += `
        <div class="timeline-day animate-in" style="animation-delay:${dayNum*0.08}s">
          <div class="timeline-dot"></div>
          <div class="timeline-date">Day ${dayNum} ${date ? '· ' + formatDateShort(date) : ''}</div>
          <div class="timeline-city">📍 ${stop.city_name}, ${stop.country}</div>
          <div class="timeline-activities">
            ${dayActs.length === 0 ? '<div class="activity-item"><div class="act-info"><div class="act-name" style="color:var(--text-muted)">Free day – explore on your own!</div></div></div>' :
              dayActs.map(a => `
                <div class="activity-item">
                  <div class="act-info"><div class="act-name">${a.name} ${getTypeBadge(a.type)}</div><div class="act-meta"><span>💰 ${formatCurrency(a.cost)}</span><span>⏱ ${a.duration_hours}h</span></div></div>
                </div>`).join('')}
          </div>
        </div>`;
      dayNum++;
    }
    return html;
  }).join('');
}

function renderList(el) {
  el.innerHTML = trip.stops.map((stop, i) => `
    <div class="stop-detail animate-in" style="animation-delay:${i*0.1}s">
      <div class="stop-detail-header"><h3>📍 ${stop.city_name}, ${stop.country}</h3><span class="badge badge-accent">Stop ${i+1}</span></div>
      <div class="stop-meta">
        <div class="stop-meta-item">📅 ${formatDate(stop.arrival_date)} → ${formatDate(stop.departure_date)}</div>
        <div class="stop-meta-item">🎯 ${stop.activities?.length||0} activities</div>
      </div>
      <div class="activity-list">
        ${(stop.activities||[]).map(a => `
          <div class="activity-item"><div class="act-info"><div class="act-name">${a.name} ${getTypeBadge(a.type)}</div><div class="act-meta"><span>💰 ${formatCurrency(a.cost)}</span><span>⏱ ${a.duration_hours}h</span></div></div></div>
        `).join('')}
      </div>
    </div>
  `).join('');
}
