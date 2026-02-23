const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');

const router = express.Router();

async function loadOrderDependencies() {
  const [customerResult, productResult] = await Promise.all([
    pool.query('SELECT id, name FROM customers ORDER BY name ASC'),
    pool.query('SELECT id, sku, name, unit_price FROM products ORDER BY name ASC')
  ]);

  return {
    customers: customerResult.rows,
    products: productResult.rows
  };
}

router.get('/new', async (req, res, next) => {
  try {
    const { customers, products } = await loadOrderDependencies();
    return res.render('orders-new', {
      title: 'Nova Ordem de Venda',
      errors: [],
      data: { customer_id: '', notes: '', items: [] },
      customers,
      products
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.created_at, o.total_amount, c.name AS customer_name
       FROM orders o
       INNER JOIN customers c ON c.id = o.customer_id
       ORDER BY o.created_at DESC`
    );

    return res.render('orders-list', {
      title: 'Ordens de Venda',
      orders: rows
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).render('error', {
        title: 'Erro',
        message: 'ID de ordem inválido.'
      });
    }

    const orderResult = await pool.query(
      `SELECT o.id, o.created_at, o.total_amount, o.notes, c.name AS customer_name, c.email AS customer_email
       FROM orders o
       INNER JOIN customers c ON c.id = o.customer_id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).render('error', {
        title: 'Erro',
        message: 'Ordem não encontrada.'
      });
    }

    const itemsResult = await pool.query(
      `SELECT oi.quantity, oi.unit_price, oi.total_price, p.sku, p.name
       FROM order_items oi
       INNER JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1
       ORDER BY oi.id ASC`,
      [orderId]
    );

    return res.render('orders-detail', {
      title: `Ordem #${orderId}`,
      order: orderResult.rows[0],
      items: itemsResult.rows
    });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/',
  [
    body('customer_id').isInt({ gt: 0 }).withMessage('Cliente obrigatório.'),
    body('notes').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Observação inválida.'),
    body('items').isArray({ min: 1 }).withMessage('Adicione pelo menos um item.'),
    body('items.*.product_id').isInt({ gt: 0 }).withMessage('Produto inválido.'),
    body('items.*.quantity').isInt({ gt: 0, lt: 10000 }).withMessage('Quantidade inválida.')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    const { customer_id, notes, items } = req.body;

    if (!errors.isEmpty()) {
      try {
        const { customers, products } = await loadOrderDependencies();
        return res.status(400).render('orders-new', {
          title: 'Nova Ordem de Venda',
          errors: errors.array(),
          data: { customer_id, notes, items: Array.isArray(items) ? items : [] },
          customers,
          products
        });
      } catch (err) {
        return next(err);
      }
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const orderInsert = await client.query(
        'INSERT INTO orders (customer_id, notes, total_amount) VALUES ($1, $2, 0) RETURNING id',
        [customer_id, notes || null]
      );

      const orderId = orderInsert.rows[0].id;
      let totalAmount = 0;

      for (const item of items) {
        const productId = Number(item.product_id);
        const quantity = Number(item.quantity);

        const productQuery = await client.query(
          'SELECT id, unit_price FROM products WHERE id = $1',
          [productId]
        );

        if (productQuery.rows.length === 0) {
          const error = new Error(`Produto ${productId} não encontrado.`);
          error.status = 400;
          throw error;
        }

        const unitPrice = Number(productQuery.rows[0].unit_price);
        const totalPrice = unitPrice * quantity;
        totalAmount += totalPrice;

        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, productId, quantity, unitPrice, totalPrice]
        );
      }

      await client.query('UPDATE orders SET total_amount = $1 WHERE id = $2', [totalAmount, orderId]);
      await client.query('COMMIT');

      return res.redirect(`/orders/${orderId}`);
    } catch (err) {
      await client.query('ROLLBACK');
      return next(err);
    } finally {
      client.release();
    }
  }
);

module.exports = router;
