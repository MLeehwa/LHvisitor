# 🏠 기숙사 방문자 관리 시스템

GPS 기반 방문자 체크인/체크아웃 시스템 - 태블릿 최적화

## ✨ 주요 기능

- 📍 **GPS 위치 기반 자동 카테고리 감지** (기숙사/공장)
- 👥 **방문자 체크인/체크아웃 관리**
- 📊 **실시간 방문자 현황 표시**
- 📋 **방문 로그 관리 및 엑셀 다운로드**
- ⚙️ **관리자 모드**
- 🔄 **자주 방문하는 방문자 관리**
- 📱 **PWA 지원** (홈 화면 설치 가능)
- 🔄 **오프라인 지원**
- 👆 **터치 제스처 지원** (태블릿 최적화)

## 🚀 배포된 사이트

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/dormitory-visitor-system)

## 📱 태블릿 최적화 기능

- **터치 제스처**:
  - 좌우 스와이프: 체크인/체크아웃 전환
  - 아래 스와이프: 메인 화면 복귀
  - 더블 탭: 위치 새로고침
- **PWA 설치**: 홈 화면에 앱처럼 설치 가능
- **오프라인 작동**: 인터넷 없이도 기본 기능 사용
- **배터리 최적화**: GPS 설정 최적화

## 🛠️ 로컬 개발

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/your-username/dormitory-visitor-system.git
cd dormitory-visitor-system

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

### 브라우저 접속

- 메인 페이지: `http://localhost:5000`
- 관리자 페이지: `http://localhost:5000/admin.html`

## ⚙️ 설정

1. **GPS 위치 설정**: 관리자 모드에서 위치 및 반경 설정
2. **Supabase 연동**: `config.js`에서 데이터베이스 설정
3. **PWA 설정**: `manifest.json`에서 앱 정보 수정

## 📋 사용법

1. **체크인**: 
   - GPS 위치 감지 후 자동으로 기숙사/공장 구분
   - 방문자 정보 입력 후 체크인 완료

2. **체크아웃**:
   - 성으로 방문자 검색
   - 선택 후 체크아웃 완료

3. **관리자 모드**:
   - 비밀번호: `admin123`
   - 방문자 현황, 로그 관리, 위치 설정

## 🔧 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Tailwind CSS + DaisyUI
- **Icons**: Font Awesome
- **Database**: Supabase (PostgreSQL)
- **PWA**: Service Worker, Web App Manifest
- **Deployment**: Vercel

## 📱 지원 브라우저

- Chrome (권장)
- Safari
- Firefox
- Edge
- 모바일 브라우저 (iOS Safari, Chrome Mobile)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제가 있으시면 이슈를 생성해주세요.