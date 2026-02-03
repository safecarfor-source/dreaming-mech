import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
import { BotDetectionGuard } from '../common/guards/bot-detection.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateMechanicSchema,
  UpdateMechanicSchema,
  type CreateMechanicDto,
  type UpdateMechanicDto,
} from './schemas/mechanic.schema';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('mechanics')
export class MechanicController {
  constructor(private readonly mechanicService: MechanicService) {}

  // GET /mechanics?page=1&limit=20
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.mechanicService.findAll(paginationDto);
  }

  // GET /mechanics/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicService.findOne(id);
  }

  // POST /mechanics
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body(new ZodValidationPipe(CreateMechanicSchema)) createMechanicDto: CreateMechanicDto) {
    return this.mechanicService.create(createMechanicDto);
  }

  // PATCH /mechanics/:id
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateMechanicSchema)) updateMechanicDto: UpdateMechanicDto,
  ) {
    return this.mechanicService.update(id, updateMechanicDto);
  }

  // DELETE /mechanics/:id
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
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
