import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class MapsService {
  private readonly GEOCODE_URL =
    'https://maps.apigw.ntruss.com/map-geocode/v2/geocode';
  private readonly REVERSE_URL =
    'https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc';
  private readonly TIMEOUT = 5000; // 5초 타임아웃

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // 주소 → 좌표 (Geocoding)
  async geocode(address: string) {
    console.log('[Geocode] Starting geocode for address:', address);
    try {
      console.log('[Geocode] Calling Naver API...');
      const response = await firstValueFrom(
        this.httpService
          .get(this.GEOCODE_URL, {
            params: { query: address },
            headers: {
              'x-ncp-apigw-api-key-id': this.configService.get<string>(
                'NAVER_MAP_CLIENT_ID',
              ),
              'x-ncp-apigw-api-key': this.configService.get<string>(
                'NAVER_MAP_CLIENT_SECRET',
              ),
              Accept: 'application/json',
            },
          })
          .pipe(timeout(this.TIMEOUT)),
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
      console.error('[Geocode] ERROR:', error.response?.data || error.message || error);
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
        this.httpService
          .get(this.REVERSE_URL, {
            params: {
              coords,
              output: 'json',
              orders: 'roadaddr,addr',
            },
            headers: {
              'x-ncp-apigw-api-key-id': this.configService.get<string>(
                'NAVER_MAP_CLIENT_ID',
              ),
              'x-ncp-apigw-api-key': this.configService.get<string>(
                'NAVER_MAP_CLIENT_SECRET',
              ),
              Accept: 'application/json',
            },
          })
          .pipe(timeout(this.TIMEOUT)),
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
