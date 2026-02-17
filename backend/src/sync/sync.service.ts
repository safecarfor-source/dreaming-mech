import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSyncMessageDto } from './dto/create-sync-message.dto';
import { UpdateSyncMessageDto } from './dto/update-sync-message.dto';

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSyncMessageDto) {
    return this.prisma.syncMessage.create({
      data: {
        content: dto.content,
        type: dto.type || 'INSTRUCTION',
        deviceFrom: dto.deviceFrom || 'phone',
        priority: dto.priority || 0,
        images: dto.images || undefined,
      },
    });
  }

  async findAll(params?: {
    status?: string;
    deviceFrom?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, deviceFrom, page = 1, limit = 50 } = params || {};
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (deviceFrom) where.deviceFrom = deviceFrom;

    const [data, total] = await Promise.all([
      this.prisma.syncMessage.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.syncMessage.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    return this.prisma.syncMessage.findUnique({ where: { id } });
  }

  async update(id: number, dto: UpdateSyncMessageDto) {
    const data: Record<string, unknown> = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.reply !== undefined) data.reply = dto.reply;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.status === 'COMPLETED') data.completedAt = new Date();

    return this.prisma.syncMessage.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.syncMessage.delete({ where: { id } });
  }

  async getStats() {
    const [pending, inProgress, completed, total] = await Promise.all([
      this.prisma.syncMessage.count({ where: { status: 'PENDING' } }),
      this.prisma.syncMessage.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.syncMessage.count({ where: { status: 'COMPLETED' } }),
      this.prisma.syncMessage.count(),
    ]);
    return { pending, inProgress, completed, total };
  }
}
