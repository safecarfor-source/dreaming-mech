import { Controller, Get, Query } from '@nestjs/common';
import { MapsService } from './maps.service';
import { GeocodeDto } from './dto/geocode.dto';
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto';

@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  // GET /maps/geocode?address=서울시 강남구 테헤란로 123
  @Get('geocode')
  async geocode(@Query() query: GeocodeDto) {
    return await this.mapsService.geocode(query.address);
  }

  // GET /maps/reverse?lat=37.5&lng=127.0
  @Get('reverse')
  async reverseGeocode(@Query() query: ReverseGeocodeDto) {
    return await this.mapsService.reverseGeocode(query.lat, query.lng);
  }
}
