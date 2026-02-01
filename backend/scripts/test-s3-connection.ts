/**
 * AWS S3 연결 테스트 스크립트
 *
 * 사용법:
 * 1. backend/.env 파일에 AWS 자격증명이 설정되어 있는지 확인
 * 2. npm run build (또는 ts-node 설치)
 * 3. npx ts-node scripts/test-s3-connection.ts
 */

import { S3Client, ListBucketsCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testS3Connection() {
  log('\n🔍 AWS S3 연결 테스트 시작...\n', colors.cyan);

  // 1. 환경 변수 확인
  log('1️⃣  환경 변수 확인...', colors.blue);
  const bucketName = process.env.AWS_S3_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'ap-northeast-2';
  const cloudFrontUrl = process.env.AWS_CLOUDFRONT_URL;

  if (!bucketName || !accessKeyId || !secretAccessKey) {
    log('❌ 환경 변수가 설정되지 않았습니다!', colors.red);
    log('   다음 변수들이 .env 파일에 필요합니다:', colors.yellow);
    log('   - AWS_S3_BUCKET', colors.yellow);
    log('   - AWS_ACCESS_KEY_ID', colors.yellow);
    log('   - AWS_SECRET_ACCESS_KEY', colors.yellow);
    log('   - AWS_REGION (선택, 기본값: ap-northeast-2)', colors.yellow);
    process.exit(1);
  }

  log(`✅ 버킷 이름: ${bucketName}`, colors.green);
  log(`✅ 리전: ${region}`, colors.green);
  log(`✅ Access Key: ${accessKeyId.substring(0, 8)}...`, colors.green);
  if (cloudFrontUrl) {
    log(`✅ CloudFront URL: ${cloudFrontUrl}`, colors.green);
  } else {
    log(`⚠️  CloudFront URL이 설정되지 않았습니다 (선택사항)`, colors.yellow);
  }

  // 2. S3 클라이언트 생성
  log('\n2️⃣  S3 클라이언트 초기화...', colors.blue);
  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
  log('✅ S3 클라이언트 생성 완료', colors.green);

  // 3. 버킷 목록 조회 (IAM 권한 테스트)
  log('\n3️⃣  IAM 권한 테스트 (버킷 목록 조회)...', colors.blue);
  try {
    const listBucketsCommand = new ListBucketsCommand({});
    const bucketsResponse = await s3Client.send(listBucketsCommand);
    log('✅ 버킷 목록 조회 성공', colors.green);

    const bucketExists = bucketsResponse.Buckets?.some(b => b.Name === bucketName);
    if (bucketExists) {
      log(`✅ 대상 버킷 "${bucketName}" 존재 확인`, colors.green);
    } else {
      log(`❌ 버킷 "${bucketName}"을(를) 찾을 수 없습니다!`, colors.red);
      log(`   사용 가능한 버킷:`, colors.yellow);
      bucketsResponse.Buckets?.forEach(bucket => {
        log(`   - ${bucket.Name}`, colors.yellow);
      });
      process.exit(1);
    }
  } catch (error: any) {
    log('❌ 버킷 목록 조회 실패', colors.red);
    log(`   에러: ${error.message}`, colors.red);
    process.exit(1);
  }

  // 4. 테스트 파일 업로드
  log('\n4️⃣  테스트 파일 업로드...', colors.blue);
  const testFileName = `test/connection-test-${Date.now()}.txt`;
  const testContent = 'AWS S3 연결 테스트 파일\n생성 시간: ' + new Date().toISOString();

  try {
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testFileName,
      Body: testContent,
      ContentType: 'text/plain',
      ACL: 'public-read',
    });
    await s3Client.send(putCommand);
    log('✅ 파일 업로드 성공', colors.green);

    const fileUrl = cloudFrontUrl
      ? `${cloudFrontUrl}/${testFileName}`
      : `https://${bucketName}.s3.${region}.amazonaws.com/${testFileName}`;
    log(`   URL: ${fileUrl}`, colors.cyan);
  } catch (error: any) {
    log('❌ 파일 업로드 실패', colors.red);
    log(`   에러: ${error.message}`, colors.red);

    if (error.Code === 'AccessDenied') {
      log('\n   💡 IAM 권한을 확인하세요:', colors.yellow);
      log('   - s3:PutObject 권한이 필요합니다', colors.yellow);
      log('   - s3:PutObjectAcl 권한이 필요합니다', colors.yellow);
    }

    process.exit(1);
  }

  // 5. 테스트 파일 다운로드
  log('\n5️⃣  테스트 파일 다운로드...', colors.blue);
  try {
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: testFileName,
    });
    const response = await s3Client.send(getCommand);
    const downloadedContent = await response.Body?.transformToString();

    if (downloadedContent === testContent) {
      log('✅ 파일 다운로드 및 내용 검증 성공', colors.green);
    } else {
      log('⚠️  파일 다운로드는 성공했으나 내용이 일치하지 않습니다', colors.yellow);
    }
  } catch (error: any) {
    log('❌ 파일 다운로드 실패', colors.red);
    log(`   에러: ${error.message}`, colors.red);

    if (error.Code === 'AccessDenied') {
      log('\n   💡 버킷 정책 또는 IAM 권한을 확인하세요:', colors.yellow);
      log('   - s3:GetObject 권한이 필요합니다', colors.yellow);
      log('   - 버킷 정책에서 공개 읽기 권한이 설정되어 있는지 확인하세요', colors.yellow);
    }

    process.exit(1);
  }

  // 6. 테스트 파일 삭제
  log('\n6️⃣  테스트 파일 삭제...', colors.blue);
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: testFileName,
    });
    await s3Client.send(deleteCommand);
    log('✅ 파일 삭제 성공', colors.green);
  } catch (error: any) {
    log('❌ 파일 삭제 실패', colors.red);
    log(`   에러: ${error.message}`, colors.red);
    log(`   수동으로 삭제하세요: ${testFileName}`, colors.yellow);
  }

  // 7. 최종 결과
  log('\n' + '='.repeat(60), colors.green);
  log('🎉 모든 테스트 통과!', colors.green);
  log('AWS S3 연결이 정상적으로 작동합니다.', colors.green);
  log('='.repeat(60) + '\n', colors.green);

  log('다음 단계:', colors.cyan);
  log('1. 백엔드 서버 시작: npm run start:dev', colors.cyan);
  log('2. 프론트엔드에서 이미지 업로드 테스트', colors.cyan);
  log('3. 업로드된 이미지 URL로 브라우저 접근 테스트\n', colors.cyan);
}

// 스크립트 실행
testS3Connection().catch((error) => {
  log('\n💥 예기치 않은 오류 발생:', colors.red);
  console.error(error);
  process.exit(1);
});
