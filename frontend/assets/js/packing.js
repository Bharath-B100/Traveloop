let tripId;
const categoryIcons = { clothing: '👕', documents: '📄', electronics: '🔌', toiletries: '🧴', misc: '📦' };

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  renderNav('trips');
  tripId = getParam('id');
  if (!tripId) { location.href = '/my-trips.html'; return; }
  await render();
});

async function render() {
  try {
    const items = await api.getPackingList(tripId);
    const packed = items.filter(i => i.is_packed).length;
    const total = items.length;
    const pct = total ? Math.round(packed / total * 100) : 0;
    const grouped = {};
    items.forEach(i => { if (!grouped[i.category]) grouped[i.category] = []; grouped[i.category].push(i); });

    document.getElementById('app').innerHTML = `
      <div class="packing-header">
        <h1>🎒 Packing List</h1>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="resetAll()">↺ Reset</button>
          <a href="/itinerary-builder.html?id=${tripId}" class="btn btn-ghost btn-sm">← Builder</a>
        </div>
      </div>
      <div class="packing-progress">
        <div class="packing-progress-text"><span>${packed} of ${total} packed</span><span>${pct}%</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="packing-add">
        <input type="text" id="itemName" class="form-input" placeholder="Add item..." onkeydown="if(event.key==='Enter')addItem()">
        <select id="itemCategory" class="form-select" style="max-width:160px">
          <option value="clothing">Clothing</option><option value="documents">Documents</option>
          <option value="electronics">Electronics</option><option value="toiletries">Toiletries</option>
          <option value="misc" selected>Misc</option>
        </select>
        <button class="btn btn-primary" onclick="addItem()">Add</button>
      </div>
      <div class="packing-categories">
        ${Object.entries(grouped).map(([cat, catItems]) => `
          <div class="packing-category card">
            <h3>${categoryIcons[cat]||'📦'} ${cat[0].toUpperCase()+cat.slice(1)}</h3>
            <div class="packing-items">
              ${catItems.map(i => `
                <div class="checkbox-item ${i.is_packed?'checked':''}">
                  <input type="checkbox" class="checkbox-input" ${i.is_packed?'checked':''} onchange="toggleItem('${i.id}', this.checked)">
                  <span class="checkbox-label" style="flex:1">${i.name}</span>
                  <button class="btn btn-icon btn-ghost" style="font-size:0.8rem;opacity:0.5" onclick="deleteItem('${i.id}')">✕</button>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
        ${total === 0 ? '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🎒</div><h3 class="empty-state-title">Nothing packed yet</h3><p class="empty-state-text">Add items above</p></div>' : ''}
      </div>
    `;
  } catch(e) { console.error(e); }
}

async function addItem() {
  const name = document.getElementById('itemName').value.trim();
  if (!name) return;
  const category = document.getElementById('itemCategory').value;
  await api.addPackingItem(tripId, { name, category });
  await render();
}
async function toggleItem(id, checked) { await api.updatePackingItem(id, { is_packed: checked }); await render(); }
async function deleteItem(id) { await api.deletePackingItem(id); await render(); }
async function resetAll() { await api.resetPacking(tripId); showToast('Checklist reset', 'success'); await render(); }
