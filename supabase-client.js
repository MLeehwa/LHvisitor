// Supabase 데이터베이스 연동 클래스
class SupabaseClient {
    constructor() {
        this.client = null;
        this.config = window.dbConfig;
        this.init();
    }
    
    // 초기화
    init() {
        this.client = this.config.initSupabase();
        if (this.client && this.config.sync.enabled) {
            this.startAutoSync();
        }
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
        if (!this.client) return;
        
        try {
            const frequentVisitors = JSON.parse(localStorage.getItem(this.config.storageKeys.frequentVisitors) || '[]');
            
            for (const visitor of frequentVisitors) {
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
        if (!this.client) return;
        
        try {
            // 방문자 데이터 로드
            const { data: visitors, error: visitorsError } = await this.client
                .from(this.config.tables.visitors)
                .select('*');
            
            if (!visitorsError && visitors) {
                localStorage.setItem(this.config.storageKeys.currentVisitors, JSON.stringify(visitors));
            }
            
            // 방문 로그 로드
            const { data: logs, error: logsError } = await this.client
                .from(this.config.tables.visitLogs)
                .select('*')
                .order('timestamp', { ascending: false });
            
            if (!logsError && logs) {
                localStorage.setItem(this.config.storageKeys.visitLogs, JSON.stringify(logs));
            }
            
            // 위치 데이터 로드
            const { data: locations, error: locationsError } = await this.client
                .from(this.config.tables.locations)
                .select('*');
            
            if (!locationsError && locations) {
                localStorage.setItem(this.config.storageKeys.locations, JSON.stringify(locations));
            }
            
            // 자주 방문자 로드
            const { data: frequentVisitors, error: frequentVisitorsError } = await this.client
                .from(this.config.tables.frequentVisitors)
                .select('*');
            
            if (!frequentVisitorsError && frequentVisitors) {
                localStorage.setItem(this.config.storageKeys.frequentVisitors, JSON.stringify(frequentVisitors));
            }
            
            console.log('데이터베이스에서 데이터 로드 완료');
        } catch (error) {
            console.error('데이터베이스 로드 중 오류:', error);
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
