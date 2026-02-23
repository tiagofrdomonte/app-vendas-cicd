const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');

test('GET / should return 200', async () => {
  const response = await request(app).get('/');
  assert.equal(response.statusCode, 200);
  assert.match(response.text, /Sistema de Vendas/);
});
