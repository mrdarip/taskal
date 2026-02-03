require('dotenv').config();
const express = require('express');
const path = require('path');
const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
app.use('/admin', adminRouter);

// Err handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Error interno del servidor');
});

// Start server
app.listen(PORT, () => {
  console.log(`server running in http://localhost:${PORT}`);
  console.log(`Index: http://localhost:${PORT}/`);
  console.log(`Admin (only actual browsers): http://localhost:${PORT}/admin`);
});
