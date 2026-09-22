import { Injectable } from '@nestjs/common';

export interface ModerationResult {
  passed: boolean;
  action: 'AUTO_APPROVE' | 'NEEDS_CHANGES' | 'PENDING_REVIEW' | 'REJECT';
  riskScore: number;
  reasons: { code: string; message: string }[];
  normalizedText: string;
}

@Injectable()
export class ModerationService {
  /**
   * Normalizes input text for contact/spam/prohibited detection.
   */
  normalizeText(input: string): string {
    if (!input) return '';
    let text = input.normalize('NFC').toLowerCase();

    // Remove zero-width characters
    text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');

    // Replace common leetspeak obfuscations for contact detection
    text = text
      .replace(/09o/g, '090')
      .replace(/09o1/g, '0901')
      .replace(/\bzero\b/gi, '0')
      .replace(/\bone\b/gi, '1')
      .replace(/\btwo\b/gi, '2')
      .replace(/\bthree\b/gi, '3')
      .replace(/\bfour\b/gi, '4')
      .replace(/\bfive\b/gi, '5')
      .replace(/\bsix\b/gi, '6')
      .replace(/\bseven\b/gi, '7')
      .replace(/\beight\b/gi, '8')
      .replace(/\bnine\b/gi, '9');

    return text;
  }

  /**
   * Detects off-platform contact information (phone, email, social, URL, payment).
   */
  detectContactInfo(text: string): { detected: boolean; details: string[] } {
    const norm = this.normalizeText(text);
    const details: string[] = [];

    // 1. Phone number pattern: matches 03x, 05x, 07x, 08x, 09x, +84, 84 with optional spaces/dots/dashes
    const compactText = norm.replace(/[\s.-]/g, '');
    const phoneRegex = /(?:(?:\+84|84|0)(?:3|5|7|8|9)[0-9]{8})/g;
    if (phoneRegex.test(compactText)) {
      details.push('Phát hiện số điện thoại liên hệ cá nhân');
    }

    // 2. Email pattern
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    if (emailRegex.test(norm)) {
      details.push('Phát hiện địa chỉ email cá nhân');
    }

    // 3. Social media & Off-platform chat keywords/links
    const socialKeywords = [
      /zalo\b/i,
      /fb\.com/i,
      /facebook\.com/i,
      /m\.me/i,
      /t\.me/i,
      /telegram/i,
      /whatsapp/i,
      /viber/i,
      /sđt/i,
      /sdt\b/i,
      /liên hệ zalo/i,
      /lh zalo/i,
      /add zalo/i,
      /nhắn zalo/i,
      /gọi điện/i,
      /so dien thoai/i,
    ];

    for (const pattern of socialKeywords) {
      if (pattern.test(norm)) {
        details.push('Phát hiện từ khóa/liên kết Zalo/Facebook/Mạng xã hội ngoài Tất Tần Tật');
        break;
      }
    }

    // 4. External URLs
    const urlRegex = /(https?:\/\/[^\s]+|(?:www\.)[^\s]+\.[a-z]{2,})/gi;
    if (urlRegex.test(norm)) {
      details.push('Phát hiện đường dẫn (URL) trang web bên ngoài');
    }

    // 5. Payment / Bank Account keywords
    const paymentKeywords = [/stk\b/i, /số tài khoản/i, /so tai khoan/i, /momo\b/i, /vnpay\b/i, /chuyển khoản trước/i];
    for (const pattern of paymentKeywords) {
      if (pattern.test(norm)) {
        details.push('Phát hiện yêu cầu chuyển khoản / tài khoản ngân hàng cá nhân');
        break;
      }
    }

    return {
      detected: details.length > 0,
      details,
    };
  }

  /**
   * Main Moderation Pipeline function.
   */
  evaluate(title: string, description: string, price?: number | string): ModerationResult {
    const combined = `${title || ''} ${description || ''}`;
    const contactCheck = this.detectContactInfo(combined);

    const reasons: { code: string; message: string }[] = [];
    let riskScore = 0;

    // Hard Rule 1: Contact Info / Off-platform link detected -> NEEDS_CHANGES
    if (contactCheck.detected) {
      riskScore += 70;
      reasons.push({
        code: 'CONTACT_INFO_DETECTED',
        message: `Tin đăng chứa thông tin liên hệ cá nhân ngoài nền tảng (${contactCheck.details.join(', ')}). Vui lòng xóa thông tin này để tiếp tục.`,
      });
      return {
        passed: false,
        action: 'NEEDS_CHANGES',
        riskScore,
        reasons,
        normalizedText: this.normalizeText(combined),
      };
    }

    // Prohibited Keywords Check
    const prohibitedKeywords = ['hàng giả', 'hàng nhái', 'vũ khí', 'chất cấm', 'ma túy', 'tiền giả', 'cờ bạc'];
    const normText = this.normalizeText(combined);
    for (const word of prohibitedKeywords) {
      if (normText.includes(word)) {
        riskScore += 90;
        reasons.push({
          code: 'PROHIBITED_CONTENT',
          message: `Nội dung tin đăng chứa từ khóa bị cấm: "${word}"`,
        });
        return {
          passed: false,
          action: 'REJECT',
          riskScore,
          reasons,
          normalizedText: normText,
        };
      }
    }

    // Low Risk -> AUTO_APPROVE
    return {
      passed: true,
      action: 'AUTO_APPROVE',
      riskScore: 10,
      reasons: [],
      normalizedText: normText,
    };
  }
}
