import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { MapsService } from './maps.service';

@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  // GET /maps/geocode?address=서울시 강남구 테헤란로 123
  @Get('geocode')
  async geocode(@Query('address') address: string) {
    if (!address) {
      throw new BadRequestException('주소를 입력해주세요');
    }
    return await this.mapsService.geocode(address);
  }

  // GET /maps/reverse?lat=37.5&lng=127.0
  @Get('reverse')
  async reverseGeocode(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    if (!lat || !lng) {
      throw new BadRequestException('위도와 경도를 입력해주세요');
    }
    return await this.mapsService.reverseGeocode(
      parseFloat(lat),
      parseFloat(lng),
    );
  }
}
