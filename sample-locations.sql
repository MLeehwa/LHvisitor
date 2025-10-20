-- 위치 관리 샘플 데이터 삽입
-- Supabase SQL Editor에서 실행하세요

-- 기존 데이터 삭제 (선택사항)
DELETE FROM locations;

-- 샘플 위치 데이터 삽입
INSERT INTO locations (id, name, category, latitude, longitude, radius) VALUES
('location_1', '기숙사 1동', 'dormitory', 37.566500, 126.978000, 0.1),
('location_2', '기숙사 2동', 'dormitory', 37.567000, 126.979000, 0.1),
('location_3', '공장 1동', 'factory', 37.568000, 126.980000, 0.2),
('location_4', '공장 2동', 'factory', 37.569000, 126.981000, 0.2),
('location_5', '관리사무소', 'dormitory', 37.565500, 126.977500, 0.05)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    radius = EXCLUDED.radius,
    updated_at = NOW();
