# 핸드폰-컴퓨터 동기화 - AWS 활용 방법

> 꿈꾸는정비사 프로젝트에서 AWS를 활용하여 핸드폰과 컴퓨터 간 데이터를 동기화하는 방법을 정리한 문서입니다.

## 현재 프로젝트 AWS 사용 현황

- **AWS S3**: 정비소 이미지 업로드/저장
- **CloudFront**: CDN (선택사항)
- **인증**: JWT (Passport) 기반

---

## 방법 1: S3 + Lambda + DynamoDB (서버리스 이벤트 기반)

가장 단순하고 비용 효율적인 방식. 서버 없이 파일 동기화를 구현합니다.

### 아키텍처

```
📱 핸드폰                              💻 컴퓨터
    │                                     │
    ▼                                     ▼
┌─────────────────────────────────────────────┐
│              API Gateway                     │
│         (REST or WebSocket API)              │
└──────────────────┬──────────────────────────┘
                   │
            ┌──────▼──────┐
            │   Lambda     │  ← Presigned URL 생성
            │   Functions  │  ← 메타데이터 관리
            └──────┬──────┘
                   │
          ┌────────┼────────┐
          │                 │
    ┌─────▼─────┐    ┌─────▼─────┐
    │    S3      │    │ DynamoDB   │
    │ (파일저장) │    │ (메타데이터)│
    └───────────┘    └───────────┘
```

### 동작 흐름

1. 기기에서 Lambda를 통해 **Presigned URL** 발급 요청
2. Presigned URL로 S3에 직접 파일 업로드
3. S3 이벤트가 Lambda 트리거 → DynamoDB에 메타데이터 기록
4. 다른 기기에서 DynamoDB 조회 → 새 파일 확인 → S3에서 다운로드

### 장점
- 서버 관리 불필요 (완전 서버리스)
- 사용한 만큼만 비용 발생 (Pay-per-use)
- 기존 S3 인프라 활용 가능

### 단점
- 실시간 푸시 알림이 없음 (폴링 방식)
- 충돌 해결 로직 직접 구현 필요

### 예상 비용 (소규모 사용)
- S3: 월 ~$0.023/GB
- Lambda: 월 100만 건 무료
- DynamoDB: 월 25GB 무료 (프리티어)

---

## 방법 2: AppSync + Cognito + S3 (실시간 동기화)

GraphQL 기반 실시간 동기화. 파일이 변경되면 즉시 다른 기기에 알림이 전달됩니다.

### 아키텍처

```
📱 핸드폰                         💻 컴퓨터
    │                                │
    └───────────┬────────────────────┘
                │
         ┌──────▼──────┐
         │   Cognito    │  ← 사용자 인증 + 임시 자격증명
         │  User Pool   │
         │+ Identity Pool│
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │   AppSync    │  ← GraphQL API
         │              │  ← 실시간 Subscription
         └──────┬──────┘
                │
        ┌───────┼───────┐
        │               │
  ┌─────▼─────┐  ┌─────▼─────┐
  │ DynamoDB   │  │    S3      │
  │(메타데이터)│  │ (파일저장)  │
  └───────────┘  └───────────┘
```

### 동작 흐름

1. Cognito로 로그인 → 임시 AWS 자격증명 발급
2. S3에 파일 업로드 (Cognito 자격증명 사용)
3. AppSync Mutation으로 파일 메타데이터를 DynamoDB에 저장
4. **AppSync Subscription**으로 다른 기기에 실시간 변경 알림 푸시
5. 다른 기기에서 알림 수신 → S3에서 파일 다운로드

### 장점
- **실시간 동기화** (WebSocket 기반 Subscription)
- **오프라인 지원** (Amplify DataStore 활용)
- 사용자별 S3 폴더 격리 (Cognito Identity Pool)
- AWS Amplify로 빠른 개발 가능

### 단점
- 학습 곡선이 있음 (GraphQL, AppSync, Cognito)
- 방법 1보다 복잡한 설정

### 예상 비용 (소규모 사용)
- AppSync: 월 $3.50/백만 쿼리, 실시간 연결 $0.08/백만분
- Cognito: 월 50,000 MAU 무료 (프리티어)
- S3 + DynamoDB: 방법 1과 동일

---

## 방법 3: 기존 NestJS 백엔드 확장 (가장 현실적)

현재 꿈꾸는정비사의 NestJS 백엔드를 확장하여 동기화 API를 추가하는 방법입니다.

### 아키텍처

```
📱 핸드폰 (PWA/앱)              💻 컴퓨터 (웹 브라우저)
    │                                │
    └───────────┬────────────────────┘
                │
    ┌───────────▼───────────┐
    │   기존 NestJS 백엔드    │
    │                        │
    │  ├── AuthModule (JWT)  │  ← 기존 인증 활용
    │  ├── SyncModule (NEW)  │  ← 동기화 API 추가
    │  └── S3Module (기존)    │  ← 기존 S3 업로드 활용
    └───────────┬───────────┘
                │
        ┌───────┼───────┐
        │               │
  ┌─────▼─────┐  ┌─────▼─────┐
  │ PostgreSQL │  │    S3      │
  │  (기존DB)  │  │  (기존)    │
  └───────────┘  └───────────┘
```

### 구현 방법

```typescript
// 새로 추가할 Sync 모듈 구조 (예시)

// sync.controller.ts
@Controller('sync')
export class SyncController {
  // 파일 목록 조회 (마지막 동기화 이후 변경된 것만)
  @Get('files')
  getUpdatedFiles(@Query('since') since: string) { }

  // 파일 업로드 (S3에 저장 + DB에 메타데이터 기록)
  @Post('upload')
  uploadFile(@UploadedFile() file) { }

  // 파일 다운로드 URL 발급 (S3 Presigned URL)
  @Get('download/:fileId')
  getDownloadUrl(@Param('fileId') fileId: string) { }

  // 동기화 상태 확인
  @Get('status')
  getSyncStatus() { }
}

// sync-file.entity (Prisma schema 추가)
// model SyncFile {
//   id        String   @id @default(uuid())
//   userId    String
//   fileName  String
//   s3Key     String
//   fileSize  Int
//   mimeType  String
//   checksum  String   // MD5 해시로 변경 감지
//   deviceId  String   // 업로드한 기기 식별
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
//   deletedAt DateTime? // soft delete
// }
```

### 장점
- **기존 인프라 100% 활용** (NestJS, S3, PostgreSQL, JWT)
- 추가 AWS 서비스 비용 없음
- 팀의 기존 기술 스택으로 개발 가능
- 빠른 개발 가능

### 단점
- 실시간 푸시 없음 (WebSocket 추가 시 가능)
- 서버 관리 필요 (이미 하고 있으므로 추가 부담 적음)

---

## 방법 비교 요약

| 항목 | 방법 1 (서버리스) | 방법 2 (AppSync) | 방법 3 (NestJS 확장) |
|------|:-:|:-:|:-:|
| **실시간 동기화** | ✗ (폴링) | ✓ (WebSocket) | △ (WebSocket 추가 시) |
| **오프라인 지원** | ✗ | ✓ (Amplify) | ✗ |
| **기존 인프라 활용** | △ (S3만) | △ (S3만) | ✓ (전부) |
| **추가 비용** | 낮음 | 중간 | 최소 |
| **개발 복잡도** | 중간 | 높음 | 낮음 |
| **확장성** | 높음 | 높음 | 중간 |
| **학습 곡선** | 중간 | 높음 | 낮음 |

---

## 동기화 대상별 추천

### 파일 동기화 (사진, 문서 등)
→ **방법 3 (NestJS 확장)** 또는 **방법 1 (서버리스)** 추천

### 실시간 데이터 동기화 (메모, 설정 등)
→ **방법 2 (AppSync)** 추천

### 정비소 관리 데이터 동기화 (현재 프로젝트 확장)
→ **방법 3 (NestJS 확장)** 강력 추천
- 이미 JWT 인증, S3 업로드, PostgreSQL이 모두 구축되어 있음
- 모바일 PWA로 핸드폰 접근 지원 가능

---

## 참고 자료

- [AWS S3 + Lambda + DynamoDB 서버리스 아키텍처](https://medium.com/@kothurusaipavan6/serverless-architectures-on-aws-using-lambda-s3-and-dynamodb-together-d1d86648e8c9)
- [S3 메타데이터 DynamoDB 동기화 (Lambda)](https://tonythomas.in/how-to-sync-the-metadata-of-an-uploaded-file-in-s3-to-dyanamodb-using-lamda/)
- [AWS AppSync 소개 (한국 블로그)](https://aws.amazon.com/ko/blogs/korea/introducing-amazon-appsync/)
- [AWS AppSync란 무엇인가?](https://docs.aws.amazon.com/ko_kr/appsync/latest/devguide/what-is-appsync.html)
- [Amazon Cognito 소개](https://www.slideshare.net/awskorea/intro-to-amazon-cognito-2016)
- [사용자 파일 스토리지 - AWS Mobile Hub](https://docs.aws.amazon.com/ko_kr/aws-mobile/latest/developerguide/User-Data-Storage.html)
- [AWS CLI로 S3 동기화](https://lovit.github.io/aws/2019/01/30/aws_s3_iam_awscli/)
- [S3 버킷 동기화 (Step Functions)](https://aws.amazon.com/blogs/compute/synchronizing-amazon-s3-buckets-using-aws-step-functions/)
