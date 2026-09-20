import test from 'node:test';
import assert from 'node:assert/strict';
import { categoryGroups, categoryHref, formatVnd, resolveCategoryIds } from '../lib/marketplace.ts';

test('VND remains exact for BIGINT and legacy zero-decimal amounts', () => {
  assert.equal(formatVnd('21900000.00'), '21.900.000đ');
  assert.equal(formatVnd('0'), '0đ');
  assert.equal(formatVnd('9223372036854775807'), '9.223.372.036.854.775.807đ');
  assert.equal(formatVnd('invalid'), 'Giá đang cập nhật');
  assert.equal(formatVnd('100.50'), 'Giá đang cập nhật');
});

test('display groups resolve live IDs including child categories', () => {
  const categories = [
    { id: '501', slug: 'xe-co' }, { id: '524', slug: 'xe-may' },
    { id: 800, slug: 'iphone' }, { id: '902', slug: 'macbook' },
  ];
  assert.deepEqual(resolveCategoryIds('vehicles', categories), [501, 524]);
  assert.deepEqual(resolveCategoryIds('technology', categories), [800, 902]);
});

test('missing groups never fall back to unrelated product categories', () => {
  assert.deepEqual(resolveCategoryIds('services', [{ id: '1', slug: 'iphone' }]), []);
  assert.deepEqual(resolveCategoryIds('unknown', []), []);
});

test('duplicate, invalid and unsafe IDs are excluded', () => {
  assert.deepEqual(resolveCategoryIds('vehicles', [
    { id: '24', slug: 'xe-may' }, { id: 24, slug: 'xe-may' },
    { id: 'bad', slug: 'xe-co' }, { id: -1, slug: 'xe-co' },
    { id: '9007199254740993', slug: 'xe-co' },
  ]), [24]);
});

test('all navigation groups have unique keys and URL-safe filter links', () => {
  assert.equal(new Set(categoryGroups.map(group => group.key)).size, categoryGroups.length);
  for (const group of categoryGroups) {
    const url = new URL(categoryHref(group.key), 'http://localhost');
    assert.equal(url.searchParams.get('category'), group.key);
    assert.equal(url.hash, '#products');
  }
});
