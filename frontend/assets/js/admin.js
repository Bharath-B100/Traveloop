let allUsers = [], allCities = [], allActivities = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  const user = getUser();
  if (user.role !== 'admin') {
    showToast('Unauthorized access', 'error');
    setTimeout(() => window.location.href = '/dashboard.html', 1000);
    return;
  }
  renderNav('admin');

  try {
    const [stats, users, topCities, topActs, trends, cities, activities] = await Promise.all([
      api.getAdminStats(),
      api.getAdminUsers(),
      api.getTopCities(),
      api.getTopActivities(),
      api.getTrends(),
      api.searchCities({ sort: 'popularity', limit: 200 }),
      api.searchActivities({ limit: 500 })
    ]);

    allUsers = users;
    allCities = cities;
    allActivities = activities;

    renderStats(stats);
    renderTrendsChart(trends);
    renderRecentUsers(users.slice(0, 8));
    renderTopCities(topCities);
    renderTopActivities(topActs);
    renderUsersTable(users);
    renderCitiesGrid(cities);
    renderActivitiesList(activities);

    document.getElementById('usersBadge').textContent = users.length;
  } catch (e) {
    console.error('Failed to load admin data', e);
    showToast('Failed to load admin data', 'error');
  }
});

// ===== TAB SWITCHING =====
function switchTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById(`panel-${tab}`).classList.add('active');
}

// ===== STATS =====
function renderStats(s) {
  const statDefs = [
    { icon: '👥', label: 'Total Users', value: s.totalUsers, color: 'purple' },
    { icon: '✈️', label: 'Total Trips', value: s.totalTrips, color: 'teal' },
    { icon: '🌐', label: 'Public Trips', value: s.publicTrips, color: 'sky' },
    { icon: '📍', label: 'Cities Visited', value: s.totalStops, color: 'gold' },
    { icon: '🎯', label: 'Activities Used', value: s.totalActivitiesUsed, color: 'coral' },
  ];
  document.getElementById('statsGrid').innerHTML = statDefs.map((d, i) => `
    <div class="admin-stat-card animate-in" style="animation-delay:${i*0.07}s">
      <div class="admin-stat-icon ${d.color}">${d.icon}</div>
      <div>
        <div class="admin-stat-value">${d.value}</div>
        <div class="admin-stat-label">${d.label}</div>
      </div>
    </div>
  `).join('');
}

// ===== TRENDS CHART =====
function renderTrendsChart(trends) {
  const ctx = document.getElementById('trendsChart').getContext('2d');
  const labels = [], data = [], map = {};
  trends.forEach(t => map[t.date] = t.count);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    labels.push(formatDateShort(dateStr));
    data.push(map[dateStr] || 0);
  }
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Trips Created', data,
        borderColor: '#7c6ffd', backgroundColor: 'rgba(124,111,253,0.08)',
        tension: 0.4, fill: true,
        pointBackgroundColor: '#00e5b5', pointBorderColor: '#fff',
        pointRadius: 3, pointHoverRadius: 6,
        pointHoverBackgroundColor: '#00e5b5'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e1e36', titleColor: '#eeeef6', bodyColor: '#9090b8',
          borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 12,
          cornerRadius: 10
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#545475', maxTicksLimit: 7 } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#545475', stepSize: 1, precision: 0 }, beginAtZero: true
        }
      }
    }
  });
}

// ===== RECENT USERS (overview tab) =====
function renderRecentUsers(users) {
  document.getElementById('recentUsersBody').innerHTML = users.map(u => `
    <tr>
      <td><strong>${u.name}</strong></td>
      <td style="color:var(--text-secondary)">${u.email}</td>
      <td>${u.role === 'admin' ? '<span class="badge badge-coral">Admin</span>' : '<span class="badge badge-sky">User</span>'}</td>
      <td>${u.trip_count}</td>
      <td style="color:var(--text-muted)">${formatDateShort(u.created_at)}</td>
    </tr>
  `).join('');
}

// ===== FULL USERS TABLE =====
function renderUsersTable(users) {
  document.getElementById('usersTableBody').innerHTML = users.map(u => `
    <tr id="user-row-${u._id}">
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--gradient-hero);display:flex;align-items:center;justify-content:center;font-size:0.78rem;font-weight:700;color:#fff;flex-shrink:0">${(u.name||'U')[0].toUpperCase()}</div>
          <strong>${u.name}</strong>
        </div>
      </td>
      <td style="color:var(--text-secondary)">${u.email}</td>
      <td>${u.role === 'admin' ? '<span class="badge badge-coral">Admin</span>' : '<span class="badge badge-sky">User</span>'}</td>
      <td>${u.trip_count}</td>
      <td style="color:var(--text-muted)">${formatDateShort(u.created_at)}</td>
      <td>
        <div class="actions">
          <button class="btn btn-sm btn-secondary" onclick="toggleUserRole('${u._id}','${u.role}','${u.name.replace(/'/g,"\\'")}')">
            ${u.role === 'admin' ? '⬇ Demote' : '⬆ Promote'}
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteUser('${u._id}','${u.name.replace(/'/g,"\\'")}')">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterUsers() {
  const q = document.getElementById('userSearchInput').value.toLowerCase();
  const role = document.getElementById('roleFilter').value;
  const filtered = allUsers.filter(u =>
    (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
    (!role || u.role === role)
  );
  renderUsersTable(filtered);
}

async function toggleUserRole(id, currentRole, name) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  const action = newRole === 'admin' ? 'promote to Admin' : 'demote to User';
  showModal('Change Role', `<p>Are you sure you want to <strong>${action}</strong> <strong>${name}</strong>?</p>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="confirmToggleRole('${id}','${newRole}')">Confirm</button>`);
}

async function confirmToggleRole(id, newRole) {
  try {
    await api.updateUserRole(id, newRole);
    showToast(`Role updated to ${newRole}`, 'success');
    closeModal();
    const users = await api.getAdminUsers();
    allUsers = users;
    renderUsersTable(users);
    renderRecentUsers(users.slice(0, 8));
    document.getElementById('usersBadge').textContent = users.length;
  } catch (e) {
    showToast('Failed to update role', 'error');
  }
}

async function deleteUser(id, name) {
  showModal('Delete User', `<p>Are you sure you want to permanently delete <strong>${name}</strong> and all their data? This cannot be undone.</p>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-danger" onclick="confirmDeleteUser('${id}')">Delete Forever</button>`);
}

async function confirmDeleteUser(id) {
  try {
    await api.deleteAdminUser(id);
    showToast('User deleted', 'success');
    closeModal();
    allUsers = allUsers.filter(u => String(u._id) !== String(id));
    renderUsersTable(allUsers);
    renderRecentUsers(allUsers.slice(0, 8));
    document.getElementById('usersBadge').textContent = allUsers.length;
  } catch (e) {
    showToast('Failed to delete user', 'error');
  }
}

// ===== TOP CITIES (overview) =====
function renderTopCities(cities) {
  document.getElementById('topCitiesList').innerHTML = cities.map(c => `
    <li>
      <div style="flex:1">
        <span class="name">${c.name}</span>
        <span class="subtext">${c.country}</span>
      </div>
      <span class="count">${c.usage_count} stops</span>
    </li>
  `).join('') || '<li><p style="color:var(--text-muted);padding:12px 0">No data yet</p></li>';
}

function renderTopActivities(acts) {
  document.getElementById('topActivitiesList').innerHTML = acts.map(a => `
    <li>
      <div>
        <span class="name">${a.name}</span>
        <span class="subtext">${a.city_name || 'Unknown'} • ${getTypeBadge(a.type)}</span>
      </div>
      <span class="count">${a.usage_count}×</span>
    </li>
  `).join('') || '<li><p style="color:var(--text-muted);padding:12px 0">No data yet</p></li>';
}

// ===== CITIES GRID =====
function renderCitiesGrid(cities) {
  const grid = document.getElementById('citiesAdminGrid');
  if (!cities.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🏙️</div><p class="empty-state-title">No cities found</p></div>';
    return;
  }
  grid.innerHTML = cities.map(c => `
    <div class="city-admin-card" id="city-card-${c._id || c.id}">
      <img class="city-admin-img" src="${c.image_url || ''}" alt="${c.name}" onerror="this.style.background='var(--bg-tertiary)';this.src=''">
      <div class="city-admin-body">
        <div class="city-admin-name">${c.name}</div>
        <div class="city-admin-country">${c.country}${c.region ? ' • ' + c.region : ''}</div>
        <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
          <span class="badge badge-accent">₹${Math.ceil(c.cost_index || 1)} cost</span>
          <span class="badge badge-teal">⭐ ${c.popularity || 0}</span>
        </div>
        <div class="city-admin-actions">
          <button class="btn btn-sm btn-secondary" style="flex:1" onclick="showEditCityModal('${c._id || c.id}','${c.name.replace(/'/g,"\\'")}','${c.country.replace(/'/g,"\\'")}','${c.region||''}',${c.popularity||50},${c.cost_index||3},'${c.image_url||''}')">✏️ Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteCityConfirm('${c._id || c.id}','${c.name.replace(/'/g,"\\'")}')">🗑</button>
        </div>
      </div>
    </div>
  `).join('');
}

function filterAdminCities() {
  const q = document.getElementById('citySearchAdmin').value.toLowerCase();
  const filtered = allCities.filter(c =>
    c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
  );
  renderCitiesGrid(filtered);
}

// ===== ACTIVITIES LIST =====
function renderActivitiesList(activities) {
  const list = document.getElementById('activitiesAdminList');
  if (!activities.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎯</div><p class="empty-state-title">No activities found</p></div>';
    return;
  }
  list.innerHTML = activities.map(a => `
    <div class="activity-admin-item">
      <div style="width:40px;height:40px;border-radius:var(--radius-sm);background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">🎯</div>
      <div class="activity-admin-info">
        <div class="activity-admin-name">${a.name} ${getTypeBadge(a.type)}</div>
        <div class="activity-admin-meta">📍 ${a.city_name || 'Unknown'} &bull; 💰 ${formatCurrency(a.cost)} &bull; ⏱ ${a.duration_hours}h</div>
      </div>
    </div>
  `).join('');
}

function filterAdminActivities() {
  const q = document.getElementById('actSearchAdmin').value.toLowerCase();
  const type = document.getElementById('actTypeFilter').value;
  const filtered = allActivities.filter(a =>
    (a.name.toLowerCase().includes(q) || (a.city_name||'').toLowerCase().includes(q)) &&
    (!type || a.type === type)
  );
  renderActivitiesList(filtered);
}

// ===== ADD CITY MODAL =====
function showAddCityModal() {
  showModal('Add New Destination', `
    <div class="form-group"><label class="form-label">City Name *</label><input type="text" id="addCityName" class="form-input" placeholder="e.g. Kyoto"></div>
    <div class="form-group"><label class="form-label">Country *</label><input type="text" id="addCityCountry" class="form-input" placeholder="e.g. Japan"></div>
    <div class="form-group"><label class="form-label">Region</label><input type="text" id="addCityRegion" class="form-input" placeholder="e.g. Asia"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label class="form-label">Popularity (0-100)</label><input type="number" id="addCityPopularity" class="form-input" value="50" min="0" max="100"></div>
      <div class="form-group"><label class="form-label">Cost Index (1-5)</label><input type="number" id="addCityCost" class="form-input" value="3" min="1" max="5" step="0.5"></div>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea id="addCityDesc" class="form-textarea" placeholder="Brief description of the city..." style="min-height:80px"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">City Image URL</label>
      <input type="url" id="addCityImageUrl" class="form-input" placeholder="https://...">
    </div>
    <div class="form-group">
      <label class="form-label">Or Upload Image</label>
      <input type="file" id="addCityImageUpload" accept="image/*" class="form-input" style="padding:8px">
      <div id="addCityUploadStatus" style="font-size:0.82rem;color:var(--text-muted);margin-top:4px"></div>
    </div>
  `,
  `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
   <button class="btn btn-primary" id="addCitySubmitBtn" onclick="submitAddCity()">💾 Save City</button>`);
}

async function submitAddCity() {
  const name = document.getElementById('addCityName').value.trim();
  const country = document.getElementById('addCityCountry').value.trim();
  if (!name || !country) return showToast('Name and country are required', 'error');

  const btn = document.getElementById('addCitySubmitBtn');
  const uploadStatus = document.getElementById('addCityUploadStatus');
  const fileInput = document.getElementById('addCityImageUpload');
  let imageUrl = document.getElementById('addCityImageUrl').value.trim();

  setLoading(btn, true);
  try {
    if (fileInput.files.length > 0) {
      uploadStatus.textContent = 'Uploading image…';
      const res = await api.uploadImage(fileInput.files[0]);
      imageUrl = res.url;
      uploadStatus.textContent = 'Upload complete!';
    }
    await api.addCity({
      name, country,
      region: document.getElementById('addCityRegion').value.trim(),
      popularity: parseInt(document.getElementById('addCityPopularity').value) || 50,
      cost_index: parseFloat(document.getElementById('addCityCost').value) || 3,
      description: document.getElementById('addCityDesc').value.trim(),
      image_url: imageUrl
    });
    showToast('City added successfully!', 'success');
    closeModal();
    const cities = await api.searchCities({ sort: 'popularity', limit: 200 });
    allCities = cities;
    renderCitiesGrid(cities);
  } catch (e) {
    showToast('Error adding city', 'error');
    setLoading(btn, false);
  }
}

// ===== EDIT CITY MODAL =====
function showEditCityModal(id, name, country, region, popularity, costIndex, imageUrl) {
  showModal('Edit Destination', `
    <p style="color:var(--text-secondary);margin-bottom:16px;font-size:0.88rem">Editing: <strong>${name}, ${country}</strong></p>
    <input type="hidden" id="editCityId" value="${id}">
    <div class="form-group"><label class="form-label">City Name *</label><input type="text" id="editCityName" class="form-input" value="${name}"></div>
    <div class="form-group"><label class="form-label">Country *</label><input type="text" id="editCityCountry" class="form-input" value="${country}"></div>
    <div class="form-group"><label class="form-label">Region</label><input type="text" id="editCityRegion" class="form-input" value="${region}"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label class="form-label">Popularity (0-100)</label><input type="number" id="editCityPopularity" class="form-input" value="${popularity}" min="0" max="100"></div>
      <div class="form-group"><label class="form-label">Cost Index (1-5)</label><input type="number" id="editCityCost" class="form-input" value="${costIndex}" min="1" max="5" step="0.5"></div>
    </div>
    <div class="form-group">
      <label class="form-label">Image URL</label>
      <input type="url" id="editCityImageUrl" class="form-input" value="${imageUrl}" placeholder="https://...">
    </div>
    <div class="form-group">
      <label class="form-label">Or Upload New Image</label>
      <input type="file" id="editCityImageUpload" accept="image/*" class="form-input" style="padding:8px">
      <div id="editCityUploadStatus" style="font-size:0.82rem;color:var(--text-muted);margin-top:4px"></div>
    </div>
  `,
  `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
   <button class="btn btn-primary" id="editCitySubmitBtn" onclick="submitEditCity()">💾 Save Changes</button>`);
}

async function submitEditCity() {
  const id = document.getElementById('editCityId').value;
  const name = document.getElementById('editCityName').value.trim();
  const country = document.getElementById('editCityCountry').value.trim();
  if (!name || !country) return showToast('Name and country are required', 'error');

  const btn = document.getElementById('editCitySubmitBtn');
  const uploadStatus = document.getElementById('editCityUploadStatus');
  const fileInput = document.getElementById('editCityImageUpload');
  let imageUrl = document.getElementById('editCityImageUrl').value.trim();

  setLoading(btn, true);
  try {
    if (fileInput.files.length > 0) {
      uploadStatus.textContent = 'Uploading image…';
      const res = await api.uploadImage(fileInput.files[0]);
      imageUrl = res.url;
      uploadStatus.textContent = 'Upload complete!';
    }
    await api.updateCity(id, {
      name, country,
      region: document.getElementById('editCityRegion').value.trim(),
      popularity: parseInt(document.getElementById('editCityPopularity').value) || 50,
      cost_index: parseFloat(document.getElementById('editCityCost').value) || 3,
      image_url: imageUrl
    });
    showToast('City updated!', 'success');
    closeModal();
    const cities = await api.searchCities({ sort: 'popularity', limit: 200 });
    allCities = cities;
    renderCitiesGrid(cities);
  } catch (e) {
    showToast('Error updating city', 'error');
    setLoading(btn, false);
  }
}

async function deleteCityConfirm(id, name) {
  showModal('Delete City', `<p>Are you sure you want to delete <strong>${name}</strong>? This will affect existing itineraries.</p>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-danger" onclick="confirmDeleteCity('${id}')">Delete City</button>`);
}

async function confirmDeleteCity(id) {
  try {
    await api.deleteCity(id);
    showToast('City deleted', 'success');
    closeModal();
    allCities = allCities.filter(c => String(c._id) !== String(id) && String(c.id) !== String(id));
    renderCitiesGrid(allCities);
  } catch (e) {
    showToast('Failed to delete city', 'error');
  }
}

// ===== EXPORT =====
function exportData() {
  const data = {
    users: allUsers.map(u => ({ name: u.name, email: u.email, role: u.role, trips: u.trip_count, joined: u.created_at })),
    cities: allCities.map(c => ({ name: c.name, country: c.country, popularity: c.popularity }))
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `traveloop-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  showToast('Data exported!', 'success');
}
