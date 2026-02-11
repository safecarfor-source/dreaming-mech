import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OwnerService } from './owner.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { OwnerApprovedGuard } from '../auth/guards/owner-approved.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateMechanicSchema,
  UpdateMechanicSchema,
  type CreateMechanicDto,
  type UpdateMechanicDto,
} from '../mechanic/schemas/mechanic.schema';

// ── 관리자용: 사장님 관리 ──

@Controller('admin/owners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminOwnerController {
  constructor(private ownerService: OwnerService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.ownerService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ownerService.findOne(id);
  }

  @Patch(':id/approve')
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.ownerService.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id', ParseIntPipe) id: number) {
    return this.ownerService.reject(id);
  }
}

// ── 사장님용: 사업자등록증 제출 ──

@Controller('owner')
@UseGuards(JwtAuthGuard)
export class OwnerProfileController {
  constructor(private ownerService: OwnerService) {}

  @Post('business-license')
  submitBusinessLicense(
    @Request() req,
    @Body() body: { businessLicenseUrl: string; businessName: string },
  ) {
    return this.ownerService.submitBusinessLicense(
      req.user.sub,
      body.businessLicenseUrl,
      body.businessName,
    );
  }
}

// ── 사장님용: 매장 관리 ──

@Controller('owner/mechanics')
@UseGuards(JwtAuthGuard, OwnerApprovedGuard)
export class OwnerMechanicController {
  constructor(private ownerService: OwnerService) {}

  @Get()
  getMyMechanics(@Request() req) {
    return this.ownerService.getMyMechanics(req.user.sub);
  }

  @Post()
  create(
    @Request() req,
    @Body(new ZodValidationPipe(CreateMechanicSchema)) data: CreateMechanicDto,
  ) {
    return this.ownerService.createMechanic(req.user.sub, data);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateMechanicSchema)) data: UpdateMechanicDto,
  ) {
    return this.ownerService.updateMechanic(req.user.sub, id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.ownerService.removeMechanic(req.user.sub, id);
  }
}
