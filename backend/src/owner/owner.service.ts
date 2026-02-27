import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * null 값을 Prisma.JsonNull로 변환 (Json? 필드용)
 */
function toJsonField(value: any): any {
  if (value === null) return Prisma.JsonNull;
  if (value === undefined) return undefined;
  return value;
}

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
        phone: true,
        address: true,
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
        phone: true,
        address: true,
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
    // 카카오톡 1계정 = 정비소 1개 제한
    const existingCount = await this.prisma.mechanic.count({
      where: { ownerId, isActive: true },
    });
    if (existingCount >= 1) {
      throw new BadRequestException('하나의 계정으로 정비소는 1개만 등록할 수 있습니다.');
    }

    // Json? 필드의 null 처리
    const createData: any = { ...data };
    if ('operatingHours' in createData) createData.operatingHours = toJsonField(createData.operatingHours);
    if ('holidays' in createData) createData.holidays = toJsonField(createData.holidays);

    const mechanic = await this.prisma.mechanic.create({
      data: {
        ...createData,
        ownerId,
        galleryImages: createData.galleryImages || [],
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

    // Json? 필드의 null 처리
    const processedData: any = { ...data };
    if ('operatingHours' in processedData) processedData.operatingHours = toJsonField(processedData.operatingHours);
    if ('holidays' in processedData) processedData.holidays = toJsonField(processedData.holidays);

    const updated = await this.prisma.mechanic.update({
      where: { id: mechanicId },
      data: processedData,
    });

    return {
      ...updated,
      mapLat: Number(updated.mapLat),
      mapLng: Number(updated.mapLng),
    };
  }

  // ── 사장님용: 프로필 조회 ──

  async getProfile(ownerId: number) {
    const owner = await this.prisma.owner.findUnique({
      where: { id: ownerId },
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
        phone: true,
        address: true,
        createdAt: true,
      },
    });
    if (!owner) throw new NotFoundException('사장님을 찾을 수 없습니다.');
    return owner;
  }

  // ── 사장님용: 내 정비소를 선택한 고객 문의 조회 ──

  async getMyInquiries(ownerId: number) {
    // 1. 사장님의 정비소 목록 조회
    const mechanics = await this.prisma.mechanic.findMany({
      where: { ownerId, isActive: true },
      select: { id: true },
    });
    const mechanicIds = mechanics.map((m) => m.id);

    if (mechanicIds.length === 0) return [];

    // 2. 해당 정비소를 선택한 ServiceInquiry 조회
    return this.prisma.serviceInquiry.findMany({
      where: { mechanicId: { in: mechanicIds } },
      include: {
        mechanic: {
          select: { id: true, name: true, address: true },
        },
        trackingLink: {
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── 사장님용: 내 문의 상세 조회 ──

  async getMyInquiryDetail(ownerId: number, inquiryId: number) {
    // 내 정비소 ID 목록
    const mechanics = await this.prisma.mechanic.findMany({
      where: { ownerId, isActive: true },
      select: { id: true },
    });
    const mechanicIds = mechanics.map((m) => m.id);

    const inquiry = await this.prisma.serviceInquiry.findFirst({
      where: {
        id: inquiryId,
        mechanicId: { in: mechanicIds },
      },
      include: {
        mechanic: {
          select: { id: true, name: true, address: true },
        },
        trackingLink: {
          select: { id: true, code: true, name: true, description: true },
        },
      },
    });

    if (!inquiry) throw new NotFoundException('문의를 찾을 수 없습니다.');
    return inquiry;
  }

  // ── 사장님용: 공유 링크 클릭 수 증가 ──

  async incrementShareClick(inquiryId: number) {
    return this.prisma.serviceInquiry.update({
      where: { id: inquiryId },
      data: { shareClickCount: { increment: 1 } },
    });
  }

  // ── 사장님용: 프로필 업데이트 (전화번호 등) ──

  async updateProfile(ownerId: number, data: { phone?: string; businessName?: string; address?: string; name?: string }) {
    return this.prisma.owner.update({
      where: { id: ownerId },
      data: {
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.businessName !== undefined && { businessName: data.businessName }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.name !== undefined && { name: data.name }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        businessName: true,
        address: true,
        status: true,
      },
    });
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

  // ── 관리자용: 고객 목록 ──

  async findAllCustomers() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        kakaoId: true,
        nickname: true,
        email: true,
        phone: true,
        trackingCode: true,
        createdAt: true,
        _count: { select: { serviceInquiries: true } },
      },
    });
  }

  // ── 관리자용: 고객 강제 탈퇴 ──

  async deleteCustomer(id: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('고객을 찾을 수 없습니다.');

    // 관련 ServiceInquiry 먼저 삭제 (cascade)
    await this.prisma.serviceInquiry.deleteMany({
      where: { customerId: id },
    });

    await this.prisma.customer.delete({ where: { id } });
    return { message: '고객이 탈퇴 처리되었습니다.' };
  }
}
