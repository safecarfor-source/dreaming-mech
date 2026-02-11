import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsUrl,
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
}
