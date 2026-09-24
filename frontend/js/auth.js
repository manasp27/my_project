// auth.js — authentication state management
const Auth = {
  user: null,

  init() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      try { this.user = JSON.parse(user); } catch(e) { this.logout(); }
    }
    this.updateNav();
  },

  login(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.user = user;
    this.updateNav();
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.user = null;
    this.updateNav();
  },

  isLoggedIn() { return !!this.user; },
  isFreelancer() { return this.user?.role === 'freelancer'; },
  isClient() { return this.user?.role === 'client'; },
  isAdmin() { return this.user?.role === 'admin'; },

  updateNav() {
    const navActions = document.getElementById('navActions');
    const navUser = document.getElementById('navUser');
    const navAvatar = document.getElementById('navAvatar');

    if (this.user) {
      if (navActions) navActions.classList.add('hidden');
      if (navUser) navUser.classList.remove('hidden');
      if (navAvatar) {
        if (this.user.avatar) {
          navAvatar.src = this.user.avatar;
        } else {
          navAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.user.name)}&background=6c63ff&color=fff&bold=true`;
        }
      }
    } else {
      if (navActions) navActions.classList.remove('hidden');
      if (navUser) navUser.classList.add('hidden');
    }
  },

  async loadNotifications() {
    if (!this.isLoggedIn()) return;
    const res = await API.get('/users/notifications/all');
    if (!res.success) return;
    const notifications = res.notifications || [];
    const unread = notifications.filter(n => !n.isRead).length;
    const badge = document.getElementById('notifBadge');
    if (badge) {
      badge.textContent = unread;
      if (unread > 0) badge.classList.remove('hidden');
      else badge.classList.add('hidden');
    }
    const dropdown = document.getElementById('notifDropdown');
    if (!dropdown) return;
    if (notifications.length === 0) {
      dropdown.innerHTML = `<div class="notif-header"><span>Notifications</span></div><div style="padding:24px;text-align:center;color:var(--text3);font-size:14px;">No notifications</div>`;
    } else {
      dropdown.innerHTML = `
        <div class="notif-header">
          <span>Notifications</span>
          <a href="#" id="markAllRead" style="color:var(--accent2);font-size:12px;cursor:pointer;">Mark all read</a>
        </div>
        ${notifications.slice(0,8).map(n => `
          <div class="notif-item ${n.isRead ? '' : 'unread'}" onclick="${n.link ? `Router.navigate('${n.link}')` : ''}">
            <div class="notif-item-text">${n.message}</div>
            <div class="notif-item-time">${Components.timeAgo(n.createdAt)}</div>
          </div>
        `).join('')}
      `;
      const markBtn = dropdown.querySelector('#markAllRead');
      if (markBtn) markBtn.onclick = async (e) => {
        e.preventDefault();
        await API.put('/users/notifications/read');
        this.loadNotifications();
      };
    }
  }
};
