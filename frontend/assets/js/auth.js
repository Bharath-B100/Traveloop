document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) { window.location.href = '/dashboard.html'; return; }

  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  document.getElementById('showSignup').addEventListener('click', () => {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    signupForm.style.animation = 'slideUp 0.4s ease';
  });
  document.getElementById('showLogin').addEventListener('click', () => {
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
    loginForm.style.animation = 'slideUp 0.4s ease';
  });

  document.getElementById('forgotPwd').addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) return showToast('Please enter your email first', 'error');
    showToast('Password reset link sent! (demo mode)', 'info');
  });

  // Password strength indicator
  document.getElementById('signupPassword').addEventListener('input', (e) => {
    const val = e.target.value;
    const bars = ['ps1','ps2','ps3'].map(id => document.getElementById(id));
    bars.forEach(b => b.className = 'pwd-bar');
    if (val.length >= 6) {
      bars[0].classList.add('weak');
      if (val.length >= 10 && /[A-Z]/.test(val)) bars[1].classList.add('fair');
      if (val.length >= 12 && /[A-Z]/.test(val) && /[0-9]/.test(val) && /[^a-zA-Z0-9]/.test(val)) bars[2].classList.add('strong');
    }
  });

  document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) return showToast('Please fill in all fields', 'error');
    const btn = document.getElementById('loginBtn');
    setLoading(btn, true);
    try {
      const data = await api.login({ email, password });
      localStorage.setItem('traveloop_token', data.token);
      localStorage.setItem('traveloop_user', JSON.stringify(data.user));
      showToast('Welcome back! 🎉', 'success');
      setTimeout(() => window.location.href = '/dashboard.html', 600);
    } catch (e) {
      setLoading(btn, false);
    }
  });

  document.getElementById('signupBtn').addEventListener('click', async () => {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    if (!name || !email || !password) return showToast('Please fill in all fields', 'error');
    if (password.length < 6) return showToast('Password must be at least 6 characters', 'error');
    const btn = document.getElementById('signupBtn');
    setLoading(btn, true);
    try {
      const data = await api.signup({ name, email, password });
      localStorage.setItem('traveloop_token', data.token);
      localStorage.setItem('traveloop_user', JSON.stringify(data.user));
      showToast('Account created! Let\'s go ✈', 'success');
      setTimeout(() => window.location.href = '/dashboard.html', 600);
    } catch (e) {
      setLoading(btn, false);
    }
  });

  // Enter key support
  document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const visible = loginForm.style.display !== 'none' ? 'loginBtn' : 'signupBtn';
        document.getElementById(visible).click();
      }
    });
  });
});
