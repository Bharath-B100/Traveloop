document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  const user = getUser();
  if (user.role !== 'admin') {
    showToast('Unauthorized access', 'error');
    setTimeout(() => { window.location.href = '/dashboard.html'; }, 1000);
    return;
  }
  renderNav('admin');
  
  try {
    const [stats, users, topCities, topActs, trends] = await Promise.all([
      api.getAdminStats(),
      api.getAdminUsers(),
      api.getTopCities(),
      api.getTopActivities(),
      api.getTrends()
    ]);
    
    renderStats(stats);
    renderTrendsChart(trends);
    renderUsers(users);
    renderTopCities(topCities);
    renderTopActivities(topActs);
  } catch(e) {
    console.error('Failed to load admin data', e);
  }
});

function renderStats(s) {
  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><h4>Total Users</h4><div class="value">${s.totalUsers}</div></div>
    <div class="stat-card"><h4>Total Trips</h4><div class="value">${s.totalTrips}</div></div>
    <div class="stat-card"><h4>Public Trips</h4><div class="value">${s.publicTrips}</div></div>
    <div class="stat-card"><h4>Cities Visited</h4><div class="value">${s.totalStops}</div></div>
    <div class="stat-card"><h4>Activities Planned</h4><div class="value">${s.totalActivitiesUsed}</div></div>
  `;
  animateCards('.stat-card');
}

function renderUsers(users) {
  document.getElementById('usersTableBody').innerHTML = users.map(u => `
    <tr>
      <td><strong>${u.name}</strong></td>
      <td>${u.email}</td>
      <td>${u.role === 'admin' ? '<span class="badge badge-coral">Admin</span>' : '<span class="badge badge-sky">User</span>'}</td>
      <td>${u.trip_count}</td>
      <td>${formatDateShort(u.created_at)}</td>
    </tr>
  `).join('');
}

function renderTopCities(cities) {
  document.getElementById('topCitiesList').innerHTML = cities.map(c => `
    <li>
      <div style="flex:1"><span class="name">${c.name}</span><span class="subtext">${c.country}</span></div>
      <div class="count" style="margin-right:12px">${c.usage_count} stops</div>
      <button class="btn btn-sm btn-ghost" onclick="showEditCityModal('${c._id || c.id}', '${c.name.replace(/'/g, "\\'")}', '${c.country.replace(/'/g, "\\'")}')">Edit</button>
    </li>
  `).join('');
}

function renderTopActivities(acts) {
  document.getElementById('topActivitiesList').innerHTML = acts.map(a => `
    <li>
      <div><span class="name">${a.name}</span><span class="subtext">${a.city_name} &bull; ${getTypeBadge(a.type)}</span></div>
      <div class="count">${a.usage_count} times</div>
    </li>
  `).join('');
}

function renderTrendsChart(trends) {
  const ctx = document.getElementById('trendsChart').getContext('2d');
  
  // Fill missing dates in the last 30 days
  const labels = [];
  const data = [];
  const map = {};
  trends.forEach(t => map[t.date] = t.count);
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    labels.push(formatDateShort(dateStr));
    data.push(map[dateStr] || 0);
  }
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Trips Created',
        data,
        borderColor: '#6c63ff',
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#00d4aa',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#00d4aa'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a2e',
          titleColor: '#e8e8f0',
          bodyColor: '#e8e8f0',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12
        }
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { color: '#8888a8', maxTicksLimit: 7 }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
          ticks: { color: '#8888a8', stepSize: 1, precision: 0 },
          beginAtZero: true
        }
      }
    }
  });
}

function showAddCityModal() {
  showModal('Add New Destination', `
    <div class="form-group"><label class="form-label">City Name *</label><input type="text" id="addCityName" class="form-input" placeholder="e.g. Kyoto"></div>
    <div class="form-group"><label class="form-label">Country *</label><input type="text" id="addCityCountry" class="form-input" placeholder="e.g. Japan"></div>
    <div class="form-group"><label class="form-label">Region</label><input type="text" id="addCityRegion" class="form-input" placeholder="e.g. Asia"></div>
    <div class="form-group"><label class="form-label">Popularity (0-100)</label><input type="number" id="addCityPopularity" class="form-input" value="50"></div>
    <div class="form-group"><label class="form-label">Cost Index (1-5)</label><input type="number" id="addCityCost" class="form-input" value="3" min="1" max="5" step="0.1"></div>
    <div class="form-group">
      <label class="form-label">City Image</label>
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="url" id="addCityImageUrl" class="form-input" placeholder="https://... (or upload below)" style="flex:1">
      </div>
      <input type="file" id="addCityImageUpload" accept="image/*" class="form-input" style="margin-top:8px;padding:8px">
      <div id="addCityUploadStatus" style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;"></div>
    </div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitAddCity()">Save City</button>`);
}

async function submitAddCity() {
  const name = document.getElementById('addCityName').value.trim();
  const country = document.getElementById('addCityCountry').value.trim();
  if (!name || !country) return showToast('Name and country are required', 'error');

  const saveBtn = document.querySelector('button[onclick="submitAddCity()"]');
  const uploadStatus = document.getElementById('addCityUploadStatus');
  const fileInput = document.getElementById('addCityImageUpload');
  let imageUrl = document.getElementById('addCityImageUrl').value.trim();

  try {
    saveBtn.disabled = true;
    if (fileInput.files.length > 0) {
      uploadStatus.textContent = 'Uploading image...';
      const uploadRes = await api.uploadImage(fileInput.files[0]);
      imageUrl = uploadRes.url;
      uploadStatus.textContent = 'Upload complete!';
    }

    await api.addCity({
      name, country,
      region: document.getElementById('addCityRegion').value.trim(),
      popularity: parseInt(document.getElementById('addCityPopularity').value) || 50,
      cost_index: parseFloat(document.getElementById('addCityCost').value) || 3,
      image_url: imageUrl
    });
    showToast('Destination added!', 'success');
    closeModal();
    // Refresh Top Cities list just in case, or user can just reload
    const topCities = await api.getTopCities();
    renderTopCities(topCities);
  } catch(e) {
    uploadStatus.textContent = '';
    showToast('Error adding destination', 'error');
  } finally {
    saveBtn.disabled = false;
  }
}

function showEditCityModal(id, name, country) {
  showModal('Edit Destination', `
    <p style="margin-bottom:16px;color:var(--text-secondary)">Currently editing: <strong>${name}, ${country}</strong></p>
    <input type="hidden" id="editCityId" value="${id}">
    <div class="form-group">
      <label class="form-label">New City Image</label>
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="url" id="editCityImageUrl" class="form-input" placeholder="https://... (or upload below)" style="flex:1">
      </div>
      <input type="file" id="editCityImageUpload" accept="image/*" class="form-input" style="margin-top:8px;padding:8px">
      <div id="editCityUploadStatus" style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;"></div>
    </div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitEditCity()">Save Changes</button>`);
}

async function submitEditCity() {
  const id = document.getElementById('editCityId').value;
  const saveBtn = document.querySelector('button[onclick="submitEditCity()"]');
  const uploadStatus = document.getElementById('editCityUploadStatus');
  const fileInput = document.getElementById('editCityImageUpload');
  let imageUrl = document.getElementById('editCityImageUrl').value.trim();

  try {
    saveBtn.disabled = true;
    if (fileInput.files.length > 0) {
      uploadStatus.textContent = 'Uploading image...';
      const uploadRes = await api.uploadImage(fileInput.files[0]);
      imageUrl = uploadRes.url;
      uploadStatus.textContent = 'Upload complete!';
    }

    const updateData = {};
    if (imageUrl) updateData.image_url = imageUrl;
    
    // Even if no image is uploaded, we update the city (maybe just clear image or do nothing)
    // Here we'll only update if imageUrl exists
    if (imageUrl) {
      await api.updateCity(id, updateData);
      showToast('Destination updated!', 'success');
      closeModal();
    } else {
      showToast('Please provide an image URL or upload a file', 'info');
      saveBtn.disabled = false;
      return;
    }
  } catch(e) {
    uploadStatus.textContent = '';
    showToast('Error updating destination', 'error');
  } finally {
    saveBtn.disabled = false;
  }
}
