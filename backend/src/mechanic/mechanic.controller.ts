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
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { MechanicService } from './mechanic.service';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';
import { BotDetectionGuard } from '../common/guards/bot-detection.guard';

@Controller('mechanics')
export class MechanicController {
  constructor(private readonly mechanicService: MechanicService) {}

  // GET /mechanics
  @Get()
  findAll() {
    return this.mechanicService.findAll();
  }

  // GET /mechanics/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicService.findOne(id);
  }

  // POST /mechanics
  @Post()
  create(@Body() createMechanicDto: CreateMechanicDto) {
    return this.mechanicService.create(createMechanicDto);
  }

  // PATCH /mechanics/:id
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMechanicDto: UpdateMechanicDto,
  ) {
    return this.mechanicService.update(id, updateMechanicDto);
  }

  // DELETE /mechanics/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicService.remove(id);
  }

  // POST /mechanics/:id/click
  @Post(':id/click')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 60초에 최대 3번
  @UseGuards(BotDetectionGuard)
  incrementClick(
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const userAgent = req['userAgent'] as string;
    const isBot = req['isBot'] as boolean;
    return this.mechanicService.incrementClick(id, ip, userAgent, isBot);
  }
}
