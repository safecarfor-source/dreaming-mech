import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import { CreateSyncMessageDto } from './dto/create-sync-message.dto';
import { UpdateSyncMessageDto } from './dto/update-sync-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  // 새 지시 생성 (폰에서 전송)
  @Post()
  create(@Body() dto: CreateSyncMessageDto) {
    return this.syncService.create(dto);
  }

  // 지시 목록 조회
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('deviceFrom') deviceFrom?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.syncService.findAll({
      status,
      deviceFrom,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  // 통계 조회
  @Get('stats')
  getStats() {
    return this.syncService.getStats();
  }

  // 지시 상세 조회
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.syncService.findOne(id);
  }

  // 지시 업데이트 (상태 변경, 답변 등)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSyncMessageDto,
  ) {
    return this.syncService.update(id, dto);
  }

  // 지시 삭제
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.syncService.delete(id);
  }
}
