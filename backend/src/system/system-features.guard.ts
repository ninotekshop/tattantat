import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { SystemFeatures, SystemFeaturesService } from './system-features.service';

type Rule = { method: RegExp; path: RegExp; flag: keyof SystemFeatures; message: string };
const RULES: Rule[] = [
  { method: /^POST$/, path: /^\/auth\/(register)\b/, flag: 'allowRegistration', message: 'Chức năng đăng ký tài khoản mới đang được tạm tắt.' },
  { method: /^POST$/, path: /^\/listings\/[^/]+\/publish$/, flag: 'allowListingPublish', message: 'Chức năng đăng tin mới đang được tạm tắt.' },
  { method: /^POST$/, path: /^\/orders$/, flag: 'allowOrders', message: 'Chức năng đặt mua đang được tạm tắt.' },
  { method: /^POST$/, path: /^\/billing\/topups$/, flag: 'allowTopup', message: 'Chức năng nạp tiền vào ví đang được tạm tắt.' },
  { method: /^POST$/, path: /^\/billing\/(subscriptions|promotions)\/purchase$/, flag: 'allowPackagePurchase', message: 'Chức năng mua gói đang được tạm tắt.' },
  { method: /^POST$/, path: /^\/chats(\/|$)/, flag: 'allowChat', message: 'Chức năng nhắn tin đang được tạm tắt.' },
  { method: /^POST$/, path: /^\/(orders\/[^/]+\/(review|buyer-review)|reviews\/)/, flag: 'allowReviews', message: 'Chức năng đánh giá đang được tạm tắt.' },
];
const MAINTENANCE_ALLOWED = /^\/(admin|auth\/(login|refresh|logout)|system|health|payments\/webhook)\b/;

/** Chặn các thao tác ghi theo công tắc chức năng do Admin cấu hình. */
@Injectable()
export class SystemFeaturesGuard implements CanActivate {
  constructor(private readonly features: SystemFeaturesService) {}
  async canActivate(context: ExecutionContext) {
    if (context.getType() !== 'http') return true;
    const req = context.switchToHttp().getRequest<{ method: string; originalUrl?: string; url: string }>();
    const method = req.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;
    const path = (req.originalUrl ?? req.url).split('?')[0].replace(/^\/api\/v\d+/, '').replace(/\/+$/, '') || '/';
    if (/^\/admin\b/.test(path) || /^\/system\b/.test(path)) return true;
    const f = await this.features.features();
    if (f.maintenanceMode && !MAINTENANCE_ALLOWED.test(path)) throw new ForbiddenException('Hệ thống đang bảo trì, vui lòng quay lại sau ít phút.');
    for (const r of RULES) if (r.method.test(method) && r.path.test(path) && f[r.flag] === false) throw new ForbiddenException(r.message);
    return true;
  }
}
