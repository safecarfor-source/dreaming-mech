import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private messageService: any = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;

    if (!apiKey || !apiSecret) {
      this.logger.warn(
        'SOLAPI 설정이 없습니다. 카카오톡 알림톡이 비활성화됩니다.',
      );
      return;
    }

    try {
      const { SolapiMessageService } = await import('solapi');
      this.messageService = new SolapiMessageService(apiKey, apiSecret);
      this.isConfigured = true;
      this.logger.log('SOLAPI 설정 완료 - 카카오톡 알림톡 활성화');
    } catch (error) {
      this.logger.error('SOLAPI 초기화 실패:', error);
    }
  }

  /**
   * 견적 요청 알림톡 발송
   */
  async sendQuoteRequestAlimtalk(params: {
    mechanicPhone: string;
    mechanicName: string;
    customerName: string;
    carModel: string;
    description: string;
    quoteRequestId: number;
  }): Promise<boolean> {
    if (!this.isConfigured || !this.messageService) {
      this.logger.warn(
        `알림톡 미발송 (SOLAPI 미설정) - 견적 요청 #${params.quoteRequestId}`,
      );
      return false;
    }

    const senderPhone = process.env.SOLAPI_SENDER_PHONE;
    const channelId = process.env.SOLAPI_KAKAO_CHANNEL_ID;
    const templateId = process.env.SOLAPI_QUOTE_TEMPLATE_ID;

    if (!senderPhone || !channelId || !templateId) {
      this.logger.warn(
        '알림톡 환경변수 부족 (SENDER_PHONE, CHANNEL_ID, TEMPLATE_ID 필요)',
      );
      return false;
    }

    try {
      // 전화번호에서 하이픈 제거
      const cleanPhone = params.mechanicPhone.replace(/-/g, '');

      await this.messageService.send({
        to: cleanPhone,
        from: senderPhone,
        kakaoOptions: {
          pfId: channelId,
          templateId: templateId,
          variables: {
            '#{정비소명}': params.mechanicName,
            '#{고객명}': params.customerName,
            '#{차종}': params.carModel,
            '#{증상}': params.description.substring(0, 50),
          },
        },
      });

      this.logger.log(
        `알림톡 발송 성공 - ${params.mechanicName} (견적 #${params.quoteRequestId})`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `알림톡 발송 실패 - ${params.mechanicName}:`,
        error,
      );
      return false;
    }
  }

  /**
   * 서비스 문의 알림톡 발송 (정비사용)
   */
  async sendServiceInquiryAlimtalk(params: {
    mechanicPhone: string;
    mechanicName: string;
    regionSido: string;
    regionSigungu: string;
    serviceType: string;
    description: string | null;
    inquiryId: number;
  }): Promise<boolean> {
    if (!this.isConfigured || !this.messageService) {
      this.logger.warn(
        `알림톡 미발송 (SOLAPI 미설정) - 문의 #${params.inquiryId}`,
      );
      return false;
    }

    const senderPhone = process.env.SOLAPI_SENDER_PHONE;
    const channelId = process.env.SOLAPI_KAKAO_CHANNEL_ID;
    const templateId = process.env.SOLAPI_INQUIRY_TEMPLATE_ID;

    if (!senderPhone || !channelId || !templateId) {
      this.logger.warn(
        '알림톡 환경변수 부족 (SOLAPI_INQUIRY_TEMPLATE_ID 필요)',
      );
      return false;
    }

    const serviceTypeMap: Record<string, string> = {
      TIRE: '타이어',
      OIL: '엔진오일',
      BRAKE: '브레이크',
      MAINTENANCE: '경정비',
      CONSULT: '종합상담',
    };
    const serviceTypeKo = serviceTypeMap[params.serviceType] || params.serviceType;

    try {
      const cleanPhone = params.mechanicPhone.replace(/-/g, '');

      await this.messageService.send({
        to: cleanPhone,
        from: senderPhone,
        kakaoOptions: {
          pfId: channelId,
          templateId: templateId,
          variables: {
            '#{정비소명}': params.mechanicName,
            '#{지역}': `${params.regionSido} ${params.regionSigungu}`,
            '#{서비스}': serviceTypeKo,
            '#{내용}': params.description
              ? params.description.substring(0, 50)
              : '내용 없음',
            '#{링크}': `https://dreammechaniclab.com/inquiry/${params.inquiryId}`,
          },
        },
      });

      this.logger.log(
        `문의 알림톡 발송 성공 - ${params.mechanicName} (문의 #${params.inquiryId})`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `문의 알림톡 발송 실패 - ${params.mechanicName}:`,
        error,
      );
      return false;
    }
  }

  /**
   * 텔레그램 메시지 발송
   */
  async sendTelegramMessage(message: string): Promise<boolean> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      this.logger.warn(
        '텔레그램 설정이 없습니다. 텔레그램 알림이 비활성화됩니다.',
      );
      return false;
    }

    try {
      await axios.post(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        },
      );

      this.logger.log('텔레그램 메시지 발송 성공');
      return true;
    } catch (error) {
      this.logger.error('텔레그램 메시지 발송 실패:', error);
      return false;
    }
  }
}
