import { Injectable, Logger } from '@nestjs/common';

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
}
