-- 방문자 관리 시스템 데이터베이스 스키마
-- Supabase PostgreSQL 데이터베이스용

-- 1. 방문자 테이블 (현재 체크인된 방문자)
CREATE TABLE IF NOT EXISTS visitors (
    id TEXT PRIMARY KEY,
    name TEXT,
    full_name TEXT,
    last_name TEXT,
    first_name TEXT,
    category TEXT NOT NULL CHECK (category IN ('dormitory', 'factory')),
    location_name TEXT,
    company TEXT,
    phone TEXT,
    purpose TEXT CHECK (purpose IN ('business', 'delivery', 'maintenance', 'inspection', 'meeting', 'other')),
    checkin_time TIMESTAMPTZ,
    checkout_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 방문 로그 테이블 (모든 방문 기록)
CREATE TABLE IF NOT EXISTS visit_logs (
    id TEXT PRIMARY KEY,
    visitor_name TEXT,
    full_name TEXT,
    last_name TEXT,
    first_name TEXT,
    category TEXT NOT NULL CHECK (category IN ('dormitory', 'factory')),
    location_name TEXT,
    company TEXT,
    phone TEXT,
    purpose TEXT CHECK (purpose IN ('business', 'delivery', 'maintenance', 'inspection', 'meeting', 'other')),
    action TEXT NOT NULL CHECK (action IN ('checkin', 'checkout')),
    checkin_time TIMESTAMPTZ,
    checkout_time TIMESTAMPTZ,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 위치 테이블 (GPS 위치 정보)
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('dormitory', 'factory')),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius DECIMAL(8, 3) NOT NULL DEFAULT 0.5, -- 킬로미터 단위
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 자주 방문자 테이블
CREATE TABLE IF NOT EXISTS frequent_visitors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    last_name TEXT,
    first_name TEXT,
    added_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_visitors_category ON visitors(category);
CREATE INDEX IF NOT EXISTS idx_visitors_checkin_time ON visitors(checkin_time);
CREATE INDEX IF NOT EXISTS idx_visitors_location ON visitors(location_name);

CREATE INDEX IF NOT EXISTS idx_visit_logs_category ON visit_logs(category);
CREATE INDEX IF NOT EXISTS idx_visit_logs_timestamp ON visit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_visit_logs_action ON visit_logs(action);
CREATE INDEX IF NOT EXISTS idx_visit_logs_visitor_name ON visit_logs(visitor_name);

CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category);
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_frequent_visitors_name ON frequent_visitors(name);

-- 6. RLS (Row Level Security) 정책 설정
-- 모든 테이블에 대해 읽기/쓰기 권한 허용 (개발용)
-- 운영 환경에서는 적절한 권한 설정 필요

ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE frequent_visitors ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 모든 데이터에 접근 가능 (개발용)
CREATE POLICY "Enable all access for all users" ON visitors FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON visit_logs FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON locations FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON frequent_visitors FOR ALL USING (true);

-- 7. 트리거 함수 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. 트리거 생성
CREATE TRIGGER update_visitors_updated_at 
    BEFORE UPDATE ON visitors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_frequent_visitors_updated_at 
    BEFORE UPDATE ON frequent_visitors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. 샘플 데이터 삽입 (선택사항)
INSERT INTO locations (id, name, category, latitude, longitude, radius) VALUES
('location_1', 'Dormitory Building A', 'dormitory', 37.566500, 126.978000, 0.1),
('location_2', 'Factory Building B', 'factory', 37.567000, 126.979000, 0.1)
ON CONFLICT (id) DO NOTHING;

-- 10. 뷰 생성 (자주 사용하는 쿼리용)
CREATE OR REPLACE VIEW visitor_summary AS
SELECT 
    category,
    COUNT(*) as total_visitors,
    COUNT(CASE WHEN checkin_time IS NOT NULL AND checkout_time IS NULL THEN 1 END) as current_visitors,
    COUNT(CASE WHEN checkout_time IS NOT NULL THEN 1 END) as checked_out_visitors
FROM visitors
GROUP BY category;

CREATE OR REPLACE VIEW daily_visit_stats AS
SELECT 
    DATE(timestamp) as visit_date,
    category,
    action,
    COUNT(*) as count
FROM visit_logs
GROUP BY DATE(timestamp), category, action
ORDER BY visit_date DESC;

-- 11. 함수 생성 (체류 시간 계산)
CREATE OR REPLACE FUNCTION calculate_duration(checkin_time TIMESTAMPTZ, checkout_time TIMESTAMPTZ)
RETURNS INTERVAL AS $$
BEGIN
    IF checkin_time IS NULL OR checkout_time IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN checkout_time - checkin_time;
END;
$$ LANGUAGE plpgsql;

-- 12. 통계 함수
CREATE OR REPLACE FUNCTION get_visitor_stats(start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS TABLE (
    total_visits BIGINT,
    unique_visitors BIGINT,
    avg_duration INTERVAL,
    most_common_purpose TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_visits,
        COUNT(DISTINCT visitor_name) as unique_visitors,
        AVG(calculate_duration(checkin_time, checkout_time)) as avg_duration,
        MODE() WITHIN GROUP (ORDER BY purpose) as most_common_purpose
    FROM visit_logs
    WHERE 
        (start_date IS NULL OR DATE(timestamp) >= start_date) AND
        (end_date IS NULL OR DATE(timestamp) <= end_date);
END;
$$ LANGUAGE plpgsql;
