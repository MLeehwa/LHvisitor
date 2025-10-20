// Supabase Client for Visitor Management System
class SupabaseClient {
    constructor() {
        this.client = null;
        this.isInitialized = false;
        this.retryCount = 0;
        this.maxRetries = 5;
        
        this.init();
    }

    async init() {
        console.log('Initializing Supabase client...');
        
        // Wait for Supabase to load first
        try {
            await this.waitForSupabase();
            this.client = this.createClient();
            
            if (this.client) {
                this.isInitialized = true;
                console.log('Supabase client initialized successfully');
            } else {
                console.error('Failed to create Supabase client');
                this.isInitialized = false;
            }
        } catch (error) {
            console.error('Supabase initialization failed:', error);
            this.isInitialized = false;
        }
    }

    async waitForSupabase() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 30; // 3 seconds with 100ms intervals
            
            const checkSupabase = () => {
                attempts++;
                console.log(`Checking for Supabase... attempt ${attempts}/${maxAttempts}`);
                
                // Check if Supabase is loaded and available
                if (typeof supabase !== 'undefined' && supabase.createClient) {
                    console.log('Supabase CDN loaded successfully');
                    resolve();
                } else if (window.supabaseLoaded === false) {
                    console.warn('Supabase CDN failed to load, continuing without Supabase');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.warn('Supabase CDN not loaded within timeout, continuing without Supabase');
                    resolve();
                } else {
                    setTimeout(checkSupabase, 100);
                }
            };
            
            checkSupabase();
        });
    }

    createClient() {
        if (typeof supabase === 'undefined') {
            console.error('Supabase library not loaded');
            return null;
        }

        try {
            const client = supabase.createClient(
                'https://xqjyhoxtahfvfvedoljz.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxanlob3h0YWhmdmZ2ZWRvbGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMzM3MzMsImV4cCI6MjA2MTcwOTczM30.unZyS_3aBRq2F0vv62jquTAy7cX40mE5nZYDRajhNqw'
            );
            
            console.log('Supabase client created successfully');
            console.log('Supabase URL:', 'https://xqjyhoxtahfvfvedoljz.supabase.co');
            return client;
        } catch (error) {
            console.error('Failed to create Supabase client:', error);
            return null;
        }
    }

    async testLocationsAccess() {
        if (!this.isInitialized || !this.client) {
            console.warn('Supabase not initialized, cannot test locations access');
            return false;
        }

        try {
            console.log('Testing locations table access...');
            const { data, error } = await this.client
                .from('locations')
                .select('count')
                .limit(1);
            
            if (error) {
                console.error('Locations access test failed:', error);
                return false;
            }
            
            console.log('Locations access test successful');
            return true;
        } catch (error) {
            console.error('Locations access test error:', error);
            return false;
        }
    }

    async testConnection() {
        try {
            const { data, error } = await this.client
                .from('visitors')
                .select('count')
                .limit(1);
            
            if (error) {
                throw error;
            }
            
            console.log('Supabase connection test successful');
            return true;
        } catch (error) {
            console.error('Supabase connection test failed:', error);
            return false;
        }
    }

    async loadFromDatabase() {
        console.log('Loading data from Supabase database...');
        
        if (!this.isInitialized || !this.client) {
            throw new Error('Supabase not initialized');
        }

        try {
            // Load visitors
            await this.loadVisitors();
            
            // Load visit logs
            await this.loadVisitLogs();
            
            // Load locations
            await this.loadLocations();
            
            // Load frequent visitors
            await this.loadFrequentVisitors();
            
            console.log('All data loaded from Supabase successfully');
        } catch (error) {
            console.error('Failed to load data from Supabase:', error);
            throw error;
        }
    }

    async loadVisitors() {
        try {
            const { data, error } = await this.client
                .from('visitors')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            if (data && data.length > 0) {
                // Convert snake_case to camelCase and update main system
                const visitors = data.map(visitor => ({
                    id: visitor.id,
                    fullName: visitor.full_name,
                    category: visitor.category,
                    company: visitor.company,
                    phone: visitor.phone,
                    purpose: visitor.purpose,
                    checkinTime: visitor.checkin_time,
                    timestamp: visitor.created_at
                }));

                if (window.mainVisitorSystem) {
                    window.mainVisitorSystem.currentVisitors = visitors;
                    window.mainVisitorSystem.updateVisitorCounts();
                }

                if (window.adminSystem) {
                    window.adminSystem.currentVisitors = visitors;
                }

                console.log(`Loaded ${visitors.length} visitors from Supabase`);
            }
        } catch (error) {
            console.error('Failed to load visitors from Supabase:', error);
            throw error;
        }
    }

    async loadVisitLogs() {
        try {
            const { data, error } = await this.client
                .from('visit_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            if (data && data.length > 0) {
                // Convert snake_case to camelCase
                const logs = data.map(log => ({
                    id: log.id,
                    name: log.name,
                    fullName: log.full_name,
                    category: log.category,
                    action: log.action,
                    company: log.company,
                    phone: log.phone,
                    purpose: log.purpose,
                    checkinTime: log.checkin_time,
                    checkoutTime: log.checkout_time,
                    timestamp: log.created_at
                }));

                if (window.mainVisitorSystem) {
                    window.mainVisitorSystem.visitLogs = logs;
                }

                if (window.adminSystem) {
                    window.adminSystem.visitLogs = logs;
                }

                console.log(`Loaded ${logs.length} visit logs from Supabase`);
            }
        } catch (error) {
            console.error('Failed to load visit logs from Supabase:', error);
            throw error;
        }
    }

    async loadLocations() {
        try {
            console.log('Starting loadLocations...');
            console.log('Supabase client available:', !!this.client);
            console.log('Supabase initialized:', this.isInitialized);
            
            // Test access first
            const hasAccess = await this.testLocationsAccess();
            if (!hasAccess) {
                console.warn('No access to locations table, skipping load');
                return;
            }
            
            const { data, error } = await this.client
                .from('locations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase locations query error:', error);
                console.error('Error details:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                throw error;
            }

            console.log('Supabase locations data:', data);
            console.log('Data length:', data ? data.length : 'null');
            console.log('Data type:', typeof data);
            console.log('Raw query result:', { data, error });
            
            if (data && data.length > 0) {
                console.log('Raw location data sample:', data[0]);
                const locations = data.map((location, index) => ({
                    id: location.id || `location_${index + 1}`,
                    name: location.name,
                    category: location.category,
                    lat: parseFloat(location.latitude),
                    lng: parseFloat(location.longitude),
                    radius: parseFloat(location.radius)
                }));

                console.log('Mapped locations:', locations);

                if (window.mainVisitorSystem) {
                    window.mainVisitorSystem.locations = locations;
                }

                if (window.adminSystem) {
                    console.log('Updating adminSystem locations with Supabase data');
                    window.adminSystem.locations = locations;
                    // Update nextLocationId to avoid conflicts
                    if (locations.length > 0) {
                        const maxId = Math.max(...locations.map(l => {
                            const idStr = l.id.toString();
                            const match = idStr.match(/location_(\d+)/);
                            return match ? parseInt(match[1]) : 0;
                        }));
                        window.adminSystem.nextLocationId = Math.max(maxId + 1, locations.length + 1);
                    } else {
                        window.adminSystem.nextLocationId = 1;
                    }
                    console.log('Updated nextLocationId to:', window.adminSystem.nextLocationId);
                }
            } else {
                console.log('No locations data from Supabase, loading default locations');
                // Load default locations when Supabase has no data
                const defaultLocations = [
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
                
                if (window.mainVisitorSystem) {
                    window.mainVisitorSystem.locations = defaultLocations;
                }
                
                if (window.adminSystem) {
                    window.adminSystem.locations = defaultLocations;
                    window.adminSystem.nextLocationId = 3;
                    console.log('Loaded default locations for adminSystem:', defaultLocations);
                }
            }
            
            // Always call renderLocationList after loading
            if (window.adminSystem) {
                if (typeof window.adminSystem.renderLocationList === 'function') {
                    console.log('Calling renderLocationList after loading locations');
                    window.adminSystem.renderLocationList();
                } else {
                    console.warn('renderLocationList method not available on adminSystem');
                }
            }
        } catch (error) {
            console.error('Failed to load locations from Supabase:', error);
            throw error;
        }
    }

    async loadFrequentVisitors() {
        try {
            const { data, error } = await this.client
                .from('frequent_visitors')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            if (data && data.length > 0) {
                // Convert snake_case to camelCase
                const frequentVisitors = data.map(visitor => ({
                    id: visitor.id,
                    name: visitor.name,
                    addedDate: visitor.added_date
                }));

                if (window.mainVisitorSystem && typeof window.mainVisitorSystem.renderFrequentVisitorsList === 'function') {
                    window.mainVisitorSystem.frequentVisitors = frequentVisitors;
                    window.mainVisitorSystem.renderFrequentVisitorsList();
                }

                if (window.adminSystem) {
                    window.adminSystem.frequentVisitors = frequentVisitors;
                    // Safe method call with error handling
                    if (typeof window.adminSystem.renderFrequentVisitorsList === 'function') {
                        window.adminSystem.renderFrequentVisitorsList();
                    } else {
                        console.warn('renderFrequentVisitorsList method not available on adminSystem');
                    }
                }

                console.log(`Loaded ${frequentVisitors.length} frequent visitors from Supabase`);
            }
        } catch (error) {
            console.error('Failed to load frequent visitors from Supabase:', error);
            throw error;
        }
    }

    async syncVisitors() {
        if (!this.isInitialized || !this.client) {
            console.warn('Supabase not initialized, skipping visitor sync');
            return;
        }

        try {
            const visitors = window.mainVisitorSystem?.currentVisitors || [];
            
            // Clear existing visitors
            await this.client
                .from('visitors')
                .delete()
                .neq('id', 0); // Delete all records

            // Insert current visitors
            if (visitors.length > 0) {
                const visitorsToInsert = visitors.map(visitor => ({
                    id: visitor.id.toString(),
                    name: visitor.fullName,
                    full_name: visitor.fullName,
                    last_name: visitor.lastName,
                    first_name: visitor.firstName,
                    category: visitor.category,
                    location_name: visitor.locationName || null,
                    company: visitor.company || null,
                    phone: visitor.phone || null,
                    purpose: visitor.purpose || null,
                    checkin_time: visitor.checkinTime,
                    checkout_time: visitor.checkoutTime || null,
                    created_at: visitor.timestamp
                }));

                const { error } = await this.client
                    .from('visitors')
                    .insert(visitorsToInsert);

                if (error) {
                    throw error;
                }

                console.log(`Synced ${visitors.length} visitors to Supabase`);
            }
        } catch (error) {
            console.error('Failed to sync visitors to Supabase:', error);
            throw error;
        }
    }

    async syncLogs() {
        if (!this.isInitialized || !this.client) {
            console.warn('Supabase not initialized, skipping logs sync');
            return;
        }

        try {
            const logs = window.mainVisitorSystem?.visitLogs || [];
            
            // Clear existing logs
            await this.client
                .from('visit_logs')
                .delete()
                .neq('id', 0); // Delete all records

            // Insert current logs
            if (logs.length > 0) {
                const logsToInsert = logs.map(log => ({
                    id: log.id.toString(),
                    visitor_name: log.name || log.fullName,
                    name: log.name || log.fullName,
                    full_name: log.fullName,
                    last_name: log.lastName,
                    first_name: log.firstName,
                    category: log.category,
                    location_name: log.locationName || null,
                    action: log.action,
                    company: log.company || null,
                    phone: log.phone || null,
                    purpose: log.purpose || null,
                    checkin_time: log.checkinTime,
                    checkout_time: log.checkoutTime,
                    timestamp: log.timestamp,
                    created_at: log.timestamp
                }));

                const { error } = await this.client
                    .from('visit_logs')
                    .insert(logsToInsert);

                if (error) {
                    throw error;
                }

                console.log(`Synced ${logs.length} visit logs to Supabase`);
            }
        } catch (error) {
            console.error('Failed to sync logs to Supabase:', error);
            throw error;
        }
    }

    async syncLocations() {
        if (!this.isInitialized || !this.client) {
            console.warn('Supabase not initialized, skipping locations sync');
            return;
        }

        try {
            const locations = window.adminSystem?.locations || [];
            
            if (locations.length > 0) {
                console.log(`Syncing ${locations.length} locations to Supabase...`);
                
                // Use UPSERT (INSERT ... ON CONFLICT) to handle duplicates safely
                const locationsToUpsert = locations.map(location => ({
                    id: location.id,
                    name: location.name,
                    category: location.category,
                    latitude: location.lat,
                    longitude: location.lng,
                    radius: location.radius,
                    updated_at: new Date()
                }));

                const { error } = await this.client
                    .from('locations')
                    .upsert(locationsToUpsert, { 
                        onConflict: 'id',
                        ignoreDuplicates: false 
                    });

                if (error) {
                    console.error('Supabase upsert error:', error);
                    throw error;
                }

                console.log(`Successfully synced ${locations.length} locations to Supabase`);
                
                // Immediately reload data after sync to ensure UI is updated
                console.log('Reloading locations after sync...');
                await this.loadLocations();
            } else {
                console.log('No locations to sync');
            }
        } catch (error) {
            console.error('Failed to sync locations to Supabase:', error);
            throw error;
        }
    }

    async syncFrequentVisitors() {
        if (!this.isInitialized || !this.client) {
            console.warn('Supabase not initialized, skipping frequent visitors sync');
            return;
        }

        try {
            const frequentVisitors = window.adminSystem?.frequentVisitors || [];
            
            // Clear existing frequent visitors
            await this.client
                .from('frequent_visitors')
                .delete()
                .neq('id', 0); // Delete all records

            // Insert current frequent visitors
            if (frequentVisitors.length > 0) {
                const visitorsToInsert = frequentVisitors.map(visitor => ({
                    id: visitor.id.toString(),
                    name: visitor.name,
                    last_name: visitor.lastName,
                    first_name: visitor.firstName,
                    added_date: visitor.addedDate,
                    created_at: new Date()
                }));

                const { error } = await this.client
                    .from('frequent_visitors')
                    .insert(visitorsToInsert);

                if (error) {
                    throw error;
                }

                console.log(`Synced ${frequentVisitors.length} frequent visitors to Supabase`);
            }
        } catch (error) {
            console.error('Failed to sync frequent visitors to Supabase:', error);
            throw error;
        }
    }

    // Real-time subscription for live updates
    subscribeToChanges() {
        if (!this.isInitialized || !this.client) {
            console.warn('Supabase not initialized, skipping real-time subscription');
            return;
        }

        try {
            // Subscribe to visitors changes
            this.client
                .channel('visitors_changes')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'visitors' },
                    (payload) => {
                        console.log('Visitors changed:', payload);
                        this.loadVisitors();
                    }
                )
                .subscribe();

            // Subscribe to visit_logs changes
            this.client
                .channel('visit_logs_changes')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'visit_logs' },
                    (payload) => {
                        console.log('Visit logs changed:', payload);
                        this.loadVisitLogs();
                    }
                )
                .subscribe();

            console.log('Real-time subscriptions established');
        } catch (error) {
            console.error('Failed to establish real-time subscriptions:', error);
        }
    }
}

// Initialize Supabase client
window.supabaseClient = new SupabaseClient();