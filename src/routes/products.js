const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');

const router = express.Router();

router.get('/new', (req, res) => {
  res.render('products-new', { title: 'Novo Produto', errors: [], data: {} });
});

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, sku, name, unit_price, created_at FROM products ORDER BY created_at DESC'
    );
    res.render('products-list', { title: 'Produtos', products: rows });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  [
    body('sku').trim().isLength({ min: 1, max: 50 }).withMessage('SKU obrigatório.'),
    body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Nome inválido.'),
    body('unit_price').isFloat({ gt: 0 }).withMessage('Preço deve ser maior que 0.')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    const { sku, name, unit_price } = req.body;

    if (!errors.isEmpty()) {
      return res.status(400).render('products-new', {
        title: 'Novo Produto',
        errors: errors.array(),
        data: { sku, name, unit_price }
      });
    }

    try {
      await pool.query(
        'INSERT INTO products (sku, name, unit_price) VALUES ($1, $2, $3)',
        [sku, name, unit_price]
      );
      return res.redirect('/products');
    } catch (err) {
      if (err.code === '23505') {
        return res.status(400).render('products-new', {
          title: 'Novo Produto',
          errors: [{ msg: 'SKU já cadastrado.' }],
          data: { sku, name, unit_price }
        });
      }
      return next(err);
    }
  }
);

module.exports = router;
