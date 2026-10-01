import { Bell, BadgeCheck, Bookmark, CircleX, Crown, EyeOff, FileText, Megaphone, MessageCircle, PackageCheck, Scale, ShieldCheck, ShoppingBag, Star, Truck, Undo2, UserCog, Wallet, type LucideIcon } from 'lucide-react';

/** Icon theo loại thông báo, dùng trong popup chuông. */
export function noticeIcon(type: string): LucideIcon {
  const t = type.toUpperCase();
  if (t === 'CHAT_MESSAGE') return MessageCircle;
  if (t === 'ORDER_CREATED') return ShoppingBag;
  if (t === 'ORDER_PAID' || t.startsWith('TOPUP') || t.startsWith('PAYOUT') || t.startsWith('WALLET')) return Wallet;
  if (t === 'ORDER_COMPLETED') return PackageCheck;
  if (t === 'ORDER_REFUNDED' || t.includes('REFUND')) return Undo2;
  if (t.startsWith('ORDER_')) return Truck;
  if (t.startsWith('DISPUTE')) return Scale;
  if (t.startsWith('REVIEW')) return Star;
  if (t === 'LISTING_REJECTED') return CircleX;
  if (t === 'LISTING_HIDDEN') return EyeOff;
  if (t === 'LISTING_APPROVED' || t.startsWith('VERIF')) return BadgeCheck;
  if (t.startsWith('LISTING_')) return FileText;
  if (t === 'SAVED_SEARCH') return Bookmark;
  if (t.startsWith('SUBSCRIPTION') || t.startsWith('PROMOTION')) return Crown;
  if (t.startsWith('ADVERTIS')) return Megaphone;
  if (t.startsWith('REPORT_')) return ShieldCheck;
  if (t.startsWith('ADMIN_') || t.startsWith('SYSTEM_')) return ShieldCheck;
  if (t.startsWith('ACCOUNT_')) return UserCog;
  return Bell;
}
