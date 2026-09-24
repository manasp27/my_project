// router.js — client-side SPA router
const Router = {
  routes: {},

  define(path, handler) { this.routes[path] = handler; },

  navigate(path, push = true) {
    if (push) history.pushState({}, '', path);
    this.resolve(path);
    window.scrollTo(0, 0);
  },

  resolve(path) {
    // Extract base path (ignore query string for matching)
    const [basePath] = path.split('?');
    const segments = basePath.split('/').filter(Boolean);

    // Try exact match first
    if (this.routes[basePath]) {
      return this.routes[basePath]({ params: {}, query: this.parseQuery(path) });
    }

    // Try dynamic routes (e.g., /project/:id)
    for (const [routePath, handler] of Object.entries(this.routes)) {
      const routeSegments = routePath.split('/').filter(Boolean);
      if (routeSegments.length !== segments.length) continue;
      const params = {};
      let match = true;
      for (let i = 0; i < routeSegments.length; i++) {
        if (routeSegments[i].startsWith(':')) {
          params[routeSegments[i].slice(1)] = segments[i];
        } else if (routeSegments[i] !== segments[i]) {
          match = false; break;
        }
      }
      if (match) return handler({ params, query: this.parseQuery(path) });
    }

    // 404
    this.render404();
  },

  parseQuery(path) {
    const [, qs] = path.split('?');
    if (!qs) return {};
    return Object.fromEntries(new URLSearchParams(qs));
  },

  render404() {
    document.getElementById('app').innerHTML = `
      <div class="page-wrap container">
        <div class="empty-state" style="padding:100px 24px">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">Page Not Found</div>
          <div class="empty-desc">The page you're looking for doesn't exist.</div>
          <a href="/" data-link class="btn btn-primary">Go Home</a>
        </div>
      </div>`;
  },

  init() {
    // Handle data-link clicks (SPA navigation)
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-link]');
      if (link) {
        e.preventDefault();
        this.navigate(link.getAttribute('href'));
      }
    });

    window.addEventListener('popstate', () => this.resolve(window.location.pathname + window.location.search));

    this.resolve(window.location.pathname + window.location.search);
  },

  render(html) {
    document.getElementById('app').innerHTML = html;
  }
};
