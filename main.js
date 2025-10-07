// 메인 방문자 관리 시스템 (체크인/체크아웃 전용)
class MainVisitorSystem {
    constructor() {
        this.currentVisitors = [];
        this.visitLogs = [];
        this.locations = [
            {
                id: 1,
                name: '기숙사 입구',
                category: 'dormitory',
                lat: 37.566500,
                lng: 126.978000,
                radius: 0.5
            }
        ];
        this.nextLocationId = 2;
        this.currentLocation = null;
        this.detectedCategory = null;
        this.activeSection = null;
        this.selectedVisitorId = null;
        this.frequentVisitors = [];
        this.dormitoryCheckinMode = 'manual';
        
        // 기본 초기화
        this.setupEventListeners();
        this.setupTouchGestures();
        this.getCurrentLocation();
        this.updateVisitorCounts();
        this.updateCheckoutOptions();
        this.showInitialSetupGuide();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 체크인 버튼
        document.getElementById('checkinBtn').addEventListener('click', () => {
            this.showCheckinSection();
        });

        // 체크아웃 버튼
        document.getElementById('checkoutBtn').addEventListener('click', () => {
            this.showCheckoutSection();
        });

        // 기숙사 체크인 관련
        document.getElementById('dormManualEntry').addEventListener('click', () => {
            this.showDormManualSection();
        });

        document.getElementById('dormSelectRegistered').addEventListener('click', () => {
            this.showDormRegisteredSection();
        });

        document.getElementById('dormCheckinBtn').addEventListener('click', () => {
            this.checkin('dormitory');
        });

        // 공장 체크인 관련
        document.getElementById('factoryCheckinBtn').addEventListener('click', () => {
            this.checkin('factory');
        });

        // 체크아웃 관련
        document.getElementById('checkoutConfirmBtn').addEventListener('click', () => {
            this.checkout();
        });

        // 자주 방문자 선택
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('frequent-visitor-item')) {
                const visitorId = e.target.dataset.visitorId;
                this.selectFrequentVisitor(visitorId);
            }
        });

        // 메인으로 돌아가기 버튼들
        document.getElementById('backToMainFromDormCheckin').addEventListener('click', () => {
            this.hideAllSections();
        });

        document.getElementById('backToMainFromCheckout').addEventListener('click', () => {
            this.hideAllSections();
        });
    }

    // 터치 제스처 설정
    setupTouchGestures() {
        let startX = 0;
        let startY = 0;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = startY - endY;

            // 좌우 스와이프 감지
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // 왼쪽 스와이프 - 체크인
                    this.showCheckinSection();
                } else {
                    // 오른쪽 스와이프 - 체크아웃
                    this.showCheckoutSection();
                }
            }

            startX = 0;
            startY = 0;
        });

        // 더블탭으로 새로고침
        let lastTap = 0;
        document.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                // 더블탭 감지
                this.refreshData();
            }
            lastTap = currentTime;
        });
    }

    // 현재 위치 가져오기
    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showNotification('위치 오류', '이 브라우저는 위치 서비스를 지원하지 않습니다.', 'error');
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5분 캐시
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                this.updateLocationStatus();
                this.detectCategory();
            },
            (error) => {
                console.error('위치 오류:', error);
                this.showNotification('위치 오류', '위치를 가져올 수 없습니다. 수동으로 설정해주세요.', 'warning');
            },
            options
        );
    }

    // 위치 상태 업데이트
    updateLocationStatus() {
        const statusElement = document.getElementById('locationStatus');
        if (statusElement && this.currentLocation) {
            statusElement.textContent = `위도: ${this.currentLocation.lat.toFixed(6)}, 경도: ${this.currentLocation.lng.toFixed(6)}`;
        }
    }

    // 카테고리 자동 감지
    detectCategory() {
        if (!this.currentLocation) return;

        for (const location of this.locations) {
            const distance = this.calculateDistance(
                this.currentLocation.lat,
                this.currentLocation.lng,
                location.lat,
                location.lng
            );

            if (distance <= location.radius) {
                this.detectedCategory = location.category;
                this.showNotification('위치 감지', `${location.name} 근처입니다.`, 'success');
                return;
            }
        }

        this.detectedCategory = null;
    }

    // 거리 계산
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // 지구 반지름 (km)
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // 체크인 섹션 표시
    showCheckinSection() {
        this.hideAllSections();
        document.getElementById('checkinSection').classList.remove('hidden');
        this.activeSection = 'checkin';
    }

    // 체크아웃 섹션 표시
    showCheckoutSection() {
        if (this.currentVisitors.length === 0) {
            this.showNotification('알림', '체크아웃할 방문자가 없습니다.', 'warning');
            return;
        }
        
        this.hideAllSections();
        document.getElementById('checkoutSection').classList.remove('hidden');
        this.activeSection = 'checkout';
        this.updateCheckoutOptions();
    }

    // 모든 섹션 숨기기
    hideAllSections() {
        document.getElementById('checkinSection').classList.add('hidden');
        document.getElementById('checkoutSection').classList.add('hidden');
        this.activeSection = null;
    }

    // 기숙사 수동 입력 섹션 표시
    showDormManualSection() {
        document.getElementById('dormRegisteredSection').classList.add('hidden');
        document.getElementById('dormManualSection').classList.remove('hidden');
        this.dormitoryCheckinMode = 'manual';
    }

    // 기숙사 등록된 방문자 선택 섹션 표시
    showDormRegisteredSection() {
        document.getElementById('dormManualSection').classList.add('hidden');
        document.getElementById('dormRegisteredSection').classList.remove('hidden');
        this.dormitoryCheckinMode = 'registered';
        this.renderFrequentVisitorsList();
    }

    // 체크인 처리
    checkin(category) {
        let visitorData = {};

        if (category === 'dormitory') {
            if (this.dormitoryCheckinMode === 'manual') {
                const lastName = document.getElementById('dormLastName').value.trim();
                const firstName = document.getElementById('dormFirstName').value.trim();
                
                if (!lastName || !firstName) {
                    this.showNotification('입력 오류', '성과 이름을 모두 입력해주세요.', 'error');
                    return;
                }
                
                visitorData = {
                    fullName: `${lastName} ${firstName}`,
                    category: 'dormitory'
                };
            } else {
                const selectedVisitor = this.frequentVisitors.find(v => v.id === this.selectedVisitorId);
                if (!selectedVisitor) {
                    this.showNotification('선택 오류', '방문자를 선택해주세요.', 'error');
                    return;
                }
                
                visitorData = {
                    fullName: selectedVisitor.name,
                    category: 'dormitory'
                };
            }
        } else if (category === 'factory') {
            const lastName = document.getElementById('factoryLastName').value.trim();
            const firstName = document.getElementById('factoryFirstName').value.trim();
            const company = document.getElementById('factoryCompany').value.trim();
            const phone = document.getElementById('factoryPhone').value.trim();
            const purpose = document.getElementById('factoryPurpose').value;
            
            if (!lastName || !firstName || !company || !phone || !purpose) {
                this.showNotification('입력 오류', '모든 필드를 입력해주세요.', 'error');
                return;
            }
            
            visitorData = {
                fullName: `${lastName} ${firstName}`,
                company: company,
                phone: phone,
                purpose: purpose,
                category: 'factory'
            };
        }

        // 방문자 추가
        const visitor = {
            id: Date.now(),
            ...visitorData,
            checkinTime: new Date(),
            timestamp: new Date()
        };

        this.currentVisitors.push(visitor);
        this.visitLogs.push({
            ...visitor,
            action: 'checkin',
            name: visitorData.fullName
        });

        // 폼 초기화
        this.resetForms();
        
        // UI 업데이트
        this.updateVisitorCounts();
        this.updateCheckoutOptions();
        this.hideAllSections();

        // Supabase에 동기화
        if (window.supabaseClient && window.supabaseClient.client) {
            window.supabaseClient.syncVisitors();
            window.supabaseClient.syncLogs();
        }

        this.showNotification('체크인 완료', `${visitorData.fullName}님이 체크인되었습니다.`, 'success');
    }

    // 체크아웃 처리
    checkout() {
        const selectedVisitorId = document.querySelector('input[name="checkoutVisitor"]:checked')?.value;
        
        if (!selectedVisitorId) {
            this.showNotification('선택 오류', '체크아웃할 방문자를 선택해주세요.', 'error');
            return;
        }

        const visitorIndex = this.currentVisitors.findIndex(v => v.id == selectedVisitorId);
        if (visitorIndex === -1) {
            this.showNotification('오류', '선택된 방문자를 찾을 수 없습니다.', 'error');
            return;
        }

        const visitor = this.currentVisitors[visitorIndex];
        const checkoutTime = new Date();

        // 로그에 체크아웃 기록 추가
        this.visitLogs.push({
            ...visitor,
            action: 'checkout',
            checkoutTime: checkoutTime,
            timestamp: checkoutTime,
            name: visitor.fullName
        });

        // 현재 방문자 목록에서 제거
        this.currentVisitors.splice(visitorIndex, 1);

        // UI 업데이트
        this.updateVisitorCounts();
        this.updateCheckoutOptions();
        this.hideAllSections();

        // Supabase에 동기화
        if (window.supabaseClient && window.supabaseClient.client) {
            window.supabaseClient.syncVisitors();
            window.supabaseClient.syncLogs();
        }

        this.showNotification('체크아웃 완료', `${visitor.fullName}님이 체크아웃되었습니다.`, 'success');
    }

    // 자주 방문자 목록 렌더링
    renderFrequentVisitorsList() {
        const container = document.getElementById('frequentVisitorsList');
        if (!container) {
            console.log('frequentVisitorsList 컨테이너를 찾을 수 없습니다.');
            return;
        }

        container.innerHTML = '';

        if (this.frequentVisitors.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <i class="fas fa-star text-2xl mb-2"></i>
                    <p>등록된 자주 방문자가 없습니다.</p>
                </div>
            `;
            return;
        }

        this.frequentVisitors.forEach(visitor => {
            const item = document.createElement('div');
            item.className = 'frequent-visitor-item p-2 border rounded cursor-pointer hover:bg-blue-50';
            item.dataset.visitorId = visitor.id;
            item.innerHTML = `
                <div class="font-medium">${visitor.name}</div>
                <div class="text-sm text-gray-500">${this.formatTime(visitor.addedDate)}</div>
            `;
            container.appendChild(item);
        });
    }

    // 자주 방문자 선택
    selectFrequentVisitor(visitorId) {
        this.selectedVisitorId = visitorId;
        
        // 선택된 방문자 하이라이트
        document.querySelectorAll('.frequent-visitor-item').forEach(item => {
            item.classList.remove('bg-blue-100', 'border-blue-300');
        });
        
        const selectedItem = document.querySelector(`[data-visitor-id="${visitorId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('bg-blue-100', 'border-blue-300');
        }
    }

    // 방문자 수 업데이트
    updateVisitorCounts() {
        const dormitoryCount = this.currentVisitors.filter(v => v.category === 'dormitory').length;
        const factoryCount = this.currentVisitors.filter(v => v.category === 'factory').length;
        const totalCount = this.currentVisitors.length;

        document.getElementById('dormitoryCount').textContent = dormitoryCount;
        document.getElementById('factoryCount').textContent = factoryCount;
        document.getElementById('totalCount').textContent = totalCount;
    }

    // 체크아웃 옵션 업데이트
    updateCheckoutOptions() {
        const container = document.getElementById('checkoutOptions');
        const confirmBtn = document.getElementById('checkoutConfirmBtn');
        
        if (!container) return;

        container.innerHTML = '';

        if (this.currentVisitors.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-users text-4xl mb-4"></i>
                    <p>체크아웃할 방문자가 없습니다.</p>
                </div>
            `;
            confirmBtn.disabled = true;
            return;
        }

        this.currentVisitors.forEach(visitor => {
            const option = document.createElement('div');
            option.className = 'flex items-center p-3 border rounded mb-2';
            option.innerHTML = `
                <input type="radio" name="checkoutVisitor" value="${visitor.id}" class="radio radio-primary mr-3">
                <div class="flex-1">
                    <div class="font-medium">${visitor.fullName}</div>
                    <div class="text-sm text-gray-500">
                        ${visitor.category === 'dormitory' ? '기숙사' : '공장'} • 
                        ${this.formatTime(visitor.checkinTime)}
                    </div>
                </div>
            `;
            container.appendChild(option);
        });

        confirmBtn.disabled = false;
    }

    // 폼 초기화
    resetForms() {
        // 기숙사 폼
        document.getElementById('dormLastName').value = '';
        document.getElementById('dormFirstName').value = '';
        
        // 공장 폼
        document.getElementById('factoryLastName').value = '';
        document.getElementById('factoryFirstName').value = '';
        document.getElementById('factoryCompany').value = '';
        document.getElementById('factoryPhone').value = '';
        document.getElementById('factoryPurpose').value = '';
    }

    // 시간 포맷팅
    formatTime(date) {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 알림 표시
    showNotification(title, message, type = 'info') {
        const modal = document.getElementById('notificationModal');
        const titleElement = document.getElementById('notificationTitle');
        const messageElement = document.getElementById('notificationMessage');
        const iconElement = document.getElementById('notificationIcon');

        titleElement.textContent = title;
        messageElement.textContent = message;

        // 아이콘 설정
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        iconElement.className = `${icons[type]} text-8xl text-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text animate-pulse`;

        modal.classList.add('modal-open');
    }

    // 초기 설정 가이드 표시
    showInitialSetupGuide() {
        // 첫 방문 시에만 표시하는 로직
        if (!localStorage.getItem('visitorSystemSetup')) {
            setTimeout(() => {
                this.showNotification(
                    '환영합니다!', 
                    '방문자 관리 시스템에 오신 것을 환영합니다. 체크인/체크아웃 버튼을 사용하세요.', 
                    'info'
                );
                localStorage.setItem('visitorSystemSetup', 'true');
            }, 1000);
        }
    }

    // 데이터 새로고침
    refreshData() {
        this.showNotification('새로고침', '데이터를 새로고침합니다.', 'info');
        // 필요시 Supabase에서 최신 데이터 로드
        if (window.supabaseClient && window.supabaseClient.client) {
            window.supabaseClient.loadFromDatabase();
        }
    }

    // Supabase에서 데이터 로드
    async loadDataFromSupabase() {
        console.log('=== 메인 시스템 Supabase 데이터 로드 시작 ===');
        
        if (!window.supabaseClient || !window.supabaseClient.client) {
            console.warn('Supabase 클라이언트가 없습니다. 로컬 데이터만 사용합니다.');
            return;
        }
        
        try {
            await window.supabaseClient.loadFromDatabase();
            console.log('✅ 메인 시스템 Supabase에서 데이터 로드 완료');
        } catch (error) {
            console.error('❌ 메인 시스템 Supabase 데이터 로드 실패:', error);
        }
    }
}

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== 메인 시스템 초기화 시작 ===');
    
    window.mainVisitorSystem = new MainVisitorSystem();
    
    const checkSupabaseAndLoad = () => {
        if (window.supabaseClient && window.supabaseClient.client) {
            console.log('Supabase 클라이언트 준비됨, 메인 데이터 로드 시작');
            window.mainVisitorSystem.loadDataFromSupabase();
        } else {
            console.log('Supabase 클라이언트 대기 중...');
            setTimeout(checkSupabaseAndLoad, 100);
        }
    };
    
    checkSupabaseAndLoad();
    
    console.log('=== 메인 시스템 초기화 완료 ===');
});
