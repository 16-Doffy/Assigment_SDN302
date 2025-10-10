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

// Routers
const apiCoursesRouter = require('./routes/api.courses');
const authApiRouter = require('./routes/api.auth');
const viewAuthRouter = require('./routes/view.auth');
const viewSectionsRouter = require('./routes/view.sections');
const viewProductsRouter = require('./routes/view.products');
const viewProfileRouter = require('./routes/view.profile');

const { attachUser } = require('./middleware/authView');

const app = express();

// DB
connectToDatabase();

// Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(methodOverride('_method'));

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
app.use('/api/courses', apiCoursesRouter);

app.use('/auth', viewAuthRouter);       // view signin
app.use('/view/sections', viewSectionsRouter);
app.use('/products', viewProductsRouter); // <-- mount products router here
app.use('/profile', viewProfileRouter);

// home
app.get('/', (req, res) => res.redirect('/auth/signin'));

// Error handler
app.use((req, res, next) => {
  res.status(404);
  if (req.accepts('html')) return res.render('errors/404');
  res.json({ message: 'Not Found' });
});

// debug: liệt kê route đã mount
app.get('/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(mw => {
    if (mw.route && mw.route.path) {
      routes.push({ path: mw.route.path, methods: mw.route.methods });
    } else if (mw.name === 'router' && mw.handle && mw.handle.stack) {
      mw.handle.stack.forEach(r => {
        if (r.route && r.route.path) routes.push({ path: r.route.path, methods: r.route.methods });
      });
    }
  });
  res.json(routes);
});

// kiểm tra nhanh: trả về text nếu /products được mount (bỏ sau khi đã debug)
app.get('/test-products', (req, res) => res.send('OK - test-products route working'));

module.exports = app;


