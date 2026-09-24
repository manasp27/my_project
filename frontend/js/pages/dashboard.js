// pages/dashboard.js
const DashboardPage = {
  async render() {
    if (!Auth.isLoggedIn()) { Router.navigate('/login'); return; }

    const user = Auth.user;
    Router.render(`
      <div class="page-wrap container">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;flex-wrap:wrap;gap:16px">
          <div>
            <div style="color:var(--text3);font-size:14px;margin-bottom:4px">Welcome back,</div>
            <div class="section-title" style="font-size:36px">${user.name} 👋</div>
            <div style="margin-top:8px"><span class="badge badge-accent" style="text-transform:capitalize">${user.role}</span></div>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            ${Auth.isClient() ? `<a href="/post-project" data-link class="btn btn-primary">+ Post Project</a>` : ''}
            ${Auth.isFreelancer() ? `<a href="/projects" data-link class="btn btn-primary">Find Work →</a>` : ''}
            <a href="/profile" data-link class="btn btn-ghost">Edit Profile</a>
          </div>
        </div>

        <!-- Stats -->
        <div class="dashboard-grid" style="margin-bottom:40px" id="dashStats">
          ${Components.loader()}
        </div>

        <!-- Tabs -->
        <div class="tabs" id="dashTabs">
          ${Auth.isClient() ? `
            <div class="tab active" onclick="DashboardPage.switchTab('projects')">My Projects</div>
            <div class="tab" onclick="DashboardPage.switchTab('payments')">Transactions</div>
          ` : `
            <div class="tab active" onclick="DashboardPage.switchTab('proposals')">My Proposals</div>
            <div class="tab" onclick="DashboardPage.switchTab('payments')">Earnings</div>
          `}
        </div>

        <div id="dashContent">${Components.loader()}</div>
      </div>
    `);

    this.loadStats();
    Auth.isClient() ? this.loadMyProjects() : this.loadMyProposals();
  },

  async loadStats() {
    const user = Auth.user;
    const res = await API.get('/auth/me');
    if (!res.success) return;
    const u = res.user;
    Auth.user = { ...Auth.user, ...u };
    localStorage.setItem('user', JSON.stringify(Auth.user));

    const el = document.getElementById('dashStats');
    if (!el) return;

    if (Auth.isClient()) {
      el.innerHTML = `
        <div class="dash-stat"><div class="dash-stat-icon">📋</div><div class="dash-stat-val">${u.completedProjects || 0}</div><div class="dash-stat-label">Projects Posted</div></div>
        <div class="dash-stat"><div class="dash-stat-icon">💵</div><div class="dash-stat-val">$${(u.totalSpent || 0).toLocaleString()}</div><div class="dash-stat-label">Total Spent</div></div>
        <div class="dash-stat"><div class="dash-stat-icon">💰</div><div class="dash-stat-val">$${(u.walletBalance || 0).toLocaleString()}</div><div class="dash-stat-label">Wallet Balance</div></div>
        <div class="dash-stat"><div class="dash-stat-icon">⭐</div><div class="dash-stat-val">${u.rating || '—'}</div><div class="dash-stat-label">Your Rating</div></div>
      `;
    } else {
      el.innerHTML = `
        <div class="dash-stat"><div class="dash-stat-icon">✅</div><div class="dash-stat-val">${u.completedProjects || 0}</div><div class="dash-stat-label">Jobs Done</div></div>
        <div class="dash-stat"><div class="dash-stat-icon">💵</div><div class="dash-stat-val">$${(u.totalEarnings || 0).toLocaleString()}</div><div class="dash-stat-label">Total Earned</div></div>
        <div class="dash-stat"><div class="dash-stat-icon">💰</div><div class="dash-stat-val">$${(u.walletBalance || 0).toLocaleString()}</div><div class="dash-stat-label">Wallet Balance</div></div>
        <div class="dash-stat"><div class="dash-stat-icon">⭐</div><div class="dash-stat-val">${u.rating || '—'}</div><div class="dash-stat-label">Rating</div></div>
      `;
    }
  },

  switchTab(tab) {
    document.querySelectorAll('.tabs .tab').forEach((t, i) => {
      t.classList.remove('active');
    });
    event.target.classList.add('active');
    if (tab === 'projects') this.loadMyProjects();
    else if (tab === 'proposals') this.loadMyProposals();
    else if (tab === 'payments') this.loadPayments();
  },

  async loadMyProjects() {
    const el = document.getElementById('dashContent');
    if (el) el.innerHTML = Components.loader();
    const res = await API.get('/projects/my/posted');
    if (!el || !document.getElementById('dashContent')) return;

    if (!res.projects?.length) {
      el.innerHTML = Components.empty('📂', 'No projects yet', 'Post your first project and start receiving proposals.',
        `<a href="/post-project" data-link class="btn btn-primary">Post a Project</a>`);
      return;
    }

    el.innerHTML = res.projects.map(p => `
      <div style="display:flex;gap:16px;align-items:center;padding:20px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);margin-bottom:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:200px">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
            ${Components.statusBadge(p.status)}
            ${p.isUrgent ? '<span class="urgent-badge">⚡ Urgent</span>' : ''}
          </div>
          <div style="font-family:var(--font-display);font-size:16px;font-weight:700;cursor:pointer" onclick="Router.navigate('/project/${p._id}')">${p.title}</div>
          <div style="color:var(--text3);font-size:13px;margin-top:4px">📅 ${Components.formatDate(p.deadline)} · 💼 ${p.proposalCount || 0} proposals</div>
        </div>
        <div style="text-align:right">
          <div style="color:var(--green);font-weight:700;font-size:18px;margin-bottom:8px">${Components.formatMoney(p.budgetMin)}–${Components.formatMoney(p.budgetMax)}</div>
          <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/project/${p._id}')">View</button>
            ${p.status === 'open' ? `<button class="btn btn-ghost btn-sm" onclick="DashboardPage.deleteProject('${p._id}')">🗑️ Delete</button>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  },

  async loadMyProposals() {
    const el = document.getElementById('dashContent');
    if (el) el.innerHTML = Components.loader();
    const res = await API.get('/proposals/my');
    if (!el || !document.getElementById('dashContent')) return;

    if (!res.proposals?.length) {
      el.innerHTML = Components.empty('📄', 'No proposals yet', 'Browse projects and submit your first proposal.',
        `<a href="/projects" data-link class="btn btn-primary">Browse Projects</a>`);
      return;
    }

    el.innerHTML = res.proposals.map(pr => `
      <div style="display:flex;gap:16px;align-items:center;padding:20px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);margin-bottom:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:200px">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
            ${Components.statusBadge(pr.status)}
          </div>
          <div style="font-family:var(--font-display);font-size:16px;font-weight:700;cursor:pointer" onclick="Router.navigate('/project/${pr.project?._id}')">${pr.project?.title || 'Project'}</div>
          <div style="color:var(--text3);font-size:13px;margin-top:4px">Submitted ${Components.timeAgo(pr.createdAt)}</div>
        </div>
        <div style="text-align:right">
          <div style="color:var(--green);font-weight:700;font-size:18px;margin-bottom:4px">${Components.formatMoney(pr.bidAmount)}</div>
          <div style="color:var(--text3);font-size:13px;margin-bottom:8px">in ${pr.deliveryDays} days</div>
          ${pr.status === 'pending' ? `<button class="btn btn-danger btn-sm" onclick="DashboardPage.withdrawProposal('${pr._id}')">Withdraw</button>` : ''}
        </div>
      </div>
    `).join('');
  },

  async loadPayments() {
    const el = document.getElementById('dashContent');
    if (el) el.innerHTML = Components.loader();
    const res = await API.get('/payments/history');
    if (!el || !document.getElementById('dashContent')) return;

    if (!res.payments?.length) {
      el.innerHTML = Components.empty('💸', 'No transactions', 'Your payment history will appear here.');
      return;
    }

    el.innerHTML = `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px">
        ${res.payments.map(tx => {
          const isCredit = tx.payee?._id === Auth.user._id || tx.type === 'deposit';
          return `
          <div class="tx-row">
            <div class="tx-icon ${isCredit ? 'credit' : 'debit'}">${isCredit ? '⬆️' : '⬇️'}</div>
            <div class="tx-info">
              <div class="tx-desc">${tx.description || tx.type}</div>
              <div class="tx-date">${Components.formatDate(tx.createdAt)} · ID: ${tx.transactionId?.slice(0,8) || '—'}</div>
            </div>
            <div class="tx-amount ${isCredit ? 'credit' : 'debit'}">${isCredit ? '+' : '-'}${Components.formatMoney(tx.amount)}</div>
          </div>`;
        }).join('')}
      </div>`;
  },

  async deleteProject(projectId) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    const res = await API.delete(`/projects/${projectId}`);
    if (res.success) {
      Components.toast('Project deleted', 'info');
      this.loadMyProjects();
    } else {
      Components.toast(res.message, 'error');
    }
  },

  async withdrawProposal(proposalId) {
    if (!confirm('Withdraw your proposal?')) return;
    const res = await API.delete(`/proposals/${proposalId}`);
    if (res.success) {
      Components.toast('Proposal withdrawn', 'info');
      this.loadMyProposals();
    } else {
      Components.toast(res.message, 'error');
    }
  }
};
