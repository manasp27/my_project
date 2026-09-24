// pages/projects.js
const ProjectsPage = {
  currentPage: 1,
  currentFilters: {},

  async render(query = {}) {
    this.currentFilters = query;
    Router.render(`
      <div class="page-wrap container">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;flex-wrap:wrap;gap:16px">
          <div>
            <div class="section-title" style="font-size:36px">Browse Projects</div>
            <p style="color:var(--text2);margin-top:6px">Find your next opportunity</p>
          </div>
          ${Auth.isClient() ? `<a href="/post-project" data-link class="btn btn-primary btn-lg">+ Post a Project</a>` : ''}
        </div>

        <div class="sidebar-layout">
          <!-- Filters -->
          <div class="sidebar-sticky">
            <div class="filter-card">
              <div class="filter-title">🔍 Filter Projects</div>

              <div class="filter-group">
                <div class="filter-group-label">Search</div>
                <div class="search-wrap">
                  <span class="search-icon">🔍</span>
                  <input type="text" id="projSearch" class="search-input" placeholder="Keywords..." value="${query.search || ''}" style="padding-left:44px" />
                </div>
              </div>

              <div class="filter-group">
                <div class="filter-group-label">Category</div>
                <select id="projCat" class="form-select">
                  <option value="">All Categories</option>
                  ${['Web Development','Mobile Development','Design','Writing','Marketing','Data Science','Video & Animation','Photography','Other']
                    .map(c => `<option value="${c}" ${query.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>

              <div class="filter-group">
                <div class="filter-group-label">Budget Range</div>
                <div class="range-wrap">
                  <input type="number" id="budgetMin" class="range-input" placeholder="Min $" value="${query.budgetMin || ''}" />
                  <span style="color:var(--text3)">—</span>
                  <input type="number" id="budgetMax" class="range-input" placeholder="Max $" value="${query.budgetMax || ''}" />
                </div>
              </div>

              <div class="filter-group">
                <div class="filter-group-label">Sort By</div>
                <select id="projSort" class="form-select">
                  <option value="-createdAt">Newest First</option>
                  <option value="createdAt">Oldest First</option>
                  <option value="budgetMin">Budget: Low to High</option>
                  <option value="-budgetMax">Budget: High to Low</option>
                  <option value="-proposalCount">Most Proposals</option>
                </select>
              </div>

              <button class="btn btn-primary btn-block" onclick="ProjectsPage.applyFilters()">Apply Filters</button>
              <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="ProjectsPage.clearFilters()">Clear All</button>
            </div>
          </div>

          <!-- Results -->
          <div>
            <div id="projectsCount" style="margin-bottom:20px;color:var(--text2);font-size:14px"></div>
            <div id="projectsList">${Components.loader()}</div>
            <div id="projectsPagination"></div>
          </div>
        </div>
      </div>
    `);

    this.loadProjects();

    document.getElementById('projSearch').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.applyFilters();
    });
  },

  applyFilters() {
    this.currentPage = 1;
    this.currentFilters = {
      search: document.getElementById('projSearch').value.trim(),
      category: document.getElementById('projCat').value,
      budgetMin: document.getElementById('budgetMin').value,
      budgetMax: document.getElementById('budgetMax').value,
      sort: document.getElementById('projSort').value,
    };
    this.loadProjects();
  },

  clearFilters() {
    this.currentFilters = {};
    this.currentPage = 1;
    document.getElementById('projSearch').value = '';
    document.getElementById('projCat').value = '';
    document.getElementById('budgetMin').value = '';
    document.getElementById('budgetMax').value = '';
    this.loadProjects();
  },

  async loadProjects() {
    const el = document.getElementById('projectsList');
    if (el) el.innerHTML = Components.loader();

    const params = new URLSearchParams({
      page: this.currentPage,
      limit: 10,
      status: 'open',
      ...Object.fromEntries(Object.entries(this.currentFilters).filter(([,v]) => v))
    });

    const res = await API.get(`/projects?${params}`);
    if (!el) return;

    const countEl = document.getElementById('projectsCount');
    if (countEl && res.total !== undefined) countEl.textContent = `${res.total} project${res.total !== 1 ? 's' : ''} found`;

    if (!res.projects?.length) {
      el.innerHTML = Components.empty('📂', 'No projects found', 'Try adjusting your filters or search terms.', Auth.isClient() ? `<a href="/post-project" data-link class="btn btn-primary">Post the First Project</a>` : '');
    } else {
      el.innerHTML = res.projects.map(p => Components.projectCard(p)).join('');
    }

    const pageEl = document.getElementById('projectsPagination');
    if (pageEl) pageEl.innerHTML = Components.pagination(this.currentPage, res.pages || 1, 'ProjectsPage.goToPage');
  },

  goToPage(page) {
    this.currentPage = page;
    this.loadProjects();
    window.scrollTo(0, 300);
  },

  // ─── PROJECT DETAIL ────────────────────────────────────────────────────────
  async renderDetail(id) {
    Router.render(`<div class="page-wrap container">${Components.loader()}</div>`);

    const res = await API.get(`/projects/${id}`);
    if (!res.success) {
      Router.render(`<div class="page-wrap container">${Components.empty('❌', 'Project not found', '', `<a href="/projects" data-link class="btn btn-ghost">Back to Projects</a>`)}</div>`);
      return;
    }
    const p = res.project;
    const daysLeft = Math.ceil((new Date(p.deadline) - Date.now()) / 86400000);
    const budgetStr = p.budgetMin === p.budgetMax
      ? Components.formatMoney(p.budgetMin)
      : `${Components.formatMoney(p.budgetMin)} – ${Components.formatMoney(p.budgetMax)}`;
    const isOwner = Auth.user && p.client?._id === Auth.user._id;
    const isAssigned = Auth.user && p.assignedFreelancer === Auth.user._id;

    Router.render(`
      <div class="page-wrap container">
        <div class="back-btn" onclick="history.back()">← Back</div>
        <div class="sidebar-layout">
          <!-- Main content -->
          <div style="grid-column:1/3">
            <div class="project-detail-header">
              <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:16px">
                <span class="badge badge-gray">${p.category}</span>
                ${Components.statusBadge(p.status)}
                ${p.isUrgent ? '<span class="urgent-badge">⚡ Urgent</span>' : ''}
              </div>
              <h1 class="project-detail-title">${p.title}</h1>
              <div style="color:var(--text3);font-size:14px;margin-top:8px">
                Posted ${Components.timeAgo(p.createdAt)} · ${p.views || 0} views
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 320px;gap:32px;align-items:start">
              <div>
                <div class="card" style="margin-bottom:24px">
                  <h3 style="font-family:var(--font-display);font-size:18px;font-weight:700;margin-bottom:16px">Project Description</h3>
                  <p style="color:var(--text2);line-height:1.8;white-space:pre-wrap">${p.description}</p>
                </div>

                ${p.skills?.length ? `
                <div class="card" style="margin-bottom:24px">
                  <h3 style="font-family:var(--font-display);font-size:18px;font-weight:700;margin-bottom:16px">Required Skills</h3>
                  <div class="tags-wrap">${p.skills.map(s => `<span class="tag tag-accent">${s}</span>`).join('')}</div>
                </div>` : ''}

                <!-- Proposals section -->
                ${isOwner ? `
                <div class="card">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                    <h3 style="font-family:var(--font-display);font-size:18px;font-weight:700">Proposals (${p.proposalCount || 0})</h3>
                    ${p.status === 'completed' ? `<button class="btn btn-ghost btn-sm" onclick="ProjectsPage.openReviewModal('${p._id}', '${p.assignedFreelancer}')">⭐ Leave Review</button>` : ''}
                  </div>
                  <div id="proposalsList">${Components.loader()}</div>
                </div>` : ''}

                ${Auth.isFreelancer() && p.status === 'open' ? `
                <div class="card">
                  <h3 style="font-family:var(--font-display);font-size:18px;font-weight:700;margin-bottom:20px">Submit Your Proposal</h3>
                  <div id="proposalFormArea"></div>
                </div>` : ''}
              </div>

              <!-- Sidebar -->
              <div>
                <div class="card" style="margin-bottom:20px">
                  <div class="project-info-item" style="margin-bottom:16px;padding:0;background:none">
                    <div class="project-info-label">Budget</div>
                    <div class="project-info-value" style="color:var(--green)">${budgetStr}</div>
                    <div style="color:var(--text3);font-size:12px;margin-top:4px">${p.budgetType === 'hourly' ? 'Per hour' : 'Fixed price'}</div>
                  </div>
                  <hr class="divider"/>
                  <div class="project-info-item" style="padding:0;background:none;margin-bottom:16px">
                    <div class="project-info-label">Deadline</div>
                    <div class="project-info-value" style="font-size:16px">${Components.formatDate(p.deadline)}</div>
                    <div style="color:${daysLeft > 0 ? 'var(--green)' : 'var(--red)'};font-size:12px;margin-top:4px">${daysLeft > 0 ? `${daysLeft} days remaining` : 'Deadline passed'}</div>
                  </div>
                  <hr class="divider"/>
                  <div class="project-info-item" style="padding:0;background:none">
                    <div class="project-info-label">Proposals</div>
                    <div class="project-info-value" style="font-size:16px">${p.proposalCount || 0}</div>
                  </div>

                  ${isOwner && p.status === 'in_progress' ? `
                  <hr class="divider"/>
                  <button class="btn btn-success btn-block" onclick="ProjectsPage.markComplete('${p._id}')">✓ Mark as Completed</button>` : ''}
                </div>

                ${p.client ? `
                <div class="card">
                  <div style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text3);margin-bottom:16px">Client</div>
                  <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
                    ${Components.avatar(p.client, 'md')}
                    <div>
                      <div style="font-weight:700;font-size:15px">${p.client.name}</div>
                      <div style="color:var(--text3);font-size:13px">${p.client.company || 'Independent'}</div>
                    </div>
                  </div>
                  <div style="display:flex;gap:8px;align-items:center;font-size:14px">
                    ${Components.stars(p.client.rating || 0)}
                    <span style="color:var(--text2)">${p.client.rating || 0} (${p.client.reviewCount || 0} reviews)</span>
                  </div>
                  <div style="margin-top:12px;font-size:13px;color:var(--text2)">📋 ${p.client.completedProjects || 0} projects posted</div>
                  ${Auth.isLoggedIn() && !isOwner ? `
                  <button class="btn btn-ghost btn-block" style="margin-top:16px" onclick="Router.navigate('/messages?to=${p.client._id}')">💬 Message</button>` : ''}
                </div>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `);

    if (isOwner) this.loadProposals(id);
    if (Auth.isFreelancer() && p.status === 'open') this.renderProposalForm(id, p);
  },

  async loadProposals(projectId) {
    const el = document.getElementById('proposalsList');
    if (!el) return;
    const res = await API.get(`/proposals/project/${projectId}`);
    if (!res.proposals?.length) {
      el.innerHTML = Components.empty('📄', 'No proposals yet', 'Proposals from freelancers will appear here.');
      return;
    }
    el.innerHTML = res.proposals.map(pr => `
      <div class="proposal-card" style="margin-bottom:16px">
        <div class="proposal-header">
          ${Components.avatar(pr.freelancer, 'md')}
          <div class="proposal-info">
            <div style="font-weight:700;font-size:15px;cursor:pointer" onclick="Router.navigate('/user/${pr.freelancer._id}')">${pr.freelancer.name}</div>
            <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
              ${Components.stars(pr.freelancer.rating || 0)}
              <span style="font-size:12px;color:var(--text3)">${pr.freelancer.rating || 0} · ${pr.freelancer.completedProjects || 0} done</span>
            </div>
            <div class="tags-wrap" style="margin-top:8px">${(pr.freelancer.skills || []).slice(0,3).map(s => `<span class="tag" style="font-size:11px">${s}</span>`).join('')}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div class="proposal-amount">${Components.formatMoney(pr.bidAmount)}</div>
            <div class="proposal-days">In ${pr.deliveryDays} days</div>
            <div style="margin-top:8px">${Components.statusBadge(pr.status)}</div>
          </div>
        </div>
        <p class="proposal-letter">${pr.coverLetter}</p>
        ${pr.status === 'pending' ? `
        <div class="proposal-actions">
          <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/messages?to=${pr.freelancer._id}')">💬 Chat</button>
          <button class="btn btn-danger btn-sm" onclick="ProjectsPage.rejectProposal('${pr._id}')">✕ Decline</button>
          <button class="btn btn-success btn-sm" onclick="ProjectsPage.acceptProposal('${pr._id}')">✓ Accept</button>
        </div>` : ''}
      </div>
    `).join('');
  },

  renderProposalForm(projectId, project) {
    const el = document.getElementById('proposalFormArea');
    if (!el) return;
    el.innerHTML = `
      <div id="propMsg" class="form-error" style="display:none;margin-bottom:16px"></div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Your Bid Amount ($)</label>
          <input type="number" id="propBid" class="form-input" placeholder="${project.budgetMin}" min="1" />
        </div>
        <div class="form-group">
          <label class="form-label">Delivery Time (days)</label>
          <input type="number" id="propDays" class="form-input" placeholder="7" min="1" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Cover Letter</label>
        <textarea id="propLetter" class="form-textarea" style="min-height:160px" placeholder="Introduce yourself and explain why you're the best fit for this project..."></textarea>
      </div>
      <button class="btn btn-primary" onclick="ProjectsPage.submitProposal('${projectId}')">📤 Submit Proposal</button>
    `;
  },

  async submitProposal(projectId) {
    const bid = document.getElementById('propBid').value;
    const days = document.getElementById('propDays').value;
    const letter = document.getElementById('propLetter').value.trim();
    const msgEl = document.getElementById('propMsg');

    msgEl.style.display = 'none';
    if (!bid || !days || !letter) {
      msgEl.textContent = 'Please fill in all fields.';
      msgEl.style.display = 'block'; return;
    }

    const res = await API.post('/proposals', {
      projectId, bidAmount: Number(bid), deliveryDays: Number(days), coverLetter: letter
    });
    if (res.success) {
      Components.toast('Proposal submitted! 🎉', 'success');
      document.getElementById('proposalFormArea').innerHTML = `<div class="badge badge-green" style="padding:16px;font-size:15px">✅ Proposal submitted successfully!</div>`;
    } else {
      msgEl.textContent = res.message;
      msgEl.style.display = 'block';
    }
  },

  async acceptProposal(proposalId) {
    if (!confirm('Accept this proposal? Other proposals will be declined.')) return;
    const res = await API.put(`/proposals/${proposalId}/accept`);
    if (res.success) {
      Components.toast('Proposal accepted! Project started.', 'success');
      location.reload();
    } else {
      Components.toast(res.message, 'error');
    }
  },

  async rejectProposal(proposalId) {
    const res = await API.put(`/proposals/${proposalId}/reject`);
    if (res.success) {
      Components.toast('Proposal declined.', 'info');
      location.reload();
    }
  },

  async markComplete(projectId) {
    if (!confirm('Mark this project as completed?')) return;
    const res = await API.post(`/projects/${projectId}/complete`);
    if (res.success) {
      Components.toast('Project completed! 🎉', 'success');
      location.reload();
    } else {
      Components.toast(res.message, 'error');
    }
  },

  openReviewModal(projectId, freelancerId) {
    Components.modal('⭐ Leave a Review', `
      <div class="form-group">
        <label class="form-label">Rating</label>
        <div style="display:flex;gap:8px;margin-top:4px" id="starRating">
          ${[1,2,3,4,5].map(n => `<span style="font-size:32px;cursor:pointer;opacity:0.4;transition:all 0.15s" id="star${n}" onclick="ProjectsPage.selectStar(${n})">★</span>`).join('')}
        </div>
        <input type="hidden" id="reviewRating" value="" />
      </div>
      <div class="form-group">
        <label class="form-label">Your Review</label>
        <textarea id="reviewComment" class="form-textarea" placeholder="Describe your experience working with this freelancer..."></textarea>
      </div>
    `, `
      <button class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="ProjectsPage.submitReview('${projectId}','${freelancerId}')">Submit Review</button>
    `);
  },

  selectStar(n) {
    document.getElementById('reviewRating').value = n;
    for (let i = 1; i <= 5; i++) {
      const star = document.getElementById(`star${i}`);
      star.style.opacity = i <= n ? '1' : '0.3';
      star.style.color = i <= n ? 'var(--yellow)' : '';
    }
  },

  async submitReview(projectId, revieweeId) {
    const rating = document.getElementById('reviewRating').value;
    const comment = document.getElementById('reviewComment').value.trim();
    if (!rating || !comment) { Components.toast('Please fill all fields', 'error'); return; }
    const res = await API.post('/reviews', { projectId, revieweeId, rating: Number(rating), comment });
    if (res.success) {
      Components.closeModal();
      Components.toast('Review submitted! ⭐', 'success');
    } else {
      Components.toast(res.message, 'error');
    }
  },

  // Post project form
  renderPostProject() {
    if (!Auth.isClient() && !Auth.isAdmin()) {
      Router.navigate('/login');
      return;
    }
    Router.render(`
      <div class="page-wrap container" style="max-width:760px">
        <div class="back-btn" onclick="history.back()">← Back</div>
        <div class="section-title" style="font-size:36px;margin-bottom:8px">Post a Project</div>
        <p style="color:var(--text2);margin-bottom:40px">Describe your project and find the perfect freelancer</p>

        <div id="postProjMsg" class="form-error" style="display:none;margin-bottom:20px"></div>

        <div class="settings-section">
          <div class="settings-section-title">📋 Project Details</div>
          <div class="form-group">
            <label class="form-label">Project Title *</label>
            <input type="text" id="ppTitle" class="form-input" placeholder="e.g. Build a responsive e-commerce website" />
          </div>
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select id="ppCat" class="form-select">
              <option value="">Select a category...</option>
              ${['Web Development','Mobile Development','Design','Writing','Marketing','Data Science','Video & Animation','Photography','Other']
                .map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Description *</label>
            <textarea id="ppDesc" class="form-textarea" style="min-height:200px" placeholder="Describe your project in detail: what you need, what deliverables you expect, any technical requirements..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Required Skills</label>
            <div class="skills-input-wrap">
              <input type="text" id="ppSkillInput" class="form-input" placeholder="Add a skill and press Enter" />
              <button class="btn btn-ghost" onclick="ProjectsPage.addSkill()">Add</button>
            </div>
            <div class="tags-wrap" id="ppSkillTags"></div>
            <input type="hidden" id="ppSkills" value="[]" />
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">💰 Budget & Timeline</div>
          <div class="form-group">
            <label class="form-label">Budget Type</label>
            <div style="display:flex;gap:12px">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px">
                <input type="radio" name="budgetType" value="fixed" checked style="accent-color:var(--accent)"> Fixed Price
              </label>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px">
                <input type="radio" name="budgetType" value="hourly" style="accent-color:var(--accent)"> Hourly Rate
              </label>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Min Budget ($) *</label>
              <input type="number" id="ppBudMin" class="form-input" placeholder="500" min="1" />
            </div>
            <div class="form-group">
              <label class="form-label">Max Budget ($) *</label>
              <input type="number" id="ppBudMax" class="form-input" placeholder="1000" min="1" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Deadline *</label>
            <input type="date" id="ppDeadline" class="form-input" min="${new Date().toISOString().split('T')[0]}" />
          </div>
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;color:var(--text2)">
            <input type="checkbox" id="ppUrgent" style="accent-color:var(--accent);width:16px;height:16px">
            <span>⚡ Mark as Urgent</span>
          </label>
        </div>

        <button class="btn btn-primary btn-lg" id="postProjBtn" onclick="ProjectsPage.submitProject()">🚀 Post Project</button>
      </div>
    `);

    document.getElementById('ppSkillInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.addSkill(); }
    });
  },

  ppSkillsList: [],
  addSkill() {
    const input = document.getElementById('ppSkillInput');
    const skill = input.value.trim();
    if (!skill || this.ppSkillsList.includes(skill)) { input.value = ''; return; }
    this.ppSkillsList.push(skill);
    input.value = '';
    this.renderSkillTags();
  },

  removeSkill(skill) {
    this.ppSkillsList = this.ppSkillsList.filter(s => s !== skill);
    this.renderSkillTags();
  },

  renderSkillTags() {
    const el = document.getElementById('ppSkillTags');
    if (el) el.innerHTML = this.ppSkillsList.map(s =>
      `<span class="skill-tag">${s}<span class="skill-tag-remove" onclick="ProjectsPage.removeSkill('${s}')">×</span></span>`
    ).join('');
    const hidden = document.getElementById('ppSkills');
    if (hidden) hidden.value = JSON.stringify(this.ppSkillsList);
  },

  async submitProject() {
    const title = document.getElementById('ppTitle').value.trim();
    const category = document.getElementById('ppCat').value;
    const description = document.getElementById('ppDesc').value.trim();
    const budgetMin = document.getElementById('ppBudMin').value;
    const budgetMax = document.getElementById('ppBudMax').value;
    const deadline = document.getElementById('ppDeadline').value;
    const isUrgent = document.getElementById('ppUrgent').checked;
    const budgetType = document.querySelector('input[name="budgetType"]:checked')?.value || 'fixed';
    const skills = this.ppSkillsList;

    const msgEl = document.getElementById('postProjMsg');
    const btn = document.getElementById('postProjBtn');
    msgEl.style.display = 'none';

    if (!title || !category || !description || !budgetMin || !budgetMax || !deadline) {
      msgEl.textContent = 'Please fill in all required fields.';
      msgEl.style.display = 'block'; return;
    }

    btn.disabled = true; btn.textContent = 'Posting...';
    const res = await API.post('/projects', { title, category, description, skills, budgetType, budgetMin: Number(budgetMin), budgetMax: Number(budgetMax), deadline, isUrgent });
    btn.disabled = false; btn.textContent = '🚀 Post Project';

    if (res.success) {
      this.ppSkillsList = [];
      Components.toast('Project posted! 🎉', 'success');
      Router.navigate(`/project/${res.project._id}`);
    } else {
      msgEl.textContent = res.message;
      msgEl.style.display = 'block';
    }
  }
};
