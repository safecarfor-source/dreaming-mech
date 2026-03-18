import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    return admin;
  }

  async login(email: string, password: string) {
    const admin = await this.validateAdmin(email, password);

    const payload = { email: admin.email, sub: admin.id, role: 'admin' as const };

    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    };
  }

  async getProfile(adminId: number) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, email: true, name: true },
    });

    if (!admin) {
      throw new UnauthorizedException('관리자를 찾을 수 없습니다.');
    }

    return admin;
  }

  // ── 카카오 OAuth ──

  getKakaoLoginUrl(from?: string) {
    const params = new URLSearchParams({
      client_id: process.env.KAKAO_CLIENT_ID || '',
      redirect_uri: process.env.KAKAO_CALLBACK_URL || '',
      response_type: 'code',
    });
    // from 파라미터가 있으면 state에 담아 콜백에서 복원
    if (from) {
      params.set('state', from);
    }
    return `https://kauth.kakao.com/oauth/authorize?${params}`;
  }

  async handleKakaoCallback(code: string) {
    console.log('카카오 콜백 시작, code:', code?.substring(0, 20) + '...');

    // 1. code → access_token 교환
    const tokenRes = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID || '',
        client_secret: process.env.KAKAO_CLIENT_SECRET || '',
        redirect_uri: process.env.KAKAO_CALLBACK_URL || '',
        code,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const accessToken = tokenRes.data.access_token;
    console.log('카카오 토큰 교환 결과:', accessToken ? '성공' : '실패', tokenRes.data.error || '');
    if (!accessToken) {
      throw new UnauthorizedException('카카오 로그인에 실패했습니다.');
    }

    // 2. access_token → 사용자 정보 조회
    const userRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const kakaoId = String(userRes.data.id);
    const kakaoAccount = userRes.data.kakao_account || {};
    const profile = kakaoAccount.profile || {};
    console.log('카카오 사용자 정보:', { kakaoId, email: kakaoAccount.email, nickname: profile.nickname });

    // 3. User 조회 후 신규 생성 또는 업데이트
    const existing = await this.prisma.user.findUnique({ where: { kakaoId } });

    let user;
    if (existing) {
      const updateData: Record<string, unknown> = {
        email: kakaoAccount.email,
        nickname: profile.nickname,
        profileImage: profile.profile_image_url,
      };

      // DEACTIVATED(deactivatedAt이 있는) 상태에서 재로그인 시: 보호 계정이면 APPROVED, 아니면 PENDING
      if (existing.deactivatedAt) {
        updateData.businessStatus = existing.isProtected ? 'APPROVED' : 'PENDING';
        updateData.deactivatedAt = null;
      }

      user = await this.prisma.user.update({
        where: { kakaoId },
        data: updateData,
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          kakaoId,
          email: kakaoAccount.email,
          nickname: profile.nickname,
          profileImage: profile.profile_image_url,
          businessStatus: 'NONE', // 일반 회원으로 시작
        },
      });
    }

    // 4. JWT 발급
    const payload = { sub: user.id, email: user.email || '', role: 'user' as const };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  // ── User 프로필 ──

  async getUserProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        profileImage: true,
        businessStatus: true,
        rejectionReason: true,
        businessLicenseUrl: true,
        businessName: true,
        phone: true,
        address: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  async updateUserProfile(userId: number, data: { phone?: string; businessName?: string; address?: string; nickname?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.businessName !== undefined && { businessName: data.businessName }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.nickname !== undefined && { nickname: data.nickname }),
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        phone: true,
        businessName: true,
        address: true,
        businessStatus: true,
      },
    });
  }

  // ── 사용자 추적 코드 연결 ──
  // 로그인 후 최초 유입 경로 trackingCode를 저장 (이미 코드가 있으면 보존)
  async updateUserTracking(userId: number, trackingCode: string) {
    // trackingCode가 유효한지 확인
    const link = await this.prisma.trackingLink.findUnique({
      where: { code: trackingCode },
    });
    if (!link) return { updated: false, reason: 'invalid_code' };

    // 이미 trackingCode가 있으면 업데이트하지 않음 (최초 유입 경로 보존)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    if (user.trackingCode) return { updated: false, reason: 'already_set' };

    await this.prisma.user.update({
      where: { id: userId },
      data: { trackingCode },
    });

    return { updated: true };
  }
}
