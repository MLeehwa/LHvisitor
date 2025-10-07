// Supabase 설정 파일
class DatabaseConfig {
    constructor() {
        // Supabase 설정
        this.supabaseUrl = process.env.SUPABASE_URL || 'https://xqjyhoxtahfvfvedoljz.supabase.co';
        this.supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxanlob3h0YWhmdmZ2ZWRvbGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMzM3MzMsImV4cCI6MjA2MTcwOTczM30.unZyS_3aBRq2F0vv62jquTAy7cX40mE5nZYDRajhNqw';
        
        // 데이터베이스 테이블명
        this.tables = {
            visitors: 'visitors',
            visitLogs: 'visit_logs',
            locations: 'locations',
            frequentVisitors: 'frequent_visitors'
        };
        
        // 로컬 스토리지 키
        this.storageKeys = {
            currentVisitors: 'visitorSystem_currentVisitors',
            visitLogs: 'visitorSystem_visitLogs',
            locations: 'visitorSystemLocations',
            frequentVisitors: 'visitorSystemFrequentVisitors'
        };
        
        // 동기화 설정
        this.sync = {
            enabled: true, // true로 설정하면 Supabase와 동기화
            autoSync: true, // 자동 동기화 여부
            syncInterval: 30000, // 30초마다 동기화
            batchSize: 50 // 한 번에 처리할 데이터 수
        };
    }
    
    // Supabase 클라이언트 초기화
    initSupabase() {
        if (typeof supabase === 'undefined') {
            console.error('Supabase가 로드되지 않았습니다. HTML에 Supabase 스크립트를 추가해주세요.');
            return null;
        }
        
        return supabase.createClient(this.supabaseUrl, this.supabaseKey);
    }
    
    // 설정 업데이트
    updateConfig(newConfig) {
        Object.assign(this, newConfig);
        localStorage.setItem('visitorSystem_config', JSON.stringify(this));
    }
    
    // 설정 로드
    loadConfig() {
        const savedConfig = localStorage.getItem('visitorSystem_config');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            Object.assign(this, config);
        }
    }
    
    // 설정 저장
    saveConfig() {
        localStorage.setItem('visitorSystem_config', JSON.stringify(this));
    }
}

// 전역 설정 인스턴스
window.dbConfig = new DatabaseConfig();
window.dbConfig.loadConfig();
