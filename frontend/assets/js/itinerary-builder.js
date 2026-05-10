let tripId, tripData, selectedStopId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  renderNav('trips');
  tripId = getParam('id');
  if (!tripId) { location.href = '/my-trips.html'; return; }
  document.getElementById('viewBudgetLink').href = `/budget.html?id=${tripId}`;
  await loadTrip();
  document.getElementById('addStopBtn').addEventListener('click', showAddStopModal);
});

async function loadTrip() {
  try {
    tripData = await api.getTrip(tripId);
    document.getElementById('tripHeader').innerHTML = `
      <h1>${tripData.name}</h1>
      <p>${tripData.description || ''} ${tripData.start_date ? `<span style="color:var(--text-muted)">📅 ${formatDate(tripData.start_date)} — ${formatDate(tripData.end_date)}</span>` : ''}</p>
      <div class="builder-actions">
        <a href="/itinerary-view.html?id=${tripId}" class="btn btn-secondary btn-sm">👁 View Itinerary</a>
        <a href="/packing.html?id=${tripId}" class="btn btn-secondary btn-sm">🎒 Packing</a>
        <a href="/notes.html?id=${tripId}" class="btn btn-secondary btn-sm">📝 Notes</a>
        <button class="btn btn-secondary btn-sm" onclick="shareTrip()">🔗 Share</button>
      </div>
    `;
    renderStops();
    updateBudget();
  } catch (e) { location.href = '/my-trips.html'; }
}

function renderStops() {
  const list = document.getElementById('stopList');
  if (!tripData.stops || tripData.stops.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:20px 0">No stops yet. Add your first destination!</p>';
    return;
  }
  list.innerHTML = tripData.stops.map((s, i) => `
    <div class="stop-item ${s.id == selectedStopId ? 'active' : ''}" onclick="selectStop('${s.id}')">
      <span class="stop-number">${i + 1}</span>
      <div class="stop-info">
        <div class="stop-city">${s.city_name}</div>
        <div class="stop-dates">${formatDateShort(s.arrival_date)} → ${formatDateShort(s.departure_date)}</div>
      </div>
      <button class="stop-remove" onclick="event.stopPropagation();removeStop('${s.id}')" title="Remove">✕</button>
    </div>
  `).join('');
}

function selectStop(stopId) {
  selectedStopId = stopId;
  renderStops();
  const stop = tripData.stops.find(s => s.id === stopId);
  if (!stop) return;
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="stop-detail animate-in">
      <div class="stop-detail-header">
        <h3>📍 ${stop.city_name}, ${stop.country}</h3>
        <span class="badge badge-accent">${stop.activities?.length || 0} activities</span>
      </div>
      <div class="stop-meta">
        <div class="stop-meta-item">📅 ${formatDate(stop.arrival_date)} → ${formatDate(stop.departure_date)}</div>
        <div class="stop-meta-item">🏨 ${stop.arrival_date && stop.departure_date ? daysBetween(stop.arrival_date, stop.departure_date) : '?'} nights</div>
      </div>
      <div class="cost-fields">
        <div class="cost-field"><label>Transport (₹)</label><input type="number" value="${stop.transport_cost||0}" onchange="updateStopCost('${stop.id}','transport_cost',this.value)"></div>
        <div class="cost-field"><label>Accommodation (₹)</label><input type="number" value="${stop.accommodation_cost||0}" onchange="updateStopCost('${stop.id}','accommodation_cost',this.value)"></div>
        <div class="cost-field"><label>Meals/Day (₹)</label><input type="number" value="${stop.meal_cost_per_day||0}" onchange="updateStopCost('${stop.id}','meal_cost_per_day',this.value)"></div>
      </div>
      <div style="margin-top:20px;display:flex;align-items:center;justify-content:space-between">
        <h3 style="font-size:1rem">Activities</h3>
        <button class="btn btn-sm btn-primary" onclick="showAddActivityModal('${stop.id}', '${stop.city_id}')">+ Add Activity</button>
      </div>
      <div class="activity-list" style="margin-top:12px">
        ${(stop.activities || []).length === 0 ? '<p style="color:var(--text-muted);font-size:0.85rem;padding:12px 0">No activities yet</p>' :
          stop.activities.map(a => `
            <div class="activity-item">
              <div class="act-info">
                <div class="act-name">${a.name} ${getTypeBadge(a.type)}</div>
                <div class="act-meta"><span>💰 ${formatCurrency(a.cost)}</span><span>⏱ ${a.duration_hours}h</span>${a.planned_time ? `<span>🕐 ${a.planned_time}</span>` : ''}</div>
              </div>
              <button class="act-remove" onclick="removeActivity('${a.id}')">✕</button>
            </div>
          `).join('')}
      </div>
    </div>
  `;
}

async function showAddStopModal() {
  const cities = await api.searchCities({ sort: 'popularity' });
  showModal('Add Stop', `
    <div class="search-bar"><span class="search-icon">🔍</span><input type="text" id="citySearchInput" placeholder="Search cities..." oninput="filterCities()"></div>
    <div id="cityResults" style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:6px">
      ${cities.map(c => `<div class="stop-item city-result" data-name="${c.name.toLowerCase()} ${c.country.toLowerCase()}" onclick="addStop('${c.id}')"><span class="stop-number" style="font-size:0.6rem">${c.country.slice(0,2)}</span><div class="stop-info"><div class="stop-city">${c.name}</div><div class="stop-dates">${c.country}</div></div><span class="badge badge-${c.cost_index<=2?'teal':'gold'}">${'₹'.repeat(Math.ceil(c.cost_index))}</span></div>`).join('')}
    </div>
  `);
}

function filterCities() {
  const q = document.getElementById('citySearchInput').value.toLowerCase();
  document.querySelectorAll('.city-result').forEach(el => {
    el.style.display = el.dataset.name.includes(q) ? 'flex' : 'none';
  });
}

async function addStop(cityId) {
  try {
    await api.addStop(tripId, { city_id: cityId });
    closeModal(); showToast('Stop added!', 'success');
    await loadTrip();
  } catch(e){}
}

async function removeStop(stopId) {
  try { await api.deleteStop(stopId); showToast('Stop removed', 'success'); selectedStopId = null; await loadTrip(); } catch(e){}
}

async function updateStopCost(stopId, field, value) {
  try { await api.updateStop(stopId, { [field]: parseFloat(value) || 0 }); await loadTrip(); selectStop(stopId); } catch(e){}
}

async function showAddActivityModal(stopId, cityId) {
  const acts = await api.searchActivities({ city_id: cityId });
  showModal('Add Activity', `
    <div style="max-height:400px;overflow-y:auto;display:flex;flex-direction:column;gap:6px">
      ${acts.length === 0 ? '<p style="color:var(--text-muted)">No activities found for this city</p>' :
        acts.map(a => `
          <div class="activity-item" style="cursor:pointer" onclick="addActivity('${stopId}','${a.id}')">
            <div class="act-info"><div class="act-name">${a.name} ${getTypeBadge(a.type)}</div><div class="act-meta"><span>💰 ${formatCurrency(a.cost)}</span><span>⏱ ${a.duration_hours}h</span></div></div>
            <span class="btn btn-sm btn-primary">Add</span>
          </div>`).join('')}
    </div>
  `);
}

async function addActivity(stopId, activityId) {
  try { await api.addStopActivity(stopId, { activity_id: activityId }); closeModal(); showToast('Activity added!', 'success'); await loadTrip(); selectStop(selectedStopId); } catch(e){}
}

async function removeActivity(saId) {
  try { await api.removeStopActivity(saId); showToast('Activity removed', 'success'); await loadTrip(); selectStop(selectedStopId); } catch(e){}
}

async function updateBudget() {
  try {
    const b = await api.getBudget(tripId);
    const bar = document.getElementById('budgetBar');
    bar.style.display = 'flex';
    document.getElementById('budgetTotal').textContent = formatCurrency(b.total);
  } catch(e){}
}

async function shareTrip() {
  try {
    const data = await api.shareTrip(tripId);
    const url = `${location.origin}/shared-trip.html?token=${data.share_token}`;
    await navigator.clipboard.writeText(url);
    showToast('Share link copied to clipboard!', 'success');
  } catch(e) { showToast('Could not generate share link', 'error'); }
}
