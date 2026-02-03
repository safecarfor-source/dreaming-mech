import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private s3Client: S3Client | null = null;
  private bucketName: string | null = null;
  private region: string;
  private cloudFrontUrl?: string;
  private isS3Configured: boolean = false;

  constructor() {
    const bucketName = process.env.AWS_S3_BUCKET;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    // S3 설정이 없으면 경고만 표시하고 계속 진행
    if (!bucketName || !accessKeyId || !secretAccessKey) {
      console.warn('⚠️  AWS S3 configuration is missing. Image upload will not be available.');
      console.warn('   Please set AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY in .env file');
      return;
    }

    // S3 설정이 있으면 클라이언트 초기화
    this.bucketName = bucketName;
    this.region = process.env.AWS_REGION || 'ap-northeast-2';
    this.cloudFrontUrl = process.env.AWS_CLOUDFRONT_URL;
    this.isS3Configured = true;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    console.log('✅ AWS S3 configured successfully');
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    // S3가 설정되지 않았으면 에러 반환
    if (!this.isS3Configured || !this.s3Client || !this.bucketName) {
      throw new InternalServerErrorException(
        'Image upload is not available. AWS S3 is not configured. Please contact administrator.'
      );
    }

    try {
      // Generate unique filename with original extension
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `mechanics/${uuidv4()}.${fileExtension}`;

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL removed - use bucket policy for public access instead
      });

      await this.s3Client.send(command);

      // Return CloudFront URL if configured, otherwise S3 direct URL
      if (this.cloudFrontUrl) {
        return `${this.cloudFrontUrl}/${fileName}`;
      }

      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new InternalServerErrorException('Failed to upload image to S3');
    }
  }
}
