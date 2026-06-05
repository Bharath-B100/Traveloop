// ===== AUTH HELPERS =====
function getUser() {
  const u = localStorage.getItem('traveloop_user');
  return u ? JSON.parse(u) : null;
}
function getToken() { return localStorage.getItem('traveloop_token'); }
function isLoggedIn() { return !!getToken(); }
function requireAuth() {
  if (!isLoggedIn()) { window.location.href = '/index.html'; return false; }
  return true;
}
function logout() {
  localStorage.removeItem('traveloop_token');
  localStorage.removeItem('traveloop_user');
  window.location.href = '/index.html';
}

// ===== TOAST =====
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(110px)';
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}

// ===== DATE FORMATTING =====
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function formatCurrency(amount) {
  return '₹' + (amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function daysBetween(d1, d2) {
  return Math.max(1, Math.ceil((new Date(d2) - new Date(d1)) / 86400000));
}

// ===== NAV RENDERER =====
function renderNav(activePage) {
  const user = getUser();
  const isAdmin = user && user.role === 'admin';
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.id = 'mainNav';
  nav.innerHTML = `
    <a href="/dashboard.html" class="nav-brand">✈ Traveloop</a>
    <div class="nav-links" id="navLinks">
      <a href="/dashboard.html" class="${activePage==='dashboard'?'active':''}">Dashboard</a>
      <a href="/my-trips.html" class="${activePage==='trips'?'active':''}">My Trips</a>
      <a href="/city-search.html" class="${activePage==='cities'?'active':''}">Explore</a>
      ${isAdmin ? `<a href="/admin.html" class="${activePage==='admin'?'active':''}">⚡ Admin</a>` : ''}
      <a href="/profile.html" class="${activePage==='profile'?'active':''}">
        <span class="nav-user">
          <span class="nav-avatar" style="${user?.photo_url ? `background-image:url(${user.photo_url});background-size:cover;` : ''}">${user?.photo_url ? '' : (user?.name||'U')[0].toUpperCase()}</span>
          ${user?.name||'User'}
        </span>
      </a>
      <button onclick="logout()" class="btn btn-ghost btn-sm btn-logout">Logout</button>
    </div>
    <button class="nav-hamburger" id="navHamburger" aria-label="Toggle menu">☰</button>
  `;
  document.body.prepend(nav);

  // Scrolled effect
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Hamburger
  document.getElementById('navHamburger').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
  });
}

// ===== MODAL HELPER =====
function showModal(title, contentHTML, actions) {
  let overlay = document.getElementById('modalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modalOverlay';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" onclick="closeModal()" aria-label="Close">✕</button>
      </div>
      <div class="modal-body">${contentHTML}</div>
      ${actions ? `<div class="modal-actions">${actions}</div>` : ''}
    </div>
  `;
  requestAnimationFrame(() => overlay.classList.add('active'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  // Focus first input
  setTimeout(() => {
    const first = overlay.querySelector('input, textarea, select');
    if (first) first.focus();
  }, 100);
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 250);
  }
}

// ===== STAGGER ANIMATION =====
function animateCards(selector) {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, i * 70);
  });
}

// ===== ACTIVITY TYPE COLORS =====
const typeColors = {
  sightseeing: 'accent', food: 'gold', adventure: 'coral',
  culture: 'teal', nightlife: 'accent', shopping: 'sky',
  nature: 'teal', wellness: 'gold'
};
function getTypeBadge(type) {
  return `<span class="badge badge-${typeColors[type]||'accent'}">${type}</span>`;
}

// ===== URL PARAMS =====
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

// ===== BUTTON LOADING =====
function setLoading(btn, loading) {
  if (loading) {
    btn.classList.add('btn-loading');
    btn.disabled = true;
    btn._origText = btn.innerHTML;
    btn.innerHTML = 'Loading...';
  } else {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
    if (btn._origText) btn.innerHTML = btn._origText;
  }
}

// ===== COPY TO CLIPBOARD =====
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  } catch {
    showToast('Could not copy to clipboard', 'error');
  }
}
