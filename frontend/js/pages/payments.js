// pages/payments.js
const PaymentsPage = {
  async render() {
    if (!Auth.isLoggedIn()) { Router.navigate('/login'); return; }

    Router.render(`
      <div class="page-wrap container" style="max-width:900px">
        <div style="margin-bottom:40px">
          <div class="section-title" style="font-size:36px">Wallet & Payments</div>
          <p style="color:var(--text2);margin-top:6px">Manage your funds and transaction history</p>
        </div>

        <!-- Wallet card -->
        <div class="wallet-card" id="walletCard">
          <div class="wallet-label">Available Balance</div>
          <div class="wallet-amount" id="walletAmount">Loading...</div>
          <div class="wallet-actions">
            <button class="wallet-btn" onclick="PaymentsPage.openDepositModal()">+ Add Funds</button>
            ${Auth.isClient() ? `<button class="wallet-btn" onclick="Router.navigate('/dashboard')">Release Payment</button>` : ''}
          </div>
        </div>

        <!-- Stats row -->
        <div class="grid-3" style="margin-bottom:40px" id="payStats">
          ${Components.loader()}
        </div>

        <!-- Transaction history -->
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
            <div style="font-family:var(--font-display);font-size:18px;font-weight:700">Transaction History</div>
            <button class="btn btn-ghost btn-sm" onclick="PaymentsPage.loadHistory()">↺ Refresh</button>
          </div>
          <div id="txHistory">${Components.loader()}</div>
        </div>
      </div>
    `);

    this.loadWallet();
    this.loadHistory();
  },

  async loadWallet() {
    const res = await API.get('/auth/me');
    if (!res.success) return;
    const u = res.user;
    const amountEl = document.getElementById('walletAmount');
    if (amountEl) amountEl.textContent = Components.formatMoney(u.walletBalance || 0);

    const statsEl = document.getElementById('payStats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat-card">
          <div class="stat-label">Total Spent</div>
          <div class="stat-value" style="color:var(--red)">${Components.formatMoney(u.totalSpent || 0)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Earned</div>
          <div class="stat-value" style="color:var(--green)">${Components.formatMoney(u.totalEarnings || 0)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Wallet Balance</div>
          <div class="stat-value">${Components.formatMoney(u.walletBalance || 0)}</div>
        </div>
      `;
    }
  },

  async loadHistory() {
    const el = document.getElementById('txHistory');
    if (el) el.innerHTML = Components.loader();
    const res = await API.get('/payments/history');
    if (!el || !document.getElementById('txHistory')) return;

    if (!res.payments?.length) {
      el.innerHTML = Components.empty('💸', 'No transactions yet', 'Add funds to get started.');
      return;
    }

    el.innerHTML = res.payments.map(tx => {
      const isCredit = tx.payee?._id === Auth.user._id || tx.type === 'deposit';
      const typeIcon = { deposit: '💳', release: '💸', refund: '↩️', withdrawal: '⬆️' };
      return `
        <div class="tx-row">
          <div class="tx-icon ${isCredit ? 'credit' : 'debit'}">${typeIcon[tx.type] || '💰'}</div>
          <div class="tx-info">
            <div class="tx-desc">${tx.description || tx.type}</div>
            <div class="tx-date">
              ${Components.formatDate(tx.createdAt)}
              <span style="margin-left:8px;font-size:11px;background:var(--bg3);padding:2px 8px;border-radius:4px">
                ID: ${(tx.transactionId || '').slice(0, 12)}...
              </span>
            </div>
            ${tx.project ? `<div style="font-size:12px;color:var(--accent2);margin-top:2px">📋 ${tx.project.title}</div>` : ''}
          </div>
          <div>
            <div class="tx-amount ${isCredit ? 'credit' : 'debit'}">${isCredit ? '+' : '-'}${Components.formatMoney(tx.amount)}</div>
            <div style="font-size:11px;text-align:right;margin-top:4px">
              <span class="badge ${tx.status === 'completed' ? 'badge-green' : 'badge-yellow'}" style="font-size:10px">${tx.status}</span>
            </div>
            <button class="btn btn-ghost btn-sm" style="margin-top:8px;font-size:11px" onclick="PaymentsPage.viewReceipt('${tx._id}', '${tx.transactionId}', '${tx.type}', ${tx.amount}, '${tx.description || tx.type}', '${tx.createdAt}')">🧾 Receipt</button>
          </div>
        </div>
      `;
    }).join('');
  },

  openDepositModal() {
    Components.modal('💳 Add Funds to Wallet', `
      <p style="color:var(--text2);font-size:14px;margin-bottom:24px">
        Add funds to your wallet to pay for projects. This is a simulated payment — no real money is involved.
      </p>
      <div class="form-group">
        <label class="form-label">Amount (USD)</label>
        <input type="number" id="depositAmount" class="form-input" placeholder="Enter amount" min="10" style="font-size:20px;padding:16px" />
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">
        ${[50, 100, 250, 500].map(n => `
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('depositAmount').value=${n}">$${n}</button>
        `).join('')}
      </div>
      <div id="depositError" class="form-error" style="display:none;margin-top:12px"></div>
    `, `
      <button class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="PaymentsPage.submitDeposit()">Add Funds</button>
    `);
  },

  async submitDeposit() {
    const amount = Number(document.getElementById('depositAmount').value);
    const errEl = document.getElementById('depositError');
    errEl.style.display = 'none';

    if (!amount || amount < 10) {
      errEl.textContent = 'Minimum deposit is $10.';
      errEl.style.display = 'block'; return;
    }

    const res = await API.post('/payments/deposit', { amount });
    if (res.success) {
      Components.closeModal();
      Auth.user.walletBalance = res.walletBalance;
      localStorage.setItem('user', JSON.stringify(Auth.user));
      Components.toast(`$${amount} added to your wallet! 💰`, 'success');
      this.loadWallet();
      this.loadHistory();
    } else {
      errEl.textContent = res.message;
      errEl.style.display = 'block';
    }
  },

  viewReceipt(id, txId, type, amount, desc, date) {
    Components.modal('🧾 Payment Receipt', `
      <div style="background:var(--bg3);border-radius:16px;padding:28px;text-align:center;margin-bottom:20px">
        <div style="font-size:48px;margin-bottom:8px">✅</div>
        <div style="font-family:var(--font-display);font-size:32px;font-weight:800;color:var(--green)">
          ${Components.formatMoney(amount)}
        </div>
        <div style="color:var(--text2);margin-top:6px;text-transform:capitalize">${type} · ${type === 'deposit' || type === 'release' ? 'Completed' : 'Processed'}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;justify-content:space-between;font-size:14px">
          <span style="color:var(--text3)">Transaction ID</span>
          <span style="font-family:monospace;font-size:12px">${txId || id}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:14px">
          <span style="color:var(--text3)">Description</span>
          <span style="max-width:240px;text-align:right">${desc}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:14px">
          <span style="color:var(--text3)">Date</span>
          <span>${Components.formatDate(date)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:14px">
          <span style="color:var(--text3)">Platform</span>
          <span>FreeLancr</span>
        </div>
      </div>
    `);
  }
};
