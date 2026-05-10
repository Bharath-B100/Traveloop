let tripId;
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  renderNav('trips');
  tripId = getParam('id');
  if (!tripId) { location.href = '/my-trips.html'; return; }
  await render();
});

async function render() {
  const notes = await api.getNotes(tripId);
  document.getElementById('app').innerHTML = `
    <div class="notes-header">
      <h1>📝 Trip Notes</h1>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="showAddNote()">+ New Note</button>
        <a href="/itinerary-builder.html?id=${tripId}" class="btn btn-ghost btn-sm">← Builder</a>
      </div>
    </div>
    ${notes.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📝</div><h3 class="empty-state-title">No notes yet</h3><p class="empty-state-text">Add notes, reminders, or journal entries for your trip.</p></div>' :
      notes.map(n => `
        <div class="card note-card animate-in">
          <div class="note-card-header">
            <span class="note-card-title">${n.title || 'Untitled Note'}</span>
            <span class="note-card-time">${formatDate(n.created_at)}</span>
          </div>
          ${n.city_name ? `<div class="note-city-tag">📍 ${n.city_name}</div>` : ''}
          <div class="note-card-body">${n.content}</div>
          <div class="note-card-footer">
            <button class="btn btn-sm btn-ghost" onclick='editNote(${JSON.stringify(n).replace(/'/g,"&#39;")})'>✏️ Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteNote('${n.id}')">🗑 Delete</button>
          </div>
        </div>
      `).join('')}
  `;
  animateCards('.note-card');
}

function showAddNote() {
  showModal('New Note', `
    <div class="form-group"><label class="form-label">Title</label><input type="text" id="noteTitle" class="form-input" placeholder="Note title"></div>
    <div class="form-group"><label class="form-label">Content *</label><textarea id="noteContent" class="form-textarea" placeholder="Write your note..."></textarea></div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveNote()">Save</button>`);
}

async function saveNote() {
  const title = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').value.trim();
  if (!content) return showToast('Content is required', 'error');
  await api.addNote(tripId, { title, content });
  closeModal(); showToast('Note saved!', 'success'); await render();
}

function editNote(n) {
  showModal('Edit Note', `
    <div class="form-group"><label class="form-label">Title</label><input type="text" id="noteTitle" class="form-input" value="${n.title||''}"></div>
    <div class="form-group"><label class="form-label">Content</label><textarea id="noteContent" class="form-textarea">${n.content||''}</textarea></div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="updateNote('${n.id}')">Update</button>`);
}

async function updateNote(id) {
  await api.updateNote(id, { title: document.getElementById('noteTitle').value.trim(), content: document.getElementById('noteContent').value.trim() });
  closeModal(); showToast('Note updated', 'success'); await render();
}
async function deleteNote(id) { await api.deleteNote(id); showToast('Note deleted', 'success'); await render(); }
