import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '꿈꾸는정비사 - 검증된 전국 자동차 정비소';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1A0A2E 0%, #2D1B69 50%, #1A0A2E 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* 배경 장식 */}
        <div
          style={{
            position: 'absolute',
            top: '60px',
            right: '120px',
            width: '200px',
            height: '200px',
            background: 'rgba(124, 77, 255, 0.2)',
            borderRadius: '50%',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            left: '100px',
            width: '160px',
            height: '160px',
            background: 'rgba(245, 158, 11, 0.15)',
            borderRadius: '50%',
            filter: 'blur(50px)',
          }}
        />

        {/* 메인 텍스트 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <span
            style={{
              fontSize: '80px',
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-2px',
            }}
          >
            꿈꾸는
          </span>
          <span
            style={{
              fontSize: '80px',
              fontWeight: 900,
              color: '#A78BFA',
              letterSpacing: '-2px',
            }}
          >
            정비사
          </span>
        </div>

        {/* 서브 텍스트 */}
        <div
          style={{
            fontSize: '28px',
            color: '#C4B5FD',
            marginBottom: '48px',
            letterSpacing: '1px',
          }}
        >
          검증된 전국 자동차 정비소를 한 곳에서
        </div>

        {/* 통계 */}
        <div
          style={{
            display: 'flex',
            gap: '48px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '16px 32px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <span style={{ fontSize: '36px', fontWeight: 900, color: '#F59E0B' }}>5.3만</span>
            <span style={{ fontSize: '14px', color: '#A78BFA', marginTop: '4px' }}>유튜브 구독자</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '16px 32px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <span style={{ fontSize: '36px', fontWeight: 900, color: '#F59E0B' }}>34만</span>
            <span style={{ fontSize: '14px', color: '#A78BFA', marginTop: '4px' }}>월간 조회수</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '16px 32px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <span style={{ fontSize: '36px', fontWeight: 900, color: 'white' }}>전국</span>
            <span style={{ fontSize: '14px', color: '#A78BFA', marginTop: '4px' }}>정비소 네트워크</span>
          </div>
        </div>

        {/* 하단 URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            fontSize: '18px',
            color: '#8B7FA8',
            letterSpacing: '2px',
          }}
        >
          dreammechaniclab.com
        </div>
      </div>
    ),
    { ...size }
  );
}
