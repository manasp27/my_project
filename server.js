const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'frontend')));

// API Routes
app.use('/api/auth',      require('./backend/routes/auth'));
app.use('/api/users',     require('./backend/routes/users'));
app.use('/api/projects',  require('./backend/routes/projects'));
app.use('/api/proposals', require('./backend/routes/proposals'));
app.use('/api/messages',  require('./backend/routes/messages'));
app.use('/api/reviews',   require('./backend/routes/reviews'));
app.use('/api/payments',  require('./backend/routes/payments'));
app.use('/api/admin',     require('./backend/routes/admin'));

// SPA fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(PORT, () => console.log(`🚀 Server → http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌ DB Error:', err.message); process.exit(1); });
