// app.js — main entry point, router definitions, event bindings

document.addEventListener('DOMContentLoaded', () => {
  // ─── Init auth state ──────────────────────────────────────────────────────
  Auth.init();

  // ─── Define routes ────────────────────────────────────────────────────────
  Router.define('/', ({ query }) => HomePage.render(query));
  Router.define('/login', ({ query }) => AuthPage.renderLogin(query));
  Router.define('/register', ({ query }) => AuthPage.renderRegister(query.role));

  Router.define('/projects', ({ query }) => {
    MessagesPage.destroy?.();
    ProjectsPage.render(query);
  });
  Router.define('/project/:id', ({ params }) => {
    MessagesPage.destroy?.();
    ProjectsPage.renderDetail(params.id);
  });
  Router.define('/post-project', () => {
    MessagesPage.destroy?.();
    ProjectsPage.renderPostProject();
  });

  Router.define('/freelancers', ({ query }) => {
    MessagesPage.destroy?.();
    FreelancersPage.render(query);
  });

  Router.define('/dashboard', () => {
    MessagesPage.destroy?.();
    DashboardPage.render();
  });

  Router.define('/profile', () => {
    MessagesPage.destroy?.();
    ProfilePage.render(null);
  });
  Router.define('/profile/edit', () => {
    MessagesPage.destroy?.();
    ProfilePage.renderEdit();
  });
  Router.define('/user/:id', ({ params }) => {
    MessagesPage.destroy?.();
    ProfilePage.render(params.id);
  });

  Router.define('/messages', ({ query }) => MessagesPage.render(query));
  Router.define('/messages/:userId', ({ params }) => MessagesPage.render({ to: params.userId }));

  Router.define('/payments', () => {
    MessagesPage.destroy?.();
    PaymentsPage.render();
  });

  Router.define('/admin', () => {
    MessagesPage.destroy?.();
    AdminPage.render();
  });

  Router.define('/how-it-works', () => {
    MessagesPage.destroy?.();
    renderHowItWorks();
  });

  // ─── Start router ─────────────────────────────────────────────────────────
  Router.init();

  // ─── Hamburger menu ───────────────────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  hamburger?.addEventListener('click', () => {
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    navLinks.style.flexDirection = 'column';
    navLinks.style.position = 'absolute';
    navLinks.style.top = 'var(--nav-h)';
    navLinks.style.left = '0';
    navLinks.style.right = '0';
    navLinks.style.background = 'var(--bg)';
    navLinks.style.borderBottom = '1px solid var(--border)';
    navLinks.style.padding = '16px';
    navLinks.style.zIndex = '99';
  });

  // ─── Notification bell toggle ─────────────────────────────────────────────
  const notifBell = document.getElementById('notifBell');
  const notifDropdown = document.getElementById('notifDropdown');
  notifBell?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = notifDropdown.classList.contains('hidden');
    notifDropdown.classList.toggle('hidden');
    if (isHidden) Auth.loadNotifications();
    // Hide avatar menu if open
    document.getElementById('avatarMenu')?.classList.add('hidden');
  });

  // ─── Avatar menu toggle ───────────────────────────────────────────────────
  const avatarWrap = document.getElementById('userAvatarWrap');
  const avatarMenu = document.getElementById('avatarMenu');
  avatarWrap?.addEventListener('click', (e) => {
    e.stopPropagation();
    avatarMenu?.classList.toggle('hidden');
    notifDropdown?.classList.add('hidden');
  });

  // ─── Close dropdowns on outside click ────────────────────────────────────
  document.addEventListener('click', () => {
    notifDropdown?.classList.add('hidden');
    avatarMenu?.classList.add('hidden');
  });

  // ─── Logout ───────────────────────────────────────────────────────────────
  document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    Auth.logout();
    Components.toast('Logged out. See you soon! 👋', 'info');
    Router.navigate('/');
  });

  // ─── Load notifications periodically ─────────────────────────────────────
  if (Auth.isLoggedIn()) {
    Auth.loadNotifications();
    setInterval(() => Auth.loadNotifications(), 30000);
  }

  // ─── Active nav link highlighting ─────────────────────────────────────────
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === path ||
        (path.startsWith(link.getAttribute('href')) && link.getAttribute('href') !== '/')) {
      link.classList.add('active');
    }
  });

  // Update nav active on navigate
  const origNavigate = Router.navigate.bind(Router);
  Router.navigate = function(path, push = true) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && path.startsWith(href) && href !== '/') link.classList.add('active');
      if (href === '/' && path === '/') link.classList.add('active');
    });
    origNavigate(path, push);
  };
});

// ─── How It Works static page ─────────────────────────────────────────────────
function renderHowItWorks() {
  Router.render(`
    <div class="page-wrap container">
      <div class="how-page" style="max-width:800px;margin:0 auto">
        <div style="margin-bottom:56px;text-align:center">
          <div class="section-label">Guide</div>
          <div class="section-title" style="text-align:center">How FreeLancr Works</div>
          <p style="color:var(--text2);font-size:17px;margin-top:16px">Everything you need to know to get started</p>
        </div>

        <div style="font-family:var(--font-display);font-size:20px;font-weight:800;margin-bottom:20px;color:var(--accent2)">For Clients</div>

        ${[
          ['Post a Project', 'Create a detailed project listing with your requirements, budget, and deadline. Add required skills so the right freelancers find you.'],
          ['Review Proposals', 'Receive and compare proposals from skilled freelancers. Check their profiles, ratings, past work, and bid amounts.'],
          ['Hire & Communicate', 'Accept the best proposal. Chat directly with your hired freelancer through the built-in messaging system.'],
          ['Release Payment', 'Fund your wallet, then release payment securely once the project is completed to your satisfaction.'],
          ['Leave a Review', 'Rate your freelancer to help the community. Your feedback builds trust for everyone.'],
        ].map(([title, desc], i) => `
          <div class="how-step">
            <div class="how-step-num">${String(i+1).padStart(2,'0')}</div>
            <div class="how-step-content"><h3>${title}</h3><p>${desc}</p></div>
          </div>`).join('')}

        <div style="font-family:var(--font-display);font-size:20px;font-weight:800;margin:40px 0 20px;color:var(--green)">For Freelancers</div>

        ${[
          ['Set Up Your Profile', 'Create a compelling profile showcasing your skills, experience, portfolio, and hourly rate. A great profile wins more projects.'],
          ['Browse Open Projects', 'Explore hundreds of projects filtered by category, budget, or required skills. Bookmark the ones that interest you.'],
          ['Submit a Proposal', 'Write a personalized cover letter explaining your approach, set your bid amount, and specify your delivery timeline.'],
          ['Communicate & Deliver', 'Once hired, collaborate with the client via messaging. Deliver high-quality work on time.'],
          ['Get Paid & Build Reputation', 'Receive payment securely to your wallet. Earn reviews to grow your profile and attract better clients.'],
        ].map(([title, desc], i) => `
          <div class="how-step">
            <div class="how-step-num" style="background:var(--green-bg);border-color:rgba(0,217,126,0.3);color:var(--green)">${String(i+1).padStart(2,'0')}</div>
            <div class="how-step-content"><h3>${title}</h3><p>${desc}</p></div>
          </div>`).join('')}

        <div class="card" style="margin-top:48px;text-align:center;padding:40px">
          <div style="font-size:40px;margin-bottom:16px">🚀</div>
          <div style="font-family:var(--font-display);font-size:24px;font-weight:800;margin-bottom:12px">Ready to get started?</div>
          <p style="color:var(--text2);margin-bottom:24px">Join thousands of freelancers and clients already on FreeLancr</p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
            <a href="/register?role=freelancer" data-link class="btn btn-primary btn-lg">Join as Freelancer</a>
            <a href="/register?role=client" data-link class="btn btn-ghost btn-lg">Hire Talent</a>
          </div>
        </div>
      </div>
    </div>
  `);
}
