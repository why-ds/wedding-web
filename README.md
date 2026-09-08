# wedding-web

예식장 검색·비교 React 초안. React + TypeScript + Vite를 사용하며 가격 계산은 Spring API가 수행합니다.

## 실행

Node.js와 npm이 있는 환경에서:

```powershell
cd D:\dev\wedding\wedding-web
npm.cmd install
npm.cmd run dev
```

브라우저: http://127.0.0.1:5173/

Spring 서버를 8080 포트에서 함께 실행해야 검색 결과가 표시됩니다. `/api` 요청은 Vite가 Spring으로 프록시합니다. 파일을 수정하면 HMR로 화면에 반영됩니다.

## 구성

- `src/App.tsx`: 검색 조건, 결과 카드, 상세 대화상자, 비교표, 찜.
- `src/api.ts`: Spring API 타입, 검색 요청, 공유 URL 조건.
- `src/styles.css`: 데스크톱·모바일 스타일.
- `vite.config.ts`: 포트와 로컬 API 프록시.

## 검증

```powershell
npm.cmd run build
```

현재 업체·가격·시설은 가상입니다. 2027년 예식, 성인 인원 기준입니다. 비회원 찜은 이 브라우저, 회원 찜은 계정별 서버 저장소에 저장됩니다. 기본 demo 모드의 회원·계정 찜은 서버 재시작 시 초기화됩니다. 다른 카테고리는 준비 중 상태입니다. 이메일 가입·로그인·로그아웃·닉네임 수정을 지원합니다. 이메일 인증·비밀번호 찾기·실데이터·예약·영구 견적 저장은 후속 구현입니다.

Vite 개발 서버는 로컬 미리보기용입니다. 운영 배포에서는 정적 빌드와 `/api` 역방향 프록시를 별도로 구성해야 합니다. 이번 초안은 공개 배포하지 않습니다.
