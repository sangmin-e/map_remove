# 사이 — OpenStreetMap 거리 측정기

출발지와 도착지를 Nominatim으로 검색하고, OSRM 자동차 경로 기준 총거리와 예상 시간을 보여주는 웹앱입니다. 결과 하단의 **지도에서 보기**를 누르면 동일한 두 지점이 OpenStreetMap 길찾기 화면에서 열립니다.

## 로컬 확인

```bash
npm test
npm run build
npm run dev
```

`npm run dev`를 실행하고 `http://127.0.0.1:4174`를 열면 정적 화면과 API를 함께 테스트할 수 있습니다. Vercel과 동일한 개발 환경이 필요하다면 [Vercel CLI](https://vercel.com/docs/cli)의 `vercel dev`를 사용해도 됩니다.

## GitHub → Vercel 배포

1. 이 폴더를 새 GitHub 저장소에 푸시합니다.
2. Vercel에서 **Add New → Project**를 누르고 저장소를 Import합니다.
3. 빌드 설정은 `vercel.json`에서 자동으로 읽습니다. 별도로 바꿀 항목은 없습니다.
4. 배포 전에 Environment Variables에 `NOMINATIM_USER_AGENT`를 추가하고, 연락 가능한 이메일이 포함된 값을 설정하는 것을 권장합니다.

예시: `SaiDistanceApp/1.0 (contact: you@example.com)`

## 사용 API

- 장소 검색: [Nominatim](https://nominatim.org/)
- 자동차 경로: [OSRM](https://project-osrm.org/)
- 데이터: [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)

브라우저에서는 검색어 입력 중 자동 요청을 보내지 않으며, 두 장소 검색 요청 사이에 1.1초 간격을 둡니다. 이는 공개 Nominatim 서비스의 사용 정책을 배려한 동작입니다. 트래픽이 많은 상용 서비스로 운영하려면 Nominatim/OSRM 자체 호스팅 또는 별도 상용 제공자를 사용하세요.

공개 Nominatim 서버는 **앱 전체를 합쳐 초당 최대 1회 요청**만 허용하며 자동완성을 금지합니다. 배포 전 [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)를 반드시 확인하세요. 이 프로젝트는 사용자 검색 시에만 요청하고 Vercel 캐시를 사용하지만, 여러 사용자가 동시에 접속하는 규모에는 공개 서버가 적합하지 않습니다. `NOMINATIM_BASE_URL` 환경 변수만 바꾸면 자체 호스팅 또는 계약한 호환 서버로 전환할 수 있습니다.
