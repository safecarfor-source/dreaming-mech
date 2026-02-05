import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

/**
 * 숫자 범위 검증 파이프
 * 입력값이 지정된 범위 내에 있는지 확인
 */
@Injectable()
export class RangeValidationPipe implements PipeTransform<number, number> {
  constructor(
    private readonly min: number,
    private readonly max: number,
  ) {}

  transform(value: number): number {
    if (isNaN(value)) {
      throw new BadRequestException(
        `Value must be a valid number between ${this.min} and ${this.max}`,
      );
    }

    if (value < this.min || value > this.max) {
      throw new BadRequestException(
        `Value must be between ${this.min} and ${this.max}`,
      );
    }

    return value;
  }
}
