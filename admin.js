// 관리자 모드 JavaScript
class AdminSystem {
    constructor() {
        this.currentVisitors = [];
        this.visitLogs = [];
        this.locations = [];
        this.nextLocationId = 1;
        this.currentLocation = null;
        this.frequentVisitors = [];
        
        this.init();
    }

    async init() {
        // 로그인 상태 확인
        if (!this.checkLoginStatus()) {
            this.showLoginModal();
            return;
        }
        
        await this.loadData();
        this.updateVisitorCounts();
        this.renderLocationList();
        this.updateVisitorList();
        this.updateLogList();
        this.renderFrequentVisitorsList();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 새로고침 버튼
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshData();
        });

        // 닫기 버튼 (로그아웃)
        document.getElementById('closeAdminBtn').addEventListener('click', () => {
            this.logout();
        });

        // 위치 관리
        document.getElementById('addLocationBtn').addEventListener('click', () => {
            this.addNewLocation();
        });

        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettings();
        });



        // 자주 방문자 관리
        document.getElementById('addFrequentVisitorBtn').addEventListener('click', () => {
            this.addFrequentVisitor();
        });

        // 로그 필터
        document.getElementById('logCategoryFilter').addEventListener('change', () => {
            this.filterLogs();
        });

        document.getElementById('logVisitorSearch').addEventListener('input', () => {
            this.filterLogs();
        });

        document.getElementById('logLocationSearch').addEventListener('input', () => {
            this.filterLogs();
        });

        document.getElementById('logStartDate').addEventListener('change', () => {
            this.filterLogs();
        });

        document.getElementById('logEndDate').addEventListener('change', () => {
            this.filterLogs();
        });

        document.getElementById('logPurposeFilter').addEventListener('change', () => {
            this.filterLogs();
        });

        document.getElementById('logTimeFilter').addEventListener('change', () => {
            this.filterLogs();
        });

        document.getElementById('logSortFilter').addEventListener('change', () => {
            this.filterLogs();
        });

        document.getElementById('logLimitFilter').addEventListener('change', () => {
            this.filterLogs();
        });

        // 필터 버튼들
        document.getElementById('applyFiltersBtn').addEventListener('click', () => {
            this.filterLogs();
        });

        document.getElementById('clearFiltersBtn').addEventListener('click', () => {
            this.clearFilters();
        });

        // 엑셀 다운로드
        document.getElementById('exportLogBtn').addEventListener('click', () => {
            this.exportLogs();
        });

        // 알림 모달
        document.getElementById('notificationOk').addEventListener('click', () => {
            this.hideNotification();
        });

        // 모달 외부 클릭으로 닫기
        document.getElementById('notificationModal').addEventListener('click', (e) => {
            if (e.target.id === 'notificationModal') {
                this.hideNotification();
            }
        });

        // 로그인 이벤트 리스너는 showLoginModal에서 동적으로 설정
    }

    // 데이터 새로고침
    async refreshData() {
        await this.loadData();
        this.updateVisitorCounts();
        this.updateVisitorList();
        this.updateLogList();
        this.renderFrequentVisitorsList();
        this.showNotification('새로고침', '데이터가 새로고침되었습니다.', 'success');
    }

    // 로그인 상태 확인
    checkLoginStatus() {
        return localStorage.getItem('adminLoggedIn') === 'true';
    }

    // 로그인 모달 표시
    showLoginModal() {
        document.getElementById('adminLoginModal').classList.add('modal-open');
        document.getElementById('adminMainContent').classList.add('hidden');
        
        // 오류 메시지 숨기기
        this.hideLoginError();
        
        // 즉시 이벤트 리스너 설정
        this.setupLoginEventListeners();
        
        // 포커스 설정
        setTimeout(() => {
            const passwordInput = document.getElementById('adminPassword');
            if (passwordInput) {
                passwordInput.focus();
            }
        }, 100);
    }

    // 로그인 이벤트 리스너 설정
    setupLoginEventListeners() {
        const passwordInput = document.getElementById('adminPassword');
        const loginBtn = document.getElementById('adminLoginBtn');
        
        if (passwordInput) {
            // 기존 이벤트 리스너 제거
            passwordInput.removeEventListener('keypress', this.handleLoginKeypress);
            passwordInput.removeEventListener('keydown', this.handleLoginKeydown);
            
            // Enter 키 이벤트 리스너
            this.handleLoginKeypress = (e) => {
                console.log('키 입력 감지:', e.key);
                if (e.key === 'Enter') {
                    e.preventDefault();
                    console.log('Enter 키 감지됨');
                    this.handleLogin();
                }
            };
            
            this.handleLoginKeydown = (e) => {
                console.log('키 다운 감지:', e.key);
                if (e.key === 'Enter') {
                    e.preventDefault();
                    console.log('Enter 키 다운 감지됨');
                    this.handleLogin();
                }
            };
            
            passwordInput.addEventListener('keypress', this.handleLoginKeypress);
            passwordInput.addEventListener('keydown', this.handleLoginKeydown);
        }
        
        if (loginBtn) {
            // 기존 이벤트 리스너 제거
            loginBtn.removeEventListener('click', this.handleLoginClick);
            
            // 클릭 이벤트 리스너
            this.handleLoginClick = (e) => {
                e.preventDefault();
                console.log('로그인 버튼 클릭됨');
                this.handleLogin();
            };
            
            loginBtn.addEventListener('click', this.handleLoginClick);
        }
    }

    // 로그인 처리
    handleLogin() {
        console.log('=== 로그인 처리 시작 ===');
        console.log('this 객체:', this);
        console.log('window.adminManager:', window.adminManager);
        
        const passwordInput = document.getElementById('adminPassword');
        console.log('비밀번호 입력 필드:', passwordInput);
        
        if (!passwordInput) {
            console.error('비밀번호 입력 필드를 찾을 수 없습니다');
            alert('비밀번호 입력 필드를 찾을 수 없습니다');
            return;
        }
        
        const password = passwordInput.value;
        const correctPassword = 'admin123'; // 기본 비밀번호
        
        console.log('입력된 비밀번호:', password);
        console.log('비밀번호 길이:', password.length);
        console.log('올바른 비밀번호:', correctPassword);
        
        if (password === correctPassword) {
            console.log('✅ 로그인 성공');
            localStorage.setItem('adminLoggedIn', 'true');
            this.hideLoginModal();
            this.showMainContent();
        } else {
            console.log('❌ 로그인 실패');
            this.showLoginError();
        }
        
        console.log('=== 로그인 처리 완료 ===');
    }

    // 테스트 함수
    testLogin() {
        console.log('테스트 로그인 함수 호출됨');
        alert('테스트 로그인 함수가 호출되었습니다!');
    }

    // 로그인 모달 숨기기
    hideLoginModal() {
        document.getElementById('adminLoginModal').classList.remove('modal-open');
        this.hideLoginError();
        document.getElementById('adminPassword').value = '';
    }

    // 메인 콘텐츠 표시
    showMainContent() {
        console.log('메인 콘텐츠 표시 시작');
        
        const mainContent = document.getElementById('adminMainContent');
        if (!mainContent) {
            console.error('메인 콘텐츠 요소를 찾을 수 없습니다');
            return;
        }
        
        mainContent.classList.remove('hidden');
        console.log('메인 콘텐츠 표시됨');
        
        // 데이터 로드 및 화면 업데이트
        this.loadData().then(() => {
            console.log('데이터 로드 완료');
            this.updateVisitorCounts();
            this.renderLocationList();
            this.updateVisitorList();
            this.updateLogList();
            this.renderFrequentVisitorsList();
            console.log('모든 화면 업데이트 완료');
        }).catch(error => {
            console.error('데이터 로드 오류:', error);
        });
    }

    // 로그인 오류 표시
    showLoginError() {
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.style.display = 'block';
            console.log('오류 메시지 표시됨');
        }
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }

    // 로그인 오류 숨기기
    hideLoginError() {
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.style.display = 'none';
            console.log('오류 메시지 숨김');
        }
    }

    // 로그아웃
    logout() {
        localStorage.removeItem('adminLoggedIn');
        document.getElementById('adminMainContent').classList.add('hidden');
        this.showLoginModal();
    }

    // GPS 기반 자동 위치 감지
    async getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                },
                (error) => {
                    console.error('위치 오류:', error);
                    this.showNotification('위치 오류', 'GPS 위치를 확인할 수 없습니다.', 'error');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        } else {
            this.showNotification('GPS 오류', 'GPS를 지원하지 않는 브라우저입니다.', 'error');
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

    // 방문자 목록 업데이트
    updateVisitorList() {
        const container = document.getElementById('visitorList');
        container.innerHTML = '';

        if (this.currentVisitors.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <i class="fas fa-users text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">현재 체크인된 방문자가 없습니다.</p>
                </div>
            `;
            return;
        }

        this.currentVisitors.forEach(visitor => {
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
                        <h3 class="card-title text-lg">${visitor.fullName || visitor.name}</h3>
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
            locationCard.className = 'card bg-base-100 shadow-sm border border-gray-200 rounded-lg';
            locationCard.innerHTML = `
                <div class="card-body p-3">
                    <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center gap-2">
                            <i class="fas ${location.category === 'dormitory' ? 'fa-home' : 'fa-industry'} text-lg ${location.category === 'dormitory' ? 'text-blue-500' : 'text-orange-500'}"></i>
                            <div>
                                <h5 class="card-title text-base font-bold text-gray-800">${location.name}</h5>
                                <span class="badge badge-sm ${location.category === 'dormitory' ? 'badge-primary' : 'badge-warning'}">
                                    ${location.category === 'dormitory' ? '기숙사' : '공장'}
                                </span>
                            </div>
                        </div>
                        <div class="flex gap-1">
                            <button class="btn btn-xs btn-ghost" onclick="adminSystem.editLocation(${index})" title="편집">
                                <i class="fas fa-edit text-sm"></i>
                            </button>
                            <button class="btn btn-xs btn-error btn-outline" onclick="adminSystem.deleteLocationById('${location.id}')" title="삭제">
                                <i class="fas fa-trash text-sm"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="form-control">
                            <label class="label py-1">
                                <span class="label-text text-sm font-medium">위치 이름</span>
                            </label>
                            <input type="text" id="locationName_${index}" value="${location.name}" 
                                   class="input input-bordered input-xs w-full" placeholder="예: 기숙사 1동, 공장 2동"
                                   oninput="adminSystem.updateLocationTitle(${index})">
                        </div>
                        <div class="form-control">
                            <label class="label py-1">
                                <span class="label-text text-sm font-medium">구분</span>
                            </label>
                            <select id="locationCategory_${index}" class="select select-bordered select-xs w-full"
                                    onchange="adminSystem.updateLocationTitle(${index})">
                                <option value="dormitory" ${location.category === 'dormitory' ? 'selected' : ''}>🏠 기숙사</option>
                                <option value="factory" ${location.category === 'factory' ? 'selected' : ''}>🏭 공장</option>
                            </select>
                        </div>
                        <div class="form-control">
                            <label class="label py-1">
                                <span class="label-text text-sm font-medium">위도</span>
                            </label>
                            <input type="number" id="locationLat_${index}" value="${location.lat}" step="0.000001" 
                                   class="input input-bordered input-xs w-full" placeholder="37.566500">
                        </div>
                        <div class="form-control">
                            <label class="label py-1">
                                <span class="label-text text-sm font-medium">경도</span>
                            </label>
                            <input type="number" id="locationLng_${index}" value="${location.lng}" step="0.000001" 
                                   class="input input-bordered input-xs w-full" placeholder="126.978000">
                        </div>
                        <div class="form-control md:col-span-2">
                            <button class="btn btn-primary btn-sm w-full" onclick="adminSystem.setCurrentLocation(${index})" 
                                    title="현재 위치로 위도/경도 설정">
                                <i class="fas fa-crosshairs mr-1"></i>
                                현재 위치로 설정
                            </button>
                        </div>
                        <div class="form-control md:col-span-2">
                            <label class="label py-1">
                                <span class="label-text text-sm font-medium">체크인 반경 (미터)</span>
                            </label>
                            <input type="number" id="locationRadius_${index}" value="${location.radius * 1000}" 
                                   class="input input-bordered input-xs w-full" placeholder="500" min="10" max="10000">
                            <label class="label py-0">
                                <span class="label-text-alt text-xs text-gray-500">이 반경 내에서만 체크인이 가능합니다</span>
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
            const newLocations = [];
            
            for (let i = 0; i < this.locations.length; i++) {
                const nameElement = document.getElementById(`locationName_${i}`);
                const categoryElement = document.getElementById(`locationCategory_${i}`);
                const latElement = document.getElementById(`locationLat_${i}`);
                const lngElement = document.getElementById(`locationLng_${i}`);
                const radiusElement = document.getElementById(`locationRadius_${i}`);
                
                // DOM 요소가 존재하지 않으면 건너뛰기
                if (!nameElement || !categoryElement || !latElement || !lngElement || !radiusElement) {
                    console.warn(`위치 ${i + 1}의 DOM 요소를 찾을 수 없습니다. 건너뜁니다.`);
                    continue;
                }
                
                const name = nameElement.value.trim();
                const category = categoryElement.value;
                const lat = parseFloat(latElement.value);
                const lng = parseFloat(lngElement.value);
                const radius = parseFloat(radiusElement.value);

                if (!name || isNaN(lat) || isNaN(lng) || isNaN(radius)) {
                    this.showNotification('입력 오류', `위치 ${i + 1}의 모든 필드를 올바르게 입력해주세요.`, 'error');
                    return;
                }

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
                    radius: radius / 1000
                });
            }

            this.locations = newLocations;
            localStorage.setItem('visitorSystemLocations', JSON.stringify(this.locations));

            // 데이터베이스에 동기화
            if (window.supabaseClient) {
                window.supabaseClient.syncLocations();
            }

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
            radius: 1.0 // 1000미터 = 1.0킬로미터 (더 넓은 범위)
        };
        
        this.locations.push(newLocation);
        localStorage.setItem('visitorSystemLocations', JSON.stringify(this.locations));
        
        // 데이터베이스에 동기화
        if (window.supabaseClient) {
            window.supabaseClient.syncLocations();
        }
        
        this.renderLocationList();
        this.showNotification('위치 추가', '새 위치가 추가되었습니다. 이름과 구분을 설정해주세요.', 'success');
    }

    // 위치 편집
    editLocation(index) {
        this.showNotification('편집 모드', '위치 정보를 수정하고 저장 버튼을 눌러주세요.', 'info');
    }

    // 위치 삭제 (ID 기반)
    async deleteLocationById(locationId) {
        if (this.locations.length <= 1) {
            this.showNotification('삭제 불가', '최소 하나의 위치는 남겨두어야 합니다.', 'error');
            return;
        }

        // ID로 위치 찾기
        const locationIndex = this.locations.findIndex(loc => loc.id === locationId);
        if (locationIndex === -1) {
            this.showNotification('오류', '삭제할 위치를 찾을 수 없습니다.', 'error');
            return;
        }

        const location = this.locations[locationIndex];
        if (confirm(`"${location.name}" 위치를 삭제하시겠습니까?`)) {
            try {
                // 데이터베이스에서 먼저 삭제
                let dbDeleteSuccess = true;
                if (window.supabaseClient) {
                    dbDeleteSuccess = await window.supabaseClient.deleteLocation(location.id);
                }
                
                if (dbDeleteSuccess) {
                    // localStorage에서 삭제
                    this.locations.splice(locationIndex, 1);
                    localStorage.setItem('visitorSystemLocations', JSON.stringify(this.locations));
                    
                    // UI 다시 렌더링
                    this.renderLocationList();
                    this.showNotification('위치 삭제', '위치가 삭제되었습니다.', 'success');
                } else {
                    this.showNotification('오류', '데이터베이스에서 위치 삭제에 실패했습니다.', 'error');
                }
                
            } catch (error) {
                console.error('위치 삭제 오류:', error);
                this.showNotification('오류', '위치 삭제 중 오류가 발생했습니다.', 'error');
            }
        }
    }

    // 위치 삭제 (인덱스 기반 - 호환성을 위해 유지)
    async deleteLocation(index) {
        if (this.locations.length <= 1) {
            this.showNotification('삭제 불가', '최소 하나의 위치는 남겨두어야 합니다.', 'error');
            return;
        }

        // 인덱스 유효성 검사
        if (index < 0 || index >= this.locations.length) {
            this.showNotification('오류', '유효하지 않은 위치 인덱스입니다.', 'error');
            return;
        }

        const location = this.locations[index];
        await this.deleteLocationById(location.id);
    }

    // 현재 위치로 좌표 설정
    setCurrentLocation(index) {
        if (!navigator.geolocation) {
            this.showNotification('GPS 오류', 'GPS를 지원하지 않는 브라우저입니다.', 'error');
            return;
        }

        this.showNotification('위치 감지 중...', '현재 위치를 가져와서 위도와 경도를 설정합니다.', 'info');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                const latElement = document.getElementById(`locationLat_${index}`);
                const lngElement = document.getElementById(`locationLng_${index}`);
                
                if (latElement && lngElement) {
                    latElement.value = lat.toFixed(6);
                    lngElement.value = lng.toFixed(6);
                    this.showNotification('위치 설정 완료', `위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)}`, 'success');
                } else {
                    this.showNotification('오류', '위치 입력 필드를 찾을 수 없습니다.', 'error');
                }
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
            iconElement.className = `fas ${newCategory === 'dormitory' ? 'fa-home' : 'fa-industry'} text-lg ${newCategory === 'dormitory' ? 'text-blue-500' : 'text-orange-500'}`;
        }
    }


    // 두 좌표 간의 거리 계산 (킬로미터)
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
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
        console.log('=== 관리자 자주 방문자 목록 렌더링 시작 ===');
        console.log('현재 자주 방문자 수:', this.frequentVisitors.length);
        console.log('자주 방문자 데이터:', this.frequentVisitors);
        
        const container = document.getElementById('frequentVisitorsList');
        if (!container) {
            console.error('❌ frequentVisitorsList 컨테이너를 찾을 수 없습니다.');
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
                <button onclick="adminSystem.removeFrequentVisitor('${visitor.id}')" 
                        class="btn btn-sm btn-error btn-outline">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(visitorCard);
            console.log(`자주 방문자 ${index + 1} 카드 추가 완료`);
        });
        
        console.log('=== 관리자 자주 방문자 목록 렌더링 완료 ===');
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

    // 로그 목록 업데이트
    updateLogList() {
        const container = document.getElementById('logList');
        container.innerHTML = '';

        const filteredLogs = this.getFilteredLogs();
        
        // 디버깅을 위한 로그 출력
        console.log('Total logs:', this.visitLogs.length);
        console.log('Filtered logs:', filteredLogs.length);
        console.log('Sample log:', filteredLogs[0]);
        console.log('All logs:', this.visitLogs);

        if (filteredLogs.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-clipboard-list text-4xl mb-4"></i>
                    <p>표시할 로그가 없습니다.</p>
                    <p class="text-sm text-gray-400 mt-2">총 ${this.visitLogs.length}개의 로그가 있습니다.</p>
                </div>
            `;
            return;
        }

        // 컬럼 헤더 추가
        const header = document.createElement('div');
        header.className = 'flex items-center p-3 bg-gray-100 border-b-2 border-gray-300 font-semibold text-gray-700 sticky top-0 z-10';
        header.innerHTML = `
            <div class="flex items-center space-x-4 flex-1">
                <div class="flex items-center space-x-2 w-48">
                    <i class="fas fa-user text-gray-500"></i>
                    <div class="text-center">
                        <div>Visitor</div>
                        <div class="text-xs text-gray-500">(방문자)</div>
                    </div>
                </div>
                <div class="flex items-center space-x-2 w-32">
                    <i class="fas fa-tag text-gray-500"></i>
                    <div class="text-center">
                        <div>Category</div>
                        <div class="text-xs text-gray-500">(카테고리)</div>
                    </div>
                </div>
                <div class="flex items-center space-x-2 w-32">
                    <i class="fas fa-info-circle text-gray-500"></i>
                    <div class="text-center">
                        <div>Action</div>
                        <div class="text-xs text-gray-500">(액션)</div>
                    </div>
                </div>
                <div class="flex items-center space-x-2 w-40">
                    <i class="fas fa-map-marker-alt text-gray-500"></i>
                    <div class="text-center">
                        <div>Location</div>
                        <div class="text-xs text-gray-500">(위치)</div>
                    </div>
                </div>
                <div class="flex items-center space-x-2 w-40">
                    <i class="fas fa-clock text-gray-500"></i>
                    <div class="text-center">
                        <div>Time</div>
                        <div class="text-xs text-gray-500">(시간)</div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(header);

        filteredLogs.forEach((log, index) => {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-3 border-b border-gray-200 hover:bg-gray-50';
            
            const categoryText = log.category === 'dormitory' ? 'Dormitory (기숙사)' : 'Factory (공장)';
            const locationName = log.locationName || (log.category === 'dormitory' ? 'Dormitory (기숙사)' : 'Factory (공장)');
            const visitorName = log.name || log.fullName || log.visitorName || `${log.lastName || ''} ${log.firstName || ''}`.trim() || 'Unknown Visitor';
            
            // 액션 상태 표시
            let statusText = '';
            let statusColor = '';
            if (log.action === 'checkin') {
                statusText = 'Check In (체크인)';
                statusColor = 'badge-success';
            } else if (log.action === 'checkout') {
                statusText = 'Check Out (체크아웃)';
                statusColor = 'badge-warning';
            } else {
                statusText = 'Unknown (알 수 없음)';
                statusColor = 'badge-neutral';
            }
            
            // 시간 처리
            const timestamp = log.timestamp ? this.formatTime(log.timestamp) : '-';
            const checkinTime = log.checkinTime ? this.formatTime(log.checkinTime) : '-';
            const checkoutTime = log.checkoutTime ? this.formatTime(log.checkoutTime) : '-';

            item.innerHTML = `
                <div class="flex items-center space-x-4 flex-1">
                    <div class="flex items-center space-x-2 w-48">
                        <i class="fas ${log.category === 'dormitory' ? 'fa-home' : 'fa-industry'} ${log.category === 'dormitory' ? 'text-blue-500' : 'text-orange-500'}"></i>
                        <span class="font-semibold text-gray-900 truncate">${visitorName}</span>
                    </div>
                    <div class="w-32">
                        <span class="badge badge-sm ${log.category === 'dormitory' ? 'badge-primary' : 'badge-warning'}">
                            ${categoryText}
                        </span>
                    </div>
                    <div class="w-32">
                        <span class="badge badge-sm ${statusColor}">
                            ${statusText}
                        </span>
                    </div>
                    <div class="text-sm text-gray-600 w-40 truncate">
                        <i class="fas fa-map-marker-alt mr-1"></i>
                        ${locationName}
                    </div>
                    <div class="text-sm text-gray-600 w-40">
                        <i class="fas fa-clock mr-1"></i>
                        ${timestamp}
                    </div>
                </div>
            `;
            
            container.appendChild(item);
        });
        
        // 로그 개수 업데이트
        this.updateLogCount();
    }

    // 필터된 로그 가져오기 (방문자별 그룹화)
    getFilteredLogs() {
        let logs = [...this.visitLogs];
        
        // 카테고리 필터
        const categoryFilter = document.getElementById('logCategoryFilter').value;
        if (categoryFilter !== 'all') {
            logs = logs.filter(log => log.category === categoryFilter);
        }
        
        // 방문자 검색 필터
        const visitorSearch = document.getElementById('logVisitorSearch').value.toLowerCase().trim();
        if (visitorSearch) {
            logs = logs.filter(log => 
                log.name.toLowerCase().includes(visitorSearch) ||
                (log.lastName && log.lastName.toLowerCase().includes(visitorSearch)) ||
                (log.firstName && log.firstName.toLowerCase().includes(visitorSearch))
            );
        }
        
        // 위치 검색 필터
        const locationSearch = document.getElementById('logLocationSearch').value.toLowerCase().trim();
        if (locationSearch) {
            logs = logs.filter(log => {
                const locationName = log.locationName || (log.category === 'dormitory' ? '기숙사' : '공장');
                return locationName.toLowerCase().includes(locationSearch);
            });
        }
        
        // 날짜 범위 필터
        const startDate = document.getElementById('logStartDate').value;
        const endDate = document.getElementById('logEndDate').value;
        
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            logs = logs.filter(log => new Date(log.timestamp) >= start);
        }
        
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            logs = logs.filter(log => new Date(log.timestamp) <= end);
        }
        
        // 방문 목적 필터
        const purposeFilter = document.getElementById('logPurposeFilter').value;
        if (purposeFilter !== 'all') {
            logs = logs.filter(log => log.purpose === purposeFilter);
        }
        
        // 시간대 필터
        const timeFilter = document.getElementById('logTimeFilter').value;
        if (timeFilter !== 'all') {
            logs = logs.filter(log => {
                const hour = new Date(log.timestamp).getHours();
                switch (timeFilter) {
                    case 'morning': return hour >= 6 && hour < 12;
                    case 'afternoon': return hour >= 12 && hour < 18;
                    case 'evening': return hour >= 18 && hour < 24;
                    case 'night': return hour >= 0 && hour < 6;
                    default: return true;
                }
            });
        }
        
        // 정렬 (그룹화하지 않고 개별 로그 표시)
        const sortFilter = document.getElementById('logSortFilter').value;
        switch (sortFilter) {
            case 'newest':
                logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
            case 'oldest':
                logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                break;
            case 'name':
                logs.sort((a, b) => {
                    const nameA = a.name || a.fullName || `${a.lastName || ''} ${a.firstName || ''}`;
                    const nameB = b.name || b.fullName || `${b.lastName || ''} ${b.firstName || ''}`;
                    return nameA.localeCompare(nameB);
                });
                break;
            case 'location':
                logs.sort((a, b) => {
                    const locationA = a.locationName || (a.category === 'dormitory' ? '기숙사' : '공장');
                    const locationB = b.locationName || (b.category === 'dormitory' ? '기숙사' : '공장');
                    return locationA.localeCompare(locationB);
                });
                break;
        }
        
        // 개수 제한
        const limitFilter = document.getElementById('logLimitFilter').value;
        if (limitFilter !== 'all') {
            const limit = parseInt(limitFilter);
            return logs.slice(0, limit);
        }
        
        return logs;
    }

    // 방문자별로 로그 그룹화
    groupLogsByVisitor(logs) {
        const visitorMap = new Map();
        
        logs.forEach(log => {
            // 방문자 식별 키 생성
            const visitorKey = `${log.name || log.fullName || `${log.lastName || ''} ${log.firstName || ''}`}_${log.category}`;
            
            if (!visitorMap.has(visitorKey)) {
                visitorMap.set(visitorKey, {
                    visitorName: log.name || log.fullName || `${log.lastName || ''} ${log.firstName || ''}`,
                    category: log.category,
                    locationName: log.locationName,
                    company: log.company,
                    phone: log.phone,
                    purpose: log.purpose,
                    checkinTime: null,
                    checkoutTime: null,
                    checkinLog: null,
                    checkoutLog: null
                });
            }
            
            const visitor = visitorMap.get(visitorKey);
            
            if (log.action === 'checkin') {
                visitor.checkinTime = log.checkinTime || log.timestamp;
                visitor.checkinLog = log;
            } else if (log.action === 'checkout') {
                visitor.checkoutTime = log.checkoutTime || log.timestamp;
                visitor.checkoutLog = log;
            }
        });
        
        return Array.from(visitorMap.values());
    }

    // 로그 필터링
    filterLogs() {
        this.updateLogList();
        this.updateLogCount();
    }

    // 필터 초기화
    clearFilters() {
        document.getElementById('logCategoryFilter').value = 'all';
        document.getElementById('logVisitorSearch').value = '';
        document.getElementById('logLocationSearch').value = '';
        document.getElementById('logStartDate').value = '';
        document.getElementById('logEndDate').value = '';
        document.getElementById('logPurposeFilter').value = 'all';
        document.getElementById('logTimeFilter').value = 'all';
        document.getElementById('logSortFilter').value = 'newest';
        document.getElementById('logLimitFilter').value = '100';
        
        this.filterLogs();
        this.showNotification('필터 초기화', '모든 필터가 초기화되었습니다.', 'info');
    }

    // 로그 개수 업데이트
    updateLogCount() {
        const filteredLogs = this.getFilteredLogs();
        const totalLogs = this.visitLogs.length;
        const countDisplay = document.getElementById('logCountDisplay');
        
        if (countDisplay) {
            countDisplay.textContent = `총 ${filteredLogs.length}개의 로그가 있습니다 (전체 ${totalLogs}개 중)`;
        }
    }

    // 로그 엑셀 다운로드
    exportLogs() {
        const logs = this.getFilteredLogs();
        
        if (logs.length === 0) {
            this.showNotification('알림', '다운로드할 로그가 없습니다.', 'info');
            return;
        }
        
        const csvContent = this.convertToCSV(logs);
        
        // UTF-8 BOM 추가하여 한글 인코딩 문제 해결
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { 
            type: 'text/csv;charset=utf-8;' 
        });
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `visit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // URL 해제
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
        
        this.showNotification('다운로드 완료', `${logs.length}개의 로그가 엑셀 파일로 다운로드되었습니다.`, 'success');
    }

    // CSV 변환
    convertToCSV(logs) {
        const headers = [
            'Visitor Name (방문자 이름)',
            'Category (카테고리)', 
            'Location Name (위치명)',
            'Company (회사)',
            'Phone Number (전화번호)',
            'Visit Purpose (방문 목적)',
            'Check-in Time (체크인 시간)',
            'Check-out Time (체크아웃 시간)',
            'Duration (체류 시간)',
            'Timestamp (기록 시간)'
        ];
        
        const rows = logs.map(log => {
            const checkinTime = log.checkinTime ? this.formatTime(log.checkinTime) : '';
            const checkoutTime = log.checkoutTime ? this.formatTime(log.checkoutTime) : '';
            const duration = this.calculateDuration(log.checkinTime, log.checkoutTime);
            
            return [
                log.name || `${log.lastName || ''} ${log.firstName || ''}`.trim(),
                log.category === 'dormitory' ? 'Dormitory (기숙사)' : 'Factory (공장)',
                log.locationName || (log.category === 'dormitory' ? 'Dormitory (기숙사)' : 'Factory (공장)'),
                log.company || '',
                log.phone || '',
                log.purpose ? this.getPurposeText(log.purpose) : '',
                checkinTime,
                checkoutTime,
                duration,
                this.formatTime(log.timestamp)
            ];
        });
        
        return [headers, ...rows].map(row => 
            row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
    }
    
    // 체류 시간 계산
    calculateDuration(checkinTime, checkoutTime) {
        if (!checkinTime || !checkoutTime) {
            return 'N/A';
        }
        
        const checkin = new Date(checkinTime);
        const checkout = new Date(checkoutTime);
        const diffMs = checkout - checkin;
        
        if (diffMs < 0) {
            return 'N/A';
        }
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        if (hours > 0) {
            return `${hours}시간 ${minutes}분 ${seconds}초`;
        } else if (minutes > 0) {
            return `${minutes}분 ${seconds}초`;
        } else {
            return `${seconds}초`;
        }
    }

    // 알림 표시
    showNotification(title, message, type = 'info') {
        const icon = document.getElementById('notificationIcon');
        const titleElement = document.getElementById('notificationTitle');
        const messageElement = document.getElementById('notificationMessage');
        
        const icons = {
            'success': 'fas fa-check-circle text-success',
            'error': 'fas fa-exclamation-circle text-error',
            'warning': 'fas fa-exclamation-triangle text-warning',
            'info': 'fas fa-info-circle text-primary'
        };
        
        icon.className = icons[type] || icons.info;
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        document.getElementById('notificationModal').classList.add('modal-open');
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

    // 데이터 로드
    async loadData() {
        const savedVisitors = localStorage.getItem('visitorSystem_currentVisitors');
        const savedLogs = localStorage.getItem('visitorSystem_visitLogs');
        const savedLocations = localStorage.getItem('visitorSystemLocations');
        const savedFrequentVisitors = localStorage.getItem('visitorSystemFrequentVisitors');
        
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

        // 위치 데이터 로드 (데이터베이스 우선, 없으면 localStorage)
        if (window.supabaseClient) {
            try {
                await this.loadLocationsFromDatabase();
            } catch (error) {
                console.error('데이터베이스에서 위치 로드 실패, localStorage 사용:', error);
                this.loadLocationsFromLocalStorage();
            }
        } else {
            this.loadLocationsFromLocalStorage();
        }

        // 자주 방문자 데이터 로드 (Supabase에서만)
        console.log('=== 관리자 자주 방문자 데이터 로드 시작 ===');
        console.log('window.supabaseClient 존재:', !!window.supabaseClient);
        console.log('window.supabaseClient.client 존재:', !!(window.supabaseClient && window.supabaseClient.client));
        console.log('동기화 설정:', window.supabaseClient ? window.supabaseClient.config.sync : '없음');
        
        if (window.supabaseClient && window.supabaseClient.config.sync.enabled) {
            try {
                console.log('✅ Supabase에서 데이터 로드 시도...');
                await window.supabaseClient.loadFromDatabase();
                console.log('✅ Supabase에서 자주 방문자 데이터 로드 완료');
            } catch (error) {
                console.error('❌ Supabase에서 자주 방문자 데이터 로드 실패:', error);
            }
        } else {
            console.warn('⚠️ Supabase 클라이언트가 없거나 동기화가 비활성화되어 있습니다.');
        }
    }

    // 데이터베이스에서 위치 데이터 로드
    async loadLocationsFromDatabase() {
        if (!window.supabaseClient || !window.supabaseClient.client) return;
        
        const { data, error } = await window.supabaseClient.client
            .from('locations')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) {
            throw error;
        }
        
        if (data && data.length > 0) {
            this.locations = data.map(loc => ({
                id: loc.id,
                name: loc.name,
                category: loc.category,
                lat: parseFloat(loc.latitude),
                lng: parseFloat(loc.longitude),
                radius: parseFloat(loc.radius)
            }));
            
            // localStorage에도 저장
            localStorage.setItem('visitorSystemLocations', JSON.stringify(this.locations));
            
            this.nextLocationId = Math.max(...this.locations.map(loc => {
                const idNum = parseInt(loc.id.split('_')[1]);
                return isNaN(idNum) ? 0 : idNum;
            })) + 1;
        }
    }

    // localStorage에서 위치 데이터 로드
    loadLocationsFromLocalStorage() {
        const savedLocations = localStorage.getItem('visitorSystemLocations');
        if (savedLocations) {
            try {
                this.locations = JSON.parse(savedLocations);
                this.nextLocationId = Math.max(...this.locations.map(loc => {
                    const idNum = parseInt(loc.id.split('_')[1]);
                    return isNaN(idNum) ? 0 : idNum;
                })) + 1;
            } catch (error) {
                console.error('위치 설정 로드 오류:', error);
            }
        }
    }
}

// 페이지 로드 시 관리자 시스템 초기화
document.addEventListener('DOMContentLoaded', async () => {
    // Supabase 클라이언트 초기화를 기다림
    let retryCount = 0;
    const maxRetries = 10;
    
    while (!window.supabaseClient && retryCount < maxRetries) {
        console.log(`Supabase 클라이언트 초기화 대기 중... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 500));
        retryCount++;
    }
    
    if (window.supabaseClient) {
        console.log('Supabase 클라이언트 초기화 완료, 관리자 시스템 시작');
        window.adminSystem = new AdminSystem();
        window.adminManager = window.adminSystem; // 호환성을 위한 별칭
        console.log('AdminSystem 초기화 완료');
    } else {
        console.warn('Supabase 클라이언트 초기화 실패, 관리자 시스템을 로컬 모드로 시작');
        window.adminSystem = new AdminSystem();
        window.adminManager = window.adminSystem; // 호환성을 위한 별칭
        console.log('AdminSystem 초기화 완료 (로컬 모드)');
    }
});

