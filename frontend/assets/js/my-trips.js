document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  renderNav('trips');
  try {
    const trips = await api.getTrips();
    const grid = document.getElementById('tripGrid');
    if (trips.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🗺️</div><h3 class="empty-state-title">No trips yet</h3><p class="empty-state-text">Start planning your first adventure!</p><a href="/create-trip.html" class="btn btn-primary">Create Trip</a></div>`;
      return;
    }
    grid.innerHTML = trips.map(t => `
      <div class="card trip-list-card">
        <div class="card-actions">
          <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();location.href='/itinerary-builder.html?id=${t.id}'">✏️ Edit</button>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteTrip('${t.id}','${t.name.replace(/'/g,"\\'")}')">🗑</button>
        </div>
        <img class="trip-card-cover" src="${t.cover_photo||'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400'}" alt="${t.name}" onclick="location.href='/itinerary-view.html?id=${t.id}'" onerror="this.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400'">
        <div class="card-title" onclick="location.href='/itinerary-view.html?id=${t.id}'" style="cursor:pointer">${t.name}</div>
        <div class="trip-card-dates">📅 ${formatDate(t.start_date)} — ${formatDate(t.end_date)}</div>
        <div class="trip-card-stats">
          <span class="trip-card-stat">📍 ${t.stop_count||0} cities</span>
        </div>
        <div class="card-footer">
          <a href="/itinerary-view.html?id=${t.id}" class="btn btn-ghost btn-sm">View Itinerary →</a>
          <a href="/budget.html?id=${t.id}" class="btn btn-ghost btn-sm">💰 Budget</a>
        </div>
      </div>
    `).join('');
    animateCards('.trip-list-card');
  } catch (e) { console.error(e); }
});

async function deleteTrip(id, name) {
  showModal('Delete Trip', `<p>Are you sure you want to delete <strong>${name}</strong>? This cannot be undone.</p>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-danger" onclick="confirmDelete('${id}')">Delete</button>`);
}
async function confirmDelete(id) {
  try { await api.deleteTrip(id); showToast('Trip deleted', 'success'); closeModal(); location.reload(); } catch(e){}
}
