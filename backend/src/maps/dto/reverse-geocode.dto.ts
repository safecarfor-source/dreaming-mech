import { IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ReverseGeocodeDto {
  @Type(() => Number)
  @IsNumber({}, { message: '위도는 숫자여야 합니다' })
  @Min(-90, { message: '위도는 -90 이상이어야 합니다' })
  @Max(90, { message: '위도는 90 이하여야 합니다' })
  lat: number;

  @Type(() => Number)
  @IsNumber({}, { message: '경도는 숫자여야 합니다' })
  @Min(-180, { message: '경도는 -180 이상이어야 합니다' })
  @Max(180, { message: '경도는 180 이하여야 합니다' })
  lng: number;
}
