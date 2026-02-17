import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsArray } from 'class-validator';

export enum SyncMessageTypeEnum {
  INSTRUCTION = 'INSTRUCTION',
  NOTE = 'NOTE',
  LINK = 'LINK',
  IMAGE = 'IMAGE',
}

export class CreateSyncMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(SyncMessageTypeEnum)
  type?: SyncMessageTypeEnum;

  @IsOptional()
  @IsString()
  deviceFrom?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  priority?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
