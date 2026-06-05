document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  renderNav('dashboard');
  const user = getUser();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  document.getElementById('hero').innerHTML = `
    <p class="hero-greeting">${greeting}, ${user?.name || 'Traveler'}!</p>
    <h1 class="hero-title">Where to <span>next?</span></h1>
    <p class="hero-subtitle">Plan your next adventure and explore the world one city at a time.</p>
    <div class="hero-actions">
      <a href="/create-trip.html" class="btn btn-primary btn-lg">✈ Plan New Trip</a>
      <a href="/city-search.html" class="btn btn-secondary btn-lg">🔍 Explore Cities</a>
    </div>
  `;

  try {
    const trips = await api.getTrips();
    const totalCities = trips.reduce((s, t) => s + (t.stop_count || 0), 0);
    const upcoming = trips.filter(t => t.start_date && new Date(t.start_date) > new Date()).length;

    document.getElementById('quickStats').innerHTML = `
      <div class="stat-card animate-in">
        <div class="stat-icon">✈️</div>
        <div class="stat-info">
          <div class="stat-value">${trips.length}</div>
          <div class="stat-label">Total Trips</div>
        </div>
      </div>
      <div class="stat-card animate-in" style="animation-delay:0.1s">
        <div class="stat-icon">📍</div>
        <div class="stat-info">
          <div class="stat-value">${totalCities}</div>
          <div class="stat-label">Cities Planned</div>
        </div>
      </div>
      <div class="stat-card animate-in" style="animation-delay:0.2s">
        <div class="stat-icon">🌟</div>
        <div class="stat-info">
          <div class="stat-value">${upcoming}</div>
          <div class="stat-label">Upcoming</div>
        </div>
      </div>
    `;

    const grid = document.getElementById('tripGrid');
    if (trips.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">🌍</div>
        <h3 class="empty-state-title">No trips yet</h3>
        <p class="empty-state-text">Create your first trip to get started!</p>
        <a href="/create-trip.html" class="btn btn-primary">✈ Plan New Trip</a>
      </div>`;
    } else {
      grid.innerHTML = trips.slice(0, 6).map(t => `
        <div class="trip-card animate-in" onclick="location.href='/itinerary-builder.html?id=${t.id}'" style="cursor:pointer">
          <img class="trip-card-cover" src="${t.cover_photo || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400'}"
            alt="${t.name}" onerror="this.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400'">
          <div class="trip-card-body">
            <div class="card-title">${t.name}</div>
            <div class="trip-card-dates">📅 ${formatDate(t.start_date)} — ${formatDate(t.end_date)}</div>
            <div class="trip-card-stats">
              <span class="trip-card-stat">📍 ${t.stop_count || 0} cities</span>
              ${t.cities ? `<span class="trip-card-stat" style="color:var(--text-muted)">${t.cities}</span>` : ''}
            </div>
          </div>
        </div>
      `).join('');
      animateCards('.trip-card');
    }
  } catch (e) { console.error(e); }

  try {
    const cities = await api.getPopularCities();
    document.getElementById('destGrid').innerHTML = cities.slice(0, 8).map(c => `
      <div class="dest-card animate-in" onclick="location.href='/city-search.html?city=${c.id}'">
        <img class="dest-card-img" src="${c.image_url}" alt="${c.name}" onerror="this.style.display='none'">
        <div class="dest-card-body">
          <div class="dest-card-name">${c.name}</div>
          <div class="dest-card-country">📍 ${c.country}</div>
          <div class="dest-card-cost">
            <span class="badge badge-${c.cost_index<=2?'teal':c.cost_index<=3.5?'gold':'coral'}">${'$'.repeat(Math.ceil(c.cost_index||1))}</span>
            <span style="font-size:0.76rem;color:var(--text-muted)">⭐ ${c.popularity || 0}</span>
          </div>
        </div>
      </div>
    `).join('');
    animateCards('.dest-card');
  } catch (e) {}
});
