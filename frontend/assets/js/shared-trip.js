document.addEventListener('DOMContentLoaded', async () => {
  const token = getParam('token');
  if (!token) { document.getElementById('app').innerHTML = '<div class="empty-state"><h3 class="empty-state-title">Invalid link</h3></div>'; return; }
  try {
    const trip = await api.getSharedTrip(token);
    if (trip.error) throw new Error(trip.error);
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="view-header animate-in">
        <h1>${trip.name}</h1>
        <p>${trip.description || ''}</p>
        <p style="color:var(--text-muted);margin-top:8px">By ${trip.author_name} · 📅 ${formatDate(trip.start_date)} — ${formatDate(trip.end_date)} · 📍 ${trip.stops?.length||0} stops</p>
        <div style="margin-top:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="copyLink()">🔗 Copy Link</button>
          ${isLoggedIn() ? `<button class="btn btn-secondary btn-sm" onclick="copyTrip('${token}')">📋 Copy Trip</button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="shareTwitter()">🐦 Twitter</button>
          <button class="btn btn-ghost btn-sm" onclick="shareWhatsApp()">💬 WhatsApp</button>
        </div>
      </div>
      ${(trip.stops||[]).map((stop, i) => `
        <div class="stop-detail animate-in" style="animation-delay:${i*0.1}s">
          <div class="stop-detail-header"><h3>📍 ${stop.city_name}, ${stop.country}</h3><span class="badge badge-accent">Stop ${i+1}</span></div>
          <div class="stop-meta"><div class="stop-meta-item">📅 ${formatDate(stop.arrival_date)} → ${formatDate(stop.departure_date)}</div></div>
          <div class="activity-list">
            ${(stop.activities||[]).map(a => `
              <div class="activity-item"><div class="act-info"><div class="act-name">${a.name} ${getTypeBadge(a.type)}</div><div class="act-meta"><span>💰 ${formatCurrency(a.cost)}</span><span>⏱ ${a.duration_hours}h</span></div></div></div>
            `).join('') || '<p style="color:var(--text-muted);font-size:0.85rem">No activities planned</p>'}
          </div>
        </div>
      `).join('')}
    `;
  } catch(e) { document.getElementById('app').innerHTML = '<div class="empty-state"><h3 class="empty-state-title">Trip not found</h3><p class="empty-state-text">This trip may not be shared publicly.</p></div>'; }
});

function copyLink() { navigator.clipboard.writeText(window.location.href); showToast('Link copied!', 'success'); }
async function copyTrip(token) { try { const r = await api.copyTrip(token); showToast('Trip copied to your account!', 'success'); setTimeout(() => location.href = `/itinerary-builder.html?id=${r.id}`, 1000); } catch(e){} }
function shareTwitter() { window.open(`https://twitter.com/intent/tweet?text=Check out my trip on Traveloop!&url=${encodeURIComponent(location.href)}`); }
function shareWhatsApp() { window.open(`https://wa.me/?text=${encodeURIComponent('Check out my trip: ' + location.href)}`); }
