import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MapsService {
  private readonly GEOCODE_URL =
    'https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode';
  private readonly REVERSE_URL =
    'https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc';

  constructor(private readonly httpService: HttpService) {}

  // 주소 → 좌표 (Geocoding)
  async geocode(address: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.GEOCODE_URL, {
          params: { query: address },
          headers: {
            'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_MAP_CLIENT_ID,
            'X-NCP-APIGW-API-KEY': process.env.NAVER_MAP_CLIENT_SECRET,
          },
        }),
      );

      const addresses = response.data.addresses;
      if (!addresses || addresses.length === 0) {
        throw new HttpException('주소를 찾을 수 없습니다', HttpStatus.NOT_FOUND);
      }

      const result = addresses[0];
      return {
        address: result.roadAddress || result.jibunAddress,
        lat: parseFloat(result.y),
        lng: parseFloat(result.x),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Geocoding error:', error);
      throw new HttpException(
        'Geocoding 실패',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 좌표 → 주소 (Reverse Geocoding)
  async reverseGeocode(lat: number, lng: number) {
    try {
      const coords = `${lng},${lat}`;
      const response = await firstValueFrom(
        this.httpService.get(this.REVERSE_URL, {
          params: {
            coords,
            output: 'json',
            orders: 'roadaddr,addr',
          },
          headers: {
            'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_MAP_CLIENT_ID,
            'X-NCP-APIGW-API-KEY': process.env.NAVER_MAP_CLIENT_SECRET,
          },
        }),
      );

      const results = response.data.results;
      if (!results || results.length === 0) {
        throw new HttpException('주소를 찾을 수 없습니다', HttpStatus.NOT_FOUND);
      }

      const result = results[0];
      const region = result.region;
      const land = result.land;

      const address =
        land?.addition0?.value ||
        `${region.area1.name} ${region.area2.name} ${region.area3.name}`;

      return {
        address,
        roadAddress: land?.addition0?.value || '',
        jibunAddress: `${region.area1.name} ${region.area2.name} ${region.area3.name}`,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Reverse geocoding error:', error);
      throw new HttpException(
        'Reverse Geocoding 실패',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
