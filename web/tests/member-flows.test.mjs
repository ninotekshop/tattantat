import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionFetch, safeReturnPath } from '../lib/session-fetch.ts';
import { moneyLabel, orderActions } from '../lib/order-ui.ts';
const old = { accessToken: 'old', refreshToken: 'refresh-old', user: { id: 'a', fullName: 'A' } };
const next = { ...old, accessToken: 'new', refreshToken: 'refresh-new' };
const response = (status, data) => new Response(JSON.stringify({ success: status === 200, data }), { status });
function fixture(fetcher) {
  let session = structuredClone(old), cleared = 0;
  const request = createSessionFetch({ read: () => session, save: value => { session = value; }, clear: () => { session = null; cleared++; }, fetch: fetcher, base: '/api' });
  return { request, get session() { return session; }, get cleared() { return cleared; }, set: value => { session = value; } };
}
test('concurrent 401 requests share one refresh and preserve idempotency key/body', async () => {
  let refreshes = 0, retries = 0;
  const client = fixture(async (url, init) => {
    if (url.endsWith('/auth/refresh')) { refreshes++; await new Promise(resolve => setTimeout(resolve, 10)); return response(200, next); }
    if (init.headers.get('Authorization') === 'Bearer old') return response(401);
    retries++; assert.equal(init.headers.get('Idempotency-Key'), 'fixed-key'); assert.equal(init.body, '{"productId":"p"}'); return response(200, { id: 1 });
  });
  const options = { method: 'POST', headers: { 'Idempotency-Key': 'fixed-key' }, body: '{"productId":"p"}' };
  await Promise.all([client.request('/orders', options, 'old'), client.request('/orders', options, 'old')]);
  assert.equal(refreshes, 1); assert.equal(retries, 2); assert.equal(client.session.accessToken, 'new');
});
test('logout during refresh cannot resurrect session or retry mutation', async () => {
  let calls = 0;
  const client = fixture(async url => { calls++; if (url.endsWith('/auth/refresh')) { client.set(null); return response(200, next); } return response(401); });
  await assert.rejects(client.request('/orders', { method: 'POST' }, 'old'), /thay đổi/);
  assert.equal(client.session, null); assert.equal(calls, 2);
});
test('account switch during refresh cannot replace the new user', async () => {
  const client = fixture(async url => { if (url.endsWith('/auth/refresh')) { client.set({ ...next, user: { id: 'b' } }); return response(200, next); } return response(401); });
  await assert.rejects(client.request('/me', {}, 'old'), /thay đổi/); assert.equal(client.session.user.id, 'b');
});
test('network and server failures do not erase saved session or retry POST', async () => {
  for (const failure of ['network', 'server']) {
    let calls = 0;
    const client = fixture(async url => { calls++; if (!url.endsWith('/auth/refresh')) return response(401); if (failure === 'network') throw new Error('offline'); return response(503); });
    await assert.rejects(client.request('/orders', { method: 'POST' }, 'old')); assert.equal(client.cleared, 0); assert.equal(calls, 2);
  }
  let calls = 0; const client = fixture(async () => { calls++; throw new Error('timeout'); });
  await assert.rejects(client.request('/orders', { method: 'POST' }, 'old')); assert.equal(calls, 1);
});
test('invalid refresh clears session but rejected retried access never loops', async () => {
  const client = fixture(async () => response(401)); await assert.rejects(client.request('/me', {}, 'old')); assert.equal(client.cleared, 1);
  let count = 0; const retry = fixture(async url => { count++; return url.endsWith('/auth/refresh') ? response(200, next) : response(401); });
  assert.equal((await retry.request('/me', {}, 'old')).status, 401); assert.equal(count, 3);
});
test('login failure and anonymous reads never trigger session refresh', async () => {
  let count = 0; const client = fixture(async () => { count++; return response(401); });
  await client.request('/auth/login', { method: 'POST' }); await client.request('/products'); assert.equal(count, 2); assert.equal(client.cleared, 0);
});
test('return navigation cannot redirect outside this site', () => {
  for (const path of ['https://evil.invalid', '//evil.invalid', '/\\evil.invalid', '/ \nevil.invalid', null]) assert.equal(safeReturnPath(path), '/account');
  assert.equal(safeReturnPath('/products/123?x=1#info'), '/products/123?x=1#info');
});
test('money remains exact above Number.MAX_SAFE_INTEGER', () => {
  assert.equal(moneyLabel('9007199254740993.00'), '9.007.199.254.740.993 đ'); assert.equal(moneyLabel('2.25'), 'Chưa có giá');
});
test('order actions respect role and terminal states', () => {
  const order = { buyer_id: 'buyer', seller_id: 'seller', order_status: 'PENDING' };
  assert.deepEqual(orderActions(order, 'stranger'), []); assert.deepEqual(orderActions(order, 'buyer'), ['CANCELLED']);
  assert.deepEqual(orderActions({ ...order, order_status: 'DELIVERED' }, 'buyer'), []);
  assert.deepEqual(orderActions({ ...order, order_status: 'DELIVERED' }, 'seller'), ['COMPLETED']);
  for (const status of ['COMPLETED', 'CANCELLED', 'REFUNDED']) assert.deepEqual(orderActions({ ...order, order_status: status }, 'seller'), []);
});
