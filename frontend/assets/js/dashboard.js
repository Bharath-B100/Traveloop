document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  renderNav('dashboard');
  const user = getUser();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  document.getElementById('hero').innerHTML = `
    <p class="hero-greeting">${greeting}, ${user?.name || 'Traveler'}!</p>
    <h1 class="hero-title">Where to <span>next?</span></h1>
    <p class="hero-subtitle">Plan your next adventure and explore the world.</p>
    <div class="hero-actions">
      <a href="/create-trip.html" class="btn btn-primary btn-lg">✈ Plan New Trip</a>
      <a href="/city-search.html" class="btn btn-secondary btn-lg">🔍 Explore Cities</a>
    </div>
  `;

  try {
    const trips = await api.getTrips();
    const statsEl = document.getElementById('quickStats');
    const totalCities = trips.reduce((s, t) => s + (t.stop_count || 0), 0);
    statsEl.innerHTML = `
      <div class="stat-card animate-in"><div class="stat-value">${trips.length}</div><div class="stat-label">Total Trips</div></div>
      <div class="stat-card animate-in" style="animation-delay:0.1s"><div class="stat-value">${totalCities}</div><div class="stat-label">Cities Planned</div></div>
      <div class="stat-card animate-in" style="animation-delay:0.2s"><div class="stat-value">${trips.filter(t => new Date(t.start_date) > new Date()).length}</div><div class="stat-label">Upcoming</div></div>
    `;

    const grid = document.getElementById('tripGrid');
    if (trips.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🌍</div><h3 class="empty-state-title">No trips yet</h3><p class="empty-state-text">Create your first trip to get started!</p><a href="/create-trip.html" class="btn btn-primary">Plan New Trip</a></div>`;
    } else {
      grid.innerHTML = trips.slice(0, 6).map(t => `
        <div class="card trip-card animate-in" onclick="location.href='/itinerary-builder.html?id=${t.id}'">
          <img class="trip-card-cover" src="${t.cover_photo || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400'}" alt="${t.name}" onerror="this.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400'">
          <div class="card-title">${t.name}</div>
          <div class="trip-card-dates">📅 ${formatDate(t.start_date)} — ${formatDate(t.end_date)}</div>
          <div class="trip-card-stats">
            <span class="trip-card-stat">📍 ${t.stop_count || 0} cities</span>
            <span class="trip-card-stat">${t.cities || 'No cities yet'}</span>
          </div>
        </div>
      `).join('');
      animateCards('.trip-card');
    }
  } catch (e) { console.error(e); }

  try {
    const cities = await api.getPopularCities();
    document.getElementById('destGrid').innerHTML = cities.slice(0, 8).map(c => `
      <div class="card dest-card animate-in" onclick="location.href='/city-search.html?city=${c.id}'">
        <img class="dest-card-img" src="${c.image_url}" alt="${c.name}" onerror="this.style.display='none'">
        <div class="dest-card-name">${c.name}</div>
        <div class="dest-card-country">${c.country}</div>
        <div class="dest-card-cost"><span class="badge badge-${c.cost_index<=2?'teal':c.cost_index<=3.5?'gold':'coral'}">${'$'.repeat(Math.ceil(c.cost_index))}</span></div>
      </div>
    `).join('');
    animateCards('.dest-card');
  } catch (e) {}
});
