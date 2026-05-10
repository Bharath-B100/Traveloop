document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  renderNav('profile');
  try {
    const user = await api.getProfile();
    document.getElementById('app').innerHTML = `
      <div class="profile-header animate-in">
        <div class="profile-avatar">${(user.name||'U')[0].toUpperCase()}</div>
        <h1>${user.name}</h1>
        <p>${user.email}</p>
        <p style="color:var(--text-muted);font-size:0.8rem;margin-top:4px">Member since ${formatDate(user.created_at)}</p>
      </div>
      <div class="profile-section animate-in" style="animation-delay:0.1s">
        <h3>Personal Info</h3>
        <div class="form-group"><label class="form-label">Name</label><input type="text" id="profName" class="form-input" value="${user.name}"></div>
        <div class="form-group">
          <label class="form-label">Profile Photo</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input type="url" id="profPhoto" class="form-input" value="${user.photo_url||''}" placeholder="https://... (or upload below)" style="flex:1">
          </div>
          <input type="file" id="profUpload" accept="image/*" class="form-input" style="margin-top:8px;padding:8px">
          <div id="profUploadStatus" style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;"></div>
        </div>
        <div class="form-group"><label class="form-label">Language</label>
          <select id="profLang" class="form-select">
            <option value="en" ${user.language==='en'?'selected':''}>English</option>
            <option value="es" ${user.language==='es'?'selected':''}>Spanish</option>
            <option value="fr" ${user.language==='fr'?'selected':''}>French</option>
            <option value="de" ${user.language==='de'?'selected':''}>German</option>
            <option value="ja" ${user.language==='ja'?'selected':''}>Japanese</option>
          </select>
        </div>
        <button class="btn btn-primary" onclick="saveProfile()">Save Changes</button>
      </div>
      <div class="profile-section animate-in" style="animation-delay:0.15s">
        <h3>Saved Destinations</h3>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:12px">Cities you have saved for future inspiration.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="badge badge-teal" style="padding:8px 16px;font-size:0.9rem">🗼 Tokyo, Japan</span>
          <span class="badge badge-teal" style="padding:8px 16px;font-size:0.9rem">🥐 Paris, France</span>
          <span class="badge badge-teal" style="padding:8px 16px;font-size:0.9rem">🏝 Bali, Indonesia</span>
        </div>
      </div>
      <div class="profile-section danger-zone animate-in" style="animation-delay:0.2s">
        <h3>⚠️ Danger Zone</h3>
        <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:16px">Permanently delete your account and all data.</p>
        <button class="btn btn-danger" onclick="deleteAccount()">Delete Account</button>
      </div>
    `;
  } catch(e) { console.error(e); }
});

async function saveProfile() {
  const saveBtn = document.querySelector('button[onclick="saveProfile()"]');
  const uploadStatus = document.getElementById('profUploadStatus');
  const fileInput = document.getElementById('profUpload');
  let photoUrl = document.getElementById('profPhoto').value.trim();

  try {
    saveBtn.disabled = true;
    if (fileInput.files.length > 0) {
      uploadStatus.textContent = 'Uploading image...';
      const uploadRes = await api.uploadImage(fileInput.files[0]);
      photoUrl = uploadRes.url;
      uploadStatus.textContent = 'Upload complete!';
    }

    const data = { 
      name: document.getElementById('profName').value.trim(), 
      photo_url: photoUrl, 
      language: document.getElementById('profLang').value 
    };
    const user = await api.updateProfile(data);
    localStorage.setItem('traveloop_user', JSON.stringify(user));
    showToast('Profile updated!', 'success');
    
    // Refresh avatar display
    document.querySelector('.profile-avatar').textContent = (user.name||'U')[0].toUpperCase();
    if (user.photo_url) {
      document.querySelector('.profile-avatar').style.backgroundImage = `url(${user.photo_url})`;
      document.querySelector('.profile-avatar').style.backgroundSize = 'cover';
      document.querySelector('.profile-avatar').style.color = 'transparent';
    }
  } catch(e) {
    uploadStatus.textContent = '';
    showToast('Error saving profile', 'error');
  } finally {
    saveBtn.disabled = false;
  }
}

function deleteAccount() {
  showModal('Delete Account', '<p style="color:var(--coral)">This will permanently delete your account and all your trips. This cannot be undone.</p>',
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-danger" onclick="confirmDeleteAccount()">Delete Forever</button>`);
}
async function confirmDeleteAccount() {
  try { await api.deleteAccount(); localStorage.clear(); location.href = '/index.html'; } catch(e){}
}
