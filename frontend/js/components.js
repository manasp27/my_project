// components.js — shared reusable UI components
const Components = {
  toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity='0'; toast.style.transform='translateX(60px)'; toast.style.transition='all 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
  },

  loader() {
    return `<div class="loader-wrap"><div class="spinner"></div><span>Loading...</span></div>`;
  },

  empty(icon, title, desc, action = '') {
    return `<div class="empty-state"><div class="empty-icon">${icon}</div><div class="empty-title">${title}</div><div class="empty-desc">${desc}</div>${action}</div>`;
  },

  stars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return `<span class="stars">${'★'.repeat(full)}${'½'.repeat(half)}${'☆'.repeat(empty)}</span>`;
  },

  avatar(user, size = 'md') {
    const sizeMap = { sm: 36, md: 52, lg: 80, xl: 120 };
    const px = sizeMap[size] || 52;
    const initials = user.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : '?';
    if (user.avatar) {
      return `<img src="${user.avatar}" alt="${user.name}" class="avatar avatar-${size}" style="width:${px}px;height:${px}px" />`;
    }
    return `<div class="avatar avatar-${size} avatar-placeholder" style="width:${px}px;height:${px}px;font-size:${px * 0.35}px">${initials}</div>`;
  },

  timeAgo(date) {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  },

  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  },

  formatMoney(n) {
    return `$${Number(n).toLocaleString()}`;
  },

  statusBadge(status) {
    const map = {
      open: ['badge-green', 'Open'],
      in_progress: ['badge-yellow', 'In Progress'],
      completed: ['badge-accent', 'Completed'],
      cancelled: ['badge-red', 'Cancelled'],
      pending: ['badge-gray', 'Pending'],
      accepted: ['badge-green', 'Accepted'],
      rejected: ['badge-red', 'Rejected'],
      withdrawn: ['badge-gray', 'Withdrawn'],
    };
    const [cls, label] = map[status] || ['badge-gray', status];
    return `<span class="badge ${cls}">${label}</span>`;
  },

  projectCard(p, onClick = '') {
    const budgetStr = p.budgetMin === p.budgetMax
      ? this.formatMoney(p.budgetMin)
      : `${this.formatMoney(p.budgetMin)}–${this.formatMoney(p.budgetMax)}`;
    const daysLeft = Math.ceil((new Date(p.deadline) - Date.now()) / 86400000);
    return `
      <div class="project-card" onclick="${onClick || `Router.navigate('/project/${p._id}')`}">
        <div class="project-card-header">
          <div>
            <div class="project-title">${p.title}</div>
            <div style="margin-top:6px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <span class="badge badge-gray">${p.category}</span>
              ${p.isUrgent ? '<span class="urgent-badge">⚡ Urgent</span>' : ''}
              ${this.statusBadge(p.status)}
            </div>
          </div>
          <div class="project-budget">${budgetStr}</div>
        </div>
        <p class="project-desc">${p.description}</p>
        <div class="tags-wrap">${(p.skills || []).slice(0,4).map(s => `<span class="tag">${s}</span>`).join('')}</div>
        <div class="project-footer">
          <div class="project-meta">
            <span class="project-meta-item">💼 ${p.proposalCount || 0} proposals</span>
            <span class="project-meta-item">📅 ${daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}</span>
          </div>
          ${p.client ? `<div class="project-client">${this.avatar(p.client,'sm')}<div><div class="project-client-name">${p.client.name}</div><div class="project-client-rating">${this.stars(p.client.rating || 0)} ${p.client.rating || 0}</div></div></div>` : ''}
        </div>
      </div>`;
  },

  freelancerCard(u) {
    return `
      <div class="freelancer-card" onclick="Router.navigate('/user/${u._id}')">
        <div class="freelancer-card-top">
          ${this.avatar(u, 'md')}
          <div class="freelancer-info">
            <div class="freelancer-name">${u.name}</div>
            <div class="freelancer-title">${u.category || 'Freelancer'}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
              ${this.stars(u.rating || 0)}
              <span style="font-size:13px;color:var(--text3)">${u.rating || 0} (${u.reviewCount || 0})</span>
            </div>
          </div>
          <div class="freelancer-rate">${u.hourlyRate ? `$${u.hourlyRate}/hr` : 'Negotiable'}</div>
        </div>
        <p style="color:var(--text2);font-size:14px;margin-bottom:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${u.bio || 'No bio added yet.'}</p>
        <div class="tags-wrap">${(u.skills || []).slice(0,5).map(s => `<span class="tag">${s}</span>`).join('')}</div>
        <div class="freelancer-stats">
          <div class="freelancer-stat-item"><div class="freelancer-stat-val">${u.completedProjects || 0}</div><div class="freelancer-stat-key">Done</div></div>
          <div class="freelancer-stat-item"><div class="freelancer-stat-val">${this.stars(u.rating || 0)}</div><div class="freelancer-stat-key">Rating</div></div>
          ${u.location ? `<div class="freelancer-stat-item"><div class="freelancer-stat-val">📍</div><div class="freelancer-stat-key">${u.location}</div></div>` : ''}
        </div>
      </div>`;
  },

  pagination(current, total, onPage) {
    if (total <= 1) return '';
    let html = '<div class="pagination">';
    if (current > 1) html += `<button class="page-btn" onclick="${onPage}(${current-1})">‹</button>`;
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current-2 && i <= current+2)) {
        html += `<button class="page-btn${i===current?' active':''}" onclick="${onPage}(${i})">${i}</button>`;
      } else if (i === current-3 || i === current+3) {
        html += `<span style="padding:0 4px;color:var(--text3)">…</span>`;
      }
    }
    if (current < total) html += `<button class="page-btn" onclick="${onPage}(${current+1})">›</button>`;
    return html + '</div>';
  },

  modal(title, content, footer = '') {
    const box = document.getElementById('modalBox');
    const overlay = document.getElementById('modalOverlay');
    box.innerHTML = `
      <div class="modal-header">
        <div class="modal-title">${title}</div>
        <button class="modal-close" onclick="Components.closeModal()">✕</button>
      </div>
      ${content}
      ${footer ? `<div style="margin-top:24px;display:flex;gap:12px;justify-content:flex-end">${footer}</div>` : ''}
    `;
    overlay.classList.remove('hidden');
  },

  closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
  }
};

// Close modal on overlay click
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalOverlay')) Components.closeModal();
});
