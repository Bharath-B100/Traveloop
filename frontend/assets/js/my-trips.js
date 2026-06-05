let allTrips = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  renderNav('trips');
  try {
    allTrips = await api.getTrips();
    renderTrips(allTrips);
  } catch (e) { console.error(e); }
});

function filterTrips() {
  const q = document.getElementById('tripSearchInput').value.toLowerCase();
  const sort = document.getElementById('tripSortSelect').value;
  let filtered = allTrips.filter(t =>
    t.name.toLowerCase().includes(q) ||
    (t.cities || '').toLowerCase().includes(q)
  );
  if (sort === 'oldest') filtered = filtered.reverse();
  else if (sort === 'upcoming') {
    filtered = filtered.filter(t => t.start_date && new Date(t.start_date) >= new Date())
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  }
  renderTrips(filtered);
}

function renderTrips(trips) {
  const grid = document.getElementById('tripGrid');
  if (trips.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">🗺️</div>
      <h3 class="empty-state-title">No trips found</h3>
      <p class="empty-state-text">Start planning your first adventure!</p>
      <a href="/create-trip.html" class="btn btn-primary">✈ Create Trip</a>
    </div>`;
    return;
  }
  const now = new Date();
  grid.innerHTML = trips.map(t => {
    const isUpcoming = t.start_date && new Date(t.start_date) > now;
    const isPast = t.end_date && new Date(t.end_date) < now;
    const statusBadge = isUpcoming
      ? '<span class="badge badge-teal">Upcoming</span>'
      : isPast
        ? '<span class="badge badge-sky">Completed</span>'
        : '';
    return `
    <div class="card trip-list-card animate-in" onclick="location.href='/itinerary-view.html?id=${t.id}'">
      <div class="card-actions">
        <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();location.href='/itinerary-builder.html?id=${t.id}'">✏️ Edit</button>
        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteTrip('${t.id}','${t.name.replace(/'/g,"\\'")}')">🗑</button>
      </div>
      <img class="trip-card-cover" src="${t.cover_photo||'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400'}"
        alt="${t.name}" onerror="this.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400'">
      <div style="padding:16px 18px 18px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:4px">
          <div class="card-title">${t.name}</div>
          ${statusBadge}
        </div>
        <div class="trip-card-dates">📅 ${formatDate(t.start_date)} — ${formatDate(t.end_date)}</div>
        <div class="trip-card-stats" style="margin-top:10px">
          <span class="trip-card-stat">📍 ${t.stop_count || 0} cities</span>
          ${t.cities ? `<span class="trip-card-stat" style="color:var(--text-muted)">${t.cities}</span>` : ''}
        </div>
        <div class="card-footer">
          <a href="/itinerary-view.html?id=${t.id}" class="btn btn-ghost btn-sm" onclick="event.stopPropagation()">View →</a>
          <div style="display:flex;gap:6px">
            <a href="/budget.html?id=${t.id}" class="btn btn-ghost btn-sm" onclick="event.stopPropagation()">💰</a>
            <a href="/packing.html?id=${t.id}" class="btn btn-ghost btn-sm" onclick="event.stopPropagation()">🎒</a>
            <a href="/notes.html?id=${t.id}" class="btn btn-ghost btn-sm" onclick="event.stopPropagation()">📝</a>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
  animateCards('.trip-list-card');
}

async function deleteTrip(id, name) {
  showModal('Delete Trip',
    `<p>Are you sure you want to delete <strong>${name}</strong>? This will permanently remove all stops, activities, packing items, and notes.</p>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-danger" onclick="confirmDelete('${id}')">🗑 Delete Forever</button>`);
}

async function confirmDelete(id) {
  try {
    await api.deleteTrip(id);
    showToast('Trip deleted', 'success');
    closeModal();
    allTrips = allTrips.filter(t => String(t.id) !== String(id));
    renderTrips(allTrips);
  } catch(e) { showToast('Error deleting trip', 'error'); }
}
