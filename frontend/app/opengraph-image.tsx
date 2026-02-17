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
          background: 'linear-gradient(135deg, #0F2B22 0%, #1B4D3E 50%, #0F2B22 100%)',
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
            background: 'rgba(255, 107, 53, 0.15)',
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
            background: 'rgba(45, 122, 95, 0.2)',
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
              color: '#FF6B35',
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
            color: '#a0c4b8',
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
            <span style={{ fontSize: '36px', fontWeight: 900, color: '#FF6B35' }}>5.3만</span>
            <span style={{ fontSize: '14px', color: '#7faa9a', marginTop: '4px' }}>유튜브 구독자</span>
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
            <span style={{ fontSize: '36px', fontWeight: 900, color: '#FF6B35' }}>34만</span>
            <span style={{ fontSize: '14px', color: '#7faa9a', marginTop: '4px' }}>월간 조회수</span>
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
            <span style={{ fontSize: '14px', color: '#7faa9a', marginTop: '4px' }}>정비소 네트워크</span>
          </div>
        </div>

        {/* 하단 URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            fontSize: '18px',
            color: '#5d9a87',
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
