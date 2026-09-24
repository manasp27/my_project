// pages/profile.js
const ProfilePage = {
  skillsList: [],

  async render(userId) {
    Router.render(`<div class="page-wrap container">${Components.loader()}</div>`);
    const isOwn = !userId || (Auth.user && userId === Auth.user._id);
    const id = userId || Auth.user?._id;
    if (!id) { Router.navigate('/login'); return; }

    const res = await API.get(`/users/${id}`);
    if (!res.success) {
      Router.render(`<div class="page-wrap container">${Components.empty('👤', 'User not found', '')}</div>`);
      return;
    }
    const u = res.user;
    const reviews = res.reviews || [];

    Router.render(`
      <div class="page-wrap container">
        ${isOwn ? `<div style="margin-bottom:16px"><a href="/profile/edit" data-link class="btn btn-ghost btn-sm">✏️ Edit Profile</a></div>` : `<div class="back-btn" onclick="history.back()">← Back</div>`}

        <!-- Profile hero -->
        <div class="profile-hero">
          <div class="profile-top">
            ${Components.avatar(u, 'xl')}
            <div class="profile-meta">
              <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
                <div class="profile-name">${u.name}</div>
                <span class="badge badge-accent" style="text-transform:capitalize">${u.role}</span>
              </div>
              ${u.category ? `<div class="profile-headline">${u.category}</div>` : ''}
              ${u.location ? `<div class="profile-location">📍 ${u.location}</div>` : ''}
              <div style="display:flex;align-items:center;gap:12px;margin-top:12px;flex-wrap:wrap">
                ${Components.stars(u.rating || 0)}
                <span style="font-size:14px;color:var(--text2)">${u.rating || 0} (${u.reviewCount || 0} reviews)</span>
                ${u.role === 'freelancer' && u.hourlyRate ? `<span class="profile-rate">${Components.formatMoney(u.hourlyRate)}/hr</span>` : ''}
              </div>
              <div class="profile-actions">
                ${!isOwn && Auth.isLoggedIn() ? `<button class="btn btn-primary" onclick="Router.navigate('/messages?to=${u._id}')">💬 Message</button>` : ''}
                ${isOwn ? `<a href="/payments" data-link class="btn btn-ghost">💰 Wallet</a>` : ''}
              </div>
            </div>
          </div>

          <div class="profile-stats">
            <div class="dash-stat"><div class="dash-stat-val">${u.completedProjects || 0}</div><div class="dash-stat-label">Projects Done</div></div>
            <div class="dash-stat"><div class="dash-stat-val">${u.rating || '—'}</div><div class="dash-stat-label">Rating</div></div>
            <div class="dash-stat"><div class="dash-stat-val">${u.reviewCount || 0}</div><div class="dash-stat-label">Reviews</div></div>
            ${u.role === 'freelancer' ? `<div class="dash-stat"><div class="dash-stat-val">${u.hourlyRate ? `$${u.hourlyRate}` : '—'}</div><div class="dash-stat-label">Hourly Rate</div></div>` : ''}
          </div>
        </div>

        <div class="grid-2" style="gap:32px;align-items:start">
          <!-- Left column -->
          <div>
            ${u.bio ? `
            <div class="card" style="margin-bottom:24px">
              <div style="font-family:var(--font-display);font-size:16px;font-weight:700;margin-bottom:14px">About</div>
              <p style="color:var(--text2);line-height:1.8;white-space:pre-wrap">${u.bio}</p>
            </div>` : ''}

            ${u.skills?.length ? `
            <div class="card" style="margin-bottom:24px">
              <div style="font-family:var(--font-display);font-size:16px;font-weight:700;margin-bottom:14px">Skills</div>
              <div class="tags-wrap">${u.skills.map(s => `<span class="tag tag-accent">${s}</span>`).join('')}</div>
            </div>` : ''}

            ${u.experience ? `
            <div class="card" style="margin-bottom:24px">
              <div style="font-family:var(--font-display);font-size:16px;font-weight:700;margin-bottom:14px">Experience</div>
              <p style="color:var(--text2);line-height:1.8;white-space:pre-wrap">${u.experience}</p>
            </div>` : ''}

            ${u.portfolio?.length ? `
            <div class="card">
              <div style="font-family:var(--font-display);font-size:16px;font-weight:700;margin-bottom:16px">Portfolio</div>
              ${u.portfolio.map(item => `
              <div style="padding:16px;background:var(--bg3);border-radius:12px;margin-bottom:12px">
                <div style="font-weight:700;margin-bottom:6px">${item.title}</div>
                <p style="color:var(--text2);font-size:14px;margin-bottom:8px">${item.description || ''}</p>
                ${item.link ? `<a href="${item.link}" target="_blank" style="color:var(--accent2);font-size:13px">🔗 View Project</a>` : ''}
              </div>`).join('')}
            </div>` : ''}
          </div>

          <!-- Right column -->
          <div>
            ${u.company || u.website ? `
            <div class="card" style="margin-bottom:24px">
              <div style="font-family:var(--font-display);font-size:16px;font-weight:700;margin-bottom:14px">Company</div>
              ${u.company ? `<div style="font-weight:600;margin-bottom:6px">🏢 ${u.company}</div>` : ''}
              ${u.website ? `<a href="${u.website}" target="_blank" style="color:var(--accent2);font-size:14px">🌐 ${u.website}</a>` : ''}
            </div>` : ''}

            <div class="card">
              <div style="font-family:var(--font-display);font-size:16px;font-weight:700;margin-bottom:16px">Reviews (${reviews.length})</div>
              ${reviews.length === 0
                ? `<div style="color:var(--text3);font-size:14px">No reviews yet.</div>`
                : reviews.map(r => `
                <div class="review-card">
                  <div class="review-header">
                    ${Components.avatar(r.reviewer, 'sm')}
                    <div>
                      <div class="review-name">${r.reviewer.name}</div>
                      <div style="display:flex;gap:8px;align-items:center">
                        ${Components.stars(r.rating)}
                        <span class="review-date">${Components.timeAgo(r.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <p class="review-text">${r.comment}</p>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `);
  },

  async renderEdit() {
    if (!Auth.isLoggedIn()) { Router.navigate('/login'); return; }
    const res = await API.get(`/users/${Auth.user._id}`);
    if (!res.success) return;
    const u = res.user;
    this.skillsList = u.skills || [];

    Router.render(`
      <div class="page-wrap container" style="max-width:760px">
        <div class="back-btn" onclick="history.back()">← Back</div>
        <div class="section-title" style="font-size:32px;margin-bottom:8px">Edit Profile</div>
        <p style="color:var(--text2);margin-bottom:32px">Keep your profile up to date to attract more opportunities</p>

        <div id="profileSaveMsg" class="form-error" style="display:none;margin-bottom:20px"></div>

        <!-- Avatar -->
        <div class="settings-section">
          <div class="settings-section-title">📸 Profile Photo</div>
          <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
            <div id="avatarPreview">${Components.avatar(u, 'lg')}</div>
            <div>
              <input type="file" id="avatarFile" accept="image/*" style="display:none" onchange="ProfilePage.uploadAvatar(this)" />
              <button class="btn btn-ghost" onclick="document.getElementById('avatarFile').click()">Upload Photo</button>
              <div class="form-hint" style="margin-top:8px">Max size: 2MB. JPG, PNG.</div>
            </div>
          </div>
        </div>

        <!-- Basic info -->
        <div class="settings-section">
          <div class="settings-section-title">👤 Basic Information</div>
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="eName" class="form-input" value="${u.name || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Bio</label>
            <textarea id="eBio" class="form-textarea">${u.bio || ''}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Location</label>
              <input type="text" id="eLoc" class="form-input" value="${u.location || ''}" placeholder="City, Country" />
            </div>
            ${u.role === 'freelancer' ? `
            <div class="form-group">
              <label class="form-label">Hourly Rate ($)</label>
              <input type="number" id="eRate" class="form-input" value="${u.hourlyRate || ''}" placeholder="50" />
            </div>` : ''}
          </div>
        </div>

        ${u.role === 'freelancer' ? `
        <div class="settings-section">
          <div class="settings-section-title">💼 Professional Details</div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select id="eCat" class="form-select">
              <option value="">Select category...</option>
              ${['Web Development','Mobile Development','Design','Writing','Marketing','Data Science','Video & Animation','Photography','Other']
                .map(c => `<option value="${c}" ${u.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Experience</label>
            <textarea id="eExp" class="form-textarea">${u.experience || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Skills</label>
            <div class="skills-input-wrap">
              <input type="text" id="eSkillInput" class="form-input" placeholder="Add skill and press Enter" />
              <button class="btn btn-ghost" onclick="ProfilePage.addSkill()">Add</button>
            </div>
            <div class="tags-wrap" id="eSkillTags" style="margin-top:12px">
              ${this.skillsList.map(s => `<span class="skill-tag">${s}<span class="skill-tag-remove" onclick="ProfilePage.removeSkill('${s}')">×</span></span>`).join('')}
            </div>
          </div>
        </div>` : ''}

        ${u.role === 'client' ? `
        <div class="settings-section">
          <div class="settings-section-title">🏢 Company Details</div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Company Name</label>
              <input type="text" id="eCompany" class="form-input" value="${u.company || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Website</label>
              <input type="url" id="eWebsite" class="form-input" value="${u.website || ''}" placeholder="https://" />
            </div>
          </div>
        </div>` : ''}

        <button class="btn btn-primary btn-lg" id="saveProfileBtn" onclick="ProfilePage.saveProfile()">💾 Save Profile</button>
      </div>
    `);

    document.getElementById('eSkillInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.addSkill(); }
    });
  },

  addSkill() {
    const input = document.getElementById('eSkillInput');
    const skill = input.value.trim();
    if (!skill || this.skillsList.includes(skill)) { input.value = ''; return; }
    this.skillsList.push(skill);
    input.value = '';
    this.renderSkillTags();
  },

  removeSkill(skill) {
    this.skillsList = this.skillsList.filter(s => s !== skill);
    this.renderSkillTags();
  },

  renderSkillTags() {
    const el = document.getElementById('eSkillTags');
    if (el) el.innerHTML = this.skillsList.map(s =>
      `<span class="skill-tag">${s}<span class="skill-tag-remove" onclick="ProfilePage.removeSkill('${s}')">×</span></span>`
    ).join('');
  },

  async saveProfile() {
    const btn = document.getElementById('saveProfileBtn');
    const msgEl = document.getElementById('profileSaveMsg');
    msgEl.style.display = 'none';
    btn.disabled = true; btn.textContent = 'Saving...';

    const data = {
      name: document.getElementById('eName')?.value.trim(),
      bio: document.getElementById('eBio')?.value.trim(),
      location: document.getElementById('eLoc')?.value.trim(),
    };
    if (Auth.isFreelancer()) {
      data.hourlyRate = Number(document.getElementById('eRate')?.value) || 0;
      data.category = document.getElementById('eCat')?.value;
      data.experience = document.getElementById('eExp')?.value.trim();
      data.skills = this.skillsList;
    }
    if (Auth.isClient()) {
      data.company = document.getElementById('eCompany')?.value.trim();
      data.website = document.getElementById('eWebsite')?.value.trim();
    }

    const res = await API.put('/users/profile', data);
    btn.disabled = false; btn.textContent = '💾 Save Profile';

    if (res.success) {
      Auth.user = { ...Auth.user, ...data };
      localStorage.setItem('user', JSON.stringify(Auth.user));
      Components.toast('Profile updated! ✨', 'success');
      Router.navigate('/profile');
    } else {
      msgEl.textContent = res.message;
      msgEl.style.display = 'block';
    }
  },

  async uploadAvatar(input) {
    const file = input.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await API.uploadFile('/users/avatar', formData);
    if (res.success) {
      Auth.user.avatar = res.avatar;
      localStorage.setItem('user', JSON.stringify(Auth.user));
      Auth.updateNav();
      const preview = document.getElementById('avatarPreview');
      if (preview) preview.innerHTML = `<img src="${res.avatar}" class="avatar avatar-lg" style="width:80px;height:80px">`;
      Components.toast('Avatar updated!', 'success');
    } else {
      Components.toast(res.message || 'Upload failed', 'error');
    }
  }
};
