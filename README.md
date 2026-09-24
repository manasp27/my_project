# ⚡ FreeLancr — Full-Stack Freelancing Platform

A complete, production-grade freelancing platform built with Node.js, Express, MongoDB, and Vanilla JS.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB running locally (`mongod`)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (edit if needed)
# .env is already pre-configured for local development

# 3. Start MongoDB (if not already running)
mongod

# 4. Run the development server
npm run dev

# 5. Open in browser
# http://localhost:5000
```

---

## 📁 Project Structure

```
freelance-platform/
├── server.js                    # Express entry point
├── .env                         # Environment variables
├── package.json
├── uploads/                     # Avatar uploads (auto-created)
│
├── backend/
│   ├── middleware/
│   │   └── auth.js              # JWT protect + authorize middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Proposal.js
│   │   ├── Message.js
│   │   ├── Review.js
│   │   └── Payment.js
│   └── routes/
│       ├── auth.js              # Register, Login, Me
│       ├── users.js             # Profiles, freelancers, notifications
│       ├── projects.js          # CRUD, search, filter
│       ├── proposals.js         # Submit, accept, reject, withdraw
│       ├── messages.js          # Conversations, send, read
│       ├── reviews.js           # Post reviews, user reviews
│       ├── payments.js          # Deposit, release, history
│       └── admin.js             # Stats, ban/unban, delete, flag
│
└── frontend/
    ├── index.html               # SPA shell
    ├── css/
    │   ├── main.css             # Design system, layout, base components
    │   └── components.css       # Page-specific styles
    └── js/
        ├── api.js               # Centralized fetch wrapper
        ├── auth.js              # Auth state + notifications
        ├── router.js            # Client-side SPA router
        ├── components.js        # Reusable UI components
        ├── app.js               # Route definitions + app init
        └── pages/
            ├── home.js          # Landing page
            ├── auth.js          # Login + Register
            ├── projects.js      # Browse, detail, post, proposals
            ├── freelancers.js   # Browse + filter freelancers
            ├── dashboard.js     # Client/Freelancer dashboard
            ├── profile.js       # View + edit profile
            ├── messages.js      # Real-time-style messaging
            ├── payments.js      # Wallet + transactions
            └── admin.js         # Admin panel
```

---

## ✅ Features Implemented

| Module | Features |
|--------|----------|
| **Auth** | Register (client/freelancer), Login, JWT, Logout, Role-based access |
| **Profiles** | Create/Edit, Avatar upload, Skills, Portfolio, Public profiles |
| **Projects** | Post, Edit, Delete, Search, Filter (budget, category, skills) |
| **Proposals** | Submit, Edit, Withdraw, Accept/Reject with notifications |
| **Messaging** | Real-time polling, Conversations list, Chat bubbles |
| **Payments** | Wallet deposit, Payment release, Transaction history, Receipts |
| **Reviews** | Post-completion reviews for both roles, Average rating update |
| **Notifications** | Bell dropdown, Unread count, Mark all read |
| **Admin** | Stats dashboard, Ban/unban users, Flag/delete projects, Dispute panel |
| **Search** | Full-text project search, Freelancer skill/category/rating filter |

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Mongoose (MongoDB), JWT, bcryptjs, Multer
- **Frontend**: Vanilla JS SPA, Custom CSS (no framework), Google Fonts
- **Design**: Dark theme, CSS variables, Syne + DM Sans fonts

---

## 👤 Test Accounts

Register new accounts via the UI, or create them manually. To make an admin:

```js
// In MongoDB shell or Compass
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `MONGO_URI` | `mongodb://localhost:27017/freelanceplatform` | MongoDB connection |
| `JWT_SECRET` | `your_super_secret...` | **Change in production!** |
| `JWT_EXPIRE` | `30d` | Token expiry |
