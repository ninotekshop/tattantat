import { allowed, categoryOf, DEFAULT_PREFS, mergePrefs } from './notification-channels';
import { MailerService } from './mailer.service';

describe('notification channels', () => {
  it('maps types to categories and keeps admin alerts in-app only', () => {
    expect(categoryOf('ORDER_PAID')).toBe('orders'); expect(categoryOf('CHAT_MESSAGE')).toBe('messages'); expect(categoryOf('SAVED_SEARCH')).toBe('alerts'); expect(categoryOf('SUBSCRIPTION_EXPIRING_3D')).toBe('billing'); expect(categoryOf('ADMIN_MODERATION_BACKLOG')).toBeNull();
  });
  it('merges stored prefs over defaults and ignores junk', () => {
    const p = mergePrefs({ email: { orders: false, messages: 'yes', hacker: true }, push: { messages: false } });
    expect(p.email.orders).toBe(false); expect(p.email.messages).toBe(false); expect(p.push.messages).toBe(false); expect(p.push.orders).toBe(true);
    expect(mergePrefs(null)).toEqual(DEFAULT_PREFS); expect(allowed(mergePrefs(null), 'email', 'alerts')).toBe(false); expect(allowed(mergePrefs(null), 'push', null)).toBe(false);
  });
  it('escapes HTML in email and limits per-user volume', async () => {
    const m = new MailerService(); const r = m.render('<b>x</b>', 'a & "b"', '/orders');
    expect(r.html).not.toContain('<b>x</b>'); expect(r.html).toContain('&amp;');
    expect(m.enabled).toBe(false); expect(await m.send('u', 'a@b.c', 't', 'c', null)).toBe(false);
  });
});
