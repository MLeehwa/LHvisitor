// 방문자 관리 시스템 JavaScript (토글 섹션 버전)
class VisitorManagementSystem {
    constructor() {
        this.currentVisitors = [];
        this.visitLogs = [];
        this.adminPassword = 'admin123'; // 기본 관리자 비밀번호
        this.locations = [
            { 
                id: 'dormitory_1',
                name: '기숙사 1동',
                category: 'dormitory',
                lat: 37.566500, 
                lng: 126.978000, 
                radius: 0.1 // 100미터 반경 (더 정확하게)
            },
            { 
                id: 'factory_1',
                name: '공장 1동',
                category: 'factory',
                lat: 37.551200, 
                lng: 126.988200, 
                radius: 0.1 // 100미터 반경 (더 정확하게)
            }
        ];
        this.nextLocationId = 2;
        this.currentLocation = null;
        this.detectedCategory = null;
        this.activeSection = null; // 현재 활성화된 섹션
        this.selectedVisitorId = null; // 체크아웃용 선택된 방문자 ID
        this.frequentVisitors = []; // 자주 방문하는 방문자 목록
        this.dormitoryCheckinMode = 'manual'; // 'manual' 또는 'registered'
        
        // 기본 초기화 (동기적)
        this.setupEventListeners();
        this.setupTouchGestures();
        this.setupOnlineStatusMonitoring();
        this.getCurrentLocation();
        this.updateVisitorCounts();
        this.updateCheckoutOptions();
        this.showInitialSetupGuide();
    }

    // Supabase에서 데이터 로드 (비동기)
    async loadDataFromSupabase() {
        console.log('=== Supabase 데이터 로드 시작 ===');
        
        if (!window.supabaseClient || !window.supabaseClient.client) {
            console.warn('Supabase 클라이언트가 없습니다. 로컬 데이터만 사용합니다.');
            this.loadData();
            return;
        }
        
        try {
            await window.supabaseClient.loadFromDatabase();
            console.log('✅ Supabase에서 데이터 로드 완료');
        } catch (error) {
            console.error('❌ Supabase 데이터 로드 실패:', error);
            console.log('로컬 데이터로 폴백합니다.');
            this.loadData();
        }
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 메인 체크인 버튼
        document.getElementById('checkinBtn').addEventListener('click', () => {
            this.toggleCheckinSection();
        });

        // 메인 체크아웃 버튼
        document.getElementById('checkoutBtn').addEventListener('click', () => {
            this.toggleCheckoutSection();
        });

        // 체크인 버튼
        const dormCheckinBtn = document.getElementById('dormCheckinBtn');
        if (dormCheckinBtn) {
            dormCheckinBtn.addEventListener('click', () => {
            this.checkin('dormitory');
        });
        }

        const factoryCheckinBtn = document.getElementById('factoryCheckinBtn');
        if (factoryCheckinBtn) {
            factoryCheckinBtn.addEventListener('click', () => {
            this.checkin('factory');
        });
        }

        // 체크아웃 버튼
        const checkoutConfirmBtn = document.getElementById('checkoutConfirmBtn');
        if (checkoutConfirmBtn) {
            checkoutConfirmBtn.addEventListener('click', () => {
            this.checkout();
        });
        }

        // 체크아웃 검색
        const checkoutSearch = document.getElementById('checkoutSearch');
        if (checkoutSearch) {
            checkoutSearch.addEventListener('input', (e) => {
                this.searchVisitorsForCheckout(e.target.value.trim());
            });
        }

        // 메인으로 돌아가기 버튼들
        const backToMainFromDormCheckin = document.getElementById('backToMainFromDormCheckin');
        if (backToMainFromDormCheckin) {
            backToMainFromDormCheckin.addEventListener('click', () => {
                this.backToMain();
            });
        }

        const backToMainFromFactoryCheckin = document.getElementById('backToMainFromFactoryCheckin');
        if (backToMainFromFactoryCheckin) {
            backToMainFromFactoryCheckin.addEventListener('click', () => {
                this.backToMain();
            });
        }

        const backToMainFromCheckout = document.getElementById('backToMainFromCheckout');
        if (backToMainFromCheckout) {
            backToMainFromCheckout.addEventListener('click', () => {
                this.backToMain();
            });
        }

        // 기숙사 체크인 모드 전환
        const dormSelectRegistered = document.getElementById('dormSelectRegistered');
        if (dormSelectRegistered) {
            dormSelectRegistered.addEventListener('click', () => {
                this.setDormitoryCheckinMode('registered');
            });
        }

        const dormManualEntry = document.getElementById('dormManualEntry');
        if (dormManualEntry) {
            dormManualEntry.addEventListener('click', () => {
                this.setDormitoryCheckinMode('manual');
            });
        }

        // 등록된 방문자 선택
        const dormRegisteredSelect = document.getElementById('dormRegisteredSelect');
        if (dormRegisteredSelect) {
            dormRegisteredSelect.addEventListener('change', (e) => {
                this.selectRegisteredVisitor(e.target.value);
            });
        }

        // 자주 방문자 추가
        const addFrequentVisitorBtn = document.getElementById('addFrequentVisitorBtn');
        if (addFrequentVisitorBtn) {
            addFrequentVisitorBtn.addEventListener('click', () => {
                this.addFrequentVisitor();
            });
        }

        // 체크아웃 선택 변경 (이제 사용하지 않음 - 검색 방식으로 변경됨)
        // document.getElementById('checkoutSelect').addEventListener('change', (e) => {
        //     document.getElementById('checkoutConfirmBtn').disabled = !e.target.value;
        // });

        // 관리자 모달
        document.getElementById('adminBtn').addEventListener('click', () => {
            // 관리자 페이지로 이동
            window.open('admin.html', '_blank');
        });

        // 로그 필터 (관리자 페이지에만 있음)
        const logCategoryFilter = document.getElementById('logCategoryFilter');
        if (logCategoryFilter) {
            logCategoryFilter.addEventListener('change', () => {
                this.filterLogs();
            });
        }

        const logDateFilter = document.getElementById('logDateFilter');
        if (logDateFilter) {
            logDateFilter.addEventListener('change', () => {
                this.filterLogs();
            });
        }

        // 엑셀 다운로드 버튼 (관리자 페이지에만 있음)
        const exportLogBtn = document.getElementById('exportLogBtn');
        if (exportLogBtn) {
            exportLogBtn.addEventListener('click', () => {
                this.exportLogs();
            });
        }

        // 설정 관련 버튼들 (관리자 페이지에만 있음)
        const addLocationBtn = document.getElementById('addLocationBtn');
        if (addLocationBtn) {
            addLocationBtn.addEventListener('click', () => {
                this.addNewLocation();
            });
        }

        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        const testLocationBtn = document.getElementById('testLocationBtn');
        if (testLocationBtn) {
            testLocationBtn.addEventListener('click', () => {
                this.testCurrentLocation();
            });
        }

        const setAllCurrentLocationBtn = document.getElementById('setAllCurrentLocationBtn');
        if (setAllCurrentLocationBtn) {
            setAllCurrentLocationBtn.addEventListener('click', () => {
                this.setAllCurrentLocation();
            });
        }

        // 알림 모달
        document.getElementById('notificationOk').addEventListener('click', () => {
            this.hideNotification();
        });

        // 모달 외부 클릭으로 닫기
        const notificationModal = document.getElementById('notificationModal');
        if (notificationModal) {
            notificationModal.addEventListener('click', (e) => {
                if (e.target.id === 'notificationModal') {
                    this.hideNotification();
                }
            });
        }
    }

    // 체크인 섹션 토글
    toggleCheckinSection() {
        if (this.activeSection === 'checkin') {
            // 이미 체크인 섹션이 열려있으면 닫기
            this.hideAllSections();
            this.showMainButtons(); // 메인 버튼들 다시 표시
        } else {
            // 체크인 섹션 열기
            if (!this.currentLocation) {
                this.showNotification('Location Error', 'Unable to detect GPS location. Please allow location permission.', 'error');
                return;
            }

            if (!this.detectedCategory) {
                this.showNotification('Location Error', 'You are far from registered locations. Please try again from the correct location.', 'error');
                return;
            }

            this.hideAllSections();
            this.hideMainButtons(); // 메인 버튼들 숨기기
            this.resetCheckinForms(); // 폼 초기화
            this.showAppropriateForm();
            document.getElementById('checkinSection').classList.remove('hidden');
            this.activeSection = 'checkin';
        }
    }

    // 체크아웃 섹션 토글
    toggleCheckoutSection() {
        if (this.activeSection === 'checkout') {
            // 이미 체크아웃 섹션이 열려있으면 닫기
            this.hideAllSections();
            this.showMainButtons(); // 메인 버튼들 다시 표시
        } else {
            // 체크아웃 섹션 열기 (방문자가 있을 때만)
            if (this.currentVisitors.length === 0) {
                this.showNotification('Notification', 'No visitors are currently checked in.', 'info');
                return;
            }

            this.hideAllSections();
            this.hideMainButtons(); // 메인 버튼들 숨기기
            this.resetCheckoutForm(); // 폼 초기화
            this.updateCheckoutOptions();
            document.getElementById('checkoutSection').classList.remove('hidden');
            this.activeSection = 'checkout';
        }
    }

    // 모든 섹션 숨기기
    hideAllSections() {
        document.getElementById('checkinSection').classList.add('hidden');
        document.getElementById('checkoutSection').classList.add('hidden');
        this.activeSection = null;
    }

    // 메인 버튼들 숨기기
    hideMainButtons() {
        const mainButtons = document.getElementById('mainButtons');
        if (mainButtons) {
            mainButtons.classList.add('hidden');
        }
    }

    // 메인 버튼들 표시
    showMainButtons() {
        const mainButtons = document.getElementById('mainButtons');
        if (mainButtons) {
            mainButtons.classList.remove('hidden');
        }
    }

    // 메인으로 돌아가기
    backToMain() {
        this.hideAllSections();
        this.showMainButtons();
        this.resetCheckinForms();
        this.resetCheckoutForm();
    }

    // 체크인 폼 초기화
    resetCheckinForms() {
        // 기숙사 폼 초기화
        const dormLastName = document.getElementById('dormLastName');
        const dormFirstName = document.getElementById('dormFirstName');
        if (dormLastName) dormLastName.value = '';
        if (dormFirstName) dormFirstName.value = '';
        
        // 공장 폼 초기화
        const factoryLastName = document.getElementById('factoryLastName');
        const factoryFirstName = document.getElementById('factoryFirstName');
        const factoryCompany = document.getElementById('factoryCompany');
        const factoryPhone = document.getElementById('factoryPhone');
        const factoryPurpose = document.getElementById('factoryPurpose');
        
        if (factoryLastName) factoryLastName.value = '';
        if (factoryFirstName) factoryFirstName.value = '';
        if (factoryCompany) factoryCompany.value = '';
        if (factoryPhone) factoryPhone.value = '';
        if (factoryPurpose) factoryPurpose.value = '';
        
        // 자주 방문자 선택 초기화
        const dormFrequentVisitor = document.getElementById('dormFrequentVisitor');
        const factoryFrequentVisitor = document.getElementById('factoryFrequentVisitor');
        if (dormFrequentVisitor) dormFrequentVisitor.value = '';
        if (factoryFrequentVisitor) factoryFrequentVisitor.value = '';
        
        // 수동 입력 섹션 숨기기
        const dormManualSection = document.getElementById('dormManualSection');
        const factoryManualSection = document.getElementById('factoryManualSection');
        if (dormManualSection) dormManualSection.classList.add('hidden');
        if (factoryManualSection) factoryManualSection.classList.add('hidden');
    }

    // 체크아웃 폼 초기화
    resetCheckoutForm() {
        // 검색 입력 초기화
        const checkoutSearch = document.getElementById('checkoutSearch');
        if (checkoutSearch) checkoutSearch.value = '';
        
        // 검색 결과 숨기기
        const checkoutResults = document.getElementById('checkoutResults');
        if (checkoutResults) checkoutResults.classList.add('hidden');
        
        // 체크아웃 버튼 비활성화
        const checkoutConfirmBtn = document.getElementById('checkoutConfirmBtn');
        if (checkoutConfirmBtn) checkoutConfirmBtn.disabled = true;
        
        // 선택된 방문자 초기화
        this.selectedVisitorId = null;
    }

    // GPS 기반 자동 위치 감지 및 카테고리 결정
    async getCurrentLocation() {
        if (!navigator.geolocation) {
            this.updateLocationStatus('GPS not supported', 'error');
            this.hideLocationLoading();
            this.showNotification(
                'GPS 지원 안됨', 
                '이 브라우저는 GPS를 지원하지 않습니다. 다른 브라우저를 사용해주세요.', 
                'error'
            );
            return;
        }

        // 캐시된 위치가 있으면 먼저 사용
        const cachedLocation = this.getCachedLocation();
        if (cachedLocation) {
            console.log('캐시된 위치 사용:', cachedLocation);
            this.currentLocation = cachedLocation;
            this.detectLocationCategory();
            this.hideLocationLoading();
            return;
        }

        // 위치 감지 시작
        this.showLocationLoading();
        this.updateLocationStatus('위치 감지 중...', 'info');
        
        // GPS 옵션 설정 (태블릿 환경에 최적화)
        const gpsOptions = {
            enableHighAccuracy: false, // 정확도보다 속도 우선
            timeout: 15000, // 15초 타임아웃 (태블릿에서 더 여유있게)
            maximumAge: 600000 // 10분 캐시 사용 (태블릿 배터리 절약)
        };

        // 첫 번째 시도
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.handleLocationSuccess(position);
            },
            (error) => {
                console.log('첫 번째 GPS 시도 실패:', error.message);
                this.retryLocationDetection(gpsOptions, 1);
            },
            gpsOptions
        );
    }

    // 위치 감지 성공 처리
    handleLocationSuccess(position) {
        this.currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        
        // 위치 캐시 저장
        this.cacheLocation(this.currentLocation);
        
        console.log('위치 감지 성공:', this.currentLocation);
        this.hideLocationLoading();
        this.detectLocationCategory();
    }

    // 위치 감지 재시도
    retryLocationDetection(options, attempt) {
        if (attempt > 3) {
            console.error('GPS 위치 감지 최대 재시도 횟수 초과');
            this.updateLocationStatus('위치 감지를 할 수 없습니다. 새로고침을 시도해주세요.', 'error');
            this.hideLocationLoading();
            this.showNotification(
                '위치 감지 실패', 
                'GPS 위치 감지에 실패했습니다. 위치 권한을 확인하거나 다른 위치에서 시도해주세요.', 
                'error',
                { retry: () => this.getCurrentLocation() }
            );
            return;
        }

        console.log(`GPS 재시도 ${attempt}/3`);
        this.updateLocationStatus(`위치 감지 재시도 중... (${attempt}/3)`, 'warning');
        this.showLocationLoading();

        // 재시도 시 더 관대한 옵션 사용
        const retryOptions = {
            ...options,
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 600000 // 10분 캐시
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.handleLocationSuccess(position);
            },
            (error) => {
                console.log(`재시도 ${attempt} 실패:`, error.message);
                setTimeout(() => {
                    this.retryLocationDetection(options, attempt + 1);
                }, 2000); // 2초 후 재시도
            },
            retryOptions
        );
    }

    // 위치 캐시 저장
    cacheLocation(location) {
        const cacheData = {
            location: location,
            timestamp: Date.now()
        };
        localStorage.setItem('gpsLocationCache', JSON.stringify(cacheData));
    }

    // 캐시된 위치 가져오기
    getCachedLocation() {
        try {
            const cached = localStorage.getItem('gpsLocationCache');
            if (!cached) return null;

            const cacheData = JSON.parse(cached);
            const now = Date.now();
            const cacheAge = now - cacheData.timestamp;

            // 30분 이내 캐시만 사용
            if (cacheAge < 30 * 60 * 1000) {
                return cacheData.location;
            }
        } catch (error) {
            console.error('캐시 읽기 오류:', error);
        }
        return null;
    }

    // 위치 기반 카테고리 감지
    detectLocationCategory() {
        if (!this.currentLocation) return;

        let closestLocation = null;
        let minDistance = Infinity;

        // 각 위치와의 거리 계산
        this.locations.forEach(location => {
            const distance = this.calculateDistance(
                this.currentLocation.lat,
                this.currentLocation.lng,
                location.lat,
                location.lng
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestLocation = location;
            }
        });

        // 가장 가까운 위치가 설정된 반경 내에 있는지 확인
        if (closestLocation && minDistance <= closestLocation.radius) {
            this.detectedCategory = closestLocation.category;
            this.updateLocationStatus(
                `${closestLocation.name} 근처 (${(minDistance * 1000).toFixed(0)}m)`, 
                'success'
            );
        } else if (closestLocation) {
            // 500미터를 넘어도 가장 가까운 위치로 체크인 가능
            this.detectedCategory = closestLocation.category;
            this.updateLocationStatus(
                `${closestLocation.name} (${(minDistance * 1000).toFixed(0)}m) - 가장 가까운 위치로 체크인 가능`, 
                'warning'
            );
        } else {
            this.detectedCategory = null;
            this.updateLocationStatus(
                `등록된 위치가 없습니다`, 
                'error'
            );
        }
        
        // 디버깅을 위한 콘솔 로그
        console.log('현재 위치:', this.currentLocation);
        console.log('등록된 위치들:', this.locations);
        console.log('가장 가까운 위치:', closestLocation);
        console.log('최소 거리:', minDistance, 'km =', (minDistance * 1000).toFixed(0), 'm');
        console.log('설정된 반경:', closestLocation ? (closestLocation.radius * 1000).toFixed(0) + 'm' : 'N/A');
    }

    // 위치 상태 업데이트
    updateLocationStatus(message, type) {
        const statusElement = document.getElementById('locationStatus');
        const badgeElement = document.getElementById('locationBadge');
        
        if (statusElement) {
            statusElement.textContent = message;
        }
        
        if (badgeElement) {
            // 배지 색상 변경
            badgeElement.className = 'badge';
            if (type === 'success') {
                badgeElement.classList.add('badge-success');
                badgeElement.innerHTML = '<i class="fas fa-check-circle mr-1"></i>Location Verified (위치 확인됨)';
            } else if (type === 'warning') {
                badgeElement.classList.add('badge-warning');
                badgeElement.innerHTML = '<i class="fas fa-exclamation-triangle mr-1"></i>Location Warning (위치 주의)';
            } else if (type === 'info') {
                badgeElement.classList.add('badge-info');
                badgeElement.innerHTML = '<i class="fas fa-info-circle mr-1"></i>Location Info (위치 정보)';
            } else {
                badgeElement.classList.add('badge-error');
                badgeElement.innerHTML = '<i class="fas fa-times-circle mr-1"></i>Location Error (위치 오류)';
            }
        }
    }

    // 위치 로딩 상태 표시
    showLocationLoading() {
        const badgeElement = document.getElementById('locationBadge');
        if (badgeElement) {
            badgeElement.innerHTML = `
                <i class="fas fa-spinner fa-spin mr-2"></i>
                위치 감지 중...
            `;
            badgeElement.className = 'badge badge-lg badge-info animate-pulse';
        }
    }

    // 위치 로딩 상태 숨기기
    hideLocationLoading() {
        const badgeElement = document.getElementById('locationBadge');
        if (badgeElement) {
            badgeElement.classList.remove('animate-pulse');
        }
    }

    // 위치 에러 표시
    showLocationError(message) {
        const statusElement = document.getElementById('locationStatus');
        const badgeElement = document.getElementById('locationBadge');
        
        if (statusElement) {
            statusElement.textContent = message;
        }
        
        if (badgeElement) {
            badgeElement.innerHTML = `
                <i class="fas fa-exclamation-triangle mr-2"></i>
                위치 감지 실패
            `;
            badgeElement.className = 'badge badge-lg badge-error';
        }
    }

    // 체크인 로딩 상태 표시
    showCheckinLoading(category) {
        const checkinBtn = document.getElementById('checkinBtn');
        const checkoutBtn = document.getElementById('checkoutBtn');
        
        if (checkinBtn) {
            checkinBtn.disabled = true;
            checkinBtn.innerHTML = `
                <i class="fas fa-spinner fa-spin mr-2"></i>
                체크인 처리 중...
            `;
        }
        
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
        }
    }

    // 체크인 로딩 상태 숨기기
    hideCheckinLoading() {
        const checkinBtn = document.getElementById('checkinBtn');
        const checkoutBtn = document.getElementById('checkoutBtn');
        
        if (checkinBtn) {
            checkinBtn.disabled = false;
            checkinBtn.innerHTML = `
                <div class="flex flex-col items-center gap-4 relative z-10">
                    <i class="fas fa-sign-in-alt text-6xl drop-shadow-lg group-hover:animate-bounce"></i>
                    <span class="text-3xl font-bold drop-shadow-md">Check In (체크인)</span>
                </div>
            `;
        }
        
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
        }
    }

    // 체크아웃 로딩 상태 표시
    showCheckoutLoading() {
        const checkoutBtn = document.getElementById('checkoutBtn');
        const checkinBtn = document.getElementById('checkinBtn');
        
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = `
                <i class="fas fa-spinner fa-spin mr-2"></i>
                체크아웃 처리 중...
            `;
        }
        
        if (checkinBtn) {
            checkinBtn.disabled = true;
        }
    }

    // 체크아웃 로딩 상태 숨기기
    hideCheckoutLoading() {
        const checkoutBtn = document.getElementById('checkoutBtn');
        const checkinBtn = document.getElementById('checkinBtn');
        
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = `
                <div class="flex flex-col items-center gap-4 relative z-10">
                    <i class="fas fa-sign-out-alt text-6xl drop-shadow-lg group-hover:animate-bounce"></i>
                    <span class="text-3xl font-bold drop-shadow-md">Check Out (체크아웃)</span>
                </div>
            `;
        }
        
        if (checkinBtn) {
            checkinBtn.disabled = false;
        }
    }

    // 적절한 폼 표시
    showAppropriateForm() {
        // 모든 폼 숨기기
        document.getElementById('dormitoryForm').classList.add('hidden');
        document.getElementById('factoryForm').classList.add('hidden');

        // 감지된 카테고리에 따라 폼 표시
        if (this.detectedCategory === 'dormitory') {
            document.getElementById('dormitoryForm').classList.remove('hidden');
            // 현재 위치 정보 표시
            const locationInfo = this.locations.find(loc => loc.category === 'dormitory' && 
                this.calculateDistance(this.currentLocation.lat, this.currentLocation.lng, loc.lat, loc.lng) <= loc.radius);
            if (locationInfo) {
                this.updateLocationDisplay('dormitoryForm', locationInfo);
            }
        } else if (this.detectedCategory === 'factory') {
            document.getElementById('factoryForm').classList.remove('hidden');
            // 현재 위치 정보 표시
            const locationInfo = this.locations.find(loc => loc.category === 'factory' && 
                this.calculateDistance(this.currentLocation.lat, this.currentLocation.lng, loc.lat, loc.lng) <= loc.radius);
            if (locationInfo) {
                this.updateLocationDisplay('factoryForm', locationInfo);
            }
        }
    }

    // 위치 정보 표시 업데이트
    updateLocationDisplay(formId, locationInfo) {
        const form = document.getElementById(formId);
        let locationDisplay = form.querySelector('.location-display');
        
        if (!locationDisplay) {
            locationDisplay = document.createElement('div');
            locationDisplay.className = 'location-display alert alert-info mb-4';
            form.insertBefore(locationDisplay, form.firstChild);
        }
        
        locationDisplay.innerHTML = `
            <i class="fas ${locationInfo.category === 'dormitory' ? 'fa-home' : 'fa-industry'} mr-2"></i>
            <span class="font-semibold">${locationInfo.name}</span>
            <span class="badge badge-outline ml-2">
                ${locationInfo.category === 'dormitory' ? '기숙사' : '공장'}
            </span>
        `;
    }

    // 체크인 처리
    async checkin(category) {
        try {
            // 로딩 상태 표시
            this.showCheckinLoading(category);
            
            // GPS 위치 확인
            if (!this.currentLocation) {
                this.hideCheckinLoading();
                this.showNotification(
                    '위치 감지 실패', 
                    'GPS 위치를 감지할 수 없습니다. 위치 권한을 허용하고 다시 시도해주세요.', 
                    'error',
                    { retry: () => this.getCurrentLocation() }
                );
                return;
            }

            // 위치 검증
            const isAtCorrectLocation = this.validateLocation(category);
            if (!isAtCorrectLocation) {
                this.hideCheckinLoading();
                this.showNotification(
                    '위치 오류', 
                    '등록된 위치에서 체크인해주세요. 현재 위치를 다시 확인하거나 관리자에게 문의하세요.', 
                    'error',
                    { retry: () => this.getCurrentLocation() }
                );
                return;
            }

            let visitorData = {};

            if (category === 'dormitory') {
                let lastName, firstName;
                
                if (this.dormitoryCheckinMode === 'registered') {
                    // 등록된 방문자 선택 모드
                    const selectedVisitorId = document.getElementById('dormRegisteredSelect').value;
                    if (!selectedVisitorId) {
                        this.showNotification('Input Error', 'Please select a registered visitor.', 'error');
                    return;
                }
                    
                    const selectedVisitor = this.frequentVisitors.find(v => v.id === selectedVisitorId);
                    if (!selectedVisitor) {
                        this.showNotification('Error', 'Selected visitor information not found.', 'error');
                        return;
                    }
                    
                    lastName = selectedVisitor.lastName;
                    firstName = selectedVisitor.firstName;
                } else {
                    // 직접 입력 모드
                    lastName = document.getElementById('dormLastName').value.trim();
                    firstName = document.getElementById('dormFirstName').value.trim();
                    
                    if (!lastName || !firstName) {
                        this.showNotification('Input Error', 'Please enter both last name and first name.', 'error');
                        return;
                    }
                }
                
                // 현재 위치의 실제 이름 찾기
                const currentLocationInfo = this.locations.find(loc => loc.category === 'dormitory' && 
                    this.calculateDistance(this.currentLocation.lat, this.currentLocation.lng, loc.lat, loc.lng) <= loc.radius);
                
                visitorData = {
                    id: Date.now(),
                    category: 'dormitory',
                    lastName: lastName,
                    firstName: firstName,
                    fullName: `${lastName} ${firstName}`,
                    locationName: currentLocationInfo ? currentLocationInfo.name : '기숙사',
                    checkinTime: new Date().toISOString(),
                    location: this.currentLocation
                };
            } else if (category === 'factory') {
                const lastName = document.getElementById('factoryLastName').value.trim();
                const firstName = document.getElementById('factoryFirstName').value.trim();
                const company = document.getElementById('factoryCompany').value.trim();
                const phone = document.getElementById('factoryPhone').value.trim();
                const purpose = document.getElementById('factoryPurpose').value;

                if (!lastName || !firstName || !company || !phone || !purpose) {
                    this.showNotification('Input Error', 'Please fill in all fields.', 'error');
                    return;
                }

                // 현재 위치의 실제 이름 찾기
                const currentLocationInfo = this.locations.find(loc => loc.category === 'factory' && 
                    this.calculateDistance(this.currentLocation.lat, this.currentLocation.lng, loc.lat, loc.lng) <= loc.radius);

                visitorData = {
                    id: Date.now(),
                    category: 'factory',
                    lastName: lastName,
                    firstName: firstName,
                    fullName: `${lastName} ${firstName}`,
                    company: company,
                    phone: phone,
                    purpose: purpose,
                    locationName: currentLocationInfo ? currentLocationInfo.name : '공장',
                    checkinTime: new Date().toISOString(),
                    location: this.currentLocation
                };
            }

            // 방문자 추가
            this.currentVisitors.push(visitorData);
            this.visitLogs.push({
                ...visitorData,
                name: visitorData.fullName, // name 필드 명시적 설정
                action: 'checkin',
                timestamp: new Date()
            });

            // 폼 초기화
            this.clearForms();

            // UI 업데이트
            this.updateVisitorCounts();
            this.updateCheckoutOptions();
            this.saveData();

            this.hideCheckinLoading();
            this.showNotification('Check In Complete', `${visitorData.fullName} has checked in at ${visitorData.locationName}.`, 'success');

            // 2초 후 자동으로 메인 화면으로 돌아가기
            setTimeout(() => {
                this.backToMain();
            }, 2000);

        } catch (error) {
            console.error('체크인 오류:', error);
            this.hideCheckinLoading();
            this.showNotification(
                '체크인 오류', 
                `체크인 처리 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`, 
                'error',
                { retry: () => this.checkin(category) }
            );
        }
    }

    // 체크아웃용 방문자 검색
    searchVisitorsForCheckout(searchTerm) {
        const resultsDiv = document.getElementById('checkoutResults');
        const listDiv = document.getElementById('checkoutList');
        const checkoutBtn = document.getElementById('checkoutConfirmBtn');
        
        // 검색어가 없으면 결과 숨기기
        if (!searchTerm) {
            resultsDiv.classList.add('hidden');
            checkoutBtn.disabled = true;
            this.selectedVisitorId = null;
            return;
        }
        
        // 현재 날짜 기준으로 24시간 이내의 방문자 중에서 검색
        const now = new Date();
        const todayVisitors = this.currentVisitors.filter(visitor => {
            const checkinTime = new Date(visitor.checkinTime);
            const hoursDiff = (now - checkinTime) / (1000 * 60 * 60);
            return hoursDiff < 24; // 24시간 이내만 검색 대상
        });
        
        // 해당 성을 가진 방문자들 찾기
        const matchingVisitors = todayVisitors.filter(visitor => 
            visitor.lastName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        // 결과 표시
        if (matchingVisitors.length === 0) {
            listDiv.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <i class="fas fa-search mr-2"></i>
                    No visitors found with last name "${searchTerm}".
                </div>
            `;
        } else {
            listDiv.innerHTML = matchingVisitors.map(visitor => `
                <div class="card bg-base-100 shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50" 
                     onclick="visitorSystem.selectVisitorForCheckout(${visitor.id})">
                    <div class="card-body p-3">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="font-semibold">${visitor.fullName || visitor.name || `${visitor.lastName} ${visitor.firstName}`}</h4>
                                <p class="text-sm text-gray-600">
                                    <i class="fas ${visitor.category === 'dormitory' ? 'fa-home' : 'fa-industry'} mr-1"></i>
                                    ${visitor.locationName || (visitor.category === 'dormitory' ? '기숙사' : '공장')}
                                    ${visitor.company ? ` • ${visitor.company}` : ''}
                                </p>
                                <p class="text-xs text-gray-500">
                                    Check In: ${this.formatTime(visitor.checkinTime)}
                                </p>
                            </div>
                            <div class="badge ${visitor.category === 'dormitory' ? 'badge-primary' : 'badge-warning'}">
                                ${visitor.category === 'dormitory' ? 'Dormitory (기숙사)' : 'Factory (공장)'}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        resultsDiv.classList.remove('hidden');
        checkoutBtn.disabled = true;
        this.selectedVisitorId = null;
    }

    // 체크아웃할 방문자 선택
    selectVisitorForCheckout(visitorId) {
        this.selectedVisitorId = visitorId;
        document.getElementById('checkoutConfirmBtn').disabled = false;
        
        // 선택된 카드 하이라이트
        document.querySelectorAll('#checkoutList .card').forEach(card => {
            card.classList.remove('ring-2', 'ring-primary', 'bg-primary', 'text-white');
        });
        
        // 클릭된 카드 찾기 및 하이라이트
        const clickedCard = document.querySelector(`[onclick*="selectVisitorForCheckout(${visitorId})"]`);
        if (clickedCard) {
            clickedCard.classList.add('ring-2', 'ring-primary', 'bg-primary', 'text-white');
        }
    }

    // 체크아웃 처리
    checkout() {
        if (!this.selectedVisitorId) {
            this.showNotification('Selection Error', 'Please select a visitor to check out.', 'error');
            return;
        }

        const visitorIndex = this.currentVisitors.findIndex(v => v.id == this.selectedVisitorId);
        if (visitorIndex === -1) {
            this.showNotification('Error', 'Selected visitor not found.', 'error');
            return;
        }

        // 로딩 상태 표시
        this.showCheckoutLoading();

        const visitor = this.currentVisitors[visitorIndex];
        
        // 체크아웃 시 방문자를 목록에서 제거
        this.currentVisitors.splice(visitorIndex, 1);
        
        // 로그 추가
        this.visitLogs.push({
            ...visitor,
            name: visitor.fullName, // name 필드 명시적 설정
            action: 'checkout',
            checkoutTime: new Date(),
            timestamp: new Date()
        });

        // UI 업데이트 (방문자 수 감소)
        this.updateVisitorCounts();
        this.updateCheckoutOptions();
        this.saveData();

        // 검색 결과 새로고침
        const searchInput = document.getElementById('checkoutSearch');
        if (searchInput && searchInput.value.trim()) {
            this.searchVisitorsForCheckout(searchInput.value.trim());
        }

        const visitorName = visitor.fullName || visitor.name || `${visitor.lastName} ${visitor.firstName}`;
        
        this.hideCheckoutLoading();
        this.showNotification('Check Out Complete', `${visitorName} has been checked out.`, 'success');

        // 2초 후 자동으로 메인 화면으로 돌아가기
        setTimeout(() => {
            this.backToMain();
        }, 2000);
    }

    // 위치 검증
    validateLocation(category) {
        if (!this.currentLocation) return false;
        
        // 해당 카테고리의 위치 찾기
        const targetLocation = this.locations.find(loc => loc.category === category);
        if (!targetLocation) return false;
        
        const distance = this.calculateDistance(
            this.currentLocation.lat,
            this.currentLocation.lng,
            targetLocation.lat,
            targetLocation.lng
        );
        
        // 디버깅을 위한 거리 정보 표시
        const distanceInMeters = distance * 1000;
        console.log(`현재 위치와 ${targetLocation.name} 거리: ${distanceInMeters.toFixed(0)}m`);
        console.log(`설정된 반경: ${(targetLocation.radius * 1000).toFixed(0)}m`);
        
        // 500미터를 넘어도 가장 가까운 위치로 체크인 허용
        const isWithinRadius = distance <= targetLocation.radius;
        const isClosestLocation = this.isClosestLocation(category);
        
        console.log(`반경 내 체크인: ${isWithinRadius ? '예' : '아니오'}`);
        console.log(`가장 가까운 위치: ${isClosestLocation ? '예' : '아니오'}`);
        console.log(`최종 체크인 가능: ${isWithinRadius || isClosestLocation ? '예' : '아니오'}`);
        
        return isWithinRadius || isClosestLocation;
    }

    // 가장 가까운 위치인지 확인
    isClosestLocation(category) {
        if (!this.currentLocation) return false;
        
        let closestLocation = null;
        let minDistance = Infinity;
        
        // 모든 위치와의 거리 계산하여 가장 가까운 위치 찾기
        this.locations.forEach(location => {
            const distance = this.calculateDistance(
                this.currentLocation.lat,
                this.currentLocation.lng,
                location.lat,
                location.lng
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestLocation = location;
            }
        });
        
        // 가장 가까운 위치가 요청한 카테고리와 일치하는지 확인
        return closestLocation && closestLocation.category === category;
    }

    // 두 좌표 간의 거리 계산 (킬로미터)
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // 지구의 반지름(km)
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // 방문자 수 업데이트 (일일 리셋 시스템)
    updateVisitorCounts() {
        // 현재 날짜 기준으로 24시간 이내의 방문자만 카운트
        const now = new Date();
        const todayVisitors = this.currentVisitors.filter(visitor => {
            const checkinTime = new Date(visitor.checkinTime);
            const hoursDiff = (now - checkinTime) / (1000 * 60 * 60); // 시간 차이
            return hoursDiff < 24; // 24시간 이내만 카운트
        });

        const dormitoryCount = todayVisitors.filter(v => v.category === 'dormitory').length;
        const factoryCount = todayVisitors.filter(v => v.category === 'factory').length;
        const totalCount = todayVisitors.length;

        document.getElementById('dormitoryCount').textContent = dormitoryCount;
        document.getElementById('factoryCount').textContent = factoryCount;
        document.getElementById('totalCount').textContent = totalCount;

        // 오래된 방문자 정리 (백그라운드에서 실행)
        this.cleanupOldVisitors();
    }

    // 오래된 방문자 정리 (24시간 이상 된 방문자)
    cleanupOldVisitors() {
        const now = new Date();
        const initialLength = this.currentVisitors.length;
        
        // 24시간 이상 된 방문자들을 찾아서 로그에 기록 후 제거
        this.currentVisitors = this.currentVisitors.filter(visitor => {
            const checkinTime = new Date(visitor.checkinTime);
            const hoursDiff = (now - checkinTime) / (1000 * 60 * 60);
            
            if (hoursDiff >= 24) {
                // 오래된 방문자를 로그에 자동 체크아웃으로 기록
                this.visitLogs.push({
                    ...visitor,
                    action: 'auto-checkout-daily',
                    checkoutTime: new Date(),
                    timestamp: new Date(),
                    reason: 'Daily cleanup - 24+ hours old'
                });
                return false; // 배열에서 제거
            }
            return true; // 유지
        });

        // 정리된 방문자가 있으면 데이터 저장
        if (this.currentVisitors.length !== initialLength) {
            this.saveData();
            console.log(`일일 정리: ${initialLength - this.currentVisitors.length}명의 오래된 방문자가 정리되었습니다.`);
        }
    }

    // 방문자 목록 업데이트 (관리자용) - 일일 리셋 시스템 적용
    updateVisitorList() {
        const container = document.getElementById('visitorList');
        if (!container) {
            console.log('visitorList 컨테이너를 찾을 수 없습니다. 관리자 모드가 아닐 수 있습니다.');
            return;
        }
        container.innerHTML = '';

        // 현재 날짜 기준으로 24시간 이내의 방문자만 표시
        const now = new Date();
        const todayVisitors = this.currentVisitors.filter(visitor => {
            const checkinTime = new Date(visitor.checkinTime);
            const hoursDiff = (now - checkinTime) / (1000 * 60 * 60);
            return hoursDiff < 24; // 24시간 이내만 표시
        });

        if (todayVisitors.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <i class="fas fa-users text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">오늘 체크인된 방문자가 없습니다.</p>
                    <p class="text-sm text-gray-400 mt-2">24시간 이내의 방문자만 표시됩니다.</p>
                </div>
            `;
            return;
        }

        todayVisitors.forEach(visitor => {
            const card = document.createElement('div');
            card.className = `card bg-base-100 shadow-md border-l-4 ${
                visitor.category === 'dormitory' ? 'border-blue-500' : 'border-orange-500'
            }`;
            
            let details = '';
            if (visitor.category === 'factory') {
                details = `
                    <div class="text-sm text-gray-600 space-y-1">
                        <div><strong>회사:</strong> ${visitor.company}</div>
                        <div><strong>전화번호:</strong> ${visitor.phone}</div>
                        <div><strong>방문목적:</strong> ${this.getPurposeText(visitor.purpose)}</div>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="card-body p-4">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="card-title text-lg">${visitor.fullName || visitor.name || `${visitor.lastName || ''} ${visitor.firstName || ''}`.trim() || 'Unknown Visitor'}</h3>
                        <div class="badge ${visitor.category === 'dormitory' ? 'badge-primary' : 'badge-warning'}">
                            ${visitor.category === 'dormitory' ? '기숙사' : '공장'}
                </div>
                    </div>
                    <div class="text-sm text-gray-600 mb-2">
                        <i class="fas ${visitor.category === 'dormitory' ? 'fa-home' : 'fa-industry'} mr-1"></i>
                        <strong>위치:</strong> ${visitor.locationName || (visitor.category === 'dormitory' ? '기숙사' : '공장')}
                    </div>
                    ${details}
                    <div class="text-xs text-gray-500 mt-2">
                        <i class="fas fa-clock mr-1"></i>
                        체크인: ${this.formatTime(visitor.checkinTime)}
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    // 목적 텍스트 변환
    getPurposeText(purpose) {
        const purposes = {
            'business': '업무',
            'delivery': '배송',
            'maintenance': '유지보수',
            'inspection': '점검',
            'meeting': '회의',
            'other': '기타'
        };
        return purposes[purpose] || purpose;
    }

    // 체크아웃 옵션 업데이트 (검색 방식으로 변경됨)
    updateCheckoutOptions() {
        const checkoutBtn = document.getElementById('checkoutConfirmBtn');
        if (checkoutBtn) {
            // 현재 방문자가 없으면 체크아웃 버튼 비활성화
            checkoutBtn.disabled = this.currentVisitors.length === 0;
        }
    }

    // 폼 초기화
    clearForms() {
        // 기숙사 폼 초기화
        const dormLastName = document.getElementById('dormLastName');
        const dormFirstName = document.getElementById('dormFirstName');
        if (dormLastName) dormLastName.value = '';
        if (dormFirstName) dormFirstName.value = '';
        
        // 공장 폼 초기화
        const factoryLastName = document.getElementById('factoryLastName');
        const factoryFirstName = document.getElementById('factoryFirstName');
        const factoryCompany = document.getElementById('factoryCompany');
        const factoryPhone = document.getElementById('factoryPhone');
        const factoryPurpose = document.getElementById('factoryPurpose');
        
        if (factoryLastName) factoryLastName.value = '';
        if (factoryFirstName) factoryFirstName.value = '';
        if (factoryCompany) factoryCompany.value = '';
        if (factoryPhone) factoryPhone.value = '';
        if (factoryPurpose) factoryPurpose.value = '';
    }

    // 관리자 모달 표시
    showAdminModal() {
        document.getElementById('adminModal').classList.add('modal-open');
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPanel').classList.add('hidden');
        document.getElementById('adminLogin').classList.remove('hidden');
    }

    // 관리자 모달 숨기기
    hideAdminModal() {
        document.getElementById('adminModal').classList.remove('modal-open');
    }

    // 관리자 로그인
    adminLogin() {
        const password = document.getElementById('adminPassword').value;
        
        if (password === this.adminPassword) {
            // 로그인 폼 숨기기
            document.getElementById('adminLogin').style.display = 'none';
            
            // 관리자 패널 표시
            document.getElementById('adminPanel').style.display = 'block';
            
            // 디버깅을 위한 콘솔 로그
            console.log('관리자 패널 표시됨');
            console.log('GPS 설정 섹션 확인 중...');
            
            this.loadSettingsToForm();
            this.updateVisitorList();
            this.updateLogList();
            this.renderFrequentVisitorsList();
        } else {
            this.showNotification('로그인 실패', '비밀번호가 올바르지 않습니다.', 'error');
        }
    }

    // 설정을 폼에 로드
    loadSettingsToForm() {
        this.renderLocationList();
    }

    // 위치 목록 렌더링
    renderLocationList() {
        const locationList = document.getElementById('locationList');
        locationList.innerHTML = '';

        if (this.locations.length === 0) {
            locationList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-map-marker-alt text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">등록된 위치가 없습니다.</p>
                    <p class="text-sm text-gray-400">"위치 추가" 버튼을 눌러 첫 번째 위치를 추가해보세요.</p>
                </div>
            `;
            return;
        }

        this.locations.forEach((location, index) => {
            const locationCard = document.createElement('div');
            locationCard.className = 'card bg-base-100 shadow-md border-l-4 border-primary';
            locationCard.innerHTML = `
                <div class="card-body p-4">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center gap-3">
                            <i class="fas ${location.category === 'dormitory' ? 'fa-home' : 'fa-industry'} text-2xl ${location.category === 'dormitory' ? 'text-blue-500' : 'text-orange-500'}"></i>
                            <div>
                                <h5 class="card-title text-lg">${location.name}</h5>
                                <span class="badge ${location.category === 'dormitory' ? 'badge-primary' : 'badge-warning'}">
                                    ${location.category === 'dormitory' ? '기숙사' : '공장'}
                                </span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-sm btn-ghost" onclick="visitorSystem.editLocation(${index})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-error" onclick="visitorSystem.deleteLocation(${index})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-semibold">위치 이름</span>
                            </label>
                            <input type="text" id="locationName_${index}" value="${location.name}" 
                                   class="input input-bordered input-sm w-full" placeholder="예: 기숙사 1동, 공장 2동"
                                   oninput="visitorSystem.updateLocationTitle(${index})">
                        </div>
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-semibold">구분</span>
                            </label>
                            <select id="locationCategory_${index}" class="select select-bordered select-sm w-full"
                                    onchange="visitorSystem.updateLocationTitle(${index})">
                                <option value="dormitory" ${location.category === 'dormitory' ? 'selected' : ''}>🏠 기숙사</option>
                                <option value="factory" ${location.category === 'factory' ? 'selected' : ''}>🏭 공장</option>
                            </select>
                        </div>
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-semibold">위도 (Latitude)</span>
                            </label>
                            <div class="flex gap-2">
                                <input type="number" id="locationLat_${index}" value="${location.lat}" step="0.000001" 
                                       class="input input-bordered input-sm flex-1" placeholder="37.566500">
                                <button class="btn btn-sm btn-outline" onclick="visitorSystem.setCurrentLocation(${index})" 
                                        title="현재 위치로 설정">
                                    <i class="fas fa-crosshairs"></i>
                                </button>
                            </div>
                        </div>
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-semibold">경도 (Longitude)</span>
                            </label>
                            <div class="flex gap-2">
                                <input type="number" id="locationLng_${index}" value="${location.lng}" step="0.000001" 
                                       class="input input-bordered input-sm flex-1" placeholder="126.978000">
                                <button class="btn btn-sm btn-outline" onclick="visitorSystem.setCurrentLocation(${index})" 
                                        title="현재 위치로 설정">
                                    <i class="fas fa-crosshairs"></i>
                                </button>
                            </div>
                        </div>
                        <div class="form-control md:col-span-2">
                            <label class="label">
                                <span class="label-text font-semibold">체크인 반경 (미터)</span>
                            </label>
                            <input type="number" id="locationRadius_${index}" value="${location.radius * 1000}" 
                                   class="input input-bordered input-sm w-full" placeholder="500">
                            <label class="label">
                                <span class="label-text-alt text-gray-500">이 반경 내에서만 체크인이 가능합니다</span>
                            </label>
                        </div>
                    </div>
                </div>
            `;
            locationList.appendChild(locationCard);
        });
    }

    // 설정 저장
    saveSettings() {
        try {
            // 모든 위치 정보 수집
            const newLocations = [];
            
            for (let i = 0; i < this.locations.length; i++) {
                const name = document.getElementById(`locationName_${i}`).value.trim();
                const category = document.getElementById(`locationCategory_${i}`).value;
                const lat = parseFloat(document.getElementById(`locationLat_${i}`).value);
                const lng = parseFloat(document.getElementById(`locationLng_${i}`).value);
                const radius = parseFloat(document.getElementById(`locationRadius_${i}`).value);

                // 유효성 검사
                if (!name || isNaN(lat) || isNaN(lng) || isNaN(radius)) {
                    this.showNotification('입력 오류', `위치 ${i + 1}의 모든 필드를 올바르게 입력해주세요.`, 'error');
                    return;
                }

                // 좌표 유효성 검사
                if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                    this.showNotification('입력 오류', `위치 ${i + 1}의 좌표가 올바르지 않습니다. (위도: -90~90, 경도: -180~180)`, 'error');
                    return;
                }

                newLocations.push({
                    id: this.locations[i].id,
                    name: name,
                    category: category,
                    lat: lat,
                    lng: lng,
                    radius: radius / 1000 // 킬로미터로 변환
                });
            }

            // 설정 업데이트
            this.locations = newLocations;

            // 로컬 스토리지에 저장
            localStorage.setItem('visitorSystemLocations', JSON.stringify(this.locations));

            // 위치 재감지
            this.detectLocationCategory();

            this.showNotification('저장 완료', `총 ${this.locations.length}개의 위치가 저장되었습니다.`, 'success');

        } catch (error) {
            console.error('설정 저장 오류:', error);
            this.showNotification('오류', '설정 저장 중 오류가 발생했습니다.', 'error');
        }
    }

    // 새 위치 추가
    addNewLocation() {
        const newLocation = {
            id: `location_${this.nextLocationId++}`,
            name: `새 위치 ${this.nextLocationId - 1}`,
            category: 'dormitory',
            lat: 37.566500,
            lng: 126.978000,
            radius: 0.5
        };
        
        this.locations.push(newLocation);
        this.renderLocationList();
        this.showNotification('위치 추가', '새 위치가 추가되었습니다. 이름과 구분을 설정해주세요.', 'success');
    }

    // 위치 편집
    editLocation(index) {
        // 편집 모드로 전환 (이미 인라인 편집이 가능하므로 별도 처리 불필요)
        this.showNotification('편집 모드', '위치 정보를 수정하고 저장 버튼을 눌러주세요.', 'info');
    }

    // 위치 삭제
    deleteLocation(index) {
        if (this.locations.length <= 1) {
            this.showNotification('삭제 불가', '최소 하나의 위치는 남겨두어야 합니다.', 'error');
            return;
        }

        const location = this.locations[index];
        if (confirm(`"${location.name}" 위치를 삭제하시겠습니까?`)) {
            this.locations.splice(index, 1);
            this.renderLocationList();
            this.showNotification('위치 삭제', '위치가 삭제되었습니다.', 'success');
        }
    }

    // 현재 위치로 좌표 설정
    setCurrentLocation(index) {
        if (!navigator.geolocation) {
            this.showNotification('GPS 오류', 'GPS를 지원하지 않는 브라우저입니다.', 'error');
            return;
        }

        this.showNotification('위치 감지 중...', '현재 위치를 가져오는 중입니다.', 'info');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // 입력 필드에 현재 위치 설정 (소수점 6자리)
                document.getElementById(`locationLat_${index}`).value = lat.toFixed(6);
                document.getElementById(`locationLng_${index}`).value = lng.toFixed(6);

                this.showNotification('위치 설정 완료', `위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)}`, 'success');
            },
            (error) => {
                console.error('위치 오류:', error);
                let errorMessage = '위치를 가져올 수 없습니다.';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = '위치 정보를 사용할 수 없습니다.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = '위치 요청 시간이 초과되었습니다.';
                        break;
                }
                
                this.showNotification('위치 오류', errorMessage, 'error');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    // 모든 위치를 현재 위치로 설정
    setAllCurrentLocation() {
        if (!navigator.geolocation) {
            this.showNotification('GPS 오류', 'GPS를 지원하지 않는 브라우저입니다.', 'error');
            return;
        }

        if (this.locations.length === 0) {
            this.showNotification('위치 없음', '설정할 위치가 없습니다.', 'error');
            return;
        }

        this.showNotification('위치 감지 중...', '현재 위치를 가져와서 모든 위치에 적용합니다.', 'info');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // 모든 위치의 좌표를 현재 위치로 설정 (소수점 6자리)
                for (let i = 0; i < this.locations.length; i++) {
                    document.getElementById(`locationLat_${i}`).value = lat.toFixed(6);
                    document.getElementById(`locationLng_${i}`).value = lng.toFixed(6);
                }

                this.showNotification('설정 완료', `모든 ${this.locations.length}개 위치가 현재 위치로 설정되었습니다.`, 'success');
            },
            (error) => {
                console.error('위치 오류:', error);
                let errorMessage = '위치를 가져올 수 없습니다.';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = '위치 정보를 사용할 수 없습니다.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = '위치 요청 시간이 초과되었습니다.';
                        break;
                }
                
                this.showNotification('위치 오류', errorMessage, 'error');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    // 위치 제목 업데이트
    updateLocationTitle(index) {
        const nameInput = document.getElementById(`locationName_${index}`);
        const categorySelect = document.getElementById(`locationCategory_${index}`);
        
        if (!nameInput || !categorySelect) return;
        
        const newName = nameInput.value || '새 위치';
        const newCategory = categorySelect.value;
        
        // 카드의 제목 부분 찾기
        const card = nameInput.closest('.card');
        if (!card) return;
        
        const titleElement = card.querySelector('.card-title');
        const badgeElement = card.querySelector('.badge');
        const iconElement = card.querySelector('.fa-home, .fa-industry');
        
        if (titleElement) {
            titleElement.textContent = newName;
        }
        
        if (badgeElement) {
            badgeElement.textContent = newCategory === 'dormitory' ? '기숙사' : '공장';
            badgeElement.className = `badge ${newCategory === 'dormitory' ? 'badge-primary' : 'badge-warning'}`;
        }
        
        if (iconElement) {
            iconElement.className = `fas ${newCategory === 'dormitory' ? 'fa-home' : 'fa-industry'} text-2xl ${newCategory === 'dormitory' ? 'text-blue-500' : 'text-orange-500'}`;
        }
    }

    // 설정 리셋
    resetSettings() {
        if (confirm('설정을 기본값으로 리셋하시겠습니까?')) {
            // 기본값으로 설정
            this.locations = [
                { 
                    id: 'dormitory_1',
                    name: '기숙사 1동',
                    category: 'dormitory',
                    lat: 37.5665, 
                    lng: 126.9780, 
                    radius: 0.1
                },
                { 
                    id: 'factory_1',
                    name: '공장 1동',
                    category: 'factory',
                    lat: 37.5512, 
                    lng: 126.9882, 
                    radius: 0.1
                }
            ];
            this.nextLocationId = 2;

            // 폼에 기본값 로드
            this.loadSettingsToForm();

            // 로컬 스토리지에서 제거
            localStorage.removeItem('visitorSystemLocations');

            // 위치 재감지
            this.detectLocationCategory();

            this.showNotification('설정 리셋 완료', '설정이 기본값으로 리셋되었습니다.', 'success');
        }
    }

    // 현재 위치로 테스트
    testCurrentLocation() {
        if (!this.currentLocation) {
            this.showNotification('위치 오류', '현재 위치를 가져올 수 없습니다. GPS 권한을 허용해주세요.', 'error');
            return;
        }

        let closestLocation = null;
        let minDistance = Infinity;

        // 각 위치와의 거리 계산
        this.locations.forEach(location => {
            const distance = this.calculateDistance(
                this.currentLocation.lat,
                this.currentLocation.lng,
                location.lat,
                location.lng
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestLocation = location;
            }
        });

        const distanceInMeters = minDistance * 1000;
        const locationName = closestLocation.name;
        const isWithinRadius = distanceInMeters <= (closestLocation.radius * 1000);

        let message = `현재 위치에서 가장 가까운 곳: ${locationName}\n`;
        message += `거리: ${distanceInMeters.toFixed(0)}m\n`;
        message += `설정된 반경: ${(closestLocation.radius * 1000).toFixed(0)}m\n`;
        message += `체크인 가능: ${isWithinRadius ? '예' : '아니오'}`;

        this.showNotification('위치 테스트 결과', message, isWithinRadius ? 'success' : 'warning');
    }

    // 로그 목록 업데이트
    updateLogList() {
        console.log('=== 방문 로그 목록 업데이트 시작 ===');
        console.log('전체 로그 수:', this.visitLogs.length);
        console.log('전체 로그 데이터:', this.visitLogs);
        
        const container = document.getElementById('logList');
        if (!container) {
            console.error('❌ logList 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        console.log('✅ logList 컨테이너 찾음');
        container.innerHTML = '';

        const filteredLogs = this.getFilteredLogs();
        console.log('필터링된 로그 수:', filteredLogs.length);
        console.log('필터링된 로그 데이터:', filteredLogs);

        if (filteredLogs.length === 0) {
            console.log('📝 로그가 없어서 빈 상태 메시지 표시');
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-clipboard-list text-4xl mb-4"></i>
                    <p>표시할 로그가 없습니다.</p>
                </div>
            `;
            return;
        }

        console.log('📝 로그 카드 생성 시작');
        filteredLogs.forEach((log, index) => {
            console.log(`로그 ${index + 1} 렌더링:`, log);
            const item = document.createElement('div');
            item.className = 'card bg-base-100 shadow-sm border';
            
            const actionText = log.action === 'checkin' ? '체크인' : '체크아웃';
            const categoryText = log.category === 'dormitory' ? '기숙사' : '공장';
            console.log(`로그 ${index + 1} - 액션: ${actionText}, 카테고리: ${categoryText}`);
            
            let details = '';
            if (log.category === 'factory') {
                details = `
                    <div class="text-sm text-gray-600 space-y-1">
                        <div><strong>회사:</strong> ${log.company}</div>
                        <div><strong>전화번호:</strong> ${log.phone}</div>
                        <div><strong>방문목적:</strong> ${this.getPurposeText(log.purpose)}</div>
                    </div>
                `;
            }

            item.innerHTML = `
                <div class="card-body p-4">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <h4 class="font-semibold">${log.name}</h4>
                            <div class="badge ${log.category === 'dormitory' ? 'badge-primary' : 'badge-warning'}">
                                ${categoryText}
                </div>
                            <div class="badge ${log.action === 'checkin' ? 'badge-success' : 'badge-error'}">
                                ${actionText}
                </div>
                        </div>
                        <span class="text-sm text-gray-500">${this.formatTime(log.timestamp)}</span>
                </div>
                    ${details}
                </div>
            `;
            
            container.appendChild(item);
            console.log(`로그 ${index + 1} 카드 추가 완료`);
        });
        
        console.log('=== 방문 로그 목록 업데이트 완료 ===');
    }

    // 필터된 로그 가져오기
    getFilteredLogs() {
        let logs = [...this.visitLogs];
        
        const categoryFilter = document.getElementById('logCategoryFilter').value;
        const dateFilter = document.getElementById('logDateFilter').value;
        
        if (categoryFilter !== 'all') {
            logs = logs.filter(log => log.category === categoryFilter);
        }
        
        if (dateFilter) {
            const filterDate = new Date(dateFilter);
            logs = logs.filter(log => {
                const logDate = new Date(log.timestamp);
                return logDate.toDateString() === filterDate.toDateString();
            });
        }
        
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // 로그 필터링
    filterLogs() {
        this.updateLogList();
    }

    // 로그 엑셀 다운로드
    exportLogs() {
        const logs = this.getFilteredLogs();
        const csvContent = this.convertToCSV(logs);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `방문로그_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // CSV 변환
    convertToCSV(logs) {
        const headers = ['이름', '카테고리', '회사', '전화번호', '방문목적', '행동', '시간'];
        const rows = logs.map(log => [
            log.name,
            log.category === 'dormitory' ? '기숙사' : '공장',
            log.company || '',
            log.phone || '',
            log.purpose ? this.getPurposeText(log.purpose) : '',
            log.action === 'checkin' ? '체크인' : '체크아웃',
            this.formatTime(log.timestamp)
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }


    // 알림 표시
    showNotification(title, message, type = 'info', options = {}) {
        const icon = document.getElementById('notificationIcon');
        const titleElement = document.getElementById('notificationTitle');
        const messageElement = document.getElementById('notificationMessage');
        
        // 아이콘 설정
        const icons = {
            'success': 'fas fa-check-circle text-success',
            'error': 'fas fa-exclamation-circle text-error',
            'warning': 'fas fa-exclamation-triangle text-warning',
            'info': 'fas fa-info-circle text-primary'
        };
        
        icon.className = icons[type] || icons.info;
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        // 재시도 버튼 추가 (옵션이 있는 경우)
        if (options.retry) {
            this.addRetryButton(options.retry);
        } else {
            this.removeRetryButton();
        }
        
        document.getElementById('notificationModal').classList.add('modal-open');
    }

    // 재시도 버튼 추가
    addRetryButton(retryFunction) {
        const modal = document.getElementById('notificationModal');
        let retryBtn = document.getElementById('retryBtn');
        
        if (!retryBtn) {
            retryBtn = document.createElement('button');
            retryBtn.id = 'retryBtn';
            retryBtn.className = 'btn btn-warning mt-2';
            retryBtn.innerHTML = '<i class="fas fa-redo mr-2"></i>다시 시도';
            modal.querySelector('.modal-box').appendChild(retryBtn);
        }
        
        retryBtn.onclick = () => {
            this.hideNotification();
            retryFunction();
        };
    }

    // 재시도 버튼 제거
    removeRetryButton() {
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.remove();
        }
    }

    // 알림 숨기기
    hideNotification() {
        document.getElementById('notificationModal').classList.remove('modal-open');
    }

    // 시간 포맷팅
    formatTime(date) {
        if (!date) return '-';
        
        try {
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) {
                return '-';
            }
            
            return dateObj.toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            console.error('시간 포맷팅 오류:', error, date);
            return '-';
        }
    }

    // 데이터 저장
    saveData() {
        localStorage.setItem('visitorSystem_currentVisitors', JSON.stringify(this.currentVisitors));
        localStorage.setItem('visitorSystem_visitLogs', JSON.stringify(this.visitLogs));
        
        // 오프라인 데이터 백업
        this.saveOfflineBackup();
        
        // Supabase 동기화 (활성화된 경우)
        if (window.supabaseClient && window.dbConfig.sync.enabled && navigator.onLine) {
            window.supabaseClient.syncToDatabase();
        } else if (!navigator.onLine) {
            // 오프라인 상태일 때 동기화 대기열에 추가
            this.addToSyncQueue();
        }
    }

    // 오프라인 백업 저장
    saveOfflineBackup() {
        const backupData = {
            visitors: this.currentVisitors,
            logs: this.visitLogs,
            timestamp: Date.now()
        };
        localStorage.setItem('visitorSystem_offlineBackup', JSON.stringify(backupData));
    }

    // 동기화 대기열에 추가
    addToSyncQueue() {
        const queue = JSON.parse(localStorage.getItem('visitorSystem_syncQueue') || '[]');
        queue.push({
            type: 'data_update',
            data: {
                visitors: this.currentVisitors,
                logs: this.visitLogs
            },
            timestamp: Date.now()
        });
        localStorage.setItem('visitorSystem_syncQueue', JSON.stringify(queue));
    }

    // 온라인 상태 복구 시 동기화
    handleOnlineStatus() {
        if (navigator.onLine) {
            this.syncOfflineData();
        }
    }

    // 오프라인 데이터 동기화
    syncOfflineData() {
        const queue = JSON.parse(localStorage.getItem('visitorSystem_syncQueue') || '[]');
        if (queue.length > 0 && window.supabaseClient && window.dbConfig.sync.enabled) {
            // 대기열의 데이터를 순차적으로 동기화
            queue.forEach(item => {
                window.supabaseClient.syncToDatabase();
            });
            // 동기화 완료 후 대기열 초기화
            localStorage.removeItem('visitorSystem_syncQueue');
        }
    }

    // 데이터 로드 (로컬 스토리지)
    loadData() {
        const savedVisitors = localStorage.getItem('visitorSystem_currentVisitors');
        const savedLogs = localStorage.getItem('visitorSystem_visitLogs');
        const savedSettings = localStorage.getItem('visitorSystem_gpsSettings');
        const savedLocations = localStorage.getItem('visitorSystemLocations');
        
        if (savedVisitors) {
            this.currentVisitors = JSON.parse(savedVisitors).map(visitor => ({
                ...visitor,
                checkinTime: new Date(visitor.checkinTime)
            }));
        }
        
        if (savedLogs) {
            this.visitLogs = JSON.parse(savedLogs).map(log => ({
                ...log,
                timestamp: new Date(log.timestamp),
                checkinTime: log.checkinTime ? new Date(log.checkinTime) : null,
                checkoutTime: log.checkoutTime ? new Date(log.checkoutTime) : null
            }));
        }

        // 위치 설정 로드 (새로운 형식 우선)
        if (savedLocations) {
            try {
                this.locations = JSON.parse(savedLocations);
                // nextLocationId 업데이트
                this.nextLocationId = Math.max(...this.locations.map(loc => {
                    const idNum = parseInt(loc.id.split('_')[1]);
                    return isNaN(idNum) ? 0 : idNum;
                })) + 1;
            } catch (error) {
                console.error('위치 설정 로드 오류:', error);
            }
        } else if (savedSettings) {
            // 기존 형식으로 마이그레이션
            try {
                const settings = JSON.parse(savedSettings);
                this.locations = [
                    {
                        id: 'dormitory_1',
                        name: settings.dormitory.name || '기숙사',
                        category: 'dormitory',
                        lat: settings.dormitory.lat || 37.5665,
                        lng: settings.dormitory.lng || 126.9780,
                        radius: settings.dormitory.radius || 0.1
                    },
                    {
                        id: 'factory_1',
                        name: settings.factory.name || '공장',
                        category: 'factory',
                        lat: settings.factory.lat || 37.5512,
                        lng: settings.factory.lng || 126.9882,
                        radius: settings.factory.radius || 0.1
                    }
                ];
                this.nextLocationId = 2;
            } catch (error) {
                console.error('설정 로드 오류:', error);
            }
        }

        // 자주 방문자 데이터 로드 (로컬 스토리지)
        const savedFrequentVisitors = localStorage.getItem('visitorSystemFrequentVisitors');
        if (savedFrequentVisitors) {
            try {
                this.frequentVisitors = JSON.parse(savedFrequentVisitors);
                console.log('로컬에서 자주 방문자 데이터 로드 완료:', this.frequentVisitors.length, '명');
            } catch (error) {
                console.error('자주 방문자 데이터 로드 오류:', error);
                this.frequentVisitors = [];
            }
        }
    }

    // 기숙사 체크인 모드 설정
    setDormitoryCheckinMode(mode) {
        this.dormitoryCheckinMode = mode;
        const registeredSection = document.getElementById('dormRegisteredSection');
        const manualSection = document.getElementById('dormManualSection');
        const selectBtn = document.getElementById('dormSelectRegistered');
        const manualBtn = document.getElementById('dormManualEntry');

        if (mode === 'registered') {
            registeredSection.classList.remove('hidden');
            manualSection.classList.add('hidden');
            selectBtn.classList.add('btn-primary');
            selectBtn.classList.remove('btn-outline');
            manualBtn.classList.remove('btn-primary');
            manualBtn.classList.add('btn-outline');
            this.loadFrequentVisitors();
        } else {
            registeredSection.classList.add('hidden');
            manualSection.classList.remove('hidden');
            manualBtn.classList.add('btn-primary');
            manualBtn.classList.remove('btn-outline');
            selectBtn.classList.remove('btn-primary');
            selectBtn.classList.add('btn-outline');
        }
    }

    // 자주 방문자 목록 로드
    loadFrequentVisitors() {
        const select = document.getElementById('dormRegisteredSelect');
        select.innerHTML = '<option value="">등록된 방문자를 선택해주세요</option>';
        
        this.frequentVisitors.forEach(visitor => {
            const option = document.createElement('option');
            option.value = visitor.id;
            option.textContent = visitor.name;
            select.appendChild(option);
        });
    }

    // 등록된 방문자 선택
    selectRegisteredVisitor(visitorId) {
        if (!visitorId) return;
        
        const visitor = this.frequentVisitors.find(v => v.id === visitorId);
        if (visitor) {
            // 선택된 방문자 정보로 체크인 폼 자동 채우기
            document.getElementById('dormLastName').value = visitor.lastName || '';
            document.getElementById('dormFirstName').value = visitor.firstName || '';
        }
    }

    // 자주 방문자 추가
    async addFrequentVisitor() {
        const lastNameInput = document.getElementById('frequentVisitorLastName');
        const firstNameInput = document.getElementById('frequentVisitorFirstName');
        const lastName = lastNameInput.value.trim();
        const firstName = firstNameInput.value.trim();
        
        if (!lastName || !firstName) {
            this.showNotification('오류', '성과 이름을 모두 입력해주세요', 'error');
            return;
        }

        const fullName = `${lastName} ${firstName}`;

        const visitor = {
            id: Date.now().toString(),
            name: fullName,
            lastName: lastName,
            firstName: firstName,
            addedDate: new Date().toISOString()
        };

        this.frequentVisitors.push(visitor);
        await this.saveFrequentVisitors();
        this.renderFrequentVisitorsList();
        
        lastNameInput.value = '';
        firstNameInput.value = '';
        this.showNotification('성공', `${fullName}님이 자주 방문자 목록에 추가되었습니다`, 'success');
    }

    // 자주 방문자 목록 렌더링
    renderFrequentVisitorsList() {
        console.log('=== 자주 방문자 목록 렌더링 시작 ===');
        console.log('현재 자주 방문자 수:', this.frequentVisitors.length);
        console.log('자주 방문자 데이터:', this.frequentVisitors);
        
        const container = document.getElementById('frequentVisitorsList');
        if (!container) {
            console.error('❌ frequentVisitorsList 컨테이너를 찾을 수 없습니다.');
            console.log('현재 페이지의 모든 요소들:', document.querySelectorAll('[id]'));
            return;
        }
        
        console.log('✅ frequentVisitorsList 컨테이너 찾음');
        container.innerHTML = '';

        if (this.frequentVisitors.length === 0) {
            console.log('📝 자주 방문자가 없어서 빈 상태 메시지 표시');
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-users text-4xl text-gray-300 mb-4"></i>
                    <p>등록된 자주 방문자가 없습니다.</p>
                    <p class="text-sm text-gray-400 mt-2">위의 폼을 사용하여 자주 방문자를 추가해보세요.</p>
                </div>
            `;
            return;
        }

        console.log('📝 자주 방문자 카드 생성 시작');
        this.frequentVisitors.forEach((visitor, index) => {
            console.log(`자주 방문자 ${index + 1} 렌더링:`, visitor);
            const visitorCard = document.createElement('div');
            visitorCard.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
            visitorCard.innerHTML = `
                <div class="flex items-center space-x-3">
                    <i class="fas fa-user text-primary"></i>
                    <span class="font-medium">${visitor.name || '이름 없음'}</span>
                    <span class="text-sm text-gray-500">(${visitor.lastName || ''} ${visitor.firstName || ''})</span>
                </div>
                <button onclick="window.visitorSystem.removeFrequentVisitor('${visitor.id}')" 
                        class="btn btn-sm btn-error btn-outline">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(visitorCard);
            console.log(`자주 방문자 ${index + 1} 카드 추가 완료`);
        });
        
        console.log('=== 자주 방문자 목록 렌더링 완료 ===');
    }

    // 자주 방문자 삭제
    async removeFrequentVisitor(visitorId) {
        this.frequentVisitors = this.frequentVisitors.filter(v => v.id !== visitorId);
        await this.saveFrequentVisitors();
        this.renderFrequentVisitorsList();
        this.showNotification('성공', '자주 방문자가 삭제되었습니다', 'success');
    }

    // 자주 방문자 데이터 저장 (Supabase로만)
    async saveFrequentVisitors() {
        if (window.supabaseClient && window.supabaseClient.config.sync.enabled) {
            try {
                await window.supabaseClient.syncFrequentVisitors();
                console.log('Supabase에 자주 방문자 데이터 저장 완료');
            } catch (error) {
                console.error('Supabase에 자주 방문자 데이터 저장 실패:', error);
            }
        }
    }

    // 초기 설정 가이드 표시
    showInitialSetupGuide() {
        // 이미 설정이 완료되었는지 확인
        const hasSetup = localStorage.getItem('visitorSystemSetupComplete');
        if (hasSetup) return;

        // 위치가 기본값인지 확인
        const isDefaultLocation = this.locations.some(loc => 
            (loc.lat === 37.566500 && loc.lng === 126.978000) ||
            (loc.lat === 37.551200 && loc.lng === 126.988200)
        );

        // 처음 사용 팝업 제거됨
    }

    // 설정 완료 표시
    markSetupComplete() {
        localStorage.setItem('visitorSystemSetupComplete', 'true');
    }

    // 터치 제스처 설정 (태블릿 최적화)
    setupTouchGestures() {
        let startX, startY, startTime;
        
        // 터치 시작
        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();
        }, { passive: true });
        
        // 터치 종료
        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            const endTime = Date.now();
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            const diffTime = endTime - startTime;
            
            // 스와이프 감지 (300ms 이내, 50px 이상 이동)
            if (diffTime < 300) {
                const absDiffX = Math.abs(diffX);
                const absDiffY = Math.abs(diffY);
                
                // 좌우 스와이프 (체크인/체크아웃 섹션 전환)
                if (absDiffX > absDiffY && absDiffX > 50) {
                    if (diffX > 0) {
                        // 왼쪽 스와이프 - 체크인 섹션으로
                        if (this.activeSection === 'checkout') {
                            this.toggleCheckoutSection();
                            this.toggleCheckinSection();
                        }
                    } else {
                        // 오른쪽 스와이프 - 체크아웃 섹션으로
                        if (this.activeSection === 'checkin') {
                            this.toggleCheckinSection();
                            this.toggleCheckoutSection();
                        }
                    }
                }
                
                // 아래 스와이프 (메인으로 돌아가기)
                if (absDiffY > absDiffX && diffY > 50) {
                    if (this.activeSection) {
                        this.backToMain();
                    }
                }
            }
            
            // 초기화
            startX = startY = null;
        }, { passive: true });
        
        // 더블 탭으로 새로고침
        let lastTap = 0;
        document.addEventListener('touchend', (e) => {
            const currentTime = Date.now();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                // 더블 탭 감지
                this.getCurrentLocation();
                this.updateVisitorCounts();
            }
            lastTap = currentTime;
        }, { passive: true });
    }

    // 온라인 상태 모니터링 설정
    setupOnlineStatusMonitoring() {
        // 온라인/오프라인 상태 변경 감지
        window.addEventListener('online', () => {
            this.showNotification('연결 복구', '인터넷 연결이 복구되었습니다. 데이터를 동기화합니다.', 'success');
            this.handleOnlineStatus();
        });

        window.addEventListener('offline', () => {
            this.showNotification('오프라인 모드', '인터넷 연결이 끊어졌습니다. 오프라인 모드로 작동합니다.', 'warning');
        });

        // 주기적으로 연결 상태 확인 (5분마다)
        setInterval(() => {
            if (navigator.onLine) {
                this.handleOnlineStatus();
            }
        }, 300000); // 5분
    }

    // Supabase 연결 상태 확인
    async checkSupabaseConnection() {
        console.log('=== Supabase 연결 상태 확인 ===');
        
        if (!window.supabaseClient) {
            console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다.');
            return;
        }
        
        if (!window.supabaseClient.client) {
            console.error('❌ Supabase 클라이언트가 연결되지 않았습니다.');
            return;
        }
        
        console.log('✅ Supabase 클라이언트 연결됨');
        console.log('📊 동기화 설정:', window.supabaseClient.config.sync);
        
        // 연결 테스트
        try {
            const { data, error } = await window.supabaseClient.client
                .from('frequent_visitors')
                .select('count')
                .limit(1);
            
            if (error) {
                console.error('❌ Supabase 테이블 접근 오류:', error);
            } else {
                console.log('✅ frequent_visitors 테이블 접근 성공');
            }
        } catch (err) {
            console.error('❌ Supabase 연결 테스트 실패:', err);
        }
        
        // 현재 로컬 데이터 확인
        console.log('📝 로컬 자주 방문자 수:', this.frequentVisitors.length);
        console.log('💾 로컬 스토리지 키:', window.supabaseClient.config.storageKeys.frequentVisitors);
        
        // Supabase에서 데이터 로드 시도
        if (window.supabaseClient.config.sync.enabled) {
            console.log('🔄 Supabase에서 데이터 로드 시도...');
            try {
                await window.supabaseClient.loadFromDatabase();
                console.log('✅ Supabase에서 데이터 로드 완료');
            } catch (err) {
                console.error('❌ Supabase 데이터 로드 실패:', err);
            }
        }
        
        console.log('=== Supabase 연결 상태 확인 완료 ===');
    }
}

// 페이지 로드 시 시스템 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== 시스템 초기화 시작 ===');
    
    // 시스템 객체 생성
    window.visitorSystem = new VisitorManagementSystem();
    
    // Supabase 클라이언트가 준비되면 데이터 로드
    const checkSupabaseAndLoad = () => {
        if (window.supabaseClient && window.supabaseClient.client) {
            console.log('Supabase 클라이언트 준비됨, 데이터 로드 시작');
            window.visitorSystem.loadDataFromSupabase();
        } else {
            console.log('Supabase 클라이언트 대기 중...');
            setTimeout(checkSupabaseAndLoad, 100);
        }
    };
    
    // 즉시 체크 시작
    checkSupabaseAndLoad();
    
    console.log('=== 시스템 초기화 완료 ===');
});
