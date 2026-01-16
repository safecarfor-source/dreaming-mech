import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 관리자 생성
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password: hashedPassword,
      name: '관리자',
    },
  });
  console.log('✅ Admin created:', admin.email);

  // 정비사 더미 데이터 (서울 지역 실제 좌표)
  const mechanics = [
    {
      name: '강남 오토센터',
      location: '강남구',
      phone: '02-1234-5678',
      description:
        '수입차 전문 정비소입니다. 20년 경력의 숙련된 기술자가 정성껏 관리해드립니다.',
      address: '서울시 강남구 테헤란로 123',
      mapLat: 37.5012743,
      mapLng: 127.0396597,
      mainImageUrl:
        'https://via.placeholder.com/800x600/4A5568/FFFFFF?text=강남+오토센터',
      galleryImages: [
        'https://via.placeholder.com/400x300/4A5568/FFFFFF?text=Image+1',
        'https://via.placeholder.com/400x300/4A5568/FFFFFF?text=Image+2',
      ],
      youtubeUrl: 'https://www.youtube.com/shorts/example1',
      clickCount: 0,
    },
    {
      name: '서초 모터스',
      location: '서초구',
      phone: '02-2345-6789',
      description: '국산차, 수입차 모두 가능한 종합 정비소입니다.',
      address: '서울시 서초구 서초대로 456',
      mapLat: 37.4833,
      mapLng: 127.0322,
      mainImageUrl:
        'https://via.placeholder.com/800x600/6B7280/FFFFFF?text=서초+모터스',
      galleryImages: [
        'https://via.placeholder.com/400x300/6B7280/FFFFFF?text=Image+1',
      ],
      youtubeUrl: null,
      clickCount: 0,
    },
    {
      name: '용산 카센터',
      location: '용산구',
      phone: '02-3456-7890',
      description: '엔진 전문 정비소. 엔진 오버홀 전문.',
      address: '서울시 용산구 한강대로 789',
      mapLat: 37.5326,
      mapLng: 126.9652,
      mainImageUrl:
        'https://via.placeholder.com/800x600/9CA3AF/FFFFFF?text=용산+카센터',
      galleryImages: null,
      youtubeUrl: 'https://www.youtube.com/shorts/example2',
      clickCount: 5,
    },
    {
      name: '송파 정비공업사',
      location: '송파구',
      phone: '02-4567-8901',
      description: '빠르고 정확한 진단. 합리적인 가격.',
      address: '서울시 송파구 올림픽로 321',
      mapLat: 37.5145,
      mapLng: 127.1065,
      mainImageUrl:
        'https://via.placeholder.com/800x600/D1D5DB/000000?text=송파+정비공업사',
      galleryImages: [
        'https://via.placeholder.com/400x300/D1D5DB/000000?text=Image+1',
        'https://via.placeholder.com/400x300/D1D5DB/000000?text=Image+2',
        'https://via.placeholder.com/400x300/D1D5DB/000000?text=Image+3',
      ],
      youtubeUrl: null,
      clickCount: 12,
    },
    {
      name: '마포 자동차정비',
      location: '마포구',
      phone: '02-5678-9012',
      description: '친절하고 꼼꼼한 정비 서비스.',
      address: '서울시 마포구 마포대로 654',
      mapLat: 37.5597,
      mapLng: 126.9089,
      mainImageUrl:
        'https://via.placeholder.com/800x600/E5E7EB/000000?text=마포+자동차정비',
      galleryImages: null,
      youtubeUrl: 'https://www.youtube.com/shorts/example3',
      clickCount: 3,
    },
  ];

  for (const mechanic of mechanics) {
    const created = await prisma.mechanic.create({
      data: mechanic,
    });
    console.log('✅ Mechanic created:', created.name);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
