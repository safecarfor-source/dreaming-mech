# 꿈꾸는정비사 — 작업 추적

## 현재 진행 중
- [ ] 타이어 문의 기능 (고객 활성화 핵심 기능)
  - [ ] Backend: TireInquiry 모델 + API
  - [ ] Backend: Mechanic에 kakaoOpenChatUrl 필드 추가
  - [ ] Backend: 검색/필터링 강화
  - [ ] Frontend: 타이어 문의 페이지 (/tire-inquiry)
  - [ ] Frontend: 홈페이지 타이어 문의 CTA
  - [ ] Frontend: 검색/필터링 UI
- [ ] HTTPS 설정 (Nginx + Let's Encrypt)
  - [x] Nginx Docker 설정 (nginx.conf)
  - [x] Docker Compose 업데이트 (nginx + certbot 서비스)
  - [x] SSL 초기화 스크립트 (init-letsencrypt.sh)
  - [ ] 도메인 설정 후 SSL 활성화

## 대기 중
- [ ] 관리자 대시보드: 타이어 문의 관리 페이지
- [ ] 알림톡 연동 (타이어 문의 접수 시 관리자 알림)
- [ ] Phase 9: 프로덕션 배포
- [ ] Phase 10: 통합 테스트 (E2E)

## 완료
- [x] Phase 0-8 구현 완료
- [x] 보안 Phase 1 완료 (9/9 - 100%)
- [x] 디자인 시스템 문서화 (DESIGN_SKILLS_ROADMAP.md)
- [x] CLAUDE.md 작업 규칙 작성
- [x] 홈페이지 UI 개편
- [x] 정비소 상세 모달 UI 개선
- [x] 워크플로우 오케스트레이션 설정

---

## 검토 기록
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-02-22 | 오케스트레이션 셋팅 | 완료 |
| 2026-02-23 | 타이어 문의 기능 + HTTPS + 검색 | 진행 중 |
