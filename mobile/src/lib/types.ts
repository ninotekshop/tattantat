export type Product = {
  id: string; title: string; price: string; priceMode?: string; location: string; postedAt: string;
  sellerId: string; sellerName: string; sellerVerified?: boolean; sellerAvatar?: string | null; isFeatured?: boolean; imageUrl: string; images?: string[]; videos?: string[];
  hasVideo?: boolean; description?: string | null; condition?: string | null; categoryId?: number | null; status?: string; listingId?: string | null;
  attrs?: Record<string, unknown>; isFavorite?: boolean; viewCount?: number;
};
export type Page<T> = { items: T[]; total: number; page: number; limit: number };
export type Category = { id: number; name: string; slug: string; icon_url?: string | null; parent_id?: number | null; parentId?: number | null };
export type Me = { id: string; full_name: string; email: string | null; phone: string | null; avatar_url: string | null; role: string; phone_verified: boolean; email_verified: boolean };
export type Chat = { id: string; product_id: string; product_title: string; product_status: string; other_id?: string; other_name: string; last_message: string | null; seller_id_is_me?: boolean; product_price?: string | null; product_price_mode?: string | null; product_image?: string | null; updated_at?: string; unread_count?: number };
export type Attachment = { kind?: string; url?: string; mime?: string; lat?: number; lng?: number; label?: string };
export type Message = { id: string; sender_id: string; content: string; created_at: string; kind?: string; attachments?: Attachment[] | null; recalled_at?: string | null; can_recall?: boolean };
export type Notice = { id: string; type: string; title: string; content: string; reference_type: string | null; reference_id: string | null; is_read: boolean; created_at: string };
export type ListingCategory = { id: string; parentId: string | null; name: string; slug: string; isGroup: boolean };
export type ListingMedia = { id: string; kind: 'images' | 'videos'; url: string };
export type ListingSummary = { id: string; categoryId: string; status: string; revision: number; productId: string | null; title: string | null; updatedAt: string };
