// Administrator System
class AdminSystem {
    constructor() {
        this.currentVisitors = [];
        this.visitLogs = [];
        this.locations = [];
        this.nextLocationId = 3;
        this.currentLocation = null;
        this.frequentVisitors = [];
        this.eventListenersSetup = false;
        
        this.init();
    }

    async init() {
        console.log('Admin system initialization started');
        
        // Set up event listeners first (only once)
        this.setupEventListeners();
        
        // Load data and show main content directly
        await this.loadData();
        this.updateVisitorCounts();
        this.renderLocationList();
        this.updateVisitorList();
        this.updateLogList();
        this.renderFrequentVisitorsList();
    }

    // Event listeners setup
    setupEventListeners() {
        if (this.eventListenersSetup) {
            console.log('Event listeners already setup, skipping...');
            return;
        }
        
        console.log('Setting up admin event listeners...');
        
        // Remove any existing listeners first
        this.removeAllEventListeners();
        
        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
            this.refreshData();
        });
        }

        // Close button (logout)
        const closeBtn = document.getElementById('closeAdminBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
            this.logout();
        });
        }

        // Location management
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

        // Frequent visitor management
        const addFrequentVisitorBtn = document.getElementById('addFrequentVisitorBtn');
        if (addFrequentVisitorBtn) {
            addFrequentVisitorBtn.addEventListener('click', () => {
            this.addFrequentVisitor();
        });
        }

        // Log filters
        const filterElements = [
            'logCategoryFilter', 'logVisitorSearch', 'logLocationSearch', 
            'logPurposeFilter', 'logStartDate', 'logEndDate', 
            'logTimeFilter', 'logSortFilter'
        ];
        
        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    console.log(`Filter changed: ${id} = ${element.value}`);
                    this.updateLogList();
                });
                if (element.type === 'text' || element.type === 'date') {
                    element.addEventListener('input', () => {
                        console.log(`Filter input: ${id} = ${element.value}`);
                        this.updateLogList();
                    });
                }
            }
        });

        // Filter buttons
        const applyFiltersBtn = document.getElementById('applyFiltersBtn');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.updateLogList();
            });
        }

        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
            this.clearFilters();
        });
        }

        const exportLogBtn = document.getElementById('exportLogBtn');
        if (exportLogBtn) {
            exportLogBtn.addEventListener('click', () => {
            this.exportLogs();
        });
        }


        // Notification modal
        const notificationOk = document.getElementById('notificationOk');
        if (notificationOk) {
            notificationOk.addEventListener('click', () => {
                this.hideNotification();
            });
        }

        this.eventListenersSetup = true;
        console.log('Admin event listeners setup completed');
    }

    // Remove all event listeners to prevent duplicates
    removeAllEventListeners() {
        // Clone and replace elements to remove all event listeners
        const elementsToClean = ['refreshBtn', 'closeAdminBtn'];
        
        elementsToClean.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
            }
        });
    }

    logout() {
        // Go back to main page
        window.location.href = 'index.html';
    }

    // Data management
    async loadData() {
        console.log('Loading admin data...');
        console.log('Initial locations:', this.locations);
        
        // Wait for Supabase client to be ready (with shorter timeout)
        let attempts = 0;
        const maxAttempts = 30; // 3 seconds
        
        while (attempts < maxAttempts) {
            if (window.supabaseClient && window.supabaseClient.isInitialized && window.supabaseClient.client) {
                try {
                    await window.supabaseClient.loadFromDatabase();
                    console.log('Admin data loaded from Supabase successfully');
                    console.log('Locations after Supabase load:', this.locations);
                    return;
                } catch (error) {
                    console.error('Failed to load admin data from Supabase:', error);
                    // Continue with default data if Supabase fails
                    console.log('Using default data due to Supabase error');
                    return;
                }
            }
            console.log(`Waiting for Supabase client... attempt ${attempts + 1}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.log('Supabase not available within timeout, using default data');
        
        // Load data from local storage as fallback first
        this.loadDataFromLocal();
        
        // Load default locations if none exist after local storage load
        if (this.locations.length === 0) {
            this.locations = [
                {
                    id: 'location_1',
                    name: '기숙사 A동',
                    category: 'dormitory',
                    lat: 37.566500,
                    lng: 126.978000,
                    radius: 0.1
                },
                {
                    id: 'location_2',
                    name: '공장 본관',
                    category: 'factory',
                    lat: 37.567000,
                    lng: 126.979000,
                    radius: 0.2
                }
            ];
            this.nextLocationId = 3;
            console.log('Loaded default locations:', this.locations);
        }
        
        // Ensure renderLocationList is called after loading
        if (typeof this.renderLocationList === 'function') {
            this.renderLocationList();
        }
    }

    loadDataFromLocal() {
        console.log('Loading data from local storage...');
        
        const savedVisitors = localStorage.getItem('currentVisitors');
        const savedLogs = localStorage.getItem('visitLogs');
        const savedLocations = localStorage.getItem('locations');
        const savedFrequentVisitors = localStorage.getItem('frequentVisitors');
        
        if (savedVisitors) {
            this.currentVisitors = JSON.parse(savedVisitors);
        }
        
        if (savedLogs) {
            this.visitLogs = JSON.parse(savedLogs);
        }
        
        // Locations are always loaded from Supabase, not local storage
        
        if (savedFrequentVisitors) {
            this.frequentVisitors = JSON.parse(savedFrequentVisitors);
        }
    }

    async refreshData() {
        console.log('Refreshing data...');
        await this.loadData();
        this.updateVisitorCounts();
        this.updateVisitorList();
        this.updateLogList();
        this.renderLocationList();
        this.renderFrequentVisitorsList();
        this.showNotification('Data Refreshed', 'All data has been refreshed successfully.', 'success');
    }

    // Visitor management
    updateVisitorCounts() {
        const dormitoryCount = this.currentVisitors.filter(v => v.category === 'dormitory').length;
        const factoryCount = this.currentVisitors.filter(v => v.category === 'factory').length;
        const totalCount = this.currentVisitors.length;

        const dormitoryCountEl = document.getElementById('dormitoryCount');
        const factoryCountEl = document.getElementById('factoryCount');
        const totalCountEl = document.getElementById('totalCount');

        if (dormitoryCountEl) dormitoryCountEl.textContent = dormitoryCount;
        if (factoryCountEl) factoryCountEl.textContent = factoryCount;
        if (totalCountEl) totalCountEl.textContent = totalCount;
    }

    updateVisitorList() {
        const container = document.getElementById('visitorList');
        if (!container) return;

        container.innerHTML = '';

        if (this.currentVisitors.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500">
                    <i class="fas fa-users text-4xl mb-4"></i>
                    <p>현재 체크인된 방문자가 없습니다.</p>
                </div>
            `;
            return;
        }

        this.currentVisitors.forEach(visitor => {
            const card = document.createElement('div');
            card.className = 'card bg-base-100 shadow-sm border';
            card.innerHTML = `
                <div class="card-body p-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="avatar placeholder">
                                <div class="bg-primary text-primary-content rounded-full w-12">
                                    <span class="text-xl">${visitor.fullName.charAt(0)}</span>
                        </div>
                    </div>
                            <div>
                                <h4 class="font-semibold">${visitor.fullName}</h4>
                                <p class="text-sm text-gray-500">
                                    ${visitor.category === 'dormitory' ? '기숙사' : '공장'} • 
                                    ${this.formatTime(visitor.checkinTime)}
                                </p>
                            </div>
                        </div>
                        <div class="badge ${visitor.category === 'dormitory' ? 'badge-primary' : 'badge-warning'}">
                            ${visitor.category === 'dormitory' ? '기숙사' : '공장'}
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // Log management
    updateLogList() {
        const container = document.getElementById('logList');
        const countDisplay = document.getElementById('logCountDisplay');
        if (!container) return;

        const filteredLogs = this.getFilteredLogs();
        container.innerHTML = '';

        if (filteredLogs.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-gray-500">
                        <i class="fas fa-clipboard-list text-4xl mb-4"></i>
                        <p>표시할 기록이 없습니다.</p>
                    </td>
                </tr>
            `;
            if (countDisplay) countDisplay.textContent = '총 0개 기록';
            return;
        }

        filteredLogs.forEach(log => {
            const logRow = document.createElement('tr');
            logRow.className = 'hover:bg-gray-50';
            
            const categoryText = log.category === 'dormitory' ? '기숙사' : '공장';
            const actionText = log.action === 'checkin' ? '체크인' : '체크아웃';
            const checkinTime = log.checkinTime ? this.formatTime(log.checkinTime) : '-';
            const checkoutTime = log.checkoutTime ? this.formatTime(log.checkoutTime) : '-';

            logRow.innerHTML = `
                <td class="font-semibold">${log.name || log.fullName || '알 수 없음'}</td>
                <td>
                    <span class="badge badge-sm ${log.category === 'dormitory' ? 'badge-primary' : 'badge-warning'}">
                        ${categoryText}
                    </span>
                </td>
                <td>
                    <span class="badge badge-sm ${log.action === 'checkin' ? 'badge-success' : 'badge-error'}">
                        ${actionText}
                    </span>
                </td>
                <td class="text-sm">${checkinTime}</td>
                <td class="text-sm">${checkoutTime}</td>
                <td class="text-sm">${log.company || '-'}</td>
                <td class="text-sm">${log.phone || '-'}</td>
                <td class="text-sm">${log.purpose || '-'}</td>
            `;
            container.appendChild(logRow);
        });

        if (countDisplay) countDisplay.textContent = `총 ${filteredLogs.length}개 기록`;
    }

    getFilteredLogs() {
        let logs = [...this.visitLogs];
        
        console.log('Original logs count:', logs.length);
        
        const categoryFilter = document.getElementById('logCategoryFilter')?.value || 'all';
        const visitorSearch = document.getElementById('logVisitorSearch')?.value.toLowerCase() || '';
        const locationSearch = document.getElementById('logLocationSearch')?.value.toLowerCase() || '';
        const purposeFilter = document.getElementById('logPurposeFilter')?.value || 'all';
        const startDate = document.getElementById('logStartDate')?.value;
        const endDate = document.getElementById('logEndDate')?.value;
        const timeFilter = document.getElementById('logTimeFilter')?.value || 'all';
        const sortFilter = document.getElementById('logSortFilter')?.value || 'newest';
        
        console.log('Filter values:', {
            categoryFilter, visitorSearch, locationSearch, purposeFilter, 
            startDate, endDate, timeFilter, sortFilter
        });
        
        // Apply filters
        if (categoryFilter !== 'all') {
            logs = logs.filter(log => log.category === categoryFilter);
            console.log('After category filter:', logs.length);
        }
        
        if (visitorSearch) {
            logs = logs.filter(log => {
                const name = (log.name || log.fullName || '').toLowerCase();
                return name.includes(visitorSearch);
            });
            console.log('After visitor search:', logs.length);
        }
        
        if (locationSearch) {
            logs = logs.filter(log => {
                const location = (log.location || '').toLowerCase();
                return location.includes(locationSearch);
            });
            console.log('After location search:', logs.length);
        }
        
        if (purposeFilter !== 'all') {
            logs = logs.filter(log => log.purpose === purposeFilter);
            console.log('After purpose filter:', logs.length);
        }
        
        if (startDate) {
            const start = new Date(startDate);
            logs = logs.filter(log => new Date(log.timestamp) >= start);
            console.log('After start date filter:', logs.length);
        }
        
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            logs = logs.filter(log => new Date(log.timestamp) <= end);
            console.log('After end date filter:', logs.length);
        }
        
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
            console.log('After time filter:', logs.length);
        }
        
        // Sort
        switch (sortFilter) {
            case 'newest':
                logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
            case 'oldest':
                logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                break;
            case 'name':
                logs.sort((a, b) => (a.name || a.fullName || '').localeCompare(b.name || b.fullName || ''));
                break;
            case 'location':
                logs.sort((a, b) => (a.location || '').localeCompare(b.location || ''));
                break;
        }
        
        console.log('Final filtered logs count:', logs.length);
        return logs;
    }

    clearFilters() {
        const filterElements = [
            'logCategoryFilter', 'logVisitorSearch', 'logLocationSearch', 
            'logPurposeFilter', 'logStartDate', 'logEndDate', 
            'logTimeFilter', 'logSortFilter'
        ];
        
        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'text' || element.type === 'date') {
                    element.value = '';
                } else if (element.tagName === 'SELECT') {
                    element.selectedIndex = 0;
                }
            }
        });
        
        this.updateLogList();
    }

    exportLogs() {
        const logs = this.getFilteredLogs();
        const csvContent = this.convertToCSV(logs);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `visit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Export Complete', 'CSV file has been downloaded.', 'success');
    }

    convertToCSV(logs) {
        const headers = ['Visitor', 'Category', 'Action', 'Check In Time', 'Check Out Time', 'Company', 'Phone', 'Purpose'];
        const rows = logs.map(log => [
            log.name || log.fullName || '',
            log.category === 'dormitory' ? 'Dormitory' : 'Factory',
            log.action === 'checkin' ? 'Check In' : 'Check Out',
            log.checkinTime ? this.formatTime(log.checkinTime) : '',
            log.checkoutTime ? this.formatTime(log.checkoutTime) : '',
                log.company || '',
                log.phone || '',
            log.purpose || ''
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        
        return '\uFEFF' + csvContent; // Add BOM
    }

    // Location management
    renderLocationList() {
        console.log('renderLocationList called, locations:', this.locations);
        const container = document.getElementById('locationList');
        if (!container) {
            console.error('locationList container not found');
            return;
        }

        container.innerHTML = '';

        if (this.locations.length === 0) {
            console.log('No locations found, showing empty state');
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-map-marker-alt text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">등록된 위치가 없습니다.</p>
                    <p class="text-sm text-gray-400">Supabase에서 위치 데이터를 불러오는 중이거나 아직 등록된 위치가 없습니다.</p>
                    <button onclick="adminSystem.addNewLocation()" class="btn btn-primary btn-sm mt-4">
                        <i class="fas fa-plus mr-1"></i>
                        첫 번째 위치 추가
                    </button>
                </div>
            `;
            return;
        }

        console.log(`Rendering ${this.locations.length} locations`);

        this.locations.forEach((location, index) => {
            console.log(`Rendering location ${index}:`, location);
            const item = document.createElement('div');
            item.className = 'card bg-base-100 shadow-sm border';
            item.innerHTML = `
                <div class="card-body p-4">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-map-marker-alt text-primary"></i>
                            <h5 class="card-title text-base font-bold text-gray-800">${location.category === 'dormitory' ? '🏠' : '🏭'} ${location.name}</h5>
                            <span class="badge badge-sm ${location.category === 'dormitory' ? 'badge-primary' : 'badge-warning'}">
                                ${location.category === 'dormitory' ? '기숙사' : '공장'}
                            </span>
                        </div>
                        <div class="flex gap-1">
                            <button class="btn btn-xs btn-ghost" onclick="adminSystem.editLocation(${index})" title="편집">
                                <i class="fas fa-edit text-sm"></i>
                            </button>
                            <button class="btn btn-xs btn-error btn-outline" onclick="adminSystem.deleteLocation(${index})" title="삭제">
                                <i class="fas fa-trash text-sm"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="form-control">
                            <label class="label py-1">
                                <span class="label-text text-base font-semibold text-gray-800">위치 이름</span>
                            </label>
                            <input type="text" class="input input-bordered input-sm text-base" 
                                   value="${location.name}" 
                                   onchange="adminSystem.updateLocationField(${index}, 'name', this.value)">
                        </div>
                        <div class="form-control">
                            <label class="label py-1">
                                <span class="label-text text-base font-semibold text-gray-800">구분</span>
                            </label>
                            <select class="select select-bordered select-sm text-base" 
                                    onchange="adminSystem.updateLocationField(${index}, 'category', this.value)">
                                <option value="dormitory" ${location.category === 'dormitory' ? 'selected' : ''}>🏠 기숙사</option>
                                <option value="factory" ${location.category === 'factory' ? 'selected' : ''}>🏭 공장</option>
                            </select>
                        </div>
                        <div class="form-control">
                            <label class="label py-1">
                                <span class="label-text text-base font-semibold text-gray-800">위도</span>
                            </label>
                            <div class="flex gap-1">
                                <input type="number" class="input input-bordered input-sm flex-1 text-base" 
                                       value="${location.lat}" step="0.000001"
                                       onchange="adminSystem.updateLocationField(${index}, 'lat', parseFloat(this.value))">
                                <button class="btn btn-xs btn-outline" onclick="adminSystem.setCurrentLocation(${index})" title="현재 위치로 설정">
                                    <i class="fas fa-crosshairs"></i>
                                </button>
                            </div>
                        </div>
                        <div class="form-control">
                            <label class="label py-1">
                                <span class="label-text text-base font-semibold text-gray-800">경도</span>
                            </label>
                            <input type="number" class="input input-bordered input-sm text-base" 
                                   value="${location.lng}" step="0.000001"
                                   onchange="adminSystem.updateLocationField(${index}, 'lng', parseFloat(this.value))">
                        </div>
                        <div class="form-control">
                            <label class="label py-1">
                                <span class="label-text text-base font-semibold text-gray-800">반경 (km)</span>
                            </label>
                            <input type="number" class="input input-bordered input-sm text-base" 
                                   value="${location.radius}" step="0.1" min="0.1" max="10"
                                   onchange="adminSystem.updateLocationField(${index}, 'radius', parseFloat(this.value))">
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(item);
        });
    }

    addNewLocation() {
        const newLocation = {
            id: `location_${Date.now()}`,
            name: `새 위치 ${this.nextLocationId}`,
            category: 'dormitory',
            lat: 37.566500,
            lng: 126.978000,
            radius: 0.1
        };
        
        this.nextLocationId++;
        
        this.locations.push(newLocation);
        this.renderLocationList();
        
        // Sync with Supabase
        if (window.supabaseClient && window.supabaseClient.isInitialized && window.supabaseClient.client) {
            window.supabaseClient.syncLocations().catch(error => {
                console.error('Failed to sync location:', error);
            });
        }
        
        this.showNotification('위치 추가', '새 위치가 추가되었습니다. 이름과 구분을 설정해주세요.', 'success');
    }

    updateLocationField(index, field, value) {
        if (index >= 0 && index < this.locations.length) {
            this.locations[index][field] = value;
            
            // Sync with Supabase
            if (window.supabaseClient && window.supabaseClient.isInitialized && window.supabaseClient.client) {
                window.supabaseClient.syncLocations().catch(error => {
                    console.error('Failed to sync location update:', error);
                });
            }
        }
    }

    setCurrentLocation(index) {
        if (!navigator.geolocation) {
            this.showNotification('GPS 오류', 'GPS를 지원하지 않는 브라우저입니다.', 'error');
            return;
        }

        this.showNotification('위치 감지 중...', '현재 위치를 가져와서 위도와 경도를 설정합니다.', 'info');

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes cache
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                if (index >= 0 && index < this.locations.length) {
                    this.locations[index].lat = position.coords.latitude;
                    this.locations[index].lng = position.coords.longitude;
                    
                    // Re-render to update the input values
                    this.renderLocationList();
                    
                    // Sync with Supabase
                    if (window.supabaseClient && window.supabaseClient.isInitialized && window.supabaseClient.client) {
                        window.supabaseClient.syncLocations().catch(error => {
                            console.error('Failed to sync location update:', error);
                        });
                    }
                    
                    this.showNotification('위치 설정 완료', '현재 위치로 위도와 경도가 설정되었습니다.', 'success');
                }
            },
            (error) => {
                console.error('Location error:', error);
                let errorMessage = '위치를 가져올 수 없습니다.';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = '위치 접근이 거부되었습니다. 브라우저 설정을 확인해주세요.';
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
            options
        );
    }


    deleteLocation(index) {
        if (this.locations.length <= 1) {
            this.showNotification('삭제 불가', '최소 하나의 위치는 남겨두어야 합니다.', 'error');
            return;
        }

        const location = this.locations[index];
        if (confirm(`"${location.name}" 위치를 삭제하시겠습니까?`)) {
            this.locations.splice(index, 1);
            this.renderLocationList();
            
            // Sync with Supabase using individual delete
            if (window.supabaseClient && window.supabaseClient.isInitialized && window.supabaseClient.client) {
                this.deleteLocationFromSupabase(location.id).catch(error => {
                    console.error('Failed to delete location from Supabase:', error);
                    this.showNotification('삭제 경고', '위치가 로컬에서 삭제되었지만 Supabase 동기화에 실패했습니다.', 'warning');
                });
            }
            
            this.showNotification('위치 삭제', '위치가 삭제되었습니다.', 'success');
        }
    }

    async deleteLocationFromSupabase(locationId) {
        if (!window.supabaseClient || !window.supabaseClient.isInitialized || !window.supabaseClient.client) {
            return;
        }

        try {
            const { error } = await window.supabaseClient.client
                .from('locations')
                .delete()
                .eq('id', locationId);

            if (error) {
                throw error;
            }

            console.log(`Successfully deleted location ${locationId} from Supabase`);
        } catch (error) {
            console.error('Failed to delete location from Supabase:', error);
            throw error;
        }
    }

    editLocation(index) {
        this.showNotification('편집 모드', '위치 정보를 수정하고 저장 버튼을 눌러주세요.', 'info');
    }

    // Frequent visitors management
    renderFrequentVisitorsList() {
        const container = document.getElementById('frequentVisitorsList');
        if (!container) return;

        container.innerHTML = '';

        if (this.frequentVisitors.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <i class="fas fa-star text-2xl mb-2"></i>
                    <p>No frequent visitors registered.</p>
                </div>
            `;
            return;
        }

        this.frequentVisitors.forEach((visitor, index) => {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-3 border rounded mb-2';
            item.innerHTML = `
                <div class="flex items-center gap-3">
                    <i class="fas fa-star text-yellow-500"></i>
                    <span class="font-medium">${visitor.name}</span>
                    <span class="text-sm text-gray-500">${this.formatTime(visitor.addedDate)}</span>
                </div>
                <button onclick="adminSystem.deleteFrequentVisitor(${index})" class="btn btn-sm btn-error">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(item);
        });
    }

    addFrequentVisitor() {
        const lastNameInput = document.getElementById('frequentVisitorLastName');
        const firstNameInput = document.getElementById('frequentVisitorFirstName');
        const lastName = lastNameInput?.value.trim();
        const firstName = firstNameInput?.value.trim();
        
        if (!lastName || !firstName) {
            this.showNotification('Input Error', 'Please enter both last name and first name.', 'error');
            return;
        }

        const newVisitor = {
            id: Date.now(),
            name: `${lastName} ${firstName}`,
            addedDate: new Date()
        };

        this.frequentVisitors.push(newVisitor);
        if (lastNameInput) lastNameInput.value = '';
        if (firstNameInput) firstNameInput.value = '';
        this.renderFrequentVisitorsList();
        
        // Sync with Supabase
        if (window.supabaseClient && window.supabaseClient.isInitialized && window.supabaseClient.client) {
            window.supabaseClient.syncFrequentVisitors().catch(error => {
                console.error('Failed to sync frequent visitor:', error);
            });
        }
        
        this.showNotification('Frequent Visitor Added', 'New frequent visitor has been added.', 'success');
    }

    deleteFrequentVisitor(index) {
        if (confirm('Are you sure you want to delete this frequent visitor?')) {
            this.frequentVisitors.splice(index, 1);
            this.renderFrequentVisitorsList();
            
            // Sync with Supabase
            if (window.supabaseClient && window.supabaseClient.isInitialized && window.supabaseClient.client) {
                window.supabaseClient.syncFrequentVisitors().catch(error => {
                    console.error('Failed to sync frequent visitor deletion:', error);
                });
            }
            
            this.showNotification('Frequent Visitor Deleted', 'Frequent visitor has been deleted.', 'success');
        }
    }

    // Settings
    saveSettings() {
        // Save frequent visitors to local storage (locations are only in Supabase)
        localStorage.setItem('frequentVisitors', JSON.stringify(this.frequentVisitors));
        
        // Sync with Supabase
        if (window.supabaseClient && window.supabaseClient.isInitialized && window.supabaseClient.client) {
            Promise.all([
                window.supabaseClient.syncLocations(),
                window.supabaseClient.syncFrequentVisitors()
            ]).then(() => {
                this.showNotification('Settings Saved', 'All settings have been saved successfully.', 'success');
            }).catch(error => {
                console.error('Failed to sync settings:', error);
                this.showNotification('Sync Warning', 'Settings saved locally but sync failed.', 'warning');
            });
        } else {
            this.showNotification('Settings Saved', 'Settings saved locally.', 'success');
        }
    }

    // Utility functions
    formatTime(date) {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showNotification(title, message, type = 'info') {
        const modal = document.getElementById('notificationModal');
        const titleElement = document.getElementById('notificationTitle');
        const messageElement = document.getElementById('notificationMessage');
        const iconElement = document.getElementById('notificationIcon');

        if (titleElement) titleElement.textContent = title;
        if (messageElement) messageElement.textContent = message;

        const icons = {
            success: 'fas fa-check-circle text-green-500',
            error: 'fas fa-exclamation-circle text-red-500',
            warning: 'fas fa-exclamation-triangle text-yellow-500',
            info: 'fas fa-info-circle text-blue-500'
        };
        
        if (iconElement) {
            iconElement.className = `${icons[type]} text-6xl`;
        }

        if (modal) {
            modal.classList.add('modal-open');
        }
    }

    hideNotification() {
        const modal = document.getElementById('notificationModal');
        if (modal) {
            modal.classList.remove('modal-open');
        }
    }
}

// Initialize admin system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing admin system...');
    window.adminSystem = new AdminSystem();
});