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

  getKakaoLoginUrl() {
    const params = new URLSearchParams({
      client_id: process.env.KAKAO_CLIENT_ID || '',
      redirect_uri: process.env.KAKAO_CALLBACK_URL || '',
      response_type: 'code',
    });
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

    // 3. Owner upsert
    const owner = await this.prisma.owner.upsert({
      where: { kakaoId },
      update: {
        email: kakaoAccount.email,
        name: profile.nickname,
        profileImage: profile.profile_image_url,
      },
      create: {
        kakaoId,
        email: kakaoAccount.email,
        name: profile.nickname,
        profileImage: profile.profile_image_url,
        provider: 'kakao',
      },
    });

    // 4. JWT 발급
    const payload = { sub: owner.id, email: owner.email || '', role: 'owner' as const };
    return {
      access_token: this.jwtService.sign(payload),
      owner,
    };
  }

  // ── Owner 프로필 ──

  async getOwnerProfile(ownerId: number) {
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
      },
    });

    if (!owner) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    return owner;
  }

  // ── 고객 카카오 OAuth ──

  getKakaoCustomerLoginUrl() {
    const params = new URLSearchParams({
      client_id: process.env.KAKAO_CLIENT_ID || '',
      redirect_uri: process.env.KAKAO_CUSTOMER_CALLBACK_URL || '',
      response_type: 'code',
    });
    return `https://kauth.kakao.com/oauth/authorize?${params}`;
  }

  async handleKakaoCustomerCallback(code: string, phone: string) {
    console.log('고객 카카오 콜백 시작, code:', code?.substring(0, 20) + '...');

    // 1. code → access_token 교환
    const tokenRes = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID || '',
        client_secret: process.env.KAKAO_CLIENT_SECRET || '',
        redirect_uri: process.env.KAKAO_CUSTOMER_CALLBACK_URL || '',
        code,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const accessToken = tokenRes.data.access_token;
    console.log('고객 카카오 토큰 교환 결과:', accessToken ? '성공' : '실패', tokenRes.data.error || '');
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
    console.log('고객 카카오 사용자 정보:', { kakaoId, email: kakaoAccount.email, nickname: profile.nickname });

    // 3. Customer upsert
    const customer = await this.prisma.customer.upsert({
      where: { kakaoId },
      update: {
        email: kakaoAccount.email,
        nickname: profile.nickname,
        phone, // 전화번호는 나중에 문의 생성 시 업데이트
      },
      create: {
        kakaoId,
        email: kakaoAccount.email,
        nickname: profile.nickname,
        phone: phone || '', // 기본값 (나중에 업데이트)
      },
    });

    // 4. JWT 발급
    const payload = { sub: customer.id, kakaoId, role: 'customer' as const };
    return {
      access_token: this.jwtService.sign(payload),
      customer,
    };
  }
}
