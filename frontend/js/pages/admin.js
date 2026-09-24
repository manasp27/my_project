// pages/admin.js
const AdminPage = {
  activeSection: 'stats',

  render() {
    if (!Auth.isAdmin()) { Router.navigate('/'); return; }

    Router.render(`
      <div style="padding-top:var(--nav-h);min-height:100vh">
        <div class="admin-layout">
          <!-- Sidebar -->
          <div class="admin-sidebar">
            <div style="padding:24px 24px 16px;border-bottom:1px solid var(--border);margin-bottom:8px">
              <div style="font-family:var(--font-display);font-size:18px;font-weight:800">⚡ Admin Panel</div>
              <div style="font-size:12px;color:var(--text3);margin-top:4px">FreeLancr Management</div>
            </div>
            ${[
              { id: 'stats',    icon: '📊', label: 'Dashboard' },
              { id: 'users',    icon: '👥', label: 'Users' },
              { id: 'projects', icon: '📋', label: 'Projects' },
              { id: 'disputes', icon: '⚠️', label: 'Disputes' },
            ].map(item => `
              <div class="admin-nav-item ${this.activeSection === item.id ? 'active' : ''}"
                   id="nav-${item.id}" onclick="AdminPage.switchSection('${item.id}')">
                <span class="admin-nav-icon">${item.icon}</span>
                ${item.label}
              </div>
            `).join('')}
          </div>

          <!-- Content -->
          <div class="admin-content" id="adminContent">
            ${Components.loader()}
          </div>
        </div>
      </div>
    `);

    this.loadStats();
  },

  switchSection(section) {
    this.activeSection = section;
    document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
    const navEl = document.getElementById(`nav-${section}`);
    if (navEl) navEl.classList.add('active');

    if (section === 'stats')    this.loadStats();
    if (section === 'users')    this.loadUsers();
    if (section === 'projects') this.loadProjects();
    if (section === 'disputes') this.loadDisputes();
  },

  async loadStats() {
    const el = document.getElementById('adminContent');
    if (el) el.innerHTML = Components.loader();
    const res = await API.get('/admin/stats');
    if (!res.success || !el) return;
    const s = res.stats;

    el.innerHTML = `
      <div style="margin-bottom:32px">
        <div style="font-family:var(--font-display);font-size:24px;font-weight:800;margin-bottom:4px">Platform Overview</div>
        <div style="color:var(--text3);font-size:14px">Real-time statistics</div>
      </div>

      <div class="grid-4" style="margin-bottom:40px">
        <div class="dash-stat"><div class="dash-stat-icon">👥</div><div class="dash-stat-val">${s.users}</div><div class="dash-stat-label">Total Users</div></div>
        <div class="dash-stat"><div class="dash-stat-icon">📋</div><div class="dash-stat-val">${s.projects}</div><div class="dash-stat-label">Total Projects</div></div>
        <div class="dash-stat"><div class="dash-stat-icon">💵</div><div class="dash-stat-val">$${(s.totalRevenue || 0).toLocaleString()}</div><div class="dash-stat-label">Total Volume</div></div>
        <div class="dash-stat"><div class="dash-stat-icon">✅</div><div class="dash-stat-val">${s.completedProjects}</div><div class="dash-stat-label">Completed</div></div>
      </div>

      <div class="grid-3">
        <div class="card">
          <div style="font-size:13px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;font-weight:600">Users Breakdown</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="color:var(--text2)">Freelancers</span>
              <span style="font-weight:700;font-family:var(--font-display)">${s.freelancers}</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${s.users ? (s.freelancers/s.users*100).toFixed(0) : 0}%"></div></div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="color:var(--text2)">Clients</span>
              <span style="font-weight:700;font-family:var(--font-display)">${s.clients}</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${s.users ? (s.clients/s.users*100).toFixed(0) : 0}%;background:var(--green)"></div></div>
          </div>
        </div>
        <div class="card">
          <div style="font-size:13px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;font-weight:600">Project Status</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;justify-content:space-between">
              <span style="color:var(--text2)">Open</span>
              <span class="badge badge-green">${s.openProjects}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="color:var(--text2)">Completed</span>
              <span class="badge badge-accent">${s.completedProjects}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="color:var(--text2)">Total</span>
              <span class="badge badge-gray">${s.projects}</span>
            </div>
          </div>
        </div>
        <div class="card" style="display:flex;flex-direction:column;justify-content:space-between">
          <div style="font-size:13px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;font-weight:600">Quick Actions</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <button class="btn btn-ghost btn-sm" onclick="AdminPage.switchSection('users')">👥 Manage Users</button>
            <button class="btn btn-ghost btn-sm" onclick="AdminPage.switchSection('projects')">📋 Review Projects</button>
            <button class="btn btn-ghost btn-sm" onclick="AdminPage.switchSection('disputes')">⚠️ View Disputes</button>
          </div>
        </div>
      </div>
    `;
  },

  async loadUsers() {
    const el = document.getElementById('adminContent');
    if (el) el.innerHTML = Components.loader();
    const res = await API.get('/admin/users?limit=50');
    if (!el || !document.getElementById('adminContent')) return;

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;flex-wrap:wrap;gap:12px">
        <div style="font-family:var(--font-display);font-size:22px;font-weight:800">User Management</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <input type="text" id="userSearch" class="form-input" style="width:220px" placeholder="Search users..." oninput="AdminPage.filterUsers()" />
          <select id="userRoleFilter" class="form-select" style="width:140px" onchange="AdminPage.filterUsers()">
            <option value="">All Roles</option>
            <option value="freelancer">Freelancers</option>
            <option value="client">Clients</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>
      <div class="card" style="padding:0;overflow:hidden">
        <table class="admin-table" id="usersTable">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Projects</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="usersBody">
            ${this.renderUsersRows(res.users || [])}
          </tbody>
        </table>
      </div>
      <div style="margin-top:12px;color:var(--text3);font-size:13px">${res.total || 0} users total</div>
    `;
    this._allUsers = res.users || [];
  },

  filterUsers() {
    const search = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const role = document.getElementById('userRoleFilter')?.value || '';
    const filtered = (this._allUsers || []).filter(u =>
      (!search || u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)) &&
      (!role || u.role === role)
    );
    const body = document.getElementById('usersBody');
    if (body) body.innerHTML = this.renderUsersRows(filtered);
  },

  renderUsersRows(users) {
    if (!users.length) return `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text3)">No users found</td></tr>`;
    return users.map(u => `
      <tr>
        <td>
          <div style="display:flex;gap:10px;align-items:center">
            ${Components.avatar(u, 'sm')}
            <div>
              <div style="font-weight:600;font-size:14px">${u.name}</div>
              <div style="font-size:12px;color:var(--text3)">${u.email}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-accent" style="text-transform:capitalize">${u.role}</span></td>
        <td style="color:var(--text2);font-size:13px">${Components.formatDate(u.createdAt)}</td>
        <td style="font-weight:600">${u.completedProjects || 0}</td>
        <td>${Components.stars(u.rating || 0)} <span style="font-size:12px;color:var(--text3)">${u.rating || '—'}</span></td>
        <td>
          ${u.isBanned
            ? '<span class="badge badge-red">Banned</span>'
            : '<span class="badge badge-green">Active</span>'}
        </td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/user/${u._id}')">View</button>
            ${u.isBanned
              ? `<button class="btn btn-success btn-sm" onclick="AdminPage.unbanUser('${u._id}')">Unban</button>`
              : `<button class="btn btn-danger btn-sm" onclick="AdminPage.banUser('${u._id}')">Ban</button>`}
            <button class="btn btn-danger btn-sm" onclick="AdminPage.deleteUser('${u._id}')">🗑️</button>
          </div>
        </td>
      </tr>`).join('');
  },

  async loadProjects() {
    const el = document.getElementById('adminContent');
    if (el) el.innerHTML = Components.loader();
    const res = await API.get('/admin/projects?limit=50');
    if (!el || !document.getElementById('adminContent')) return;

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;flex-wrap:wrap;gap:12px">
        <div style="font-family:var(--font-display);font-size:22px;font-weight:800">Project Monitor</div>
        <select id="projStatusFilter" class="form-select" style="width:160px" onchange="AdminPage.filterProjects()">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div class="card" style="padding:0;overflow:hidden">
        <table class="admin-table" id="projectsTable">
          <thead>
            <tr>
              <th>Project</th>
              <th>Client</th>
              <th>Budget</th>
              <th>Status</th>
              <th>Proposals</th>
              <th>Posted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="projectsBody">
            ${this.renderProjectRows(res.projects || [])}
          </tbody>
        </table>
      </div>
      <div style="margin-top:12px;color:var(--text3);font-size:13px">${res.total || 0} projects total</div>
    `;
    this._allProjects = res.projects || [];
  },

  filterProjects() {
    const status = document.getElementById('projStatusFilter')?.value || '';
    const filtered = (this._allProjects || []).filter(p => !status || p.status === status);
    const body = document.getElementById('projectsBody');
    if (body) body.innerHTML = this.renderProjectRows(filtered);
  },

  renderProjectRows(projects) {
    if (!projects.length) return `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text3)">No projects found</td></tr>`;
    return projects.map(p => `
      <tr>
        <td>
          <div style="max-width:220px">
            <div style="font-weight:600;font-size:14px;cursor:pointer" onclick="Router.navigate('/project/${p._id}')">${p.title}</div>
            <div style="font-size:12px;color:var(--text3)">${p.category}</div>
            ${p.isFlagged ? '<span class="badge badge-red" style="font-size:10px;margin-top:4px">⚑ Flagged</span>' : ''}
          </div>
        </td>
        <td style="font-size:13px">${p.client?.name || '—'}</td>
        <td style="color:var(--green);font-weight:600">${Components.formatMoney(p.budgetMin)}–${Components.formatMoney(p.budgetMax)}</td>
        <td>${Components.statusBadge(p.status)}</td>
        <td style="font-weight:600">${p.proposalCount || 0}</td>
        <td style="color:var(--text2);font-size:13px">${Components.formatDate(p.createdAt)}</td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/project/${p._id}')">View</button>
            ${!p.isFlagged ? `<button class="btn btn-danger btn-sm" onclick="AdminPage.flagProject('${p._id}')">⚑ Flag</button>` : ''}
            <button class="btn btn-danger btn-sm" onclick="AdminPage.deleteProject('${p._id}')">🗑️</button>
          </div>
        </td>
      </tr>`).join('');
  },

  loadDisputes() {
    const el = document.getElementById('adminContent');
    if (!el) return;
    el.innerHTML = `
      <div style="margin-bottom:32px">
        <div style="font-family:var(--font-display);font-size:22px;font-weight:800;margin-bottom:4px">Dispute Management</div>
        <div style="color:var(--text3);font-size:14px">Handle reported issues and flagged content</div>
      </div>
      <div class="grid-2" style="margin-bottom:32px">
        <div class="card">
          <div style="font-size:28px;margin-bottom:12px">⚑</div>
          <div style="font-family:var(--font-display);font-size:18px;font-weight:700;margin-bottom:8px">Flagged Projects</div>
          <p style="color:var(--text2);font-size:14px;margin-bottom:16px">Review projects that have been flagged for inappropriate content or policy violations.</p>
          <button class="btn btn-ghost" onclick="AdminPage.loadFlaggedProjects()">Review Flagged →</button>
        </div>
        <div class="card">
          <div style="font-size:28px;margin-bottom:12px">🚫</div>
          <div style="font-family:var(--font-display);font-size:18px;font-weight:700;margin-bottom:8px">Banned Users</div>
          <p style="color:var(--text2);font-size:14px;margin-bottom:16px">Review currently banned users and manage their account status.</p>
          <button class="btn btn-ghost" onclick="AdminPage.loadBannedUsers()">Review Bans →</button>
        </div>
      </div>
      <div class="card">
        <div style="font-family:var(--font-display);font-size:16px;font-weight:700;margin-bottom:16px">Admin Guidelines</div>
        <div style="display:flex;flex-direction:column;gap:12px;color:var(--text2);font-size:14px">
          <div style="display:flex;gap:12px"><span>📌</span><span>Ban users only for repeated violations of platform terms. Always warn first.</span></div>
          <div style="display:flex;gap:12px"><span>📌</span><span>Flag projects with misleading descriptions, inappropriate content, or policy violations.</span></div>
          <div style="display:flex;gap:12px"><span>📌</span><span>Payment disputes should be resolved by reviewing transaction history and project status.</span></div>
          <div style="display:flex;gap:12px"><span>📌</span><span>Deleted data is permanently removed. Prefer banning/flagging over deletion where possible.</span></div>
        </div>
      </div>
      <div id="disputeExtraContent"></div>
    `;
  },

  async loadFlaggedProjects() {
    const res = await API.get('/admin/projects?limit=50');
    const flagged = (res.projects || []).filter(p => p.isFlagged);
    const el = document.getElementById('disputeExtraContent');
    if (!el) return;
    if (!flagged.length) {
      el.innerHTML = `<div class="card" style="margin-top:24px">${Components.empty('✅', 'No flagged projects', 'All content looks clean!')}</div>`;
      return;
    }
    el.innerHTML = `
      <div class="card" style="margin-top:24px">
        <div style="font-family:var(--font-display);font-size:16px;font-weight:700;margin-bottom:16px">Flagged Projects (${flagged.length})</div>
        ${flagged.map(p => `
          <div style="display:flex;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">
            <div style="flex:1"><div style="font-weight:600">${p.title}</div><div style="font-size:12px;color:var(--text3)">${p.client?.name}</div></div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/project/${p._id}')">View</button>
              <button class="btn btn-danger btn-sm" onclick="AdminPage.deleteProject('${p._id}')">Remove</button>
            </div>
          </div>`).join('')}
      </div>`;
  },

  async loadBannedUsers() {
    const res = await API.get('/admin/users?limit=100');
    const banned = (res.users || []).filter(u => u.isBanned);
    const el = document.getElementById('disputeExtraContent');
    if (!el) return;
    if (!banned.length) {
      el.innerHTML = `<div class="card" style="margin-top:24px">${Components.empty('✅', 'No banned users', 'All users are in good standing.')}</div>`;
      return;
    }
    el.innerHTML = `
      <div class="card" style="margin-top:24px">
        <div style="font-family:var(--font-display);font-size:16px;font-weight:700;margin-bottom:16px">Banned Users (${banned.length})</div>
        ${banned.map(u => `
          <div style="display:flex;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">
            <div style="flex:1"><div style="font-weight:600">${u.name}</div><div style="font-size:12px;color:var(--text3)">${u.email}</div></div>
            <button class="btn btn-success btn-sm" onclick="AdminPage.unbanUser('${u._id}')">Unban</button>
          </div>`).join('')}
      </div>`;
  },

  async banUser(userId) {
    if (!confirm('Ban this user? They will not be able to log in.')) return;
    const res = await API.put(`/admin/users/${userId}/ban`);
    if (res.success) { Components.toast('User banned.', 'info'); this.loadUsers(); }
    else Components.toast(res.message, 'error');
  },

  async unbanUser(userId) {
    const res = await API.put(`/admin/users/${userId}/unban`);
    if (res.success) { Components.toast('User unbanned.', 'success'); this.loadUsers(); }
    else Components.toast(res.message, 'error');
  },

  async deleteUser(userId) {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return;
    const res = await API.delete(`/admin/users/${userId}`);
    if (res.success) { Components.toast('User deleted.', 'info'); this.loadUsers(); }
    else Components.toast(res.message, 'error');
  },

  async flagProject(projectId) {
    const res = await API.put(`/admin/projects/${projectId}/flag`);
    if (res.success) { Components.toast('Project flagged.', 'info'); this.loadProjects(); }
    else Components.toast(res.message, 'error');
  },

  async deleteProject(projectId) {
    if (!confirm('Permanently delete this project?')) return;
    const res = await API.delete(`/admin/projects/${projectId}`);
    if (res.success) { Components.toast('Project removed.', 'info'); this.loadProjects(); }
    else Components.toast(res.message, 'error');
  }
};
