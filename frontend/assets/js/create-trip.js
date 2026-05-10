document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  renderNav('trips');

  document.getElementById('createBtn').addEventListener('click', async () => {
    const name = document.getElementById('tripName').value.trim();
    if (!name) return showToast('Trip name is required', 'error');
    
    const createBtn = document.getElementById('createBtn');
    const uploadStatus = document.getElementById('uploadStatus');
    let coverPhotoUrl = document.getElementById('coverUrl').value.trim();
    const fileInput = document.getElementById('coverUpload');
    
    try {
      createBtn.disabled = true;
      if (fileInput.files.length > 0) {
        uploadStatus.textContent = 'Uploading image...';
        const uploadRes = await api.uploadImage(fileInput.files[0]);
        coverPhotoUrl = uploadRes.url;
        uploadStatus.textContent = 'Upload complete!';
      }

      const trip = await api.createTrip({
        name,
        description: document.getElementById('tripDesc').value.trim(),
        start_date: document.getElementById('startDate').value || null,
        end_date: document.getElementById('endDate').value || null,
        cover_photo: coverPhotoUrl
      });
      showToast('Trip created!', 'success');
      setTimeout(() => window.location.href = `/itinerary-builder.html?id=${trip.id}`, 500);
    } catch (e) {
      uploadStatus.textContent = '';
      showToast('Error creating trip', 'error');
    } finally {
      createBtn.disabled = false;
    }
  });
});
