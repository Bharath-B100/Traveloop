document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  renderNav('profile');
  try {
    const [user, trips] = await Promise.all([api.getProfile(), api.getTrips()]);
    const totalCities = trips.reduce((s, t) => s + (t.stop_count || 0), 0);
    const upcoming = trips.filter(t => t.start_date && new Date(t.start_date) > new Date()).length;

    document.getElementById('app').innerHTML = `
      <div class="profile-header animate-in">
        <div class="profile-avatar" id="profileAvatarEl" style="${user.photo_url ? `background-image:url(${user.photo_url});background-size:cover;` : ''}">${user.photo_url ? '' : (user.name||'U')[0].toUpperCase()}</div>
        <div class="profile-header-info">
          <h1>${user.name}</h1>
          <p>${user.email}</p>
          <p class="member-since">Member since ${formatDate(user.created_at)}</p>
          <div class="profile-role-badge">${user.role === 'admin' ? '<span class="badge badge-coral">Admin</span>' : '<span class="badge badge-sky">User</span>'}</div>
        </div>
      </div>

      <div class="profile-stats">
        <div class="profile-stat">
          <div class="profile-stat-value">${trips.length}</div>
          <div class="profile-stat-label">Trips</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value">${totalCities}</div>
          <div class="profile-stat-label">Cities</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value">${upcoming}</div>
          <div class="profile-stat-label">Upcoming</div>
        </div>
      </div>

      <div class="profile-section animate-in" style="animation-delay:0.1s">
        <h3>Personal Info</h3>
        <div class="form-group"><label class="form-label">Full Name</label><input type="text" id="profName" class="form-input" value="${user.name}"></div>
        <div class="form-group">
          <label class="form-label">Profile Photo URL</label>
          <input type="url" id="profPhoto" class="form-input" value="${user.photo_url||''}" placeholder="https://... (or upload below)">
        </div>
        <div class="form-group">
          <label class="form-label">Or Upload Photo</label>
          <input type="file" id="profUpload" accept="image/*" class="form-input" style="padding:8px">
          <div id="profUploadStatus" style="font-size:0.82rem;color:var(--text-muted);margin-top:4px"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Language</label>
          <select id="profLang" class="form-select">
            <option value="en" ${user.language==='en'||!user.language?'selected':''}>🇺🇸 English</option>
            <option value="es" ${user.language==='es'?'selected':''}>🇪🇸 Spanish</option>
            <option value="fr" ${user.language==='fr'?'selected':''}>🇫🇷 French</option>
            <option value="de" ${user.language==='de'?'selected':''}>🇩🇪 German</option>
            <option value="ja" ${user.language==='ja'?'selected':''}>🇯🇵 Japanese</option>
            <option value="hi" ${user.language==='hi'?'selected':''}>🇮🇳 Hindi</option>
          </select>
        </div>
        <button class="btn btn-primary" id="saveProfileBtn" onclick="saveProfile()">💾 Save Changes</button>
      </div>

      ${trips.length > 0 ? `
      <div class="profile-section animate-in" style="animation-delay:0.15s">
        <h3>Recent Trips</h3>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${trips.slice(0,4).map(t => `
            <a href="/itinerary-builder.html?id=${t.id}" style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-tertiary);border:1px solid var(--glass-border);border-radius:var(--radius-sm);text-decoration:none;color:inherit;transition:var(--transition)" onmouseover="this.style.borderColor='var(--glass-border-hover)'" onmouseout="this.style.borderColor='var(--glass-border)'">
              <div style="width:40px;height:40px;border-radius:var(--radius-sm);background:var(--gradient-hero);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">✈️</div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:0.9rem">${t.name}</div>
                <div style="font-size:0.78rem;color:var(--text-muted)">${formatDateShort(t.start_date)} — ${formatDateShort(t.end_date)} • ${t.stop_count||0} cities</div>
              </div>
            </a>
          `).join('')}
        </div>
      </div>` : ''}

      <div class="profile-section danger-zone animate-in" style="animation-delay:0.2s">
        <h3>⚠️ Danger Zone</h3>
        <p style="color:var(--text-secondary);font-size:0.88rem;margin-bottom:16px">Permanently delete your account and all your trips and data.</p>
        <button class="btn btn-danger" onclick="deleteAccount()">🗑 Delete Account</button>
      </div>
    `;
  } catch(e) { console.error(e); }
});

async function saveProfile() {
  const btn = document.getElementById('saveProfileBtn');
  const uploadStatus = document.getElementById('profUploadStatus');
  const fileInput = document.getElementById('profUpload');
  let photoUrl = document.getElementById('profPhoto').value.trim();
  setLoading(btn, true);
  try {
    if (fileInput.files.length > 0) {
      uploadStatus.textContent = 'Uploading…';
      const res = await api.uploadImage(fileInput.files[0]);
      photoUrl = res.url;
      uploadStatus.textContent = 'Upload complete!';
    }
    const data = {
      name: document.getElementById('profName').value.trim(),
      photo_url: photoUrl,
      language: document.getElementById('profLang').value
    };
    const user = await api.updateProfile(data);
    localStorage.setItem('traveloop_user', JSON.stringify(user));
    showToast('Profile updated! 🎉', 'success');
    const avatar = document.getElementById('profileAvatarEl');
    if (user.photo_url) {
      avatar.style.backgroundImage = `url(${user.photo_url})`;
      avatar.style.backgroundSize = 'cover';
      avatar.textContent = '';
    } else {
      avatar.textContent = (user.name||'U')[0].toUpperCase();
    }
  } catch(e) {
    showToast('Error saving profile', 'error');
  } finally {
    setLoading(btn, false);
  }
}

function deleteAccount() {
  showModal('Delete Account',
    '<div class="alert alert-warning" style="margin-bottom:16px">⚠️ This will permanently delete your account, all trips, packing lists, and notes. This cannot be undone.</div>',
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-danger" onclick="confirmDeleteAccount()">Delete Forever</button>`);
}

async function confirmDeleteAccount() {
  try {
    await api.deleteAccount();
    localStorage.clear();
    showToast('Account deleted', 'info');
    setTimeout(() => location.href = '/index.html', 800);
  } catch(e) { showToast('Error deleting account', 'error'); }
}
