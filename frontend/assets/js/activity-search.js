let activeType = '', cityId = null;
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  renderNav('cities');
  cityId = getParam('city');
  if (cityId) {
    try {
      const city = await api.getCity(cityId);
      document.getElementById('subtitle').textContent = `Activities in ${city.name}, ${city.country}`;
    } catch(e){}
  }
  const types = ['all','sightseeing','food','adventure','culture','nightlife','shopping','nature','wellness'];
  document.getElementById('typeTabs').innerHTML = types.map(t =>
    `<button class="type-tab ${t==='all'?'active':''}" onclick="filterType('${t==='all'?'':t}',this)">${t==='all'?'All':t[0].toUpperCase()+t.slice(1)}</button>`
  ).join('');
  document.getElementById('searchInput').addEventListener('input', debounce(searchActs, 400));
  searchActs();
});

function filterType(type, el) {
  activeType = type;
  document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  searchActs();
}

async function searchActs() {
  const params = { q: document.getElementById('searchInput').value.trim() };
  if (activeType) params.type = activeType;
  if (cityId) params.city_id = cityId;
  try {
    const acts = await api.searchActivities(params);
    document.getElementById('resultsCount').textContent = `${acts.length} activities found`;
    document.getElementById('resultsGrid').innerHTML = acts.map(a => `
      <div class="card animate-in">
        <div class="card-header"><span class="card-title">${a.name}</span>${getTypeBadge(a.type)}</div>
        <p class="card-body">${a.description || ''}</p>
        <div class="city-card-meta" style="margin-top:12px">
          <span class="badge badge-teal">💰 ${formatCurrency(a.cost)}</span>
          <span class="badge badge-sky">⏱ ${a.duration_hours}h</span>
          <span style="font-size:0.8rem;color:var(--text-muted)">📍 ${a.city_name}</span>
        </div>
      </div>
    `).join('');
    animateCards('.card');
  } catch(e){}
}
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
