const path = require('path');
const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const methodOverride = require('method-override');
const cors = require('cors');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();

const { connectToDatabase } = require('./config/database');
const mongoose = require('mongoose');
const Product = require('./models/Product');

// Routers
const authApiRouter = require('./routes/api.auth');
const viewAuthRouter = require('./routes/view.auth');
const viewProductsRouter = require('./routes/view.products');
const viewProfileRouter = require('./routes/view.profile');
const viewUsersRouter = require('./routes/view.users');
const viewDashboardRouter = require('./routes/view.dashboard');
const apiBrandsRouter = require('./routes/api.brands');
const apiPerfumesRouter = require('./routes/api.perfumes');

const { attachUser } = require('./middleware/authView');
const { requireRole } = require('./middleware/authorize');

const app = express();

// DB
connectToDatabase();

// Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// app.use(expressLayouts); // Tắt express-ejs-layouts
// app.set('layout', 'layouts/main');

// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(methodOverride('_method'));
// Also support query param ?_method=DELETE for links/forms
app.use(methodOverride(function (req) {
  if (req.query && typeof req.query._method === 'string') {
    return req.query._method;
  }
  return undefined;
}));

// <-- thêm session trước khi mount routes
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'session_secret',
    resave: false,
    saveUninitialized: false,
  })
);

// gắn user từ session vào req.user
app.use(attachUser);

// static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes: mount routers (đảm bảo /products được mount)
app.use('/auth', authApiRouter);        // API auth
app.use('/brands', apiBrandsRouter); // admin-only CRUD
app.use('/perfumes', apiPerfumesRouter); // admin-only CRUD

app.use('/auth', viewAuthRouter);       // view signin
app.use('/products', viewProductsRouter); // <-- mount products router here
// alias /perfumes to the same router
app.use('/perfumes', viewProductsRouter);
app.use('/profile', viewProfileRouter);
app.use('/users', viewUsersRouter);
app.use('/dashboard', requireRole('admin'), viewDashboardRouter);

// Root route - redirect to appropriate page
app.get('/', (req, res) => {
  if (!req.user) return res.redirect('/auth/signin');
  if (req.user.role === 'admin') return res.redirect('/dashboard');
  return res.redirect('/products');
});

// debug routes (place AFTER all app.use(...) router mounts)
app.get('/test-products', (req, res) => res.send('OK - test-products route working'));

app.get('/debug/products', async (req, res) => {
  try {
    const docs = await Product.find().select('_id name').lean();
    res.json(docs.map(d => ({ id: String(d._id), name: d.name || null })));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/debug/product/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const valid = mongoose.isValidObjectId(id);
    const prod = valid ? await Product.findById(id).lean() : null;
    res.json({ id, validObjectId: valid, found: !!prod, product: prod });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// move/ensure 404 handler is LAST in the file
app.use((req, res, next) => {
  res.status(404);
  if (req.accepts('html')) return res.render('errors/404');
  res.json({ message: 'Not Found' });
});

module.exports = app;


