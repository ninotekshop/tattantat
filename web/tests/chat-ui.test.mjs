import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeMessages, selectConversation } from '../lib/chat-ui.ts';

test('explicit conversation must never silently select an unrelated seller', () => {
  const items = [{ id: 'seller-a' }, { id: 'seller-b' }];
  assert.equal(selectConversation(items, 'seller-b'), 'seller-b');
  assert.equal(selectConversation(items, 'unknown'), '');
  assert.equal(selectConversation(items, null), 'seller-a');
  assert.equal(selectConversation([], null), '');
});
test('stale poll preserves acknowledged messages and retries cannot duplicate bubbles', () => {
  const first = { id: '1', created_at: '2026-09-20T01:00:00.000Z', content: 'Hello' };
  const second = { id: '2', created_at: '2026-09-20T01:01:00.000Z', content: 'Still available?' };
  assert.deepEqual(mergeMessages([first], [second]), [first, second]);
  assert.deepEqual(mergeMessages([first, second], [second, second]), [first, second]);
  assert.deepEqual(mergeMessages([], [second, first]), [first, second]);
});
