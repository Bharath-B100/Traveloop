document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  renderNav('cities');
  try {
    const countries = await api.getCountries();
    const sel = document.getElementById('countryFilter');
    countries.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o); });
  } catch(e){}
  document.getElementById('searchInput').addEventListener('input', debounce(searchCities, 400));
  document.getElementById('costFilter').addEventListener('input', (e) => {
    document.getElementById('costValue').textContent = e.target.value >= 5 ? 'Any' : '≤ ' + e.target.value;
  });
  searchCities();
});

async function searchCities() {
  const params = { q: document.getElementById('searchInput').value.trim(), sort: document.getElementById('sortFilter').value };
  const country = document.getElementById('countryFilter').value;
  const maxCost = parseFloat(document.getElementById('costFilter').value);
  if (country) params.country = country;
  if (maxCost < 5) params.max_cost = maxCost;
  try {
    const cities = await api.searchCities(params);
    document.getElementById('resultsCount').textContent = `${cities.length} destinations found`;
    document.getElementById('resultsGrid').innerHTML = cities.map(c => `
      <div class="card animate-in" style="cursor:pointer" onclick="viewCity('${c.id}')">
        <img class="city-card-img" src="${c.image_url}" alt="${c.name}" onerror="this.style.background='var(--bg-tertiary)';this.style.height='100px'">
        <div class="card-title">${c.name}</div>
        <div class="card-subtitle">${c.country} · ${c.region}</div>
        <div class="city-card-meta">
          <span class="badge badge-${c.cost_index<=2?'teal':c.cost_index<=3.5?'gold':'coral'}">${'₹'.repeat(Math.ceil(c.cost_index))} cost</span>
          <span class="popularity-stars">${'★'.repeat(Math.round(c.popularity/20))}${'☆'.repeat(5-Math.round(c.popularity/20))}</span>
        </div>
        <div class="card-footer">
          <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();addCityToTrip('${c.id}')">+ Add to Trip</button>
          <a href="/activity-search.html?city=${c.id}" class="btn btn-sm btn-ghost" onclick="event.stopPropagation()">Activities →</a>
        </div>
      </div>
    `).join('');
    animateCards('.card');
  } catch(e){}
}

async function viewCity(cityId) { location.href = `/activity-search.html?city=${cityId}`; }

async function addCityToTrip(cityId) {
  try {
    const trips = await api.getTrips();
    if (trips.length === 0) { showToast('Create a trip first!', 'info'); location.href = '/create-trip.html'; return; }
    showModal('Add to Trip', `<p style="margin-bottom:12px;color:var(--text-secondary)">Select a trip:</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${trips.map(t => `<button class="btn btn-secondary btn-block" onclick="addStopToTrip('${t.id}','${cityId}')">${t.name}</button>`).join('')}
      </div>`);
  } catch(e){}
}

async function addStopToTrip(tripId, cityId) {
  try { await api.addStop(tripId, { city_id: cityId }); closeModal(); showToast('City added to trip!', 'success'); } catch(e){}
}

function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
