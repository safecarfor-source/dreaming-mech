import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OwnerService {
  constructor(private prisma: PrismaService) {}

  // ── 관리자용: 사장님 목록 ──

  async findAll(status?: string) {
    const where = status ? { status: status as any } : {};
    return this.prisma.owner.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        provider: true,
        status: true,
        rejectionReason: true,
        businessLicenseUrl: true,
        businessName: true,
        createdAt: true,
        _count: { select: { mechanics: true } },
      },
    });
  }

  // ── 관리자용: 사장님 상세 ──

  async findOne(id: number) {
    const owner = await this.prisma.owner.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        provider: true,
        status: true,
        rejectionReason: true,
        businessLicenseUrl: true,
        businessName: true,
        createdAt: true,
        _count: { select: { mechanics: true } },
      },
    });
    if (!owner) throw new NotFoundException('사장님을 찾을 수 없습니다.');
    return owner;
  }

  // ── 관리자용: 승인 ──

  async approve(id: number) {
    const owner = await this.prisma.owner.findUnique({ where: { id } });
    if (!owner) throw new NotFoundException('사장님을 찾을 수 없습니다.');

    return this.prisma.owner.update({
      where: { id },
      data: { status: 'APPROVED', rejectionReason: null },
    });
  }

  // ── 관리자용: 거절 ──

  async reject(id: number, reason?: string) {
    const owner = await this.prisma.owner.findUnique({ where: { id } });
    if (!owner) throw new NotFoundException('사장님을 찾을 수 없습니다.');

    return this.prisma.owner.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason || null },
    });
  }

  // ── 사장님용: 재신청 (거절된 상태에서 사업자등록증 재제출) ──

  async reapply(ownerId: number, businessLicenseUrl: string, businessName: string) {
    const owner = await this.prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException('사장님을 찾을 수 없습니다.');
    if (owner.status !== 'REJECTED') {
      throw new ForbiddenException('거절 상태에서만 재신청할 수 있습니다.');
    }

    return this.prisma.owner.update({
      where: { id: ownerId },
      data: {
        status: 'PENDING',
        rejectionReason: null,
        businessLicenseUrl,
        businessName,
      },
    });
  }

  // ── 사장님용: 사업자등록증 제출 ──

  async submitBusinessLicense(ownerId: number, businessLicenseUrl: string, businessName: string) {
    const owner = await this.prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException('사장님을 찾을 수 없습니다.');

    return this.prisma.owner.update({
      where: { id: ownerId },
      data: { businessLicenseUrl, businessName },
    });
  }

  // ── 사장님용: 내 매장 목록 ──

  async getMyMechanics(ownerId: number) {
    const mechanics = await this.prisma.mechanic.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });

    return mechanics.map((m) => ({
      ...m,
      mapLat: Number(m.mapLat),
      mapLng: Number(m.mapLng),
    }));
  }

  // ── 사장님용: 매장 등록 ──

  async createMechanic(ownerId: number, data: any) {
    const mechanic = await this.prisma.mechanic.create({
      data: {
        ...data,
        ownerId,
        galleryImages: data.galleryImages || [],
      },
    });

    return {
      ...mechanic,
      mapLat: Number(mechanic.mapLat),
      mapLng: Number(mechanic.mapLng),
    };
  }

  // ── 사장님용: 매장 수정 (본인 매장만) ──

  async updateMechanic(ownerId: number, mechanicId: number, data: any) {
    const mechanic = await this.prisma.mechanic.findUnique({
      where: { id: mechanicId },
    });

    if (!mechanic) throw new NotFoundException('매장을 찾을 수 없습니다.');
    if (mechanic.ownerId !== ownerId) throw new ForbiddenException('본인 매장만 수정할 수 있습니다.');

    const updated = await this.prisma.mechanic.update({
      where: { id: mechanicId },
      data,
    });

    return {
      ...updated,
      mapLat: Number(updated.mapLat),
      mapLng: Number(updated.mapLng),
    };
  }

  // ── 사장님용: 매장 삭제 (본인 매장만, 소프트 삭제) ──

  async removeMechanic(ownerId: number, mechanicId: number) {
    const mechanic = await this.prisma.mechanic.findUnique({
      where: { id: mechanicId },
    });

    if (!mechanic) throw new NotFoundException('매장을 찾을 수 없습니다.');
    if (mechanic.ownerId !== ownerId) throw new ForbiddenException('본인 매장만 삭제할 수 있습니다.');

    return this.prisma.mechanic.update({
      where: { id: mechanicId },
      data: { isActive: false },
    });
  }
}
