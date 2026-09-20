// DEV acceptance: real PostgreSQL, ephemeral users/products, unconditional rollback.
require('dotenv').config({ quiet: true });
require('reflect-metadata');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const { ChatService } = require('../dist/chat/chat.service');
const { FavoritesService } = require('../dist/favorites/favorites.service');
const { OrdersController } = require('../dist/orders/orders.controller');
const { PricingService } = require('../dist/pricing/pricing.service');
const { IdempotencyService } = require('../dist/finance/idempotency.service');
const { LedgerService } = require('../dist/finance/ledger.service');
const { LedgerWriterService } = require('../dist/finance/ledger-writer.service');

async function run() {
  if (!process.argv.includes('--dev') || process.env.NODE_ENV === 'production') throw new Error('DEV_ONLY');
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const tag = randomUUID();
  try {
    await client.query('BEGIN');
    let serial = 0;
    const db = {
      query: (...args) => client.query(...args),
      transaction: async work => {
        const savepoint = 'member_test_' + ++serial;
        await client.query('SAVEPOINT ' + savepoint);
        try { const result = await work(client); await client.query('RELEASE SAVEPOINT ' + savepoint); return result; }
        catch (error) { await client.query('ROLLBACK TO SAVEPOINT ' + savepoint); throw error; }
      },
    };
    const notices = { create: async () => null }; // Never contact Firebase from tests.
    const users = [];
    for (const role of ['buyer', 'seller', 'outsider']) users.push((await client.query("INSERT INTO users(email,full_name,password_hash,role) VALUES($1,$2,'disabled','USER') RETURNING id", [`member-${role}-${tag}@example.invalid`, 'Rollback ' + role])).rows[0].id);
    const [buyer, seller, outsider] = users;
    const category = (await client.query("SELECT id FROM categories WHERE status='ACTIVE' LIMIT 1")).rows[0].id;
    const product = (await client.query("INSERT INTO products(seller_id,category_id,title,slug,price,condition,status,published_at) VALUES($1,$2,'Rollback member product',$3,10000000,'USED_GOOD','ACTIVE',NOW()) RETURNING id", [seller, category, 'member-' + tag])).rows[0].id;
    const chat = new ChatService(db, notices);
    const conversation = (await chat.open(buyer, product)).data;
    assert.equal((await chat.open(buyer, product)).data.id, conversation.id);
    await assert.rejects(() => chat.messages(outsider, conversation.id));
    const messageKey = randomUUID();
    const sent = await chat.send(buyer, conversation.id, 'Kiểm thử PostgreSQL, không lưu vĩnh viễn.', messageKey);
    assert.equal((await chat.send(buyer, conversation.id, 'Kiểm thử PostgreSQL, không lưu vĩnh viễn.', messageKey)).data.id, sent.data.id);
    await assert.rejects(() => chat.send(buyer, conversation.id, 'Nội dung khác cùng key', messageKey));
    assert.equal((await chat.messages(seller, conversation.id)).data.length, 1);
    const favorites = new FavoritesService(db);
    await favorites.add(buyer, product); await favorites.add(buyer, product);
    assert.equal((await favorites.list(buyer)).data.length, 1);
    const pricing = new PricingService(db), orders = new OrdersController(db, pricing, new IdempotencyService(), notices);
    const preview = pricing.serializeQuote(await pricing.preview(product, 1));
    await assert.rejects(() => orders.create({ user: { id: buyer } }, { productId: product, quoteFingerprint: '0'.repeat(64) }, randomUUID()));
    assert.equal((await client.query('SELECT count(*)::int AS count FROM orders WHERE product_id=$1', [product])).rows[0].count, 0);
    await client.query('INSERT INTO user_blocks(blocker_id,blocked_id) VALUES($1,$2)', [seller, buyer]);
    await assert.rejects(() => chat.send(buyer, conversation.id, 'Must be blocked'));
    assert.equal((await favorites.list(buyer)).data.length, 0);
    await assert.rejects(() => orders.create({ user: { id: buyer } }, { productId: product }, randomUUID()));
    await client.query('DELETE FROM user_blocks WHERE blocker_id=$1 AND blocked_id=$2', [seller, buyer]);
    const key = randomUUID(), body = { productId: product, quantity: 1, note: 'ROLLBACK ONLY', quoteFingerprint: preview.quoteFingerprint };
    const order = (await orders.create({ user: { id: buyer } }, body, key)).data;
    assert.equal((await orders.create({ user: { id: buyer } }, body, key)).data.id, order.id);
    assert.equal((await chat.open(buyer, product)).data.id, conversation.id, 'Buyer must retain chat after reserving product');
    await assert.rejects(() => chat.open(outsider, product));
    assert.equal((await chat.list(seller)).data[0].product_title, 'Rollback member product');
    await assert.rejects(() => orders.create({ user: { id: outsider } }, { productId: product }, randomUUID()));
    await assert.rejects(() => orders.status({ user: { id: outsider } }, order.id, 'CONFIRMED'));
    for (const status of ['CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED']) await orders.status({ user: { id: seller } }, order.id, status);
    const ledger = new LedgerService(db, new LedgerWriterService());
    await assert.rejects(() => ledger.completeOrder(order.id, buyer));
    const completed = await ledger.completeOrder(order.id, seller);
    assert.equal((await ledger.completeOrder(order.id, seller)).replay, true);
    const sum = (await client.query('SELECT sum(amount)::text AS balance FROM ledger_entries WHERE transaction_id=$1', [completed.ledgerTransactionId])).rows[0].balance;
    assert.equal(sum, '0');
    const wallet = (await client.query('SELECT pending_balance::text FROM seller_wallets WHERE seller_id=$1', [seller])).rows[0];
    assert.equal(wallet.pending_balance, preview.sellerPayout);
    assert.equal((await orders.price({ user: { id: buyer } }, order.id)).data.buyerTotal, preview.buyerTotal);
    console.log('PASS: chat ownership/blocking, favorites, quote conflict, blocked purchase, idempotent order, reserved-product protection, role transitions, COD journal balance and single wallet credit.');
  } finally {
    await client.query('ROLLBACK');
    const retained = await client.query('SELECT count(*)::int AS count FROM users WHERE email LIKE $1', ['member-%-' + tag + '@example.invalid']);
    assert.equal(retained.rows[0].count, 0);
    await client.end();
    console.log('PASS: all test records rolled back; no real orders, balances or push notifications changed.');
  }
}
run().catch(error => { console.error('MEMBER_DB_TEST_FAILED', error.message, error.stack?.split('\n').find(line => line.includes('test-member-flows-db.cjs'))); process.exitCode = 1; });
