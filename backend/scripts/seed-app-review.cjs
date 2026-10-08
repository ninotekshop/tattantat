/**
 * Tạo 2 tài khoản demo cho Apple App Review (đã xác thực sẵn, không cần OTP) kèm dữ liệu mẫu:
 * tin đăng, hội thoại, yêu thích, thông báo, số dư ví.
 *
 * Chạy (trong thư mục backend, cần DATABASE_URL trong .env):
 *   set APPREVIEW_PASSWORD=MatKhauDemo@2026   (Windows CMD)   rồi:   node scripts/seed-app-review.cjs
 * Không đặt APPREVIEW_PASSWORD thì script tự sinh mật khẩu ngẫu nhiên và in ra màn hình.
 * Chạy lại nhiều lần an toàn: tài khoản đã có thì chỉ đặt lại mật khẩu, dữ liệu mẫu không bị nhân đôi.
 */
require('dotenv').config({ quiet: true });
const { randomBytes } = require('node:crypto');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const password = process.env.APPREVIEW_PASSWORD || 'Ttt@' + randomBytes(5).toString('hex');
const SELLER = { email: 'appreview.seller@tattantat.vn', name: 'Cửa hàng Demo (Người bán)' };
const BUYER = { email: 'appreview.buyer@tattantat.vn', name: 'Khách Demo (Người mua)' };

async function upsertUser(c, u, hash) {
  const found = (await c.query('SELECT id FROM users WHERE LOWER(email)=$1', [u.email])).rows[0];
  let id;
  if (found) {
    id = found.id;
    await c.query(`UPDATE users SET password_hash=$2, status='ACTIVE', full_name=$3 WHERE id=$1`, [id, hash, u.name]);
  } else {
    id = (await c.query(`INSERT INTO users(email, full_name, password_hash) VALUES($1,$2,$3) RETURNING id`, [u.email, u.name, hash])).rows[0].id;
    await c.query('INSERT INTO user_profiles(user_id, display_name) VALUES($1,$2) ON CONFLICT DO NOTHING', [id, u.name]).catch(() => {});
  }
  // Đánh dấu đã xác thực (bỏ qua cột nào chưa tồn tại)
  for (const col of ['email_verified', 'phone_verified', 'is_verified']) {
    await c.query('SAVEPOINT s');
    try { await c.query(`UPDATE users SET ${col}=TRUE WHERE id=$1`, [id]); await c.query('RELEASE SAVEPOINT s'); }
    catch { await c.query('ROLLBACK TO SAVEPOINT s'); }
  }
  return id;
}

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  try {
    await c.query('BEGIN');
    const hash = await bcrypt.hash(password, 12);
    const sellerId = await upsertUser(c, SELLER, hash);
    const buyerId = await upsertUser(c, BUYER, hash);

    // Tin đăng: nhân bản 4 tin đang hiển thị làm mẫu (kèm ảnh) cho người bán demo
    const have = (await c.query(`SELECT id, title FROM products WHERE seller_id=$1 AND slug LIKE 'appreview-%' AND deleted_at IS NULL ORDER BY created_at`, [sellerId])).rows;
    if (have.length < 4) {
      const donors = (await c.query(`SELECT id, category_id, title, description, price, condition::text AS condition, address FROM products
        WHERE status='ACTIVE' AND deleted_at IS NULL AND seller_id<>$1 AND EXISTS(SELECT 1 FROM product_images i WHERE i.product_id=products.id)
        ORDER BY published_at DESC NULLS LAST LIMIT 4`, [sellerId])).rows;
      for (const [i, d] of donors.entries()) {
        const slug = `appreview-${i + 1}-${randomBytes(3).toString('hex')}`;
        const id = (await c.query(`INSERT INTO products(seller_id, category_id, title, slug, description, price, condition, status, published_at, address)
          VALUES($1,$2,$3,$4,$5,$6,$7::product_condition,'ACTIVE',NOW() - ($8 * interval '1 hour'),$9) RETURNING id`,
          [sellerId, d.category_id, d.title, slug, d.description, d.price, d.condition, i * 3, d.address])).rows[0].id;
        await c.query(`INSERT INTO product_images(product_id,url,sort_order) SELECT $1,url,sort_order FROM product_images WHERE product_id=$2`, [id, d.id]);
        have.push({ id, title: d.title });
      }
    }
    if (!have.length) throw new Error('Chưa có tin đăng mẫu nào trong hệ thống để nhân bản.');
    const featured = have[0];

    // Hội thoại mẫu về tin đầu tiên + vài tin nhắn
    const chat = (await c.query(`INSERT INTO chats(buyer_id,seller_id,product_id) VALUES($1,$2,$3)
      ON CONFLICT(buyer_id,seller_id,product_id) DO UPDATE SET updated_at=NOW() RETURNING id`, [buyerId, sellerId, featured.id])).rows[0].id;
    const n = Number((await c.query('SELECT count(*)::int AS n FROM messages WHERE chat_id=$1', [chat])).rows[0].n);
    if (n === 0) {
      const lines = [
        [buyerId, 'Chào shop, sản phẩm này còn hàng không ạ?'],
        [sellerId, 'Chào bạn, sản phẩm còn hàng nhé. Bạn muốn xem trực tiếp hay nhận qua giao hàng?'],
        [buyerId, 'Mình muốn xem trực tiếp. Shop có giảm thêm được không ạ?'],
        [sellerId, 'Bạn đến xem hàng, mình sẽ hỗ trợ giá tốt nhất.'],
      ];
      for (const [i, [sender, text]] of lines.entries()) {
        await c.query(`INSERT INTO messages(chat_id,sender_id,content,created_at) VALUES($1,$2,$3,NOW() - ($4 * interval '5 minute'))`, [chat, sender, text, lines.length - i]);
      }
    }

    // Yêu thích (người mua) và thông báo (cả hai)
    for (const p of have.slice(1, 3)) await c.query('INSERT INTO favorites(user_id,product_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [buyerId, p.id]).catch(() => {});
    for (const [uid, title, content] of [
      [buyerId, 'Chào mừng đến Tất Tần Tật', 'Tài khoản demo đã sẵn sàng. Hãy thử nhắn tin, lưu tin yêu thích và xem ví.'],
      [sellerId, 'Có người quan tâm tin đăng của bạn', 'Một khách vừa nhắn tin hỏi về tin đăng của bạn.'],
    ]) {
      const exists = (await c.query(`SELECT 1 FROM notifications WHERE user_id=$1 AND title=$2`, [uid, title])).rows[0];
      if (!exists) await c.query(`INSERT INTO notifications(user_id,type,title,content) VALUES($1,'ADMIN_ANNOUNCEMENT',$2,$3)`, [uid, title, content]);
    }

    // Ví TTTCoin: cộng 500.000 cho mỗi tài khoản nếu chưa có giao dịch
    for (const uid of [sellerId, buyerId]) {
      const has = (await c.query(`SELECT 1 FROM credit_transactions WHERE user_id=$1 AND note='Demo App Review'`, [uid])).rows[0];
      if (!has) {
        await c.query(`INSERT INTO credit_accounts(user_id,balance) VALUES($1,500000) ON CONFLICT(user_id) DO UPDATE SET balance=credit_accounts.balance+500000, updated_at=now()`, [uid]);
        const bal = (await c.query('SELECT balance FROM credit_accounts WHERE user_id=$1', [uid])).rows[0].balance;
        await c.query(`INSERT INTO credit_transactions(user_id,type,amount,balance_after,note) VALUES($1,'TOPUP',500000,$2,'Demo App Review')`, [uid, bal]);
      }
    }

    await c.query('COMMIT');
    console.log('Đã tạo xong tài khoản demo cho App Review:');
    console.log('  Người bán :', SELLER.email);
    console.log('  Người mua :', BUYER.email);
    console.log('  Mật khẩu  :', password);
    console.log('  (Đăng nhập bằng email ở trên; không cần OTP.)');
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    console.error('LỖI:', e.message);
    process.exitCode = 1;
  } finally {
    await c.end();
  }
}
main();
