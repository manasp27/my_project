// pages/auth.js
const AuthPage = {
  renderLogin() {
    Router.render(`
      <div class="page-wrap" style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:100px 24px 40px">
        <div style="width:100%;max-width:460px">
          <div style="text-align:center;margin-bottom:40px">
            <div class="logo" style="justify-content:center;font-size:28px;margin-bottom:20px">⚡ FreeLancr</div>
            <div class="section-title" style="font-size:32px;text-align:center">Welcome back</div>
            <p style="color:var(--text2);margin-top:8px">Sign in to your account</p>
          </div>
          <div class="card card-elevated">
            <div id="loginError" class="form-error" style="margin-bottom:16px;display:none"></div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="loginEmail" class="form-input" placeholder="you@example.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" id="loginPass" class="form-input" placeholder="••••••••" />
            </div>
            <button class="btn btn-primary btn-block btn-lg" id="loginBtn" onclick="AuthPage.submitLogin()">
              Sign In
            </button>
            <p style="text-align:center;margin-top:20px;color:var(--text2);font-size:14px">
              Don't have an account? <a href="/register" data-link style="color:var(--accent2);font-weight:600">Sign up</a>
            </p>
          </div>
        </div>
      </div>
    `);

    document.getElementById('loginPass').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.submitLogin();
    });
  },

  async submitLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPass').value;
    const btn = document.getElementById('loginBtn');
    const errEl = document.getElementById('loginError');

    errEl.style.display = 'none';
    if (!email || !password) {
      errEl.textContent = 'Please fill in all fields.';
      errEl.style.display = 'block'; return;
    }

    btn.disabled = true; btn.textContent = 'Signing in...';
    const res = await API.post('/auth/login', { email, password });
    btn.disabled = false; btn.textContent = 'Sign In';

    if (res.success) {
      Auth.login(res.token, res.user);
      Components.toast('Welcome back, ' + res.user.name + '!', 'success');
      Router.navigate('/dashboard');
    } else {
      errEl.textContent = res.message;
      errEl.style.display = 'block';
    }
  },

  renderRegister(defaultRole = '') {
    Router.render(`
      <div class="page-wrap" style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:100px 24px 40px">
        <div style="width:100%;max-width:520px">
          <div style="text-align:center;margin-bottom:40px">
            <div class="logo" style="justify-content:center;font-size:28px;margin-bottom:20px">⚡ FreeLancr</div>
            <div class="section-title" style="font-size:32px;text-align:center">Create your account</div>
            <p style="color:var(--text2);margin-top:8px">Join thousands of freelancers and clients</p>
          </div>
          <div class="card card-elevated">
            <!-- Role selector -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px">
              <div class="role-btn ${defaultRole !== 'client' ? 'active' : ''}" id="roleFreelancer" onclick="AuthPage.selectRole('freelancer')" style="padding:16px;border-radius:12px;border:2px solid var(--border);cursor:pointer;text-align:center;transition:all 0.2s">
                <div style="font-size:28px;margin-bottom:8px">💼</div>
                <div style="font-weight:700;font-size:15px">Freelancer</div>
                <div style="color:var(--text3);font-size:13px;margin-top:4px">I want to find work</div>
              </div>
              <div class="role-btn ${defaultRole === 'client' ? 'active' : ''}" id="roleClient" onclick="AuthPage.selectRole('client')" style="padding:16px;border-radius:12px;border:2px solid var(--border);cursor:pointer;text-align:center;transition:all 0.2s">
                <div style="font-size:28px;margin-bottom:8px">🏢</div>
                <div style="font-weight:700;font-size:15px">Client</div>
                <div style="color:var(--text3);font-size:13px;margin-top:4px">I want to hire talent</div>
              </div>
            </div>
            <input type="hidden" id="regRole" value="${defaultRole === 'client' ? 'client' : 'freelancer'}" />

            <div id="regError" class="form-error" style="margin-bottom:16px;display:none"></div>
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" id="regName" class="form-input" placeholder="John Doe" />
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="regEmail" class="form-input" placeholder="you@example.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" id="regPass" class="form-input" placeholder="Min. 6 characters" />
              <div class="form-hint">Use at least 6 characters with a mix of letters and numbers</div>
            </div>
            <button class="btn btn-primary btn-block btn-lg" id="regBtn" onclick="AuthPage.submitRegister()">
              Create Account
            </button>
            <p style="text-align:center;margin-top:20px;color:var(--text2);font-size:14px">
              Already have an account? <a href="/login" data-link style="color:var(--accent2);font-weight:600">Sign in</a>
            </p>
          </div>
        </div>
      </div>
    `);

    // Style active role
    this.selectRole(defaultRole === 'client' ? 'client' : 'freelancer');
  },

  selectRole(role) {
    const fBtn = document.getElementById('roleFreelancer');
    const cBtn = document.getElementById('roleClient');
    const roleInput = document.getElementById('regRole');
    if (!fBtn || !cBtn) return;

    const active = 'border:2px solid var(--accent)!important;background:var(--accent-glow)';
    const inactive = 'border:2px solid var(--border)';

    if (role === 'freelancer') {
      fBtn.style.cssText = `padding:16px;border-radius:12px;cursor:pointer;text-align:center;transition:all 0.2s;border:2px solid var(--accent);background:var(--accent-glow)`;
      cBtn.style.cssText = `padding:16px;border-radius:12px;cursor:pointer;text-align:center;transition:all 0.2s;border:2px solid var(--border)`;
    } else {
      cBtn.style.cssText = `padding:16px;border-radius:12px;cursor:pointer;text-align:center;transition:all 0.2s;border:2px solid var(--accent);background:var(--accent-glow)`;
      fBtn.style.cssText = `padding:16px;border-radius:12px;cursor:pointer;text-align:center;transition:all 0.2s;border:2px solid var(--border)`;
    }
    if (roleInput) roleInput.value = role;
  },

  async submitRegister() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPass').value;
    const role = document.getElementById('regRole').value;
    const btn = document.getElementById('regBtn');
    const errEl = document.getElementById('regError');

    errEl.style.display = 'none';
    if (!name || !email || !password || !role) {
      errEl.textContent = 'Please fill in all fields.';
      errEl.style.display = 'block'; return;
    }
    if (password.length < 6) {
      errEl.textContent = 'Password must be at least 6 characters.';
      errEl.style.display = 'block'; return;
    }

    btn.disabled = true; btn.textContent = 'Creating account...';
    const res = await API.post('/auth/register', { name, email, password, role });
    btn.disabled = false; btn.textContent = 'Create Account';

    if (res.success) {
      Auth.login(res.token, res.user);
      Components.toast('Account created! Welcome to FreeLancr 🎉', 'success');
      Router.navigate('/dashboard');
    } else {
      errEl.textContent = res.message;
      errEl.style.display = 'block';
    }
  }
};
