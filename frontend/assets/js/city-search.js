let searchTimeout;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  renderNav('cities');

  // Load countries for filter
  try {
    const countries = await api.getCountries();
    const sel = document.getElementById('countryFilter');
    countries.forEach(c => {
      const opt = document.createElement('option'); opt.value = c; opt.textContent = c;
      sel.appendChild(opt);
    });
  } catch(e) {}

  // Load initial cities
  await searchCities();

  // Check if a specific city was requested
  const cityId = getParam('city');
  if (cityId) {
    try {
      const city = await api.getCity(cityId);
      showCityDetail(city);
    } catch(e) {}
  }
});

async function searchCities() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const q = document.getElementById('cityInput').value.trim();
    const country = document.getElementById('countryFilter').value;
    const sort = document.getElementById('sortFilter').value;
    try {
      const cities = await api.searchCities({ q, country, sort, limit: 60 });
      renderCities(cities);
    } catch(e) {}
  }, 300);
}

function renderCities(cities) {
  const grid = document.getElementById('cityGrid');
  if (!cities.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">🔍</div>
      <h3 class="empty-state-title">No cities found</h3>
      <p class="empty-state-text">Try a different search term or filter.</p>
    </div>`;
    return;
  }
  grid.innerHTML = cities.map(c => `
    <div class="city-card animate-in" onclick="showCityDetail(${JSON.stringify(c).replace(/"/g,'&quot;')})">
      <div style="position:relative;overflow:hidden;border-radius:var(--radius-lg) var(--radius-lg) 0 0">
        <img class="city-card-img" src="${c.image_url || ''}" alt="${c.name}"
          onerror="this.parentElement.style.background='var(--bg-tertiary)';this.style.display='none'">
        <div class="city-card-overlay"></div>
        <div style="position:absolute;top:12px;left:12px">
          <span class="badge badge-teal">⭐ ${c.popularity || 0}</span>
        </div>
      </div>
      <div class="city-card-body">
        <div class="city-card-name">${c.name}</div>
        <div class="city-card-country">📍 ${c.country}${c.region ? ' • ' + c.region : ''}</div>
        <div class="city-card-footer">
          <div class="city-card-cost">
            ${[1,2,3,4,5].map(i => `<div class="cost-dot${i<=Math.ceil(c.cost_index||1)?' active':''}"></div>`).join('')}
            <span style="font-size:0.76rem;color:var(--text-muted);margin-left:6px">${['','Budget','Budget','Mid','Upscale','Luxury'][Math.ceil(c.cost_index||1)]}</span>
          </div>
          <span class="btn btn-sm btn-secondary">Explore →</span>
        </div>
      </div>
    </div>
  `).join('');
  animateCards('.city-card');
}

function showCityDetail(city) {
  const acts = city.activities || [];
  showModal(`${city.name}, ${city.country}`, `
    ${city.image_url ? `<img src="${city.image_url}" alt="${city.name}" style="width:100%;height:180px;object-fit:cover;border-radius:var(--radius-md);margin-bottom:16px">` : ''}
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">
      <span class="badge badge-teal">⭐ Popularity: ${city.popularity || 0}</span>
      <span class="badge badge-gold">💰 Cost: ${'$'.repeat(Math.ceil(city.cost_index||1))}</span>
      ${city.region ? `<span class="badge badge-sky">${city.region}</span>` : ''}
    </div>
    ${city.description ? `<p style="color:var(--text-secondary);font-size:0.88rem;margin-bottom:16px;line-height:1.6">${city.description}</p>` : ''}
    <h4 style="font-size:0.85rem;font-weight:700;margin-bottom:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em">Activities (${acts.length})</h4>
    ${acts.length === 0
      ? '<p style="color:var(--text-muted);font-size:0.85rem">No activities listed for this city yet.</p>'
      : `<div style="display:flex;flex-direction:column;gap:8px;max-height:260px;overflow-y:auto">
          ${acts.map(a => `
            <div class="activity-item">
              <div class="act-info">
                <div class="act-name">${a.name} ${getTypeBadge(a.type)}</div>
                <div class="act-meta">
                  <span>💰 ${formatCurrency(a.cost)}</span>
                  <span>⏱ ${a.duration_hours}h</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>`}
  `, `<button class="btn btn-secondary" onclick="closeModal()">Close</button>
      <a href="/create-trip.html" class="btn btn-primary">✈ Plan a Trip</a>`);
}
