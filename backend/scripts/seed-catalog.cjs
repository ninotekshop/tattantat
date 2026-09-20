require('dotenv').config({ quiet: true });
const { Client } = require('pg');

const categories = [
  { name: 'Điện thoại', slug: 'dien-thoai' },
  { name: 'Laptop', slug: 'laptop' },
  { name: 'Xe máy', slug: 'xe-may' },
];

const products = [
  {
    category: 'dien-thoai', title: 'iPhone 15 Pro 128GB Titan Tự Nhiên', slug: 'iphone-15-pro-128gb-demo',
    description: 'Máy còn đẹp, đầy đủ hộp và phụ kiện. Pin tốt, sử dụng ổn định.', price: 21900000,
    condition: 'LIKE_NEW', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80',
  },
  {
    category: 'laptop', title: 'MacBook Air M2 13 inch 8GB/256GB', slug: 'macbook-air-m2-demo',
    description: 'Máy nguyên zin, phù hợp học tập và làm việc. Sạc cáp đầy đủ.', price: 18400000,
    condition: 'USED_GOOD', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
  },
  {
    category: 'xe-may', title: 'Honda Vision 2023 bản đặc biệt', slug: 'honda-vision-2023-demo',
    description: 'Xe chính chủ, bảo dưỡng định kỳ, giấy tờ hợp lệ và sang tên ngay.', price: 29500000,
    condition: 'USED_GOOD', image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80',
  },
];

async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query('BEGIN');
    const categoryIds = new Map();
    for (const category of categories) {
      const result = await client.query(
        `INSERT INTO categories (name, slug, sort_order) VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [category.name, category.slug, categories.indexOf(category) + 1],
      );
      categoryIds.set(category.slug, result.rows[0].id);
    }
    const seller = await client.query("SELECT id FROM users WHERE email = 'user@tattantat.vn' LIMIT 1");
    if (!seller.rows[0]) throw new Error('Demo seller is missing. Run seed:demo first.');
    for (const product of products) {
      const result = await client.query(
        `INSERT INTO products (seller_id, category_id, title, slug, description, price, condition, status, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::product_condition, 'ACTIVE', NOW())
         ON CONFLICT (slug) DO NOTHING RETURNING id`,
        [seller.rows[0].id, categoryIds.get(product.category), product.title, product.slug, product.description, product.price, product.condition],
      );
      if (result.rows[0]) {
        await client.query('INSERT INTO product_images (product_id, url, sort_order) VALUES ($1, $2, 1)', [result.rows[0].id, product.image]);
        console.log(`CREATED=${product.slug}`);
      } else console.log(`EXISTS=${product.slug}`);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { await client.end(); }
}

seed().catch((error) => { console.error(`SEED_FAILED=${error.message}`); process.exitCode = 1; });
