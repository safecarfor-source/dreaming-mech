import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;
  private cloudFrontUrl?: string;

  constructor() {
    const bucketName = process.env.AWS_S3_BUCKET;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET environment variable is required');
    }

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables are required');
    }

    this.bucketName = bucketName;
    this.region = process.env.AWS_REGION || 'ap-northeast-2';
    this.cloudFrontUrl = process.env.AWS_CLOUDFRONT_URL;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
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
        ACL: 'public-read', // Make file publicly accessible
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
