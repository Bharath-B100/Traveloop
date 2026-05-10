document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  renderNav('trips');
  const tripId = getParam('id');
  if (!tripId) { location.href = '/my-trips.html'; return; }
  try {
    const b = await api.getBudget(tripId);
    const el = document.getElementById('budgetContent');
    const categories = [
      { key: 'transport', label: 'Transport', icon: '✈️', color: '#6c63ff', bg: 'rgba(108,99,255,0.15)' },
      { key: 'accommodation', label: 'Accommodation', icon: '🏨', color: '#00d4aa', bg: 'rgba(0,212,170,0.15)' },
      { key: 'activities', label: 'Activities', icon: '🎯', color: '#ffd93d', bg: 'rgba(255,217,61,0.15)' },
      { key: 'meals', label: 'Meals', icon: '🍽️', color: '#ff6b6b', bg: 'rgba(255,107,107,0.15)' },
    ];
    el.innerHTML = `
      <div class="budget-hero animate-in">
        <div class="total">${formatCurrency(b.total)}</div>
        <div class="avg">Average ${formatCurrency(b.average_per_day)} / day</div>
      </div>
      <div class="budget-charts">
        <div class="chart-card"><h3>Spending by Category</h3><canvas id="pieChart"></canvas></div>
        <div class="chart-card"><h3>Cost per Stop</h3><canvas id="barChart"></canvas></div>
      </div>
      <div class="budget-breakdown">
        ${b.average_per_day > 200 ? `<div class="alert alert-warning animate-in" style="margin-bottom:24px;padding:16px;background:rgba(255,107,107,0.1);border-left:4px solid var(--coral);border-radius:8px;"><strong>⚠️ Over Budget Alert:</strong> Your average daily cost (${formatCurrency(b.average_per_day)}) is higher than recommended. Review your transport and accommodation expenses.</div>` : ''}
        <h3 style="font-family:var(--font-display);margin-bottom:16px">Category Breakdown</h3>
        ${categories.map(c => `
          <div class="budget-category animate-in">
            <div class="budget-category-icon" style="background:${c.bg}">${c.icon}</div>
            <div class="budget-category-info">
              <div class="budget-category-name">${c.label}</div>
              <div class="budget-category-bar"><div class="budget-category-fill" style="width:${b.total?Math.round(b.breakdown[c.key]/b.total*100):0}%;background:${c.color}"></div></div>
            </div>
            <div class="budget-category-amount" style="color:${c.color}">${formatCurrency(b.breakdown[c.key])}</div>
          </div>
        `).join('')}
      </div>
      ${b.stops.length > 0 ? `<div class="table-wrapper"><table><thead><tr><th>City</th><th>Days</th><th>Transport</th><th>Accom.</th><th>Activities</th><th>Meals</th><th>Total</th></tr></thead><tbody>
        ${b.stops.map(s => `<tr><td>${s.city_name}</td><td>${s.days}</td><td>${formatCurrency(s.transport)}</td><td>${formatCurrency(s.accommodation)}</td><td>${formatCurrency(s.activities)}</td><td>${formatCurrency(s.meals)}</td><td style="font-weight:600">${formatCurrency(s.total)}</td></tr>`).join('')}
      </tbody></table></div>` : ''}
      <div style="margin-top:24px;text-align:center"><a href="/itinerary-builder.html?id=${tripId}" class="btn btn-secondary">← Back to Builder</a></div>
    `;
    // Charts
    const ctx1 = document.getElementById('pieChart').getContext('2d');
    new Chart(ctx1, { type: 'doughnut', data: { labels: categories.map(c=>c.label), datasets: [{ data: categories.map(c=>b.breakdown[c.key]), backgroundColor: categories.map(c=>c.color), borderWidth: 0 }] }, options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#8888a8', padding: 16 } } } } });
    if (b.stops.length > 0) {
      const ctx2 = document.getElementById('barChart').getContext('2d');
      new Chart(ctx2, { type: 'bar', data: { labels: b.stops.map(s=>s.city_name), datasets: [{ label: 'Total', data: b.stops.map(s=>s.total), backgroundColor: '#6c63ff', borderRadius: 6 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#8888a8' }, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { ticks: { color: '#8888a8' }, grid: { display: false } } } } });
    }
  } catch(e) { console.error(e); }
});
