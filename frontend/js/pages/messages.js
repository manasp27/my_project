// pages/messages.js
const MessagesPage = {
  activeConvId: null,
  activeReceiverId: null,
  pollInterval: null,

  async render(query = {}) {
    if (!Auth.isLoggedIn()) { Router.navigate('/login'); return; }

    Router.render(`
      <div style="padding-top:var(--nav-h);height:100vh;display:flex;flex-direction:column">
        <div style="flex:1;overflow:hidden;padding:20px 24px">
          <div class="messages-layout" style="height:100%">
            <!-- Conversations sidebar -->
            <div class="conversations-list" id="convList">
              <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                <div style="font-family:var(--font-display);font-size:16px;font-weight:700">Messages</div>
              </div>
              <div id="convListInner">${Components.loader()}</div>
            </div>

            <!-- Chat area -->
            <div class="chat-area" id="chatArea">
              <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:var(--text3)" id="chatPlaceholder">
                <div style="font-size:48px">💬</div>
                <div style="font-size:16px;font-weight:600">Select a conversation</div>
                <div style="font-size:14px">Choose from the left to start chatting</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);

    await this.loadConversations();

    // If opened with ?to=userId, open that chat immediately
    if (query.to) {
      await this.openChat(query.to);
    }
  },

  async loadConversations() {
    const el = document.getElementById('convListInner');
    if (!el) return;

    const res = await API.get('/messages/conversations');
    if (!res.conversations?.length) {
      el.innerHTML = `<div style="padding:32px 20px;text-align:center;color:var(--text3);font-size:14px">No conversations yet.<br/>Message a client or freelancer to start.</div>`;
      return;
    }

    el.innerHTML = res.conversations.map(c => `
      <div class="conv-item ${this.activeConvId === c.conversationId ? 'active' : ''}"
           id="conv-${c.conversationId}"
           onclick="MessagesPage.openChat('${c.other._id}', '${c.conversationId}')">
        ${Components.avatar(c.other, 'sm')}
        <div class="conv-info">
          <div class="conv-name">${c.other.name}</div>
          <div class="conv-last">${c.lastMessage?.content || ''}</div>
        </div>
        ${c.unread > 0 ? `<div class="conv-unread">${c.unread}</div>` : ''}
      </div>
    `).join('');
  },

  async openChat(receiverId, convId) {
    this.activeReceiverId = receiverId;
    this.activeConvId = convId;
    if (this.pollInterval) clearInterval(this.pollInterval);

    // Highlight active conversation
    document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));
    if (convId) {
      const el = document.getElementById(`conv-${convId}`);
      if (el) el.classList.add('active');
    }

    // Get receiver info
    const userRes = await API.get(`/users/${receiverId}`);
    const receiver = userRes.user || { name: 'User', _id: receiverId };

    // Render chat area
    const chatArea = document.getElementById('chatArea');
    if (!chatArea) return;
    chatArea.innerHTML = `
      <div class="chat-header">
        ${Components.avatar(receiver, 'sm')}
        <div>
          <div style="font-weight:700;font-size:15px;cursor:pointer" onclick="Router.navigate('/user/${receiver._id}')">${receiver.name}</div>
          <div style="font-size:12px;color:var(--text3);text-transform:capitalize">${receiver.role || ''}</div>
        </div>
      </div>
      <div class="chat-messages" id="chatMessages">${Components.loader()}</div>
      <div class="chat-input-area">
        <textarea class="chat-input" id="chatInput" placeholder="Type your message..." rows="1"
          onkeydown="MessagesPage.handleKey(event)"></textarea>
        <button class="chat-send-btn" onclick="MessagesPage.sendMessage()">Send ↑</button>
      </div>
    `;

    await this.loadMessages();
    this.pollInterval = setInterval(() => this.loadMessages(false), 5000);
  },

  async loadMessages(scroll = true) {
    if (!this.activeReceiverId) return;
    const res = await API.get(`/messages/${this.activeReceiverId}`);
    const el = document.getElementById('chatMessages');
    if (!el) return;

    if (!res.messages?.length) {
      el.innerHTML = `<div style="text-align:center;color:var(--text3);font-size:14px;margin:auto">Start the conversation!</div>`;
      return;
    }

    el.innerHTML = res.messages.map(m => {
      const isMine = m.sender._id === Auth.user._id || m.sender === Auth.user._id;
      return `
        <div>
          <div class="msg-bubble ${isMine ? 'msg-sent' : 'msg-received'}">
            ${m.content}
            <div class="msg-time">${Components.timeAgo(m.createdAt)}</div>
          </div>
        </div>`;
    }).join('');

    if (scroll) el.scrollTop = el.scrollHeight;
    Auth.loadNotifications();
  },

  handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  },

  async sendMessage() {
    const input = document.getElementById('chatInput');
    const content = input?.value.trim();
    if (!content || !this.activeReceiverId) return;

    input.value = '';
    const res = await API.post('/messages', { receiverId: this.activeReceiverId, content });
    if (res.success) {
      await this.loadMessages();
      await this.loadConversations();
    } else {
      Components.toast(res.message, 'error');
    }
  },

  destroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }
};
