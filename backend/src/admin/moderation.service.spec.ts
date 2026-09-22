import { ModerationService } from './moderation.service';

describe('ModerationService', () => {
  let service: ModerationService;

  beforeEach(() => {
    service = new ModerationService();
  });

  describe('Contact Detection', () => {
    it('should detect standard phone number', () => {
      const result = service.detectContactInfo('Cần bán iPhone 15 liên hệ 0901992349');
      expect(result.detected).toBe(true);
    });

    it('should detect phone number with spaces and dots', () => {
      const result = service.detectContactInfo('Bán xe máy gọi 0901 992 349 hoặc 0901.992.349');
      expect(result.detected).toBe(true);
    });

    it('should detect email address', () => {
      const result = service.detectContactInfo('Gửi mail cho mình qua contact@gmail.com');
      expect(result.detected).toBe(true);
    });

    it('should detect Zalo and social media references', () => {
      const result = service.detectContactInfo('Kết bạn zalo 0901... để ép giá');
      expect(result.detected).toBe(true);
    });

    it('should detect external links', () => {
      const result = service.detectContactInfo('Xem thêm mẫu tại https://myshop.com');
      expect(result.detected).toBe(true);
    });

    it('should pass clean text without contact information', () => {
      const result = service.detectContactInfo('iPhone 15 Pro Max 256GB còn mới 99% chính chủ FPT Shop');
      expect(result.detected).toBe(false);
    });
  });

  describe('Moderation Pipeline Evaluation', () => {
    it('should recommend NEEDS_CHANGES if contact info is found', () => {
      const evalResult = service.evaluate('Bán iPhone 15 Pro Max', 'Liên hệ SĐT 0901992349 để mua');
      expect(evalResult.action).toBe('NEEDS_CHANGES');
      expect(evalResult.reasons[0].code).toBe('CONTACT_INFO_DETECTED');
    });

    it('should recommend REJECT if prohibited keywords are present', () => {
      const evalResult = service.evaluate('Bán ma túy cấm', 'Hàng nhập khẩu');
      expect(evalResult.action).toBe('REJECT');
      expect(evalResult.reasons[0].code).toBe('PROHIBITED_CONTENT');
    });

    it('should recommend AUTO_APPROVE for clean posts', () => {
      const evalResult = service.evaluate('iPhone 14 Pro Max 256GB Gold', 'Máy nữ dùng cẩn thận còn nguyên hộp đầy đủ phụ kiện');
      expect(evalResult.action).toBe('AUTO_APPROVE');
      expect(evalResult.passed).toBe(true);
    });
  });
});
