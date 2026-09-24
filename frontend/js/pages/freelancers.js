// pages/freelancers.js
const FreelancersPage = {
  currentPage: 1,

  async render(query = {}) {
    Router.render(`
      <div class="page-wrap container">
        <div style="margin-bottom:40px">
          <div class="section-title" style="font-size:36px">Find Talent</div>
          <p style="color:var(--text2);margin-top:6px">Discover skilled professionals for your projects</p>
        </div>

        <div class="sidebar-layout">
          <!-- Filters -->
          <div class="sidebar-sticky">
            <div class="filter-card">
              <div class="filter-title">🔍 Filter Freelancers</div>

              <div class="filter-group">
                <div class="filter-group-label">Search</div>
                <div class="search-wrap">
                  <span class="search-icon">🔍</span>
                  <input type="text" id="freSearch" class="search-input" placeholder="Name, skill..." value="${query.search || ''}" style="padding-left:44px" />
                </div>
              </div>

              <div class="filter-group">
                <div class="filter-group-label">Category</div>
                <select id="freCat" class="form-select">
                  <option value="">All Categories</option>
                  ${['Web Development','Mobile Development','Design','Writing','Marketing','Data Science','Video & Animation','Photography','Other']
                    .map(c => `<option value="${c}" ${query.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>

              <div class="filter-group">
                <div class="filter-group-label">Minimum Rating</div>
                ${[4, 3, 2].map(r => `
                <label class="filter-option">
                  <input type="radio" name="freRating" value="${r}" ${query.rating == r ? 'checked' : ''}> ${Components.stars(r)} & up
                </label>`).join('')}
                <label class="filter-option">
                  <input type="radio" name="freRating" value="" ${!query.rating ? 'checked' : ''}> Any rating
                </label>
              </div>

              <button class="btn btn-primary btn-block" onclick="FreelancersPage.applyFilters()">Apply Filters</button>
              <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="FreelancersPage.clearFilters()">Clear All</button>
            </div>
          </div>

          <!-- Results -->
          <div>
            <div id="freCount" style="margin-bottom:20px;color:var(--text2);font-size:14px"></div>
            <div class="grid-2" id="freelancersList">${Components.loader()}</div>
            <div id="frePagination"></div>
          </div>
        </div>
      </div>
    `);

    this.loadFreelancers(query);

    document.getElementById('freSearch').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.applyFilters();
    });
  },

  applyFilters() {
    this.currentPage = 1;
    this.loadFreelancers({
      search: document.getElementById('freSearch').value.trim(),
      category: document.getElementById('freCat').value,
      rating: document.querySelector('input[name="freRating"]:checked')?.value || '',
    });
  },

  clearFilters() {
    document.getElementById('freSearch').value = '';
    document.getElementById('freCat').value = '';
    document.querySelectorAll('input[name="freRating"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="freRating"]')[3].checked = true;
    this.currentPage = 1;
    this.loadFreelancers({});
  },

  async loadFreelancers(filters = {}) {
    const el = document.getElementById('freelancersList');
    if (!el) return;
    el.style.opacity = '0.5';

    const params = new URLSearchParams({
      page: this.currentPage, limit: 12,
      ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v))
    });
    const res = await API.get(`/users/freelancers?${params}`);
    el.style.opacity = '1';

    const countEl = document.getElementById('freCount');
    if (countEl) countEl.textContent = `${res.total || 0} freelancer${res.total !== 1 ? 's' : ''} found`;

    if (!res.freelancers?.length) {
      el.innerHTML = Components.empty('👥', 'No freelancers found', 'Try different search terms or filters.');
    } else {
      el.innerHTML = res.freelancers.map(f => Components.freelancerCard(f)).join('');
    }

    const pageEl = document.getElementById('frePagination');
    if (pageEl) pageEl.innerHTML = Components.pagination(this.currentPage, res.pages || 1, 'FreelancersPage.goToPage');
  },

  goToPage(page) {
    this.currentPage = page;
    this.applyFilters();
    window.scrollTo(0, 300);
  }
};
