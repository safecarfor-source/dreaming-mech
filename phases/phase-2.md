# Phase 2: Backend API 개발

## 🎯 목표
NestJS로 정비사 CRUD API, 네이버 지도 프록시 API, 클릭 로그 API를 구현합니다.

## 📋 사전 준비
- Phase 1 완료
- Backend 서버 실행 가능 상태

---

## Step 2-1: Prisma Service 생성

### 작업 내용
Prisma Client를 NestJS에서 사용할 수 있도록 서비스를 만듭니다.

### 명령어
```bash
cd backend

# prisma 모듈 생성
nest g module prisma
nest g service prisma
```

### 파일 작성

#### `backend/src/prisma/prisma.service.ts`
```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');
  }

  async enableShutdownHooks(app: any) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
```

#### `backend/src/prisma/prisma.module.ts`
```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()  // 전역 모듈로 설정
@Module({
  providers: [PrismaService],
  exports: [PrismaService],  // 다른 모듈에서 사용 가능
})
export class PrismaModule {}
```

### AppModule에 등록

#### `backend/src/app.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 테스트
```bash
npm run start:dev

# 콘솔에 "✅ Database connected" 출력 확인
```

### 커밋
```bash
git add .
git commit -m "feat(backend): Prisma service 생성"
```

---

## Step 2-2: Mechanic CRUD API

### 작업 내용
정비사 관련 CRUD API를 구현합니다.

### 명령어
```bash
cd backend

# mechanic 리소스 생성
nest g resource mechanic

# 프롬프트 응답:
# ? What transport layer do you use? REST API
# ? Would you like to generate CRUD entry points? Yes
```

### DTO 작성

#### `backend/src/mechanic/dto/create-mechanic.dto.ts`
```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, IsUrl } from 'class-validator';

export class CreateMechanicDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumber()
  @IsNotEmpty()
  mapLat: number;

  @IsNumber()
  @IsNotEmpty()
  mapLng: number;

  @IsUrl()
  @IsOptional()
  mainImageUrl?: string;

  @IsArray()
  @IsOptional()
  galleryImages?: string[];

  @IsUrl()
  @IsOptional()
  youtubeUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
```

#### `backend/src/mechanic/dto/update-mechanic.dto.ts`
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateMechanicDto } from './create-mechanic.dto';

export class UpdateMechanicDto extends PartialType(CreateMechanicDto) {}
```

### Service 작성

#### `backend/src/mechanic/mechanic.service.ts`
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';

@Injectable()
export class MechanicService {
  constructor(private prisma: PrismaService) {}

  // 모든 정비사 조회
  async findAll() {
    return await this.prisma.mechanic.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 특정 정비사 조회
  async findOne(id: number) {
    const mechanic = await this.prisma.mechanic.findUnique({
      where: { id },
      include: {
        clickLogs: {
          orderBy: { clickedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!mechanic) {
      throw new NotFoundException(`Mechanic with ID ${id} not found`);
    }

    return mechanic;
  }

  // 정비사 생성
  async create(createMechanicDto: CreateMechanicDto) {
    return await this.prisma.mechanic.create({
      data: {
        ...createMechanicDto,
        galleryImages: createMechanicDto.galleryImages || [],
      },
    });
  }

  // 정비사 수정
  async update(id: number, updateMechanicDto: UpdateMechanicDto) {
    // 존재 여부 확인
    await this.findOne(id);

    return await this.prisma.mechanic.update({
      where: { id },
      data: updateMechanicDto,
    });
  }

  // 정비사 삭제 (소프트 삭제)
  async remove(id: number) {
    await this.findOne(id);

    return await this.prisma.mechanic.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // 클릭수 증가
  async incrementClick(id: number, ipAddress?: string) {
    // 정비사 존재 여부 확인
    await this.findOne(id);

    // 트랜잭션으로 클릭수 증가 + 로그 저장
    return await this.prisma.$transaction(async (tx) => {
      // 클릭수 증가
      const mechanic = await tx.mechanic.update({
        where: { id },
        data: {
          clickCount: { increment: 1 },
        },
      });

      // 클릭 로그 저장
      await tx.clickLog.create({
        data: {
          mechanicId: id,
          ipAddress: ipAddress || 'unknown',
        },
      });

      return mechanic;
    });
  }
}
```

### Controller 작성

#### `backend/src/mechanic/mechanic.controller.ts`
```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Ip,
} from '@nestjs/common';
import { MechanicService } from './mechanic.service';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';

@Controller('mechanics')
export class MechanicController {
  constructor(private readonly mechanicService: MechanicService) {}

  // GET /mechanics - 모든 정비사 조회
  @Get()
  findAll() {
    return this.mechanicService.findAll();
  }

  // GET /mechanics/:id - 특정 정비사 조회
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicService.findOne(id);
  }

  // POST /mechanics - 정비사 생성
  @Post()
  create(@Body() createMechanicDto: CreateMechanicDto) {
    return this.mechanicService.create(createMechanicDto);
  }

  // PATCH /mechanics/:id - 정비사 수정
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMechanicDto: UpdateMechanicDto,
  ) {
    return this.mechanicService.update(id, updateMechanicDto);
  }

  // DELETE /mechanics/:id - 정비사 삭제
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicService.remove(id);
  }

  // POST /mechanics/:id/click - 클릭수 증가
  @Post(':id/click')
  incrementClick(
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.mechanicService.incrementClick(id, ip);
  }
}
```

### Module 업데이트

#### `backend/src/mechanic/mechanic.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { MechanicService } from './mechanic.service';
import { MechanicController } from './mechanic.controller';

@Module({
  controllers: [MechanicController],
  providers: [MechanicService],
  exports: [MechanicService],  // 다른 모듈에서 사용 가능
})
export class MechanicModule {}
```

### AppModule에 등록

#### `backend/src/app.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MechanicModule } from './mechanic/mechanic.module';

@Module({
  imports: [PrismaModule, MechanicModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 테스트
```bash
# 서버 실행
npm run start:dev

# API 테스트
# 1. 모든 정비사 조회
curl http://localhost:3001/mechanics

# 2. 특정 정비사 조회
curl http://localhost:3001/mechanics/1

# 3. 클릭수 증가
curl -X POST http://localhost:3001/mechanics/1/click

# 4. 정비사 생성 (POST 요청)
curl -X POST http://localhost:3001/mechanics \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트 정비소",
    "location": "강남구",
    "phone": "02-1111-2222",
    "address": "서울시 강남구 테스트로 123",
    "mapLat": 37.5,
    "mapLng": 127.0
  }'
```

### 커밋
```bash
git add .
git commit -m "feat(backend): Mechanic CRUD API 구현"
```

---

## Step 2-3: DTO 및 Validation

### 작업 내용
입력 데이터 검증을 위한 ValidationPipe를 글로벌 설정합니다.

### 패키지 설치
```bash
npm install class-validator class-transformer
```

### main.ts 수정

#### `backend/src/main.ts`
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // 글로벌 Validation Pipe 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,  // DTO에 없는 속성 제거
      forbidNonWhitelisted: true,  // DTO에 없는 속성 있으면 에러
      transform: true,  // 자동 타입 변환
    }),
  );

  await app.listen(3001);
  console.log('🚀 Backend server running on http://localhost:3001');
}
bootstrap();
```

### 테스트
```bash
# 잘못된 데이터로 테스트
curl -X POST http://localhost:3001/mechanics \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "invalidField": "test"
  }'

# 예상 응답:
# {
#   "statusCode": 400,
#   "message": [
#     "name should not be empty",
#     "location must be a string",
#     ...
#   ],
#   "error": "Bad Request"
# }
```

### 커밋
```bash
git add .
git commit -m "feat(backend): ValidationPipe 글로벌 설정"
```

---

## Step 2-4: Naver Maps API 프록시

### 작업 내용
네이버 지도 Geocoding/Reverse Geocoding API를 프록시합니다.

### 패키지 설치
```bash
npm install axios
npm install @nestjs/axios
```

### 명령어
```bash
nest g module maps
nest g service maps
nest g controller maps
```

### Service 작성

#### `backend/src/maps/maps.service.ts`
```typescript
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MapsService {
  private readonly GEOCODE_URL = 'https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode';
  private readonly REVERSE_URL = 'https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc';

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
      const coords = `${lng},${lat}`;  // 경도, 위도 순서
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

      // 도로명 주소 또는 지번 주소
      const address = land?.addition0?.value || 
                     `${region.area1.name} ${region.area2.name} ${region.area3.name}`;

      return {
        address,
        roadAddress: land?.addition0?.value || '',
        jibunAddress: `${region.area1.name} ${region.area2.name} ${region.area3.name}`,
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw new HttpException(
        'Reverse Geocoding 실패',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
```

### Controller 작성

#### `backend/src/maps/maps.controller.ts`
```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { MapsService } from './maps.service';

@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  // GET /maps/geocode?address=서울시 강남구 테헤란로 123
  @Get('geocode')
  async geocode(@Query('address') address: string) {
    if (!address) {
      throw new Error('주소를 입력해주세요');
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
      throw new Error('위도와 경도를 입력해주세요');
    }
    return await this.mapsService.reverseGeocode(
      parseFloat(lat),
      parseFloat(lng),
    );
  }
}
```

### Module 작성

#### `backend/src/maps/maps.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';

@Module({
  imports: [HttpModule],
  controllers: [MapsController],
  providers: [MapsService],
  exports: [MapsService],
})
export class MapsModule {}
```

### AppModule에 등록

#### `backend/src/app.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MechanicModule } from './mechanic/mechanic.module';
import { MapsModule } from './maps/maps.module';

@Module({
  imports: [PrismaModule, MechanicModule, MapsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### .env 확인

#### `backend/.env`
```env
# Naver Maps API 키 입력 필요!
NAVER_MAP_CLIENT_ID=your_client_id_here
NAVER_MAP_CLIENT_SECRET=your_client_secret_here
```

### 테스트
```bash
# 1. Geocoding 테스트
curl "http://localhost:3001/maps/geocode?address=서울시%20강남구%20테헤란로%20123"

# 예상 응답:
# {
#   "address": "서울 강남구 테헤란로 123",
#   "lat": 37.5012,
#   "lng": 127.0396
# }

# 2. Reverse Geocoding 테스트
curl "http://localhost:3001/maps/reverse?lat=37.5012&lng=127.0396"

# 예상 응답:
# {
#   "address": "서울 강남구 역삼동",
#   "roadAddress": "서울 강남구 테헤란로 123",
#   "jibunAddress": "서울 강남구 역삼동 123-45"
# }
```

### 커밋
```bash
git add .
git commit -m "feat(backend): Naver Maps API 프록시 구현"
```

---

## Step 2-5: 클릭 로그 API

### 명령어
```bash
nest g module click-log
nest g service click-log
nest g controller click-log
```

### Service 작성

#### `backend/src/click-log/click-log.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClickLogService {
  constructor(private prisma: PrismaService) {}

  // 특정 정비사의 클릭 통계
  async getStats(mechanicId: number) {
    const logs = await this.prisma.clickLog.findMany({
      where: { mechanicId },
      orderBy: { clickedAt: 'desc' },
    });

    // 일별 통계
    const dailyStats = logs.reduce((acc, log) => {
      const date = log.clickedAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalClicks: logs.length,
      dailyStats,
      recentLogs: logs.slice(0, 10),
    };
  }
}
```

### Controller 작성

#### `backend/src/click-log/click-log.controller.ts`
```typescript
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ClickLogService } from './click-log.service';

@Controller('click-logs')
export class ClickLogController {
  constructor(private readonly clickLogService: ClickLogService) {}

  // GET /click-logs/stats/:mechanicId
  @Get('stats/:mechanicId')
  getStats(@Param('mechanicId', ParseIntPipe) mechanicId: number) {
    return this.clickLogService.getStats(mechanicId);
  }
}
```

### Module 작성

#### `backend/src/click-log/click-log.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { ClickLogService } from './click-log.service';
import { ClickLogController } from './click-log.controller';

@Module({
  controllers: [ClickLogController],
  providers: [ClickLogService],
})
export class ClickLogModule {}
```

### AppModule에 등록

#### `backend/src/app.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MechanicModule } from './mechanic/mechanic.module';
import { MapsModule } from './maps/maps.module';
import { ClickLogModule } from './click-log/click-log.module';

@Module({
  imports: [
    PrismaModule,
    MechanicModule,
    MapsModule,
    ClickLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 테스트
```bash
# 클릭 로그 통계 조회
curl http://localhost:3001/click-logs/stats/1

# 예상 응답:
# {
#   "totalClicks": 5,
#   "dailyStats": {
#     "2025-01-17": 3,
#     "2025-01-16": 2
#   },
#   "recentLogs": [...]
# }
```

### 커밋
```bash
git add .
git commit -m "feat(backend): 클릭 로그 API 구현"
```

---

## Step 2-6: CORS 설정 (이미 완료)

Step 2-3에서 이미 설정했으므로 스킵!

---

## ✅ Phase 2 완료 체크리스트

```markdown
- [ ] Step 2-1: Prisma Service 생성
- [ ] Step 2-2: Mechanic CRUD API
- [ ] Step 2-3: ValidationPipe 설정
- [ ] Step 2-4: Naver Maps API 프록시
- [ ] Step 2-5: 클릭 로그 API
- [ ] Step 2-6: CORS 설정 (완료)
```

---

## 🧪 최종 테스트

### Postman/Insomnia로 전체 API 테스트

```
GET    /mechanics           ✅
GET    /mechanics/:id       ✅
POST   /mechanics           ✅
PATCH  /mechanics/:id       ✅
DELETE /mechanics/:id       ✅
POST   /mechanics/:id/click ✅

GET    /maps/geocode        ✅
GET    /maps/reverse        ✅

GET    /click-logs/stats/:id ✅
```

---

## 🚀 다음 단계

```bash
git push origin feature/phase-2-backend-api
# GitHub PR → Squash Merge
```

**다음**: [Phase 3 - Frontend 기본 구조](./phase-3.md)
