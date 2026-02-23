const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');

const router = express.Router();

router.get('/new', (req, res) => {
  res.render('customers-new', { title: 'Novo Cliente', errors: [], data: {} });
});

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, created_at FROM customers ORDER BY created_at DESC'
    );
    res.render('customers-list', { title: 'Clientes', customers: rows });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 3, max: 100 }).withMessage('Nome deve ter entre 3 e 100 caracteres.'),
    body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
    body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 20 }).withMessage('Telefone inválido.')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    const { name, email, phone } = req.body;

    if (!errors.isEmpty()) {
      return res.status(400).render('customers-new', {
        title: 'Novo Cliente',
        errors: errors.array(),
        data: { name, email, phone }
      });
    }

    try {
      await pool.query(
        'INSERT INTO customers (name, email, phone) VALUES ($1, $2, $3)',
        [name, email, phone || null]
      );
      return res.redirect('/customers');
    } catch (err) {
      if (err.code === '23505') {
        return res.status(400).render('customers-new', {
          title: 'Novo Cliente',
          errors: [{ msg: 'Email já cadastrado.' }],
          data: { name, email, phone }
        });
      }
      return next(err);
    }
  }
);

module.exports = router;
