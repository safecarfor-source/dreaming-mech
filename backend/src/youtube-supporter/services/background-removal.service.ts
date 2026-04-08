import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BackgroundRemovalService {
  private readonly logger = new Logger(BackgroundRemovalService.name);
  private readonly apiKey: string | null;

  constructor() {
    this.apiKey = process.env.REMOVE_BG_API_KEY || null;
    if (!this.apiKey) {
      this.logger.warn('REMOVE_BG_API_KEY not set. Background removal will return original image.');
    }
  }

  async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    if (!this.apiKey) {
      this.logger.warn('No API key, returning original image');
      return imageBuffer;
    }

    const formData = new FormData();
    // Buffer → Uint8Array 변환으로 Blob 타입 호환성 확보
    formData.append('image_file', new Blob([new Uint8Array(imageBuffer)]));
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': this.apiKey },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`remove.bg error: ${response.status} ${error}`);
      throw new Error(`Background removal failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
