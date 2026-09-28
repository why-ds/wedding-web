# All About Wedding · wedding-web

예식장 검색·비교 React 초안. React + TypeScript + Vite를 사용하며 가격 계산은 Spring API가 수행합니다.

DB 기반 업체 공개 흐름을 추가했습니다. `/directory`는 검수를 거쳐 게시한 업체 기본 정보를 조회합니다. `/admin`의 초안에서 출처와 확인일을 검수해 공개하고, ‘검수·게시’에서 공개를 중단할 수 있습니다. 10개 업종을 지원하며 상품·가격·견적 저장 편집은 후속입니다. `/`도 실제 공개 업체 목록이며 가상 견적은 `/preview/venues`에서만 제공합니다. 실제 공개 업체의 회원 찜은 PostgreSQL에 저장하며 `/admin` 저장소 상태에서 연결과 권한을 확인할 수 있습니다.

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

`/`와 `/directory`는 DB에서 검수·공개한 10개 업종의 실제 업체 목록입니다. `/directory/{id}`는 사진·주차·조건별 참고 견적 상세이며 날짜·요일·시각·인원을 필터링합니다. 사진은 사용 권한이 확인된 HTTPS 이미지 주소 방식이고 직접 파일 업로드는 아직 지원하지 않습니다. 참고 견적은 등록된 정확한 조건에만 적용되며 자동 계산·실시간 예약·확정 금액을 뜻하지 않습니다. 빈 정보는 미확인으로 표시합니다.

`/preview/venues`의 업체·가격·시설은 별도의 가상 체험입니다. 2027년 예식, 성인 인원 기준입니다. 비회원 체험 찜은 브라우저, 회원 찜은 계정별 서버 저장소에 저장됩니다. 기본 demo 프로필의 회원·계정 찜은 서버 재시작 시 초기화됩니다. 이메일 가입·로그인·로그아웃·닉네임 수정을 지원합니다. 이메일 인증·비밀번호 찾기·예약·영구 조합 견적 저장은 후속 구현입니다.

Vite 개발 서버는 루프백 로컬 미리보기용입니다. 운영은 정적 빌드와 `/api` 역방향 프록시로 제공합니다.

관리자 화면은 `/admin`입니다. 기본 demo 계정 정보는 `../wedding-pai/.runtime/admin-initial-login.txt`에서 확인합니다. 일반 회원가입으로 관리자 권한을 얻을 수 없습니다. 업체 초안 편집에서 사진·주차·참고 견적을 입력하고, 공개 검수의 미리보기를 확인한 뒤 게시합니다. 초안 변경만으로 공개 내용은 바뀌지 않습니다. CSV는 기본 정보 8열만 다루며 상세는 개별 편집에서 입력합니다.

## EC2 미리보기 배포

`.github/workflows/preview.yml`은 main push 시 타입 검사·빌드를 실행합니다. `preview` 환경의 SSH Secrets와 Repository variable `WEDDING_DEPLOY_ENABLED=true`가 준비되면 정적 결과물을 Nginx의 웨딩 전용 폴더로 배포합니다. 기본적으로 배포는 비활성입니다.

서버 최초 설정과 두 저장소의 Secrets 등록은 [API 저장소의 배포 안내](https://github.com/why-ds/wedding-api/blob/main/deploy/README.md)를 따르세요. 임시 주소는 서버 IP의 8088 포트이며, HTTPS 연결 전에는 본인 IP로 접근을 제한하고 테스트 데이터만 사용합니다. 이 배포에서는 Vite 개발 서버를 실행하지 않습니다.
