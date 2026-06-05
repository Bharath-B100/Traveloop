let actSearchTimeout, currentType = '';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  renderNav('cities');
  await searchActivities();
});

function setTypeFilter(type) {
  currentType = type;
  document.getElementById('typeFilter').value = type;
  document.querySelectorAll('.filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.type === type);
  });
  searchActivities();
}

async function searchActivities() {
  clearTimeout(actSearchTimeout);
  actSearchTimeout = setTimeout(async () => {
    const q = document.getElementById('actInput').value.trim();
    const type = document.getElementById('typeFilter').value || currentType;
    try {
      const activities = await api.searchActivities({ q, type, limit: 100 });
      renderActivities(activities);
    } catch(e) {}
  }, 300);
}

function renderActivities(activities) {
  const grid = document.getElementById('actGrid');
  if (!activities.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">🎯</div>
      <h3 class="empty-state-title">No activities found</h3>
      <p class="empty-state-text">Try a different search or filter.</p>
    </div>`;
    return;
  }
  grid.innerHTML = activities.map(a => `
    <div class="activity-card animate-in">
      <div class="activity-card-header">
        <div class="activity-card-name">${a.name}</div>
        ${getTypeBadge(a.type)}
      </div>
      ${a.city_name ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px">📍 ${a.city_name}, ${a.country||''}</div>` : ''}
      <div class="activity-card-desc">${a.description || 'No description available.'}</div>
      <div class="activity-card-footer">
        <div class="activity-card-meta">
          <span class="activity-meta-item">💰 ${formatCurrency(a.cost)}</span>
          <span class="activity-meta-item">⏱ ${a.duration_hours}h</span>
        </div>
      </div>
    </div>
  `).join('');
  animateCards('.activity-card');
}
