import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsUrl,
  IsObject,
} from 'class-validator';

export class CreateMechanicDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumber()
  @IsNotEmpty()
  mapLat: number;

  @IsNumber()
  @IsNotEmpty()
  mapLng: number;

  @IsUrl()
  @IsOptional()
  mainImageUrl?: string | null;

  @IsArray()
  @IsOptional()
  galleryImages?: string[];

  @IsUrl()
  @IsOptional()
  youtubeUrl?: string | null;

  @IsUrl()
  @IsOptional()
  youtubeLongUrl?: string | null;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // 상세 정보 필드
  @IsObject()
  @IsOptional()
  operatingHours?: Record<string, { open: string; close: string } | null> | null;

  @IsArray()
  @IsOptional()
  specialties?: string[];

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @IsBoolean()
  @IsOptional()
  parkingAvailable?: boolean | null;

  @IsArray()
  @IsOptional()
  paymentMethods?: string[];

  @IsObject()
  @IsOptional()
  holidays?: {
    type: 'weekly' | 'custom' | 'none';
    days?: string[];
    dates?: string[];
    description?: string;
  } | null;
}
