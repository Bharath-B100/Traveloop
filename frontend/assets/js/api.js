const API_BASE = '/api';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('traveloop_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Something went wrong', 'error');
      throw new Error(data.error);
    }
    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') showToast('Network error', 'error');
    throw err;
  }
}

const api = {
  // Auth
  signup: (d) => apiRequest('/auth/signup', { method: 'POST', body: JSON.stringify(d) }),
  login: (d) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(d) }),
  getProfile: () => apiRequest('/auth/profile'),
  updateProfile: (d) => apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(d) }),
  deleteAccount: () => apiRequest('/auth/account', { method: 'DELETE' }),
  // Trips
  getTrips: () => apiRequest('/trips'),
  createTrip: (d) => apiRequest('/trips', { method: 'POST', body: JSON.stringify(d) }),
  getTrip: (id) => apiRequest(`/trips/${id}`),
  updateTrip: (id, d) => apiRequest(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteTrip: (id) => apiRequest(`/trips/${id}`, { method: 'DELETE' }),
  // Stops
  getStops: (tripId) => apiRequest(`/itinerary/trips/${tripId}/stops`),
  addStop: (tripId, d) => apiRequest(`/itinerary/trips/${tripId}/stops`, { method: 'POST', body: JSON.stringify(d) }),
  updateStop: (id, d) => apiRequest(`/itinerary/stops/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteStop: (id) => apiRequest(`/itinerary/stops/${id}`, { method: 'DELETE' }),
  reorderStops: (tripId, order) => apiRequest(`/itinerary/trips/${tripId}/reorder`, { method: 'PUT', body: JSON.stringify({ order }) }),
  // Stop Activities
  addStopActivity: (stopId, d) => apiRequest(`/itinerary/stops/${stopId}/activities`, { method: 'POST', body: JSON.stringify(d) }),
  removeStopActivity: (id) => apiRequest(`/itinerary/stop-activities/${id}`, { method: 'DELETE' }),
  // Cities
  searchCities: (params) => apiRequest(`/cities?${new URLSearchParams(params)}`),
  getCity: (id) => apiRequest(`/cities/${id}`),
  addCity: (d) => apiRequest('/cities', { method: 'POST', body: JSON.stringify(d) }),
  updateCity: (id, d) => apiRequest(`/cities/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteCity: (id) => apiRequest(`/cities/${id}`, { method: 'DELETE' }),
  getPopularCities: () => apiRequest('/cities/popular'),
  getCountries: () => apiRequest('/cities/countries'),
  // Activities
  searchActivities: (params) => apiRequest(`/activities?${new URLSearchParams(params)}`),
  // Budget
  getBudget: (tripId) => apiRequest(`/budget/${tripId}/budget`),
  // Packing
  getPackingList: (tripId) => apiRequest(`/trips/${tripId}/packing`),
  addPackingItem: (tripId, d) => apiRequest(`/trips/${tripId}/packing`, { method: 'POST', body: JSON.stringify(d) }),
  updatePackingItem: (id, d) => apiRequest(`/trips/packing/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deletePackingItem: (id) => apiRequest(`/trips/packing/${id}`, { method: 'DELETE' }),
  resetPacking: (tripId) => apiRequest(`/trips/${tripId}/packing/reset`, { method: 'POST' }),
  // Notes
  getNotes: (tripId) => apiRequest(`/trips/${tripId}/notes`),
  addNote: (tripId, d) => apiRequest(`/trips/${tripId}/notes`, { method: 'POST', body: JSON.stringify(d) }),
  updateNote: (id, d) => apiRequest(`/trips/notes/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteNote: (id) => apiRequest(`/trips/notes/${id}`, { method: 'DELETE' }),
  // Share
  shareTrip: (id) => apiRequest(`/share/${id}/share`, { method: 'POST' }),
  getSharedTrip: (token) => fetch(`${API_BASE}/shared/${token}`).then(r => r.json()),
  copyTrip: (token) => apiRequest(`/shared/${token}/copy`, { method: 'POST' }),
  // Admin
  getAdminStats: () => apiRequest('/admin/stats'),
  getAdminUsers: () => apiRequest('/admin/users'),
  deleteAdminUser: (id) => apiRequest(`/admin/users/${id}`, { method: 'DELETE' }),
  updateUserRole: (id, role) => apiRequest(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  getTopCities: () => apiRequest('/admin/top-cities'),
  getTopActivities: () => apiRequest('/admin/top-activities'),
  getTrends: () => apiRequest('/admin/trends'),
  // Upload
  uploadImage: async (file) => {
    const token = localStorage.getItem('traveloop_token');
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  }
};
