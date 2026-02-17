import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';

export enum SyncMessageStatusEnum {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateSyncMessageDto {
  @IsOptional()
  @IsEnum(SyncMessageStatusEnum)
  status?: SyncMessageStatusEnum;

  @IsOptional()
  @IsString()
  reply?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  priority?: number;
}
