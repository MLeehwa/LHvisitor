# Supabase 연동 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 계정 생성
2. "New Project" 클릭하여 새 프로젝트 생성
3. 프로젝트 이름과 데이터베이스 비밀번호 설정
4. 지역 선택 (가장 가까운 지역 선택)

## 2. 데이터베이스 스키마 설정

1. Supabase 대시보드에서 "SQL Editor" 메뉴 선택
2. `database-schema.sql` 파일의 내용을 복사하여 실행
3. 모든 테이블과 인덱스가 생성되었는지 확인

## 3. API 키 설정

1. Supabase 대시보드에서 "Settings" > "API" 메뉴 선택
2. Project URL과 anon public key 복사
3. `config.js` 파일에서 다음 값들을 업데이트:

```javascript
this.supabaseUrl = 'YOUR_SUPABASE_URL'; // Project URL
this.supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // anon public key
```

## 4. 동기화 활성화

`config.js` 파일에서 동기화 설정을 활성화:

```javascript
this.sync = {
    enabled: true, // true로 변경
    autoSync: true,
    syncInterval: 30000, // 30초마다 동기화
    batchSize: 50
};
```

## 5. 테이블 구조

### visitors (현재 체크인된 방문자)
- id: 고유 식별자
- name: 방문자 이름
- category: 기숙사/공장 구분
- checkin_time: 체크인 시간
- checkout_time: 체크아웃 시간

### visit_logs (모든 방문 기록)
- id: 고유 식별자
- visitor_name: 방문자 이름
- category: 기숙사/공장 구분
- action: 체크인/체크아웃 구분
- timestamp: 기록 시간

### locations (GPS 위치 정보)
- id: 고유 식별자
- name: 위치 이름
- category: 기숙사/공장 구분
- latitude: 위도
- longitude: 경도
- radius: 체크인 반경 (km)

### frequent_visitors (자주 방문자)
- id: 고유 식별자
- name: 방문자 이름
- added_date: 추가된 날짜

## 6. 보안 설정

### RLS (Row Level Security) 정책
현재는 모든 사용자가 모든 데이터에 접근 가능하도록 설정되어 있습니다.
운영 환경에서는 적절한 권한 설정이 필요합니다.

### 권한 설정 예시:
```sql
-- 특정 사용자만 접근 가능하도록 설정
CREATE POLICY "Users can only see their own data" ON visitors
    FOR ALL USING (auth.uid()::text = user_id);
```

## 7. 모니터링 및 백업

### 실시간 모니터링
- Supabase 대시보드에서 실시간 데이터 확인 가능
- API 사용량 및 성능 모니터링

### 백업 설정
- Supabase는 자동 백업을 제공
- 필요시 수동 백업도 가능

## 8. 문제 해결

### 일반적인 문제들:

1. **연결 실패**: API 키와 URL이 올바른지 확인
2. **권한 오류**: RLS 정책 확인
3. **동기화 실패**: 네트워크 연결 상태 확인

### 디버깅:
- 브라우저 개발자 도구의 콘솔에서 오류 메시지 확인
- Supabase 로그에서 서버 측 오류 확인

## 9. 성능 최적화

### 인덱스 활용
- 자주 검색하는 컬럼에 인덱스 생성
- 복합 인덱스로 쿼리 성능 향상

### 배치 처리
- 대량 데이터 처리 시 배치 크기 조정
- 동기화 간격 조정으로 성능 최적화

## 10. 추가 기능

### 실시간 구독
```javascript
// 실시간 데이터 변경 감지
const subscription = supabase
    .channel('visitors')
    .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'visitors' },
        (payload) => console.log('Change received!', payload)
    )
    .subscribe();
```

### 데이터 분석
- Supabase 대시보드에서 기본 통계 확인
- 커스텀 쿼리로 상세 분석 가능
