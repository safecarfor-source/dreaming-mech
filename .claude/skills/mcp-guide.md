---
name: mcp-guide
description: 커스텀 MCP 서버 제작 가이드. "MCP 만들어줘", "커스텀 MCP", "MCP 제작", "도구 만들기" 요청 시 트리거.
---

# 커스텀 MCP 제작 가이드

## Purpose (목적)
대장님 맞춤 커스텀 MCP 서버를 설계하고 구현한다.

## Trigger (자동 트리거)
- "MCP 만들어줘", "커스텀 MCP", "MCP 제작"
- "도구 만들어줘", "자동화 도구 필요해"
- 기존 MCP로 할 수 없는 새 기능이 필요할 때

## MCP란? (대장님 기준)
정비소에 새 장비를 설치하는 것.
- 기본 공구(파일 읽기, 검색)는 이미 있음
- 특수 장비(텔레그램 알림, DB 조회 등)가 필요하면 MCP로 추가
- MCP = Claude에게 새로운 **능력**을 주는 것

## MCP vs 스킬 — 언제 뭘 쓰나?

| 상황 | 선택 | 이유 |
|------|------|------|
| 외부 API 연동 (텔레그램, Grok) | 스킬 먼저 | 컨텍스트 절약, 수동 전달로 충분 |
| 실시간 자동 연동 (DB 모니터링) | MCP | 자동으로 호출해야 하니까 |
| 반복 작업 자동화 | 스킬 또는 훅 | MCP 없어도 가능 |
| 외부 서비스 읽기/쓰기 | MCP | API 직접 호출 필요 |

**원칙: 스킬로 해결 가능하면 스킬 먼저. MCP는 정말 필요할 때만.**

## Process (MCP 제작 절차)
1. **필요성 확인** — "이거 스킬이나 훅으로 안 되나?" 먼저 검토
2. **설계** — 어떤 도구(tool)를 제공할지 정의
3. **구현** — Node.js 또는 Python으로 MCP 서버 코드 작성
4. **등록** — settings.json에 MCP 서버 추가
5. **테스트** — `/mcp` 명령으로 연결 확인
6. **⏸ 대장님 확인** — 정상 동작하는지 같이 테스트

## MCP 서버 기본 구조 (Node.js)
```javascript
// my-mcp-server.js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server({
  name: 'my-custom-mcp',
  version: '1.0.0',
});

// 도구 정의
server.setRequestHandler('tools/list', async () => ({
  tools: [{
    name: 'my_tool',
    description: '이 도구가 하는 일',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } }
  }]
}));

// 도구 실행
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'my_tool') {
    // 여기서 실제 작업 수행
    return { content: [{ type: 'text', text: '결과' }] };
  }
});
```

## 등록 방법
settings.json에 추가:
```json
{
  "mcpServers": {
    "my-custom-mcp": {
      "command": "node",
      "args": ["/path/to/my-mcp-server.js"],
      "env": { "API_KEY": "..." }
    }
  }
}
```

## 대장님 맞춤 MCP 후보 (필요할 때 제작)

### 1. 텔레그램 알림 MCP
- 빌드 실패, 배포 완료 등 → 텔레그램으로 알림
- Think Tank 봇과 연동 가능

### 2. 정비소 데이터 MCP
- 극동 DB readonly_user로 안전 조회
- "오늘 매출 얼마야?" → 직접 DB 조회

### 3. 유튜브 분석 MCP
- 채널 통계, 인기 영상, 댓글 분석
- 유튜브 API 키 필요

## Constraints (제약)
- API 키는 반드시 환경변수(.env)로 관리
- MCP 서버가 크면 컨텍스트를 많이 차지 → 도구 최소화
- 프로덕션 DB에 쓰기 권한 주지 않기 (readonly_user만)
