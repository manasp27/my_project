// pages/home.js
const HomePage = {
  async render() {
    Router.render(`
      <!-- Hero -->
      <section class="hero">
        <div class="hero-inner">
          <div class="hero-eyebrow">✨ The future of work is here</div>
          <h1 class="hero-title">Where great <span>talent</span><br/>meets great work</h1>
          <p class="hero-desc">Connect with top freelancers worldwide. Post projects, receive proposals, and get work done — fast, securely, and on your terms.</p>
          <div class="hero-cta">
            ${Auth.isLoggedIn()
              ? `<a href="/dashboard" data-link class="btn btn-primary btn-lg">Go to Dashboard →</a>`
              : `<a href="/register" data-link class="btn btn-primary btn-lg">Start for Free →</a>
                 <a href="/projects" data-link class="btn btn-ghost btn-lg">Browse Projects</a>`
            }
          </div>
          <div class="hero-stats">
            <div><div class="hero-stat-num">12K+</div><div class="hero-stat-label">Freelancers</div></div>
            <div><div class="hero-stat-num">8K+</div><div class="hero-stat-label">Projects Posted</div></div>
            <div><div class="hero-stat-num">$2M+</div><div class="hero-stat-label">Total Paid Out</div></div>
            <div><div class="hero-stat-num">98%</div><div class="hero-stat-label">Satisfaction</div></div>
          </div>
        </div>
      </section>

      <!-- Categories -->
      <section class="category-section">
        <div class="container">
          <div class="section-header" style="text-align:center">
            <div class="section-label">Explore</div>
            <div class="section-title">Find talent in any field</div>
          </div>
          <div class="grid-4" id="categoriesGrid">
            ${this.categoryCards()}
          </div>
        </div>
      </section>

      <!-- How it works -->
      <section class="how-section">
        <div class="container">
          <div class="section-header" style="text-align:center;margin-bottom:60px">
            <div class="section-label">Process</div>
            <div class="section-title">How FreeLancr works</div>
          </div>
          <div class="grid-3">
            <div class="step-card">
              <div class="step-num">01</div>
              <div class="step-title">Post a Project</div>
              <p class="step-desc">Describe your project, set your budget and deadline. It takes less than 5 minutes.</p>
            </div>
            <div class="step-card">
              <div class="step-num">02</div>
              <div class="step-title">Receive Proposals</div>
              <p class="step-desc">Skilled freelancers bid on your project. Review their profiles, ratings, and past work.</p>
            </div>
            <div class="step-card">
              <div class="step-num">03</div>
              <div class="step-title">Hire & Pay Securely</div>
              <p class="step-desc">Choose the best match, collaborate via messaging, and release payment when satisfied.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured projects -->
      <section style="padding:100px 24px">
        <div class="container">
          <div class="section-header" style="display:flex;justify-content:space-between;align-items:flex-end">
            <div>
              <div class="section-label">Latest</div>
              <div class="section-title">Open Projects</div>
            </div>
            <a href="/projects" data-link class="btn btn-ghost">View All →</a>
          </div>
          <div id="featuredProjects">${Components.loader()}</div>
        </div>
      </section>

      <!-- Featured Freelancers -->
      <section class="featured-section">
        <div class="container">
          <div class="section-header" style="display:flex;justify-content:space-between;align-items:flex-end">
            <div>
              <div class="section-label">Top Rated</div>
              <div class="section-title">Featured Freelancers</div>
            </div>
            <a href="/freelancers" data-link class="btn btn-ghost">Browse All →</a>
          </div>
          <div id="featuredFreelancers" class="grid-3">${Components.loader()}</div>
        </div>
      </section>

      <!-- CTA -->
      ${!Auth.isLoggedIn() ? `
      <section style="padding:100px 24px;text-align:center">
        <div class="container" style="max-width:640px;margin:0 auto">
          <div class="section-label">Join Free</div>
          <div class="section-title" style="text-align:center">Ready to start?</div>
          <p style="color:var(--text2);font-size:17px;margin:20px 0 40px">Whether you're a freelancer looking for work or a client looking for talent — we've got you covered.</p>
          <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
            <a href="/register?role=freelancer" data-link class="btn btn-primary btn-lg">Join as Freelancer</a>
            <a href="/register?role=client" data-link class="btn btn-ghost btn-lg">Hire a Freelancer</a>
          </div>
        </div>
      </section>` : ''}
    `);

    this.loadFeatured();
  },

  categoryCards() {
    const cats = [
      { icon: '💻', name: 'Web Development', count: '2.4K projects' },
      { icon: '📱', name: 'Mobile Development', count: '1.2K projects' },
      { icon: '🎨', name: 'Design', count: '3.1K projects' },
      { icon: '✍️', name: 'Writing', count: '1.8K projects' },
      { icon: '📊', name: 'Marketing', count: '980 projects' },
      { icon: '🤖', name: 'Data Science', count: '740 projects' },
      { icon: '🎬', name: 'Video & Animation', count: '560 projects' },
      { icon: '📸', name: 'Photography', count: '430 projects' },
    ];
    return cats.map(c => `
      <div class="category-card" onclick="Router.navigate('/projects?category=${encodeURIComponent(c.name)}')">
        <div class="category-icon">${c.icon}</div>
        <div class="category-name">${c.name}</div>
        <div class="category-count">${c.count}</div>
      </div>`).join('');
  },

  async loadFeatured() {
    const [projRes, freRes] = await Promise.all([
      API.get('/projects?limit=6&status=open'),
      API.get('/users/freelancers?limit=3')
    ]);

    const projEl = document.getElementById('featuredProjects');
    if (projEl) {
      if (projRes.projects?.length) {
        projEl.innerHTML = `<div class="grid-2">${projRes.projects.map(p => Components.projectCard(p)).join('')}</div>`;
      } else {
        projEl.innerHTML = Components.empty('📂', 'No projects yet', 'Be the first to post a project!', `<a href="/post-project" data-link class="btn btn-primary">Post a Project</a>`);
      }
    }

    const freEl = document.getElementById('featuredFreelancers');
    if (freEl) {
      if (freRes.freelancers?.length) {
        freEl.innerHTML = freRes.freelancers.map(f => Components.freelancerCard(f)).join('');
      } else {
        freEl.innerHTML = Components.empty('👥', 'No freelancers yet', 'Be the first to join!');
      }
    }
  }
};
