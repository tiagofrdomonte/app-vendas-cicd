require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const homeRoutes = require('./routes/home');
const customerRoutes = require('./routes/customers');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const { errorHandler } = require('./middleware/error-handler');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:']
      }
    }
  })
);

app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 300),
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.appName = process.env.APP_NAME || 'Sales App';
  next();
});

app.use('/', homeRoutes);
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);

app.use((req, res) => {
  res.status(404).render('error', { title: '404', message: 'Página não encontrada.' });
});

app.use(errorHandler);

module.exports = app;
