# All About Wedding · wedding-web

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
- `src/admin/AdminApp.tsx`: `/admin` 전용 관리자 로그인, 업체 초안, CSV 업로드, 변경 이력 화면. 별도 청크로 로드합니다.
- `src/membership.ts`: 회원 세션·찜과 CSRF를 포함하는 API 요청.
- `vite.config.ts`: 포트와 로컬 API 프록시.

## 검증

```powershell
npm.cmd run build
```

현재 업체·가격·시설은 가상입니다. 2027년 예식, 성인 인원 기준입니다. 비회원 찜은 이 브라우저, 회원 찜은 계정별 서버 저장소에 저장됩니다. 기본 demo 모드의 회원·계정 찜은 서버 재시작 시 초기화됩니다. 다른 카테고리는 준비 중 상태입니다. 이메일 가입·로그인·로그아웃·닉네임 수정을 지원합니다. 이메일 인증·비밀번호 찾기·실데이터·예약·영구 견적 저장은 후속 구현입니다.

Vite 개발 서버는 로컬 미리보기용입니다. 운영 배포에서는 정적 빌드와 `/api` 역방향 프록시를 별도로 구성해야 합니다. 이번 초안은 공개 배포하지 않습니다.

관리자 화면은 http://127.0.0.1:5173/admin 입니다. 기본 demo 계정 정보는 `../wedding-pai/.runtime/admin-initial-login.txt`에서 확인합니다. 일반 회원가입으로 관리자 권한을 얻을 수 없습니다. 관리 데이터는 초안이며 아직 공개 검색과 연결하지 않습니다. CSV 양식은 로그인 후 데이터 업로드 메뉴에서 다운로드합니다.

## EC2 미리보기 배포

`.github/workflows/preview.yml`은 main push 시 타입 검사·빌드를 실행합니다. `preview` 환경의 SSH Secrets와 Repository variable `WEDDING_DEPLOY_ENABLED=true`가 준비되면 정적 결과물을 Nginx의 웨딩 전용 폴더로 배포합니다. 기본적으로 배포는 비활성입니다.

서버 최초 설정과 두 저장소의 Secrets 등록은 [API 저장소의 배포 안내](https://github.com/why-ds/wedding-api/blob/main/deploy/README.md)를 따르세요. 임시 주소는 서버 IP의 8088 포트이며, HTTPS 연결 전에는 본인 IP로 접근을 제한하고 테스트 데이터만 사용합니다. 이 배포에서는 Vite 개발 서버를 실행하지 않습니다.
