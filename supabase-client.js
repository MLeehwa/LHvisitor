// Supabase 데이터베이스 연동 클래스
class SupabaseClient {
    constructor() {
        this.client = null;
        this.config = window.dbConfig;
        this.init();
    }
    
    // 초기화
    init() {
        console.log('=== Supabase 클라이언트 초기화 시작 ===');
        console.log('window.dbConfig 존재:', !!this.config);
        console.log('동기화 설정:', this.config.sync);
        
        // Supabase가 로드될 때까지 기다림
        this.waitForSupabase().then(() => {
            console.log('✅ Supabase CDN 로딩 완료, 클라이언트 생성 시도...');
            this.client = this.config.initSupabase();
            console.log('Supabase 클라이언트 초기화:', this.client ? '성공' : '실패');
            
            if (this.client) {
                console.log('✅ Supabase 클라이언트 생성 성공');
                if (this.config.sync.enabled) {
                    this.startAutoSync();
                    console.log('✅ Supabase 자동 동기화 시작');
                } else {
                    console.warn('⚠️ Supabase 동기화가 비활성화되어 있습니다');
                }
            } else {
                console.error('❌ Supabase 클라이언트 생성 실패');
            }
        }).catch(error => {
            console.error('❌ Supabase 초기화 오류:', error);
        });
    }
    
    // Supabase 로딩 대기
    async waitForSupabase() {
        let retryCount = 0;
        const maxRetries = 20; // 10초 대기
        
        while (typeof supabase === 'undefined' && retryCount < maxRetries) {
            console.log(`Supabase 로딩 대기 중... (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 500));
            retryCount++;
        }
        
        if (typeof supabase === 'undefined') {
            throw new Error('Supabase 로딩 시간 초과');
        }
        
        console.log('Supabase 로딩 완료');
    }
    
    // 자동 동기화 시작
    startAutoSync() {
        if (this.config.sync.autoSync) {
            setInterval(() => {
                this.syncToDatabase();
            }, this.config.sync.syncInterval);
        }
    }
    
    // 방문자 데이터 동기화
    async syncVisitors() {
        if (!this.client) return;
        
        try {
            const currentVisitors = JSON.parse(localStorage.getItem(this.config.storageKeys.currentVisitors) || '[]');
            
            for (const visitor of currentVisitors) {
                const { data, error } = await this.client
                    .from(this.config.tables.visitors)
                    .upsert({
                        id: visitor.id,
                        name: visitor.name,
                        full_name: visitor.fullName,
                        last_name: visitor.lastName,
                        first_name: visitor.firstName,
                        category: visitor.category,
                        location_name: visitor.locationName,
                        company: visitor.company,
                        phone: visitor.phone,
                        purpose: visitor.purpose,
                        checkin_time: visitor.checkinTime,
                        checkout_time: visitor.checkoutTime,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                
                if (error) {
                    console.error('방문자 동기화 오류:', error);
                }
            }
            
            console.log('방문자 데이터 동기화 완료');
        } catch (error) {
            console.error('방문자 동기화 중 오류:', error);
        }
    }
    
    // 방문 로그 동기화
    async syncVisitLogs() {
        if (!this.client) return;
        
        try {
            const visitLogs = JSON.parse(localStorage.getItem(this.config.storageKeys.visitLogs) || '[]');
            
            for (const log of visitLogs) {
                const { data, error } = await this.client
                    .from(this.config.tables.visitLogs)
                    .upsert({
                        id: log.id,
                        visitor_name: log.name,
                        full_name: log.fullName,
                        last_name: log.lastName,
                        first_name: log.firstName,
                        category: log.category,
                        location_name: log.locationName,
                        company: log.company,
                        phone: log.phone,
                        purpose: log.purpose,
                        action: log.action,
                        checkin_time: log.checkinTime,
                        checkout_time: log.checkoutTime,
                        timestamp: log.timestamp,
                        created_at: new Date().toISOString()
                    });
                
                if (error) {
                    console.error('방문 로그 동기화 오류:', error);
                }
            }
            
            console.log('방문 로그 동기화 완료');
        } catch (error) {
            console.error('방문 로그 동기화 중 오류:', error);
        }
    }
    
    // 위치 데이터 동기화
    async syncLocations() {
        if (!this.client) return;
        
        try {
            const locations = JSON.parse(localStorage.getItem(this.config.storageKeys.locations) || '[]');
            
            // 현재 localStorage에 있는 모든 위치 ID 수집
            const currentLocationIds = locations.map(loc => loc.id);
            
            // 데이터베이스에서 모든 위치 가져오기
            const { data: dbLocations, error: fetchError } = await this.client
                .from(this.config.tables.locations)
                .select('id');
            
            if (fetchError) {
                console.error('데이터베이스 위치 조회 오류:', fetchError);
                return;
            }
            
            // 데이터베이스에 있지만 localStorage에 없는 위치들 삭제
            if (dbLocations) {
                const dbLocationIds = dbLocations.map(loc => loc.id);
                const locationsToDelete = dbLocationIds.filter(id => !currentLocationIds.includes(id));
                
                for (const locationId of locationsToDelete) {
                    const { error: deleteError } = await this.client
                        .from(this.config.tables.locations)
                        .delete()
                        .eq('id', locationId);
                    
                    if (deleteError) {
                        console.error('위치 삭제 오류:', deleteError);
                    } else {
                        console.log(`위치 ${locationId} 삭제 완료`);
                    }
                }
            }
            
            // localStorage의 위치들을 데이터베이스에 upsert
            for (const location of locations) {
                const { data, error } = await this.client
                    .from(this.config.tables.locations)
                    .upsert({
                        id: location.id,
                        name: location.name,
                        category: location.category,
                        latitude: location.lat,
                        longitude: location.lng,
                        radius: location.radius,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                
                if (error) {
                    console.error('위치 데이터 동기화 오류:', error);
                }
            }
            
            console.log('위치 데이터 동기화 완료');
        } catch (error) {
            console.error('위치 데이터 동기화 중 오류:', error);
        }
    }
    
    // 개별 위치 삭제
    async deleteLocation(locationId) {
        if (!this.client) return false;
        
        try {
            const { error } = await this.client
                .from(this.config.tables.locations)
                .delete()
                .eq('id', locationId);
            
            if (error) {
                console.error('위치 삭제 오류:', error);
                return false;
            }
            
            console.log(`위치 ${locationId} 삭제 완료`);
            return true;
        } catch (error) {
            console.error('위치 삭제 중 오류:', error);
            return false;
        }
    }
    
    // 자주 방문자 동기화
    async syncFrequentVisitors() {
        if (!this.client) {
            console.error('Supabase 클라이언트가 초기화되지 않았습니다');
            return;
        }
        
        try {
            // 현재 시스템에서 자주 방문자 데이터 가져오기
            let frequentVisitors = [];
            if (window.visitorSystem) {
                frequentVisitors = window.visitorSystem.frequentVisitors;
            } else if (window.adminSystem) {
                frequentVisitors = window.adminSystem.frequentVisitors;
            }
            
            console.log('자주 방문자 동기화 시작:', frequentVisitors.length, '개');
            
            for (const visitor of frequentVisitors) {
                console.log('자주 방문자 동기화 중:', visitor);
                const { data, error } = await this.client
                    .from(this.config.tables.frequentVisitors)
                    .upsert({
                        id: visitor.id,
                        name: visitor.name,
                        last_name: visitor.lastName,
                        first_name: visitor.firstName,
                        added_date: visitor.addedDate,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                
                if (error) {
                    console.error('자주 방문자 동기화 오류:', error);
                } else {
                    console.log('자주 방문자 동기화 성공:', visitor.name);
                }
            }
            
            console.log('자주 방문자 동기화 완료');
        } catch (error) {
            console.error('자주 방문자 동기화 중 오류:', error);
        }
    }
    
    // 전체 데이터 동기화
    async syncToDatabase() {
        if (!this.config.sync.enabled || !this.client) return;
        
        console.log('데이터베이스 동기화 시작...');
        
        await Promise.all([
            this.syncVisitors(),
            this.syncVisitLogs(),
            this.syncLocations(),
            this.syncFrequentVisitors()
        ]);
        
        console.log('전체 데이터 동기화 완료');
    }
    
    // 데이터베이스에서 데이터 로드
    async loadFromDatabase() {
        console.log('=== Supabase 데이터 로드 시작 ===');
        console.log('Supabase 클라이언트 상태:', this.client ? '초기화됨' : '초기화 안됨');
        console.log('동기화 설정:', this.config.sync);
        
        if (!this.client) {
            console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다');
            return;
        }
        
        try {
            console.log('✅ Supabase에서 데이터 로드 시작...');
            
            // 자주 방문자 로드
            console.log('자주 방문자 데이터 로드 중...');
            const { data: frequentVisitors, error: frequentVisitorsError } = await this.client
                .from(this.config.tables.frequentVisitors)
                .select('*');
            
            if (frequentVisitorsError) {
                console.error('자주 방문자 데이터 로드 오류:', frequentVisitorsError);
            } else {
                console.log('자주 방문자 데이터 로드 성공:', frequentVisitors?.length || 0, '개');
                
                // Supabase 필드명을 시스템 필드명으로 변환
                const convertedFrequentVisitors = (frequentVisitors || []).map(visitor => ({
                    id: visitor.id,
                    name: visitor.name,
                    lastName: visitor.last_name,
                    firstName: visitor.first_name,
                    addedDate: visitor.added_date
                }));
                
                console.log('변환된 자주 방문자 데이터:', convertedFrequentVisitors);
                
                // 시스템이 준비될 때까지 기다림
                const assignToSystem = (systemName, system) => {
                    if (system) {
                        console.log(`${systemName}에 자주 방문자 데이터 할당 중...`);
                        system.frequentVisitors = convertedFrequentVisitors;
                        console.log(`${systemName} 자주 방문자 데이터:`, system.frequentVisitors);
                        if (typeof system.renderFrequentVisitorsList === 'function') {
                            system.renderFrequentVisitorsList();
                            console.log(`${systemName}에 자주 방문자 데이터 할당 완료`);
                        } else {
                            console.warn(`${systemName}에 renderFrequentVisitorsList 메서드가 없습니다.`);
                        }
                    } else {
                        console.warn(`${systemName}이 없습니다.`);
                    }
                };
                
                assignToSystem('메인 시스템', window.visitorSystem);
                assignToSystem('관리자 시스템', window.adminSystem);
            }
            
            // 방문자 데이터 로드
            console.log('현재 방문자 데이터 로드 중...');
            const { data: visitors, error: visitorsError } = await this.client
                .from(this.config.tables.visitors)
                .select('*');
            
            if (visitorsError) {
                console.error('현재 방문자 데이터 로드 오류:', visitorsError);
            } else {
                console.log('현재 방문자 데이터 로드 성공:', visitors?.length || 0, '개');
                if (window.visitorSystem) {
                    window.visitorSystem.currentVisitors = visitors || [];
                    window.visitorSystem.updateVisitorList();
                }
            }
            
            // 방문 로그 로드
            console.log('방문 로그 데이터 로드 중...');
            const { data: logs, error: logsError } = await this.client
                .from(this.config.tables.visitLogs)
                .select('*')
                .order('timestamp', { ascending: false });
            
            if (logsError) {
                console.error('방문 로그 데이터 로드 오류:', logsError);
            } else {
                console.log('방문 로그 데이터 로드 성공:', logs?.length || 0, '개');
                if (window.visitorSystem) {
                    window.visitorSystem.visitLogs = logs || [];
                    window.visitorSystem.updateLogList();
                }
                if (window.adminSystem) {
                    window.adminSystem.visitLogs = logs || [];
                    window.adminSystem.updateLogList();
                }
            }
            
            // 위치 데이터 로드
            console.log('위치 데이터 로드 중...');
            const { data: locations, error: locationsError } = await this.client
                .from(this.config.tables.locations)
                .select('*');
            
            if (locationsError) {
                console.error('위치 데이터 로드 오류:', locationsError);
            } else {
                console.log('위치 데이터 로드 성공:', locations?.length || 0, '개');
                if (window.visitorSystem) {
                    window.visitorSystem.locations = locations || [];
                    window.visitorSystem.renderLocationList();
                }
                if (window.adminSystem) {
                    window.adminSystem.locations = locations || [];
                    window.adminSystem.renderLocationList();
                }
            }
            
            console.log('Supabase에서 모든 데이터 로드 완료');
        } catch (error) {
            console.error('Supabase 데이터 로드 중 오류:', error);
        }
    }
    
    // 동기화 상태 확인
    async checkSyncStatus() {
        if (!this.client) return false;
        
        try {
            const { data, error } = await this.client
                .from(this.config.tables.visitors)
                .select('count')
                .limit(1);
            
            return !error;
        } catch (error) {
            console.error('동기화 상태 확인 오류:', error);
            return false;
        }
    }
}

// 전역 Supabase 클라이언트 인스턴스
window.supabaseClient = new SupabaseClient();
