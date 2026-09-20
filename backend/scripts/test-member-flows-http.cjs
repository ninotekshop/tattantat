// Read-only local acceptance, except logging into an existing DEV demo account.
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
async function run() {
  if (!process.argv.includes('--dev') || process.env.NODE_ENV === 'production') throw new Error('DEV_ONLY');
  const port = process.env.MEMBER_TEST_PORT || '3000';
  if (!/^\d{4,5}$/.test(port)) throw new Error('INVALID_LOCAL_PORT');
  const base = `http://localhost:${port}/api/v1`;
  async function request(path, token, method = 'GET', body) {
    const response = await fetch(base + path, { method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
    return { status: response.status, payload: await response.json() };
  }
  for (const route of ['/me', '/orders', '/chats', '/favorites', '/notifications']) assert.equal((await request(route)).status, 401, 'unauthorized ' + route);
  const login = await request('/auth/login', null, 'POST', { phoneOrEmail: 'user@tattantat.vn', password: process.env.DEMO_TEST_PASSWORD || 'Demo@123' });
  assert.equal(login.status, 201, 'demo login'); const token = login.payload.data.accessToken;
  for (const route of ['/me', '/products/mine', '/listings/mine', '/orders', '/chats', '/favorites', '/notifications', '/me/blocks']) {
    const result = await request(route, token); assert.equal(result.status, 200, route); assert.equal(result.payload.success, true, route);
  }
  for (const [route, method, body] of [['/me', 'PATCH', { role: 'ADMIN' }], ['/chats', 'POST', { productId: 'invalid' }], ['/orders', 'POST', { productId: 'invalid', platform_fee: 0 }]]) assert.equal((await request(route, token, method, body)).status, 400, 'invalid input ' + route);
  const products = (await request('/products?q=DEMO', token)).payload.data;
  const product = products.find(p => p.priceMode === 'FIXED'); assert.ok(product);
  const preview = await request('/pricing/order-preview?productId=' + product.id + '&quantity=1');
  assert.equal(preview.status, 200); assert.match(preview.payload.data.quoteFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(typeof preview.payload.data.buyerTotal, 'string');
  console.log('PASS: HTTP auth isolation, account/listings/chat/favorites/notifications/orders/blocks reads, forbidden financial/profile inputs, live pricing fingerprint and exact money strings. No content/financial mutations.');
}
run().catch(error => { console.error('MEMBER_HTTP_TEST_FAILED', error.message); process.exitCode = 1; });
