import { IsNumber, IsInt, Min, Max } from 'class-validator';

export class SetOpeningCashDto {
  @IsNumber()
  openingCash: number;
}

export class OpeningCashParamDto {
  @IsInt()
  @Min(2020)
  @Max(2030)
  year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}
