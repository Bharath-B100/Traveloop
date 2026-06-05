let tripId, tripData, selectedStopId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  renderNav('trips');
  tripId = getParam('id');
  if (!tripId) { location.href = '/my-trips.html'; return; }
  document.getElementById('viewBudgetLink').href = `/budget.html?id=${tripId}`;
  await loadTrip();
  document.getElementById('addStopBtn').addEventListener('click', showAddStopModal);
  document.getElementById('editTripBtn').addEventListener('click', showEditTripModal);
});

async function loadTrip() {
  try {
    tripData = await api.getTrip(tripId);
    document.getElementById('tripHeader').innerHTML = `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <h1>${tripData.name}</h1>
          ${tripData.description ? `<p>${tripData.description}</p>` : ''}
          ${tripData.start_date ? `<p style="color:var(--text-muted);font-size:0.83rem;margin-top:4px">📅 ${formatDate(tripData.start_date)} — ${formatDate(tripData.end_date)}</p>` : ''}
        </div>
      </div>
      <div class="builder-actions">
        <button id="editTripBtn" class="btn btn-secondary btn-sm" onclick="showEditTripModal()">✏️ Edit Trip</button>
        <a href="/itinerary-view.html?id=${tripId}" class="btn btn-secondary btn-sm">👁 View</a>
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
    list.innerHTML = '<div style="color:var(--text-muted);font-size:0.83rem;text-align:center;padding:24px 0">No stops yet. Add your first destination!</div>';
    return;
  }
  list.innerHTML = tripData.stops.map((s, i) => `
    <div class="stop-item ${s.id == selectedStopId ? 'active' : ''}" onclick="selectStop('${s.id}')">
      <span class="stop-number">${i + 1}</span>
      <div class="stop-info">
        <div class="stop-city">${s.city_name}</div>
        <div class="stop-dates">${formatDateShort(s.arrival_date)} → ${formatDateShort(s.departure_date)}</div>
      </div>
      <button class="stop-remove" onclick="event.stopPropagation();removeStop('${s.id}')" title="Remove stop">✕</button>
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
        ${stop.city_image ? `<div class="stop-meta-item"><img src="${stop.city_image}" alt="${stop.city_name}" style="width:100px;height:56px;object-fit:cover;border-radius:6px;margin-left:4px"></div>` : ''}
      </div>
      <div style="margin-bottom:16px">
        <h4 style="font-size:0.85rem;color:var(--text-muted);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700">Update Dates</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="cost-field"><label>Arrival Date</label><input type="date" value="${stop.arrival_date||''}" onchange="updateStopDate('${stop.id}','arrival_date',this.value)"></div>
          <div class="cost-field"><label>Departure Date</label><input type="date" value="${stop.departure_date||''}" onchange="updateStopDate('${stop.id}','departure_date',this.value)"></div>
        </div>
      </div>
      <div class="cost-fields">
        <div class="cost-field"><label>Transport (₹)</label><input type="number" value="${stop.transport_cost||0}" onchange="updateStopCost('${stop.id}','transport_cost',this.value)"></div>
        <div class="cost-field"><label>Accommodation (₹)</label><input type="number" value="${stop.accommodation_cost||0}" onchange="updateStopCost('${stop.id}','accommodation_cost',this.value)"></div>
        <div class="cost-field"><label>Meals/Day (₹)</label><input type="number" value="${stop.meal_cost_per_day||0}" onchange="updateStopCost('${stop.id}','meal_cost_per_day',this.value)"></div>
      </div>
      <div style="margin-top:22px;display:flex;align-items:center;justify-content:space-between">
        <h3 style="font-size:0.95rem;font-weight:700">Activities</h3>
        <button class="btn btn-sm btn-primary" onclick="showAddActivityModal('${stop.id}', '${stop.city_id}')">+ Add Activity</button>
      </div>
      <div class="activity-list" style="margin-top:12px">
        ${(stop.activities || []).length === 0
          ? '<p style="color:var(--text-muted);font-size:0.83rem;padding:12px 0">No activities yet</p>'
          : stop.activities.map(a => `
            <div class="activity-item">
              <div class="act-info">
                <div class="act-name">${a.name} ${getTypeBadge(a.type)}</div>
                <div class="act-meta">
                  <span>💰 ${formatCurrency(a.cost)}</span>
                  <span>⏱ ${a.duration_hours}h</span>
                  ${a.planned_time ? `<span>🕐 ${a.planned_time}</span>` : ''}
                </div>
              </div>
              <button class="act-remove" onclick="removeActivity('${a.id}')">✕</button>
            </div>
          `).join('')}
      </div>
    </div>
  `;
}

async function showAddStopModal() {
  const cities = await api.searchCities({ sort: 'popularity', limit: 200 });
  showModal('Add Stop', `
    <div class="search-bar" style="margin-bottom:12px">
      <span class="search-icon">🔍</span>
      <input type="text" id="citySearchInput" placeholder="Search cities..." oninput="filterCities()">
    </div>
    <div id="cityResults" style="max-height:320px;overflow-y:auto;display:flex;flex-direction:column;gap:6px">
      ${cities.map(c => `
        <div class="stop-item city-result" data-name="${c.name.toLowerCase()} ${c.country.toLowerCase()}" onclick="addStop('${c._id || c.id}')">
          <span class="stop-number" style="font-size:0.6rem;width:24px;height:24px">${c.country.slice(0,2).toUpperCase()}</span>
          <div class="stop-info">
            <div class="stop-city">${c.name}</div>
            <div class="stop-dates">${c.country}</div>
          </div>
          <span class="badge badge-${c.cost_index<=2?'teal':c.cost_index<=3.5?'gold':'coral'}">${'$'.repeat(Math.ceil(c.cost_index||1))}</span>
        </div>
      `).join('')}
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
  } catch(e) { showToast('Failed to add stop', 'error'); }
}

async function removeStop(stopId) {
  try {
    await api.deleteStop(stopId);
    showToast('Stop removed', 'success');
    selectedStopId = null;
    await loadTrip();
    document.getElementById('mainContent').innerHTML = '<div class="empty-state"><div class="empty-state-icon">🗺️</div><h3 class="empty-state-title">Select a stop</h3><p class="empty-state-text">Click a stop on the left or add a new one</p></div>';
  } catch(e) {}
}

async function updateStopCost(stopId, field, value) {
  try { await api.updateStop(stopId, { [field]: parseFloat(value) || 0 }); updateBudget(); } catch(e) {}
}

async function updateStopDate(stopId, field, value) {
  try { await api.updateStop(stopId, { [field]: value }); } catch(e) {}
}

async function showAddActivityModal(stopId, cityId) {
  const acts = await api.searchActivities({ city_id: cityId });
  showModal('Add Activity', `
    <div class="search-bar" style="margin-bottom:12px">
      <span class="search-icon">🔍</span>
      <input type="text" id="actSearchInput" placeholder="Search activities..." oninput="filterActivities()">
    </div>
    <div id="actResults" style="max-height:380px;overflow-y:auto;display:flex;flex-direction:column;gap:8px">
      ${acts.length === 0
        ? '<p style="color:var(--text-muted);padding:12px">No activities available for this city</p>'
        : acts.map(a => `
          <div class="activity-item act-result" data-name="${a.name.toLowerCase()}" style="cursor:pointer" onclick="addActivity('${stopId}','${a._id || a.id}')">
            <div class="act-info">
              <div class="act-name">${a.name} ${getTypeBadge(a.type)}</div>
              <div class="act-meta"><span>💰 ${formatCurrency(a.cost)}</span><span>⏱ ${a.duration_hours}h</span></div>
            </div>
            <span class="btn btn-sm btn-primary">Add</span>
          </div>`).join('')}
    </div>
  `);
}

function filterActivities() {
  const q = document.getElementById('actSearchInput').value.toLowerCase();
  document.querySelectorAll('.act-result').forEach(el => {
    el.style.display = el.dataset.name.includes(q) ? 'flex' : 'none';
  });
}

async function addActivity(stopId, activityId) {
  try {
    await api.addStopActivity(stopId, { activity_id: activityId });
    closeModal(); showToast('Activity added!', 'success');
    await loadTrip(); selectStop(selectedStopId);
  } catch(e) { showToast('Failed to add activity', 'error'); }
}

async function removeActivity(saId) {
  try { await api.removeStopActivity(saId); showToast('Removed', 'success'); await loadTrip(); selectStop(selectedStopId); } catch(e) {}
}

async function updateBudget() {
  try {
    const b = await api.getBudget(tripId);
    const bar = document.getElementById('budgetBar');
    bar.style.display = 'flex';
    document.getElementById('budgetTotal').textContent = formatCurrency(b.total);
  } catch(e) {}
}

async function shareTrip() {
  try {
    const data = await api.shareTrip(tripId);
    const url = `${location.origin}/shared-trip.html?token=${data.share_token}`;
    await copyToClipboard(url);
  } catch(e) { showToast('Could not generate share link', 'error'); }
}

function showEditTripModal() {
  if (!tripData) return;
  showModal('Edit Trip', `
    <div class="form-group"><label class="form-label">Trip Name *</label><input type="text" id="editTripName" class="form-input" value="${tripData.name}"></div>
    <div class="form-group"><label class="form-label">Description</label><textarea id="editTripDesc" class="form-textarea" style="min-height:80px">${tripData.description||''}</textarea></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label class="form-label">Start Date</label><input type="date" id="editTripStart" class="form-input" value="${tripData.start_date||''}"></div>
      <div class="form-group"><label class="form-label">End Date</label><input type="date" id="editTripEnd" class="form-input" value="${tripData.end_date||''}"></div>
    </div>
    <div class="form-group"><label class="form-label">Cover Photo URL</label><input type="url" id="editTripCover" class="form-input" value="${tripData.cover_photo||''}" placeholder="https://..."></div>
    <div class="form-group">
      <label class="form-label">Or Upload Cover Photo</label>
      <input type="file" id="editTripCoverUpload" accept="image/*" class="form-input" style="padding:8px">
      <div id="editTripUploadStatus" style="font-size:0.82rem;color:var(--text-muted);margin-top:4px"></div>
    </div>
  `,
  `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
   <button class="btn btn-primary" id="editTripSaveBtn" onclick="saveEditTrip()">💾 Save Changes</button>`);
}

async function saveEditTrip() {
  const name = document.getElementById('editTripName').value.trim();
  if (!name) return showToast('Trip name is required', 'error');
  const btn = document.getElementById('editTripSaveBtn');
  const uploadStatus = document.getElementById('editTripUploadStatus');
  const fileInput = document.getElementById('editTripCoverUpload');
  let coverPhoto = document.getElementById('editTripCover').value.trim();
  setLoading(btn, true);
  try {
    if (fileInput.files.length > 0) {
      uploadStatus.textContent = 'Uploading…';
      const res = await api.uploadImage(fileInput.files[0]);
      coverPhoto = res.url;
      uploadStatus.textContent = 'Done!';
    }
    await api.updateTrip(tripId, {
      name,
      description: document.getElementById('editTripDesc').value.trim(),
      start_date: document.getElementById('editTripStart').value || null,
      end_date: document.getElementById('editTripEnd').value || null,
      cover_photo: coverPhoto
    });
    showToast('Trip updated!', 'success');
    closeModal();
    await loadTrip();
  } catch(e) {
    showToast('Error saving trip', 'error');
    setLoading(btn, false);
  }
}
