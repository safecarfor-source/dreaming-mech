import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UploadCsvDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['team', 'manager', 'director'])
  type: string;
}
