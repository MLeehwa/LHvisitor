// Main Visitor Management System
class MainVisitorSystem {
    constructor() {
        this.currentVisitors = [];
        this.visitLogs = [];
        this.locations = [
            {
                id: 1,
                name: 'Dormitory Entrance',
                category: 'dormitory',
                lat: 37.566500,
                lng: 126.978000,
                radius: 0.5
            }
        ];
        this.frequentVisitors = [];
        this.currentLocation = null;
        this.detectedCategory = null;
        
        this.init();
    }

    async init() {
        console.log('Main system initialization started');
        this.setupEventListeners();
        this.getCurrentLocation();
        this.updateVisitorCounts();
        
        // Load data from Supabase first, fallback to local storage
        await this.loadDataFromSupabase();
    }

    setupEventListeners() {
        // Admin button
        document.getElementById('adminBtn').addEventListener('click', () => {
            this.showAdminLogin();
        });

        // Check-in button
        document.getElementById('checkinBtn').addEventListener('click', () => {
            this.showCheckinSection();
        });

        // Check-out button
        document.getElementById('checkoutBtn').addEventListener('click', () => {
            this.showCheckoutSection();
        });

        // Category selection
        document.getElementById('dormitoryBtn').addEventListener('click', () => {
            this.selectCategory('dormitory');
        });

        document.getElementById('factoryBtn').addEventListener('click', () => {
            this.selectCategory('factory');
        });

        // Check-in form buttons
        document.getElementById('dormCheckinBtn').addEventListener('click', () => {
            this.checkin('dormitory');
        });

        document.getElementById('factoryCheckinBtn').addEventListener('click', () => {
            this.checkin('factory');
        });

        // Check-out confirmation
        document.getElementById('checkoutConfirmBtn').addEventListener('click', () => {
            this.checkout();
        });

        // Back to main buttons
        document.getElementById('backToMainFromCheckin').addEventListener('click', () => {
            this.hideAllSections();
        });

        document.getElementById('backToMainFromCheckout').addEventListener('click', () => {
            this.hideAllSections();
        });

        // Notification modal
        document.getElementById('notificationOk').addEventListener('click', () => {
            this.hideNotification();
        });


        // Frequent visitor selection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('frequent-visitor-item')) {
                const visitorId = e.target.dataset.visitorId;
                this.selectFrequentVisitor(visitorId);
            }
        });
    }

    showAdminLogin() {
        // Go directly to admin page
        window.location.href = 'admin.html';
    }

    async showCheckinSection() {
        this.hideAllSections();
        document.getElementById('checkinSection').classList.remove('hidden');
        // Hide main buttons when showing check-in form
        document.getElementById('mainButtons').classList.add('hidden');
        
        // Auto-detect location and show appropriate form
        await this.autoDetectLocation();
    }

    showCheckoutSection() {
        if (this.currentVisitors.length === 0) {
            this.showNotification('Notice', 'No visitors to check out.', 'warning');
            return;
        }
        
        this.hideAllSections();
        document.getElementById('checkoutSection').classList.remove('hidden');
        this.updateCheckoutOptions();
        // Hide main buttons when showing check-out form
        document.getElementById('mainButtons').classList.add('hidden');
    }

    hideAllSections() {
        document.getElementById('checkinSection').classList.add('hidden');
        document.getElementById('checkoutSection').classList.add('hidden');
        // Show main buttons when hiding sections
        document.getElementById('mainButtons').classList.remove('hidden');
    }

    async autoDetectLocation() {
        try {
            // Get current GPS position
            const position = await this.getCurrentPosition();
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            console.log('Current position:', userLat, userLng);
            
            // Find nearest location
            const nearestLocation = this.findNearestLocation(userLat, userLng);
            
            if (nearestLocation) {
                console.log('Nearest location:', nearestLocation);
                this.selectCategory(nearestLocation.category);
                this.currentLocation = nearestLocation;
                
                // Show location info
                this.showNotification(
                    'Location Detected', 
                    `You are near ${nearestLocation.name}. Please proceed with check-in.`, 
                    'success'
                );
            } else {
                // Fallback to manual selection
                this.showLocationSelection();
            }
        } catch (error) {
            console.error('Location detection failed:', error);
            // Fallback to manual selection
            this.showLocationSelection();
        }
    }

    showLocationSelection() {
        // Show category selection buttons
        document.getElementById('categorySelection').classList.remove('hidden');
        document.getElementById('dormitoryForm').classList.add('hidden');
        document.getElementById('factoryForm').classList.add('hidden');
    }

    selectCategory(category) {
        // Hide category selection
        document.getElementById('categorySelection').classList.add('hidden');
        
        // Hide all forms
        document.getElementById('dormitoryForm').classList.add('hidden');
        document.getElementById('factoryForm').classList.add('hidden');
        
        // Show selected form
        if (category === 'dormitory') {
            document.getElementById('dormitoryForm').classList.remove('hidden');
            this.renderFrequentVisitorsList();
        } else if (category === 'factory') {
            document.getElementById('factoryForm').classList.remove('hidden');
        }
    }

    async checkin() {
        // Auto-detect category based on GPS location
        let category = this.detectedCategory;
        
        if (!category) {
            this.showNotification('Location Error', 'Unable to detect location. Please select manually.', 'error');
            this.showLocationSelection();
            return;
        }

        let visitorData = {};

        if (category === 'dormitory') {
            const lastName = document.getElementById('dormLastName').value.trim();
            const firstName = document.getElementById('dormFirstName').value.trim();
            
            if (!lastName || !firstName) {
                this.showNotification('Input Error', 'Please enter both last name and first name.', 'error');
                return;
            }
            
            visitorData = {
                fullName: `${lastName} ${firstName}`,
                lastName,
                firstName,
                category: 'dormitory'
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
            
            visitorData = {
                fullName: `${lastName} ${firstName}`,
                lastName,
                firstName,
                company: company,
                phone: phone,
                purpose: purpose,
                category: 'factory'
            };
        }

        // Add visitor
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

        // Reset forms
        this.resetForms();
        
        // Update UI
        this.updateVisitorCounts();
        this.hideAllSections();

        // Sync with Supabase
        if (window.supabaseClient && window.supabaseClient.isInitialized && window.supabaseClient.client) {
            try {
                await window.supabaseClient.syncVisitors();
                await window.supabaseClient.syncLogs();
                console.log('Data synced to Supabase successfully');
            } catch (error) {
                console.error('Failed to sync to Supabase:', error);
                this.showNotification('Database Error', 'Failed to save data to database. Please try again.', 'error');
                return; // Don't show success message if sync failed
            }
        } else {
            this.showNotification('Database Error', 'Database not available. Please refresh the page.', 'error');
            return;
        }

        this.showNotification('Check-in Complete', `${visitorData.fullName} has been checked in.`, 'success');
        
        // Auto return to main after 2 seconds
        setTimeout(() => {
            this.hideAllSections();
        }, 2000);
    }

    async checkout() {
        const selectedVisitorId = document.querySelector('input[name="checkoutVisitor"]:checked')?.value;
        
        if (!selectedVisitorId) {
            this.showNotification('Selection Error', 'Please select a visitor to check out.', 'error');
            return;
        }

        const visitorIndex = this.currentVisitors.findIndex(v => v.id == selectedVisitorId);
        if (visitorIndex === -1) {
            this.showNotification('Error', 'Selected visitor not found.', 'error');
            return;
        }

        const visitor = this.currentVisitors[visitorIndex];
        const checkoutTime = new Date();

        // Add checkout log
        this.visitLogs.push({
            ...visitor,
            action: 'checkout',
            checkoutTime: checkoutTime,
            timestamp: checkoutTime,
            name: visitor.fullName
        });

        // Remove from current visitors
        this.currentVisitors.splice(visitorIndex, 1);

        // Update UI
        this.updateVisitorCounts();
        this.hideAllSections();

        // Sync with Supabase
        if (window.supabaseClient && window.supabaseClient.isInitialized && window.supabaseClient.client) {
            try {
                await window.supabaseClient.syncVisitors();
                await window.supabaseClient.syncLogs();
                console.log('Data synced to Supabase successfully');
            } catch (error) {
                console.error('Failed to sync to Supabase:', error);
                this.showNotification('Database Error', 'Failed to save data to database. Please try again.', 'error');
                return; // Don't show success message if sync failed
            }
        } else {
            this.showNotification('Database Error', 'Database not available. Please refresh the page.', 'error');
            return;
        }

        this.showNotification('Check-out Complete', `${visitor.fullName} has been checked out.`, 'success');
        
        // Auto return to main after 2 seconds
        setTimeout(() => {
            this.hideAllSections();
        }, 2000);
    }

    updateCheckoutOptions() {
        const container = document.getElementById('checkoutOptions');
        const confirmBtn = document.getElementById('checkoutConfirmBtn');
        
        if (!container) return;

        container.innerHTML = '';

        if (this.currentVisitors.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-users text-4xl mb-4"></i>
                    <p>No visitors to check out.</p>
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
                        ${visitor.category === 'dormitory' ? 'Dormitory' : 'Factory'} • 
                        ${this.formatTime(visitor.checkinTime)}
                    </div>
                </div>
            `;
            container.appendChild(option);
        });

        confirmBtn.disabled = false;
    }

    updateVisitorCounts() {
        const dormitoryCount = this.currentVisitors.filter(v => v.category === 'dormitory').length;
        const factoryCount = this.currentVisitors.filter(v => v.category === 'factory').length;
        const totalCount = this.currentVisitors.length;

        document.getElementById('dormitoryCount').textContent = dormitoryCount;
        document.getElementById('factoryCount').textContent = factoryCount;
        document.getElementById('totalCount').textContent = totalCount;
    }

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

    selectFrequentVisitor(visitorId) {
        const visitor = this.frequentVisitors.find(v => v.id == visitorId);
        if (!visitor) return;

        // Fill in the form
        const nameParts = visitor.name.split(' ');
        if (nameParts.length >= 2) {
            document.getElementById('dormLastName').value = nameParts[0];
            document.getElementById('dormFirstName').value = nameParts.slice(1).join(' ');
        }

        // Highlight selected visitor
        document.querySelectorAll('.frequent-visitor-item').forEach(item => {
            item.classList.remove('bg-blue-100', 'border-blue-300');
        });
        
        const selectedItem = document.querySelector(`[data-visitor-id="${visitorId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('bg-blue-100', 'border-blue-300');
        }
    }

    resetForms() {
        // Dormitory form
        document.getElementById('dormLastName').value = '';
        document.getElementById('dormFirstName').value = '';
        
        // Factory form
        document.getElementById('factoryLastName').value = '';
        document.getElementById('factoryFirstName').value = '';
        document.getElementById('factoryCompany').value = '';
        document.getElementById('factoryPhone').value = '';
        document.getElementById('factoryPurpose').value = '';
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showNotification('Location Error', 'This browser does not support location services.', 'error');
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes cache
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
                console.error('Location error:', error);
                this.showNotification('Location Error', 'Unable to get location. Please set manually.', 'warning');
            },
            options
        );
    }

    updateLocationStatus() {
        const statusElement = document.getElementById('locationStatus');
        if (statusElement && this.currentLocation) {
            statusElement.textContent = `Lat: ${this.currentLocation.lat.toFixed(6)}, Lng: ${this.currentLocation.lng.toFixed(6)}`;
        }
    }

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
                this.showNotification('Location Detected', `Near ${location.name}.`, 'success');
                return;
            }
        }

        this.detectedCategory = null;
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

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

        titleElement.textContent = title;
        messageElement.textContent = message;

        const icons = {
            success: 'fas fa-check-circle text-green-500',
            error: 'fas fa-exclamation-circle text-red-500',
            warning: 'fas fa-exclamation-triangle text-yellow-500',
            info: 'fas fa-info-circle text-blue-500'
        };
        iconElement.className = `${icons[type]} text-8xl text-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text animate-pulse`;

        modal.classList.add('modal-open');
    }

    hideNotification() {
        document.getElementById('notificationModal').classList.remove('modal-open');
    }

    async loadDataFromSupabase() {
        console.log('Loading data from Supabase...');
        
        // Wait for Supabase client to be ready
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds
        
        while (attempts < maxAttempts) {
            if (window.supabaseClient && window.supabaseClient.isInitialized && window.supabaseClient.client) {
                try {
                    await window.supabaseClient.loadFromDatabase();
                    console.log('Data loaded from Supabase successfully');
                    return;
                } catch (error) {
                    console.error('Failed to load from Supabase:', error);
                    this.showNotification('Database Error', 'Failed to load data from database. Please refresh the page.', 'error');
                    return;
                }
            }
            console.log(`Waiting for Supabase client... attempt ${attempts + 1}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.error('Supabase not available after maximum attempts');
        this.showNotification('Connection Error', 'Cannot connect to database. Please check your internet connection and refresh the page.', 'error');
    }
}

// DOM loaded, initialize system
document.addEventListener('DOMContentLoaded', () => {
    console.log('Main system initialization started');
    window.mainVisitorSystem = new MainVisitorSystem();
    console.log('Main system initialization completed');
});