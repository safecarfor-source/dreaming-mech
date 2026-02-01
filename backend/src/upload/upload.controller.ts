import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  ParseFilePipeBuilder,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // Maximum file size: 5MB
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;

  // Allowed MIME types for images
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|webp)$/,
        })
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024, // 5MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    // Additional MIME type validation
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Only JPEG, PNG, and WebP images are allowed. Received: ${file.mimetype}`,
      );
    }

    // Additional file size check (defense in depth)
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum limit of 5MB. Received: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    const url = await this.uploadService.uploadImage(file);
    return { url };
  }
}
