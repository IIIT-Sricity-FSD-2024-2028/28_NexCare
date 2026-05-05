// NEXCARE — persisted CRUD (localStorage) for requests + profile
const STORAGE_KEY = 'nexcare_app_v1';

// Session Management System
const SessionManager = {
    // User session management
    currentUser: null,
    
    // Initialize session
    init: function() {
        this.checkAuthStatus();
        this.setupNavigation();
        this.setupLogout();
    },
       // Check if user is logged in
    checkAuthStatus: function() {
        // ── JWT Bridge ────────────────────────────────────────────────────────
        // Read the auth token stored by the global login (session.js / api.js).
        // Decode it client-side to get the user's name, email, and role without
        // an extra API round-trip. This replaces the old NexCareDB bridge.
        const token = sessionStorage.getItem('nexcare_auth_token')
                   || localStorage.getItem('nexcare_auth_token');

        if (token) {
            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const raw  = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                    const json = decodeURIComponent(
                        atob(raw).split('').map(c =>
                            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                        ).join('')
                    );
                    const payload = JSON.parse(json);

                    // Validate token is not expired and is for an ambulance user
                    const now = Math.floor(Date.now() / 1000);
                    if (payload.role === 'ambulance' && (!payload.exp || now <= payload.exp)) {
                        this.currentUser = {
                            id:        payload.sub   || 'emp-001',
                            name:      payload.name  || payload.email.split('@')[0],
                            email:     payload.email || 'ambulance@nexcare.com',
                            role:      'ambulance',
                            loginTime: new Date().toISOString()
                        };
                        this.updateUIForLoggedInUser();
                        return true;
                    }
                }
            } catch (e) {
                console.warn('Could not decode auth token:', e);
            }
        }

        // Fallback: check legacy ambulanceUser key (for backward compat)
        const userData = localStorage.getItem('ambulanceUser');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.updateUIForLoggedInUser();
                return true;
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }

        // Not logged in — redirect to login
        sessionStorage.clear();
        window.location.replace('../auth/login.html');
        return false;
    },

    // Login user
    login: function(userData) {
        this.currentUser = {
            id: userData.id || 'emp-' + Date.now(),
            name: userData.name || 'Alex Martinez',
            email: userData.email || 'alex@nexcare.com',
            role: userData.role || 'paramedic',
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('ambulanceUser', JSON.stringify(this.currentUser));
        this.updateUIForLoggedInUser();
        
        // Show welcome message
        this.showNotification(`Welcome back, ${this.currentUser.name}!`, 'success');
        
        return true;
    },
    
    // Logout user
    logout: function() {
        localStorage.removeItem('ambulanceUser');
        this.currentUser = null;
        
        // Clear all session data
        this.clearSessionData();
        
        // Show logout message
        this.showNotification('Logged out successfully', 'info');
        
        // Redirect using global logout helper if available
        if (typeof logoutUser === 'function') {
            logoutUser();
        } else {
            sessionStorage.clear();
            window.location.href = '../landing/landing.html';
        }
    },
    
    // Update UI for logged in user
    updateUIForLoggedInUser: function() {
        if (this.currentUser) {
            // Update welcome message
            const userNameElement = document.getElementById('dashboard-user-name');
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.name;
            }
            
            // Update profile name if exists
            const profileNameElement = document.querySelector('.profile-name');
            if (profileNameElement) {
                profileNameElement.textContent = this.currentUser.name;
            }
        }
    },
    
    // Setup navigation
    setupNavigation: function() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = link.getAttribute('data-page');
                if (pageId) {
                    this.navigateToPage(pageId);
                }
            });
        });
    },
    
    // Navigate to specific page
    navigateToPage: async function(pageId) {
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            page.classList.remove('active');
        });
        
        // Show target page
        const targetPage = document.getElementById(pageId + '-page');
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update navigation active state
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active');
            }
        });
        
        // Store current page in session and update URL hash
        sessionStorage.setItem('currentPage', pageId);
        window.location.hash = pageId;
        
        // Track navigation history for back button
        if (typeof NavigationHistory !== 'undefined' && NavigationHistory.navigateToPage) {
            NavigationHistory.navigateToPage(pageId);
        }
        
        // RE-FETCH AND RE-RENDER ON EVERY NAVIGATION (FR-12)
        if (typeof refreshAllViews === 'function') {
            await refreshAllViews(false); // Direct navigation = show animations
            console.log(`NexCare: Navigated to ${pageId}, data refreshed.`);
        }
    },
    
    // Setup logout
    setupLogout: function() {
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to logout?')) {
                    this.logout();
                }
            });
        }
    },
    
    // Clear session data
    clearSessionData: function() {
        sessionStorage.clear();
        // Keep localStorage data (profile, settings) but clear session-specific data
    },
    
    // Show notification
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#10b981';
                break;
            case 'error':
                notification.style.backgroundColor = '#ef4444';
                break;
            case 'warning':
                notification.style.backgroundColor = '#f59e0b';
                break;
            default:
                notification.style.backgroundColor = '#3b82f6';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
};

// State Management System
const StateManager = {
    // Current state
    state: {
        selectedRequest: null,
        currentPage: 'dashboard',
        filters: {},
        sortBy: 'time'
    },
    
    // Initialize state
    init: function() {
        this.loadStateFromStorage();
        this.setupStatePersistence();
    },
    
    // Load state from storage
    loadStateFromStorage: function() {
        const savedState = sessionStorage.getItem('ambulanceState');
        if (savedState) {
            try {
                this.state = { ...this.state, ...JSON.parse(savedState) };
            } catch (error) {
                console.error('Error loading state:', error);
            }
        }
        
        // Restore current page
        if (this.state.currentPage) {
            SessionManager.navigateToPage(this.state.currentPage);
        }
    },
    
    // Save state to storage
    saveState: function() {
        sessionStorage.setItem('ambulanceState', JSON.stringify(this.state));
    },
    
    // Setup state persistence
    setupStatePersistence: function() {
        // Save state before page unload
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });
        
        // Save state on page changes
        const observer = new MutationObserver(() => {
            this.saveState();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },
    
    // Set selected request
    setSelectedRequest: function(request) {
        this.state.selectedRequest = request;
        localStorage.setItem('selectedRequest', JSON.stringify(request));
        this.saveState();
    },
    
    // Get selected request
    getSelectedRequest: function() {
        if (this.state.selectedRequest) {
            return this.state.selectedRequest;
        }
        
        const saved = localStorage.getItem('selectedRequest');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (error) {
                console.error('Error loading selected request:', error);
            }
        }
        
        return null;
    },
    
    // Set current page
    setCurrentPage: function(page) {
        this.state.currentPage = page;
        this.saveState();
    },
    
    // Set filters
    setFilters: function(filters) {
        this.state.filters = { ...this.state.filters, ...filters };
        this.saveState();
    },
    
    // Get filters
    getFilters: function() {
        return this.state.filters;
    },
    
    // Clear state
    clearState: function() {
        this.state = {
            selectedRequest: null,
            currentPage: 'dashboard',
            filters: {},
            sortBy: 'time'
        };
        sessionStorage.removeItem('ambulanceState');
        localStorage.removeItem('selectedRequest');
    }
};

// Navigation Helper Functions
function goBack() {
    const previousPage = sessionStorage.getItem('previousPage') || 'dashboard';
    SessionManager.navigateToPage(previousPage);
}

function showPage(pageId) {
    SessionManager.navigateToPage(pageId);
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize session and state management
    SessionManager.init();
    StateManager.init();
    
    // Simulate login for demo (in real app, this would be actual login)
    if (!SessionManager.currentUser) {
        SessionManager.login({
            name: 'Alex Martinez',
            email: 'alex@nexcare.com',
            role: 'paramedic',
            id: 'emp-001'
        });
    }
    
    // Initialize dynamic rendering
    DynamicRenderer.init();
    
    // Initialize existing functionality
    initializeNavigation();
    initializeDashboard();
    initializeAmbulanceRequests();
    initializeAssignedDispatch();
    initializeActiveTransport();
    initializeCompletedTransports();
    initializeProfile();
    initializeLogout();
});

// Form Validation Utilities
const ValidationUtils = {
    // Email validation regex
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    
    // Phone validation regex (supports multiple formats)
    phoneRegex: /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/,
    
    // Name validation (letters, spaces, hyphens, apostrophes)
    nameRegex: /^[a-zA-Z\s\-'\.]{2,50}$/,
    
    // Vehicle number validation (alphanumeric with hyphens)
    vehicleRegex: /^[A-Z0-9\-]{3,10}$/,
    
    // Location validation (letters, numbers, spaces, common punctuation)
    locationRegex: /^[a-zA-Z0-9\s\,\.\-\#]{5,100}$/,
    
    validateRequired: function(value, fieldName) {
        if (!value || value.trim() === '') {
            return `${fieldName} is required`;
        }
        return null;
    },
    
    validateEmail: function(email) {
        if (!email || email.trim() === '') {
            return 'Email is required';
        }
        if (!this.emailRegex.test(email.trim())) {
            return 'Invalid email format';
        }
        return null;
    },
    
    validatePhone: function(phone) {
        if (!phone || phone.trim() === '') {
            return 'Phone number is required';
        }
        const digits = phone.trim().replace(/\D/g, '');
        if (digits.length !== 10) {
            return 'Phone number must be exactly 10 digits';
        }
        return null;
    },
    
    validateName: function(name, fieldName = 'Name') {
        if (!name || name.trim() === '') {
            return `${fieldName} is required`;
        }
        if (name.trim().length < 2) {
            return `${fieldName} must be at least 2 characters`;
        }
        if (name.trim().length > 50) {
            return `${fieldName} must be less than 50 characters`;
        }
        if (!this.nameRegex.test(name.trim())) {
            return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
        }
        return null;
    },
    
    validateVehicle: function(vehicle) {
        if (!vehicle || vehicle.trim() === '') {
            return 'Vehicle number is required';
        }
        if (!this.vehicleRegex.test(vehicle.trim().toUpperCase())) {
            return 'Vehicle number must be 3-10 characters (letters, numbers, hyphens only)';
        }
        return null;
    },
    
    validateLocation: function(location) {
        if (!location || location.trim() === '') {
            return 'Location is required';
        }
        if (location.trim().length < 5) {
            return 'Location must be at least 5 characters';
        }
        if (location.trim().length > 100) {
            return 'Location must be less than 100 characters';
        }
        if (!this.locationRegex.test(location.trim())) {
            return 'Location contains invalid characters';
        }
        return null;
    },
    
    validateSelect: function(value, fieldName, allowedValues) {
        if (!value || value.trim() === '') {
            return `${fieldName} is required`;
        }
        if (allowedValues && !allowedValues.includes(value)) {
            return `Invalid ${fieldName} selected`;
        }
        return null;
    },
    
    checkDuplicate: function(value, existingValues, fieldName) {
        if (existingValues && existingValues.includes(value.trim())) {
            return `${fieldName} already exists`;
        }
        return null;
    }
};

// Form Error Display Manager
const FormValidation = {
    errorElements: new Map(),
    
    showError: function(inputElement, message) {
        // Remove existing error if any
        this.removeError(inputElement);
        
        // Add error class to input
        inputElement.classList.add('input-error');
        
        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        // Insert error message after input
        inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
        
        // Store reference for later removal
        this.errorElements.set(inputElement, errorElement);
        
        // Add aria-invalid for accessibility
        inputElement.setAttribute('aria-invalid', 'true');
        inputElement.setAttribute('aria-describedby', errorElement.id || `error-${Date.now()}`);
    },
    
    removeError: function(inputElement) {
        // Remove error class
        inputElement.classList.remove('input-error');
        inputElement.setAttribute('aria-invalid', 'false');
        
        // Remove existing error message
        const existingError = this.errorElements.get(inputElement);
        if (existingError && existingError.parentNode) {
            existingError.parentNode.removeChild(existingError);
        }
        
        // Clear from map
        this.errorElements.delete(inputElement);
    },
    
    clearAllErrors: function(formElement) {
        const inputs = formElement.querySelectorAll('input, select, textarea');
        inputs.forEach(input => this.removeError(input));
    },
    
    validateForm: function(formElement, validationRules) {
        let isValid = true;
        this.clearAllErrors(formElement);
        
        for (const [fieldName, rules] of Object.entries(validationRules)) {
            const inputElement = formElement.querySelector(`[name="${fieldName}"], #${fieldName}`);
            if (!inputElement) continue;
            
            const value = inputElement.value;
            
            // Run all validation rules for this field
            for (const rule of rules) {
                let error = null;
                
                if (rule.type === 'required') {
                    error = ValidationUtils.validateRequired(value, rule.message || fieldName);
                } else if (rule.type === 'email') {
                    error = ValidationUtils.validateEmail(value);
                } else if (rule.type === 'phone') {
                    error = ValidationUtils.validatePhone(value);
                } else if (rule.type === 'name') {
                    error = ValidationUtils.validateName(value, rule.message || fieldName);
                } else if (rule.type === 'vehicle') {
                    error = ValidationUtils.validateVehicle(value);
                } else if (rule.type === 'location') {
                    error = ValidationUtils.validateLocation(value);
                } else if (rule.type === 'select') {
                    error = ValidationUtils.validateSelect(value, rule.message || fieldName, rule.allowedValues);
                } else if (rule.type === 'duplicate') {
                    error = ValidationUtils.checkDuplicate(value, rule.existingValues, rule.message || fieldName);
                } else if (rule.type === 'custom') {
                    error = rule.validator(value);
                }
                
                if (error) {
                    this.showError(inputElement, error);
                    isValid = false;
                    break; // Stop at first error for this field
                }
            }
        }
        
        return isValid;
    }
};

// Navigation History Management
const NavigationHistory = {
    history: [],
    currentIndex: -1,
    
    // Initialize history with current page
    init: function() {
        const currentPage = this.getCurrentPage();
        this.history.push(currentPage);
        this.currentIndex = 0;
    },
    
    // Get current page from hash or default
    getCurrentPage: function() {
        const hash = window.location.hash.slice(1);
        return hash || 'dashboard';
    },
    
    // Navigate to page and update history
    navigateToPage: function(pageId) {
        const currentPage = this.getCurrentPage();
        
        // Don't add to history if it's the same page
        if (currentPage === pageId) return;
        
        // Remove any forward history when navigating to new page
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }
        
        // Add new page to history
        this.history.push(pageId);
        this.currentIndex = this.history.length - 1;
        
        // Update back button visibility
        this.updateBackButtonVisibility();
    },
    
    // Go back to previous page
    goBack: function() {
        if (this.canGoBack()) {
            this.currentIndex--;
            const previousPage = this.history[this.currentIndex];
            
            // Navigate to previous page
            const targetPage = document.getElementById(previousPage + '-page');
            if (targetPage) {
                // Update navigation
                const navLinks = document.querySelectorAll('.nav-link');
                const pages = document.querySelectorAll('.page');
                
                pages.forEach((page) => page.classList.remove('active'));
                navLinks.forEach((link) => link.classList.remove('active'));
                
                targetPage.classList.add('active');
                
                const activeLink = document.querySelector(`[data-page="${previousPage}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
                
                // Update URL hash
                window.location.hash = previousPage;
                
                // Update back button visibility
                this.updateBackButtonVisibility();
                
                // Show toast notification
                ToastNotifications.info(`Navigated back to ${this.getPageName(previousPage)}`);
            }
        } else {
            // If no history, go to dashboard
            this.goToDashboard();
        }
    },
    
    // Check if we can go back
    canGoBack: function() {
        return this.currentIndex > 0;
    },
    
    // Go to dashboard
    goToDashboard: function() {
        const dashboardLink = document.querySelector('[data-page="dashboard"]');
        if (dashboardLink) {
            dashboardLink.click();
        }
    },
    
    // Get user-friendly page name
    getPageName: function(pageId) {
        const pageNames = {
            'dashboard': 'Dashboard',
            'ambulance-requests': 'Incoming Requests',
            'assigned-dispatch': 'Assigned Dispatch',
            'active-transport': 'Active Transport',
            'completed-transports': 'Completed Transports',
            'profile': 'Profile'
        };
        return pageNames[pageId] || pageId;
    },
    
    // Update back button visibility based on history
    updateBackButtonVisibility: function() {
        const backButtons = document.querySelectorAll('.btn-back');
        const canGoBack = this.canGoBack();
        
        backButtons.forEach(button => {
            button.style.display = canGoBack ? 'inline-flex' : 'none';
        });
    }
};

// Global back function for onclick handlers
function goBack() {
    NavigationHistory.goBack();
}

// Error Handling and Empty State Management
const ErrorHandler = {
    // Show error state in a container
    showError: function(containerId, title, description, actionCallback = null) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-state">
                <svg class="error-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div class="error-state-title">${title}</div>
                <div class="error-state-description">${description}</div>
                ${actionCallback ? `<div class="empty-state-action"><button type="button" class="btn btn-primary" onclick="${actionCallback}">Try Again</button></div>` : ''}
            </div>
        `;
    },
    
    // Show empty state in a container
    showEmpty: function(containerId, title, description, actionCallback = null, actionText = 'Add New') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                </svg>
                <div class="empty-state-title">${title}</div>
                <div class="empty-state-description">${description}</div>
                ${actionCallback ? `<div class="empty-state-action"><button type="button" class="btn btn-primary" onclick="${actionCallback}">${actionText}</button></div>` : ''}
            </div>
        `;
    },
    
    // Show loading state in a container
    showLoading: function(containerId, message = 'Loading...') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <div class="loading-state-text">${message}</div>
            </div>
        `;
    },
    
    // Validate record exists
    validateRecord: function(recordId, recordType = 'record') {
        if (!recordId) {
            ToastNotifications.error(`No ${recordType} ID provided`);
            return false;
        }
        
        const record = appState.requests.find(r => r.id === recordId);
        if (!record) {
            ToastNotifications.error(`${recordType.charAt(0).toUpperCase() + recordType.slice(1)} not found`);
            return false;
        }
        
        return record;
    },
    
    // Handle API errors gracefully
    handleApiError: function(error, operation = 'operation') {
        console.error(`Error during ${operation}:`, error);
        ToastNotifications.error(`Failed to ${operation}. Please try again.`);
    },
    
    // Create alert message
    showAlert: function(containerId, message, type = 'info', dismissible = true) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const alertId = 'alert-' + Date.now();
        const alertHtml = `
            <div id="${alertId}" class="alert alert-${type}">
                <svg class="alert-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${this.getAlertIcon(type)}
                </svg>
                <span class="alert-message">${message}</span>
                ${dismissible ? `<button class="alert-close" onclick="this.parentElement.remove()">×</button>` : ''}
            </div>
        `;
        
        // Insert at the beginning of container
        container.insertAdjacentHTML('afterbegin', alertHtml);
        
        // Auto-dismiss after 5 seconds for info and success
        if (type === 'info' || type === 'success') {
            setTimeout(() => {
                const alert = document.getElementById(alertId);
                if (alert) alert.remove();
            }, 5000);
        }
    },
    
    getAlertIcon: function(type) {
        const icons = {
            info: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
            warning: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>',
            error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
            success: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>'
        };
        return icons[type] || icons.info;
    }
};

// ETA Timer System for Real-time Status Display (FR-11)
const ETATimer = {
    intervals: new Map(),
    
    // ETA estimates per step (in minutes)
    stepEstimates: {
        0: 8,  // Dispatch Accepted -> Ambulance En Route
        1: 12, // Ambulance En Route -> Patient Picked Up  
        2: 5,  // Patient Picked Up -> Reached Hospital
        3: 15, // Reached Hospital -> Transport Completed
        4: 0   // Transport Completed (no further steps)
    },
    
    startTimer: function(requestId, currentStep) {
        // Clear existing timer for this request
        this.stopTimer(requestId);
        
        const estimate = this.stepEstimates[currentStep] || 0;
        if (estimate === 0) return; // No timer needed for completed steps
        
        let remainingSeconds = estimate * 60;
        
        const interval = setInterval(() => {
            remainingSeconds--;
            
            if (remainingSeconds <= 0) {
                this.stopTimer(requestId);
                this.updateTimerDisplay(requestId, 'Completed', true);
            } else {
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                this.updateTimerDisplay(requestId, timeString, false);
            }
        }, 1000);
        
        this.intervals.set(requestId, interval);
        this.updateTimerDisplay(requestId, `${estimate}:00`, false);
    },
    
    stopTimer: function(requestId) {
        const interval = this.intervals.get(requestId);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(requestId);
        }
    },
    
    updateTimerDisplay: function(requestId, timeString, isCompleted) {
        const etaElement = document.getElementById(`eta-${requestId}`);
        if (etaElement) {
            if (isCompleted) {
                etaElement.innerHTML = `<span class="eta-completed">✓ Step Completed</span>`;
            } else {
                etaElement.innerHTML = `<span class="eta-live">⏱️ ETA: ${timeString}</span>`;
            }
        }
    },
    
    formatTimeRemaining: function(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
};

// Toast Notification System
const ToastNotifications = {
    container: null,
    
    init: function() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    },
    
    show: function(message, type = 'info', duration = 3000) {
        if (!this.container) this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        this.container.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
        
        // Animate in
        setTimeout(() => toast.classList.add('toast-show'), 10);
    },
    
    success: function(message) {
        this.show(message, 'success');
    },
    
    error: function(message) {
        this.show(message, 'error', 5000);
    },
    
    info: function(message) {
        this.show(message, 'info');
    },
    
    warning: function(message) {
        this.show(message, 'warning');
    }
};

// Checklist Persistence System
const ChecklistManager = {
    storageKey: 'nexcare_checklist_v1',
    
    getChecklistState: function() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    },
    
    saveChecklistState: function(state) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(state));
        } catch (e) {
            console.warn('Could not save checklist state:', e);
        }
    },
    
    bindCheckboxes: function() {
        const checkboxes = document.querySelectorAll('.checklist-grid .checkbox');
        const currentState = this.getChecklistState();
        
        checkboxes.forEach((checkbox, index) => {
            const checkboxId = `checklist-${index}`;
            
            // Restore saved state
            if (currentState[checkboxId]) {
                checkbox.checked = true;
            }
            
            // Save on change
            checkbox.addEventListener('change', function() {
                const newState = ChecklistManager.getChecklistState();
                newState[checkboxId] = this.checked;
                ChecklistManager.saveChecklistState(newState);
                
                // NOTIFY UI TO RE-RENDER BUTTONS (FR-13)
                if (typeof refreshAllViews === 'function') {
                    refreshAllViews(true); // Background refresh, no flickers
                }
            });
        });
    },

    isComplete: function() {
        const checkboxes = document.querySelectorAll('.checklist-grid .checkbox');
        if (checkboxes.length === 0) return true; // Fail safe
        let allChecked = true;
        checkboxes.forEach(cb => {
            if (!cb.checked) allChecked = false;
        });
        return allChecked;
    },
    
    resetChecklist: function() {
        try {
            localStorage.removeItem(this.storageKey);
            const checkboxes = document.querySelectorAll('.checklist-grid .checkbox');
            checkboxes.forEach(checkbox => checkbox.checked = false);
        } catch (e) {
            console.warn('Could not reset checklist:', e);
        }
    }
};

// CSV Export Utility
const CSVExport = {
    downloadCSV: function(data, filename) {
        const csv = this.convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    },
    
    convertToCSV: function(data) {
        if (!data || data.length === 0) return '';
        
        // Get headers from first object
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        
        // Convert data rows
        const csvRows = data.map(row => {
            return headers.map(header => {
                const value = row[header] || '';
                // Escape quotes and wrap in quotes if contains comma
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',');
        });
        
        return [csvHeaders, ...csvRows].join('\n');
    }
};

const TRANSPORT_STEPS = [
    {
        label: 'Dispatch Accepted',
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    },
    {
        label: 'Ambulance En Route',
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
    },
    {
        label: 'Patient Picked Up',
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>',
    },
    {
        label: 'Reached Hospital',
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    },
    {
        label: 'Transport Completed',
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
    },
];

function escapeHtml(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}

/**
 * Updates an element's innerHTML only if the content has changed.
 * This prevents flickering/flashing during background refreshes.
 */
function safeSetInnerHTML(element, newHTML) {
    if (!element) return;
    if (element.innerHTML.trim() === newHTML.trim()) return;
    element.innerHTML = newHTML;
}

function formatRequestTime() {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatCompletedDate() {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

async function loadAppState() {
    let state = {
        nextSeq: 20,
        profile: {
            name: 'Alex Martinez',
            phone: '+1 (555) 987-6543',
            vehicle: 'AMB-05',
            status: 'Available',
        },
        requests: []
    };
    
    if (window.NexCareAPI && window.NexCareAPI.Ambulance) {
        try {
            // Use the API to fetch all ambulance requests from backend
            const res = await window.NexCareAPI.Ambulance.getAllRequests();
            const dbReqs = res.data;
            if (dbReqs && dbReqs.length > 0) {
                state.requests = dbReqs.map(req => ({
                    id: req.id,
                    patient: req.patientName || 'Emergency Patient',
                    location: req.pickupLocation || 'Unknown Location',
                    contact: req.contact || '-',
                    time: req.createdAt ? new Date(req.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '12:00 PM',
                    createdAt: req.createdAt || new Date().toISOString(), // Preserve raw timestamp for sorting/formatting
                    priority: req.priority || 'Medium',
                    status: (function(s) {
                        if (!s) return 'pending';
                        const ls = s.toLowerCase();
                        if (ls === 'pending') return 'pending';
                        if (ls === 'dispatched') return 'assigned';
                        if (ls === 'en route' || ls === 'picked up' || ls === 'at hospital') return 'in_transit';
                        if (ls === 'completed') return 'completed';
                        if (ls === 'canceled' || ls === 'cancelled') return 'completed';
                        return 'pending';
                    })(req.status),
                    stepIndex: req.stepIndex != null ? req.stepIndex : 0,
                    completedDate: req.completedDate || null,
                    completedTime: req.completedTime || null
                }));
            }
        } catch (err) {
            console.warn('Failed to load ambulance requests from API:', err);
        }
    }
    return state;
}

let appState = {
    nextSeq: 20,
    profile: { name: 'Alex Martinez', phone: '+1 (555) 987-6543', vehicle: 'AMB-05', status: 'Available' },
    requests: []
};

// Initialize appState asynchronously
(async function initAppState() {
    appState = await loadAppState();
    refreshAllViews();
})();

function persistAppState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        // Backend persistence is handled by NexCareStore API calls
        // (updateAmbulanceRequest, etc.) at the point of mutation
    } catch (e) {}
}

function newRequestId() {
    const n = appState.nextSeq++;
    return `AMB-2026-${String(n).padStart(3, '0')}`;
}

    function getPriorityBadgeClass(priority) {
        switch (priority) {
        case 'High':
            return 'badge-red';
        case 'Medium':
            return 'badge-yellow';
        case 'Low':
            return 'badge-green';
        default:
            return 'badge-gray';
    }
}

function statusToRecentBadge(status) {
    switch (status) {
        case 'pending':
            return 'badge-orange';
        case 'assigned':
            return 'badge-blue';
        case 'in_transit':
            return 'badge-teal';
        case 'completed':
            return 'badge-green';
        default:
            return 'badge-gray';
    }
}

function statusToLabel(status) {
    switch (status) {
        case 'pending':
            return 'Pending';
        case 'assigned':
            return 'Assigned';
        case 'in_transit':
            return 'Active';
        case 'completed':
            return 'Completed';
        default:
            return status;
    }
}

function getActiveTransportRequest() {
    return appState.requests.find((r) => r.status === 'in_transit');
}

async function refreshAllViews(isBackground = false) {
    // CRITICAL: Re-read the database into the appState before each render
    appState = await loadAppState();
    
    renderDashboard();
    renderAmbulanceRequests();
    renderAssignedDispatch();
    renderCompletedTransports();
    renderActiveTransport();
    syncDashboardUserName();
    syncProfileQuickStats();
    
    // Also update the DynamicRenderer if available
    if (typeof DynamicRenderer !== 'undefined' && DynamicRenderer.renderStats) {
        DynamicRenderer.renderStats(isBackground);
        DynamicRenderer.renderRecentRequests(isBackground);
    }
}

function syncDashboardUserName() {
    const el = document.getElementById('dashboard-user-name');
    if (el && appState.profile) el.textContent = appState.profile.name;
}

function renderDashboard() {
    const pending = appState.requests.filter((r) => r.status === 'pending').length;
    const assigned = appState.requests.filter((r) => r.status === 'assigned').length;
    const active = appState.requests.filter((r) => r.status === 'in_transit').length;
    const completed = appState.requests.filter((r) => r.status === 'completed').length;

    const sp = document.getElementById('stat-pending');
    const sa = document.getElementById('stat-assigned');
    const sac = document.getElementById('stat-active');
    const sc = document.getElementById('stat-completed');
    if (sp) sp.textContent = String(pending);
    if (sa) sa.textContent = String(assigned);
    if (sac) sac.textContent = String(active);
    if (sc) sc.textContent = String(completed);

    // Update Active Transport banner
    updateActiveTransportBanner();

    const recentBody = document.getElementById('dashboard-recent-tbody');
    if (!recentBody) return;

    const open = appState.requests
        .filter((r) => r.status !== 'completed')
        .slice()
        .sort((a, b) => (a.time > b.time ? -1 : 1))
        .slice(0, 8);

    const html = open.length
        ? open
              .map(
                  (r) => {
                      const priorityClass = `priority-${r.priority.toLowerCase()}`;
                      return `
        <tr>
            <td><span class="request-id">${escapeHtml(r.id)}</span></td>
            <td><span class="patient-name">${escapeHtml(r.patient)}</span></td>
            <td><span class="text-gray">${escapeHtml(r.location)}</span></td>
            <td><span class="text-gray">${escapeHtml(r.time)}</span></td>
            <td><span class="priority-badge ${priorityClass}">${escapeHtml(r.priority)}</span></td>
            <td><span class="badge ${statusToRecentBadge(r.status)}">${escapeHtml(statusToLabel(r.status))}</span></td>
        </tr>`;
                  }
              )
              .join('')
        : '<tr><td colspan="6" class="text-gray">No open requests</td></tr>';
    
    safeSetInnerHTML(recentBody, html);
}

function updateActiveTransportBanner() {
    const banner = document.getElementById('dashboard-active-banner');
    const activeRequest = getActiveTransportRequest();
    
    if (!banner) return;
    
    if (activeRequest) {
        const currentStep = TRANSPORT_STEPS[activeRequest.stepIndex || 0];
        const etaDisplay = document.getElementById('eta-display');
        const currentStepElement = document.getElementById('eta-current-step');
        
        // Update banner content
        document.getElementById('banner-patient-name').textContent = `Patient: ${activeRequest.patient}`;
        document.getElementById('banner-current-step').textContent = `Step: ${currentStep.label}`;
        
        // Show banner
        banner.style.display = 'block';
        
        // Update ETA if timer is running
        if (etaDisplay && etaDisplay.textContent !== '⏱️ ETA: --:--') {
            document.getElementById('banner-time-remaining').textContent = `ETA: ${etaDisplay.textContent.replace('⏱️ ETA: ', '')}`;
        } else {
            document.getElementById('banner-time-remaining').textContent = 'ETA: --:--';
        }
    } else {
        // Hide banner if no active transport
        banner.style.display = 'none';
    }
}

function resetRequestForm() {
    const form = document.getElementById('request-mutate-form');
    const title = document.getElementById('request-form-title');
    const hint = document.getElementById('request-form-hint');
    const submitBtn = document.getElementById('request-form-submit');
    const cancelBtn = document.getElementById('request-form-cancel');
    const editId = document.getElementById('request-edit-id');
    if (form) form.reset();
    if (editId) editId.value = '';
    if (title) title.textContent = 'New request';
    if (hint) hint.textContent = 'Add a dispatch request to the queue';
    if (submitBtn) submitBtn.textContent = 'Create request';
    if (cancelBtn) cancelBtn.style.display = 'none';
    const pr = document.getElementById('req-priority');
    if (pr) pr.value = 'Medium';
}

function renderAmbulanceRequests() {
    const tbody = document.getElementById('ambulance-requests-tbody');
    if (!tbody) return;

    try {
        const pending = appState.requests.filter((r) => r.status === 'pending');

        if (pending.length === 0) {
            // Show empty state with proper messaging
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="8">
                        <div class="empty-state">
                            <svg class="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                            </svg>
                            <div class="empty-state-title">No Pending Requests</div>
                            <div class="empty-state-description">There are no pending ambulance requests from dispatch at the moment. New requests will appear here automatically.</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const html = pending
            .map(
                (request) => {
                    const priorityClass = `priority-${request.priority.toLowerCase()}`;
                    const checklistComplete = ChecklistManager.isComplete();
                    return `
            <tr>
                <td><span class="request-id">${escapeHtml(request.id)}</span></td>
                <td><span class="patient-name">${escapeHtml(request.patient)}</span></td>
                <td><span class="text-gray">${escapeHtml(request.location)}</span></td>
                <td><span class="text-gray">${escapeHtml(request.contact)}</span></td>
                <td><span class="text-gray">${escapeHtml(request.time)}</span></td>
                <td><span class="priority-badge ${priorityClass}">${escapeHtml(request.priority)}</span></td>
                <td><span class="badge badge-orange">Pending</span></td>
                <td>
                    ${!checklistComplete 
                        ? `<div class="checklist-warning" style="color: #DC2626; font-size: 10px; font-weight: 700; margin-bottom: 4px;">CHECKLIST REQUIRED</div>` 
                        : ''}
                    <button type="button" class="btn btn-primary btn-sm accept-btn" 
                        data-id="${escapeHtml(request.id)}"
                        ${!checklistComplete ? 'disabled title="Complete safety checklist to accept"' : ''}>
                        Accept
                    </button>
                </td>
            </tr>`;
                }
            )
            .join('');
        
        safeSetInnerHTML(tbody, html);
    } catch (error) {
        ErrorHandler.handleApiError(error, 'load requests');
        ErrorHandler.showError('ambulance-requests-tbody', 'Failed to Load Requests', 'Unable to load incoming requests. Please refresh the page.');
    }
}

// Global Event Delegation (FR-13)
// This fixes the multiple listener bug and avoids stacking listeners every refresh
function setupGlobalDelegation() {
    // 1. Incoming Requests
    const reqTbody = document.getElementById('ambulance-requests-tbody');
    if (reqTbody) {
        reqTbody.addEventListener('click', async function(e) {
            const btn = e.target.closest('.accept-btn');
            if (!btn || btn.disabled) return;
            
            const id = btn.getAttribute('data-id');
            const record = ErrorHandler.validateRecord(id, 'request');
            if (!record) return;
            
            if (record.status !== 'pending') {
                ToastNotifications.warning('This request is no longer pending');
                await refreshAllViews();
                return;
            }
            
            record.status = 'assigned';
            if (window.NexCareAPI) {
                await window.NexCareAPI.Ambulance.updateRequest(id, { status: 'Dispatched' });
            }
            persistAppState();
            ToastNotifications.success(`Accepted request ${record.id} - ${record.patient}`);
            // Navigate to Assigned Dispatch page (this will refresh data)
            await SessionManager.navigateToPage('assigned-dispatch');
        });
    }

    // 2. Assigned Dispatch
    const dispatchContainer = document.getElementById('assigned-requests-container');
    if (dispatchContainer) {
        dispatchContainer.addEventListener('click', async function(e) {
            const startBtn = e.target.closest('.start-transport-btn');
            const cancelBtn = e.target.closest('.cancel-assignment-btn');

            if (startBtn && !startBtn.disabled) {
                const id = startBtn.getAttribute('data-id');
                const record = ErrorHandler.validateRecord(id, 'request');
                if (!record || record.status !== 'assigned') return;
                
                record.status = 'in_transit';
                record.stepIndex = 0;
                if (window.NexCareAPI) {
                    await window.NexCareAPI.Ambulance.updateRequest(id, { status: 'En Route', stepIndex: 0 });
                }
                persistAppState();
                ToastNotifications.success(`Transport started for ${record.patient}`);
                // Navigate to Active Transport page (this will refresh data and render)
                await SessionManager.navigateToPage('active-transport');
                // Start ETA timer after page is rendered
                ETATimer.startTimer(record.id, record.stepIndex);
            }

            if (cancelBtn) {
                const id = cancelBtn.getAttribute('data-id');
                const record = ErrorHandler.validateRecord(id, 'request');
                if (!record || record.status !== 'assigned') return;
                
                if (confirm(`Cancel assignment for ${record.patient}?`)) {
                    record.status = 'pending';
                    if (window.NexCareAPI) {
                        await window.NexCareAPI.Ambulance.updateRequest(id, { status: 'Pending' });
                    }
                    persistAppState();
                    await refreshAllViews();
                    ToastNotifications.info(`Assignment canceled for ${record.patient}`);
                }
            }
        });
    }

    // 3. Completed Transports
    const completedTbody = document.getElementById('completed-transports-tbody');
    if (completedTbody) {
        completedTbody.addEventListener('click', function(e) {
            const btn = e.target.closest('.delete-completed-btn');
            if (!btn) return;
            
            const id = btn.getAttribute('data-id');
            const record = appState.requests.find(r => r.id === id);
            if (!record) return;

            if (confirm(`Remove ${id} from history? This action cannot be undone.`)) {
                if (window.NexCareAPI) {
                    window.NexCareAPI.Ambulance.cancelRequest(id);
                }
                appState.requests = appState.requests.filter(r => r.id !== id);
                persistAppState();
                refreshAllViews();
                ToastNotifications.info(`Transport ${id} removed from history`);
            }
        });
    }
}

function bindRequestCrudForm() {
    const form = document.getElementById('request-mutate-form');
    const cancelBtn = document.getElementById('request-form-cancel');
    if (!form) return;

    // Add name attributes to form fields for validation
    document.getElementById('req-patient').setAttribute('name', 'patient');
    document.getElementById('req-location').setAttribute('name', 'location');
    document.getElementById('req-contact').setAttribute('name', 'contact');
    document.getElementById('req-priority').setAttribute('name', 'priority');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        
        // Get existing contacts for duplicate checking
        const existingContacts = appState.requests.map(r => r.contact);
        const editId = document.getElementById('request-edit-id').value.trim();
        
        // If editing, exclude current contact from duplicate check
        if (editId) {
            const currentRequest = appState.requests.find(r => r.id === editId);
            if (currentRequest) {
                const index = existingContacts.indexOf(currentRequest.contact);
                if (index > -1) {
                    existingContacts.splice(index, 1);
                }
            }
        }
        
        // Validation rules
        const validationRules = {
            patient: [
                { type: 'required', message: 'Patient name' },
                { type: 'name', message: 'Patient name' }
            ],
            location: [
                { type: 'required', message: 'Location' },
                { type: 'location' }
            ],
            contact: [
                { type: 'required', message: 'Contact number' },
                { type: 'phone' },
                { type: 'duplicate', existingValues: existingContacts, message: 'Contact number' }
            ],
            priority: [
                { type: 'required', message: 'Priority' },
                { type: 'select', allowedValues: ['Low', 'Medium', 'High'] }
            ]
        };
        
        // Validate form
        const isValid = FormValidation.validateForm(form, validationRules);
        
        if (!isValid) {
            // Focus first error field
            const firstError = form.querySelector('.input-error');
            if (firstError) {
                firstError.focus();
            }
            return;
        }
        
        // If validation passes, proceed with form submission
        const patient = document.getElementById('req-patient').value.trim();
        const location = document.getElementById('req-location').value.trim();
        const contact = document.getElementById('req-contact').value.trim();
        const priority = document.getElementById('req-priority').value;

        if (editId) {
            const r = appState.requests.find((x) => x.id === editId);
            if (r && r.status === 'pending') {
                r.patient = patient;
                r.location = location;
                r.contact = contact;
                r.priority = priority;
            }
        } else {
            appState.requests.push({
                id: newRequestId(),
                patient,
                location,
                contact,
                time: formatRequestTime(),
                priority,
                status: 'pending',
            });
        }
        persistAppState();
        resetRequestForm();
        refreshAllViews();
    });

    // Add real-time validation on input
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateSingleField(input);
        });
        
        input.addEventListener('input', function() {
            // Clear error on typing
            if (input.classList.contains('input-error')) {
                FormValidation.removeError(input);
            }
        });
    });

    if (cancelBtn) {
        cancelBtn.addEventListener('click', resetRequestForm);
    }
}

// Function to validate a single field
function validateSingleField(inputElement) {
    const fieldName = inputElement.name || inputElement.id;
    const value = inputElement.value;
    
    let validationRules = [];
    
    switch(fieldName) {
        case 'patient':
            validationRules = [
                { type: 'required', message: 'Patient name' },
                { type: 'name', message: 'Patient name' }
            ];
            break;
        case 'location':
            validationRules = [
                { type: 'required', message: 'Location' },
                { type: 'location' }
            ];
            break;
        case 'contact':
            validationRules = [
                { type: 'required', message: 'Contact number' },
                { type: 'phone' }
            ];
            break;
        case 'priority':
            validationRules = [
                { type: 'required', message: 'Priority' },
                { type: 'select', allowedValues: ['Low', 'Medium', 'High'] }
            ];
            break;
    }
    
    // Run validation for this field
    for (const rule of validationRules) {
        let error = null;
        
        if (rule.type === 'required') {
            error = ValidationUtils.validateRequired(value, rule.message || fieldName);
        } else if (rule.type === 'name') {
            error = ValidationUtils.validateName(value, rule.message || fieldName);
        } else if (rule.type === 'location') {
            error = ValidationUtils.validateLocation(value);
        } else if (rule.type === 'phone') {
            error = ValidationUtils.validatePhone(value);
        } else if (rule.type === 'select') {
            error = ValidationUtils.validateSelect(value, rule.message || fieldName, rule.allowedValues);
        }
        
        if (error) {
            FormValidation.showError(inputElement, error);
            return;
        }
    }
    
    // If no errors, show success state (optional)
    FormValidation.removeError(inputElement);
}

function renderAssignedDispatch() {
    const container = document.getElementById('assigned-requests-container');
    if (!container) return;

    try {
        const assigned = appState.requests.filter((r) => r.status === 'assigned');
        const active = getActiveTransportRequest();

        // Update stats with error handling
        try {
            const totalEl = document.getElementById('dispatch-stat-total');
            const readyEl = document.getElementById('dispatch-stat-ready');
            const progEl = document.getElementById('dispatch-stat-progress');
            if (totalEl) totalEl.textContent = String(assigned.length + (active ? 1 : 0));
            if (readyEl) readyEl.textContent = String(assigned.length);
            if (progEl) progEl.textContent = String(active ? 1 : 0);
        } catch (error) {
            console.warn('Failed to update dispatch stats:', error);
        }

        if (assigned.length === 0) {
            // Show empty state with proper messaging
            container.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    <div class="empty-state-title">No Assigned Dispatches</div>
                    <div class="empty-state-description">You don't have any assigned ambulance requests. Accept pending requests from the Incoming Requests page to see them here.</div>
                    <div class="empty-state-action">
                        <a href="#ambulance-requests" class="btn btn-primary" data-page="ambulance-requests">View Incoming Requests</a>
                    </div>
                </div>
            `;
            return;
        }

        const html = assigned
            .map(
                (request) => {
                    const priorityClass = `priority-${request.priority.toLowerCase()}`;
                    return `
            <div class="dispatch-card">
                <div class="dispatch-card-header">
                    <div>
                        <h3 class="dispatch-patient">${escapeHtml(request.patient)}</h3>
                        <span class="dispatch-id">${escapeHtml(request.id)}</span>
                    </div>
                    <div class="dispatch-badges">
                        <span class="badge badge-green">Ready to Start</span>
                        <span class="priority-badge ${priorityClass}">${escapeHtml(request.priority)}</span>
                    </div>
                </div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-icon blue-bg">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        </div>
                        <div>
                            <p class="info-label">Pickup Address</p>
                            <p class="info-value">${escapeHtml(request.location)}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-icon teal-bg">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        </div>
                        <div>
                            <p class="info-label">Contact Number</p>
                            <p class="info-value">${escapeHtml(request.contact)}</p>
                        </div>
                    </div>
                </div>
                <div class="dispatch-actions">
                    ${!ChecklistManager.isComplete() 
                        ? `<div class="checklist-warning" style="color: #DC2626; font-size: 11px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">📋 Checklist Required</div>` 
                        : ''}
                    <button type="button" class="btn btn-teal start-transport-btn" 
                        data-id="${escapeHtml(request.id)}" 
                        ${getActiveTransportRequest() ? 'disabled title="Finish current transport first"' : ''}
                        ${!ChecklistManager.isComplete() ? 'disabled title="Complete ALL pre-departure checklist items to start"' : ''}>
                        Start Transport
                    </button>
                    <button type="button" class="btn-cancel cancel-assignment-btn" data-id="${escapeHtml(request.id)}">
                        Cancel Assignment
                    </button>
                </div>
            </div>`;
                }
            )
            .join('');
        
        safeSetInnerHTML(container, html);
    } catch (error) {
        ErrorHandler.handleApiError(error, 'load dispatches');
    }
}

function renderProgressTracker(stepIndex) {
        const tracker = document.getElementById('progress-tracker');
    if (!tracker) return;
    const maxIdx = TRANSPORT_STEPS.length - 1;
    const cur = Math.min(Math.max(0, stepIndex), maxIdx);
    const progressPercent = maxIdx > 0 ? (cur / maxIdx) * 100 : 100;

        tracker.innerHTML = `
            <div class="progress-line">
                <div class="progress-line-fill" style="height: ${progressPercent}%"></div>
            </div>
            <div class="progress-steps">
            ${TRANSPORT_STEPS.map((step, index) => {
                const isCompleted = index < cur;
                const isCurrent = index === cur;
                let statusClass = 'pending';
                    let statusText = '';
                    if (isCompleted) {
                        statusClass = 'completed';
                        statusText = '<p class="step-status completed">Completed</p>';
                    } else if (isCurrent) {
                        statusClass = 'current';
                        statusText = '<p class="step-status current">In Progress</p>';
                    }
                    return `
                        <div class="progress-step">
                        <div class="step-icon ${statusClass}">${step.icon}</div>
                            <div class="step-content">
                            <h3 class="${statusClass}">${escapeHtml(step.label)}</h3>
                                ${statusText}
                        </div>
                    </div>`;
                }).join('')}
        </div>`;
}

function renderActiveTransport() {
    const empty = document.getElementById('active-transport-empty');
    const panel = document.getElementById('active-transport-panel');
    const actions = document.getElementById('active-transport-actions');
    const nextBtn = document.getElementById('next-step-btn');
    const completeBtn = document.getElementById('complete-transport-btn');
    const etaBanner = document.getElementById('eta-banner');

    const active = getActiveTransportRequest();

    if (!active) {
        if (empty) empty.style.display = 'block';
        if (panel) panel.style.display = 'none';
        if (actions) actions.style.display = 'none';
        if (etaBanner) etaBanner.style.display = 'none';
        // Stop any running ETA timer
        if (active) ETATimer.stopTimer(active.id);
        return;
    }

    if (empty) empty.style.display = 'none';
    if (panel) panel.style.display = 'block';
    if (actions) actions.style.display = 'flex';
    if (etaBanner) etaBanner.style.display = 'flex';

    const nameEl = document.getElementById('active-patient-name');
    const phoneEl = document.getElementById('active-patient-phone');
    const locEl = document.getElementById('active-patient-location');
    if (nameEl) nameEl.textContent = active.patient;
    if (phoneEl) phoneEl.textContent = active.contact;
    if (locEl) locEl.textContent = active.location;

    let step = active.stepIndex != null ? active.stepIndex : 0;
    if (step < 0) step = 0;
    if (step >= TRANSPORT_STEPS.length) step = TRANSPORT_STEPS.length - 1;
    active.stepIndex = step;

    renderProgressTracker(step);

    // Update ETA timer
    const currentStep = TRANSPORT_STEPS[step];
    const etaStepInfo = document.getElementById('eta-current-step');
    if (etaStepInfo) {
        etaStepInfo.textContent = currentStep.label;
    }

    // Start or update ETA timer
    ETATimer.startTimer(active.id, step);

    const lastStep = TRANSPORT_STEPS.length - 1;
    if (nextBtn) {
        nextBtn.style.display = step < lastStep ? 'block' : 'none';
    }
    if (completeBtn) {
        completeBtn.style.display = step >= lastStep ? 'block' : 'none';
    }
}

function bindActiveTransportControls() {
    const nextBtn = document.getElementById('next-step-btn');
    const completeBtn = document.getElementById('complete-transport-btn');

    // Map step index to backend AmbulanceStatus enum values
    const STEP_TO_BACKEND_STATUS = [
        'Dispatched',   // Step 0: Dispatch Accepted
        'En Route',     // Step 1: Ambulance En Route
        'Picked Up',    // Step 2: Patient Picked Up
        'At Hospital',  // Step 3: Reached Hospital
        'Completed'     // Step 4: Transport Completed
    ];

    if (nextBtn) {
        nextBtn.addEventListener('click', async function () {
            const r = getActiveTransportRequest();
            if (!r) return;
            const lastStep = TRANSPORT_STEPS.length - 1;
            if (r.stepIndex < lastStep) {
                r.stepIndex++;
                const backendStatus = STEP_TO_BACKEND_STATUS[r.stepIndex] || 'En Route';
                if (window.NexCareAPI) {
                    await window.NexCareAPI.Ambulance.updateRequest(r.id, { stepIndex: r.stepIndex, status: backendStatus });
                }
                persistAppState();
                await refreshAllViews();
            }
        });
    }

    if (completeBtn) {
        completeBtn.addEventListener('click', async function () {
            const r = getActiveTransportRequest();
            if (!r) return;
            r.status = 'completed';
            r.completedDate = formatCompletedDate();
            r.completedTime = formatRequestTime();
            if (window.NexCareAPI) {
                await window.NexCareAPI.Ambulance.updateRequest(r.id, { 
                    status: 'Completed',
                    completedDate: r.completedDate,
                    completedTime: r.completedTime
                });
            }
            
            // Log the transport completion to recent system activity (FR-12)
            if (window.NexCareStore && window.NexCareStore.logActivity) {
                window.NexCareStore.logActivity('Complete', 'Ambulance', `Transport for ${r.patient} (ID: ${r.id}) completed successfully.`);
            }

            delete r.stepIndex;
            persistAppState();
            
            // Stop the timer
            if (typeof ETATimer !== 'undefined' && ETATimer.stopTimer) {
                ETATimer.stopTimer(r.id);
            }
            
            ToastNotifications.success(`Transport for ${r.patient} completed successfully!`);
            // Navigate to completed transports page (this will refresh data)
            await SessionManager.navigateToPage('completed-transports');
        });
    }
}

function renderCompletedTransports() {
    const tbody = document.getElementById('completed-transports-tbody');
    if (!tbody) return;

    try {
        const completed = [...appState.requests]
            .filter((r) => r.status === 'completed')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Newest first

        // Update dynamic stats with error handling
        try {
            updateCompletedTransportStats(completed);
        } catch (error) {
            console.warn('Failed to update completed transport stats:', error);
        }

        if (completed.length === 0) {
            // ... (keep empty state logic)
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="8">
                        <div class="empty-state">
                            <svg class="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <div class="empty-state-title">No Completed Transports</div>
                            <div class="empty-state-description">No ambulance transports have been completed yet. Completed transports will appear here with detailed information.</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const html = completed
            .map(
                (t) => {
                    const priorityClass = `priority-${(t.priority || 'Medium').toLowerCase()}`;
                    return `
        <tr>
            <td><span class="request-id">${escapeHtml(t.id)}</span></td>
            <td><span class="patient-name">${escapeHtml(t.patient)}</span></td>
            <td><span class="text-gray">${escapeHtml(t.location)}</span></td>
            <td><span class="text-gray">${escapeHtml(t.completedDate || '—')}</span></td>
            <td><span class="text-gray">${escapeHtml(t.completedTime || '—')}</span></td>
            <td><span class="priority-badge ${priorityClass}">${escapeHtml(t.priority)}</span></td>
            <td><span class="badge badge-green">Completed</span></td>
            <td>
                <button type="button" class="btn btn-danger btn-sm delete-completed-btn" data-id="${escapeHtml(t.id)}">Delete</button>
            </td>
        </tr>`;
                }
            )
            .join('');
        
        safeSetInnerHTML(tbody, html);
    } catch (error) {
        ErrorHandler.handleApiError(error, 'load completed transports');
        ErrorHandler.showError('completed-transports-tbody', 'Failed to Load History', 'Unable to load completed transport history. Please refresh the page.');
    }
}

function updateCompletedTransportStats(completed) {
    try {
        // 1. Total Completed (dynamic)
        const totalEl = document.getElementById('stat-total-completed');
        const totalSubEl = document.getElementById('stat-completed-sub');
        if (totalEl) totalEl.textContent = String(completed.length);
        if (totalSubEl) {
            totalSubEl.textContent = completed.length === 1
                ? '1 transport done'
                : `${completed.length} transports done`;
        }

        // 2. Pending Requests (live count from all requests)
        const pendingEl = document.getElementById('stat-pending-count');
        const pendingSubEl = document.getElementById('stat-pending-sub');
        if (pendingEl) {
            const pendingCount = appState.requests.filter(r => r.status === 'pending').length;
            pendingEl.textContent = String(pendingCount);
            if (pendingSubEl) {
                pendingSubEl.textContent = pendingCount === 0
                    ? 'No pending requests'
                    : pendingCount === 1
                    ? '1 request awaiting acceptance'
                    : `${pendingCount} requests awaiting acceptance`;
            }
        }

        // 3. Latest Transport (most recently completed)
        const latestPatientEl = document.getElementById('stat-latest-patient');
        const latestTimeEl = document.getElementById('stat-latest-time');
        if (latestPatientEl && latestTimeEl) {
            if (completed.length > 0) {
                const latest = completed[0];
                latestPatientEl.textContent = latest.patient || '—';
                const dateStr = latest.completedDate || '';
                const timeStr = latest.completedTime || '';
                latestTimeEl.textContent = dateStr && timeStr
                    ? `${dateStr} at ${timeStr}`
                    : dateStr || timeStr || 'Time not recorded';
            } else {
                latestPatientEl.textContent = '—';
                latestTimeEl.textContent = 'No completed transport yet';
            }
        }
    } catch (error) {
        console.warn('Failed to update completed transport stats:', error);
    }
}

function exportCompletedTransports() {
    try {
        const completed = appState.requests.filter((r) => r.status === 'completed');
        
        if (completed.length === 0) {
            ToastNotifications.warning('No completed transports to export');
            return;
        }

        // Validate data integrity
        if (!completed.every(t => t.id && t.patient)) {
            ToastNotifications.error('Some transport data is incomplete and cannot be exported');
            return;
        }

        // Prepare CSV data with error handling
        const csvData = completed.map(t => {
            try {
                return {
                    'Transport ID': t.id || 'Unknown',
                    'Patient Name': t.patient || 'Unknown',
                    'Pickup Location': t.location || 'Unknown',
                    'Completed Date': t.completedDate || '',
                    'Completed Time': t.completedTime || '',
                    'Priority Level': t.priority || 'Unknown',
                    'Status': t.status || 'Unknown'
                };
            } catch (error) {
                console.warn('Error processing transport record:', t, error);
                return null;
            }
        }).filter(Boolean); // Remove null entries

        if (csvData.length === 0) {
            ToastNotifications.error('No valid transport data available for export');
            return;
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `completed-transports-${timestamp}.csv`;

        // Download CSV with error handling
        try {
            CSVExport.downloadCSV(csvData, filename);
            ToastNotifications.success(`Exported ${csvData.length} transports to ${filename}`);
        } catch (error) {
            ErrorHandler.handleApiError(error, 'download CSV');
            ToastNotifications.error('Failed to download CSV file. Please try again.');
        }
    } catch (error) {
        ErrorHandler.handleApiError(error, 'export transports');
        ToastNotifications.error('Failed to export transports. Please try again.');
    }
}

function syncProfileQuickStats() {
    const completed = appState.requests.filter(r => r.status === 'completed');
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Total completed transports
    const totalEl = document.getElementById('qs-total');
    if (totalEl) totalEl.textContent = String(completed.length);

    // Completed transports this month
    const thisMonth = completed.filter(r => {
        if (!r.completedDate) return false;
        const d = new Date(r.completedDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthEl = document.getElementById('qs-month');
    if (monthEl) monthEl.textContent = String(thisMonth.length);

    // Success Rate = completed / all requests that were accepted (assigned + active + completed)
    const accepted = appState.requests.filter(r =>
        r.status === 'assigned' || r.status === 'active' || r.status === 'completed'
    ).length;
    const rateEl = document.getElementById('qs-rate');
    if (rateEl) {
        rateEl.textContent = accepted > 0
            ? `${Math.round((completed.length / accepted) * 100)}%`
            : '—';
    }
}

function initProfile() {
    syncProfileQuickStats(); // Populate Quick Stats on load
    const formData = {
        name: appState.profile.name,
        phone: appState.profile.phone,
        vehicle: appState.profile.vehicle,
        status: appState.profile.status,
    };

    const editBtn = document.getElementById('edit-profile-btn');
    const saveBtn = document.getElementById('save-profile-btn');
    const cancelBtn = document.getElementById('cancel-profile-btn');
    const formActions = document.getElementById('profile-actions');
    const profileForm = document.getElementById('profile-form');

    const nameInput = document.getElementById('profile-name');
    const phoneInput = document.getElementById('profile-phone');
    const vehicleInput = document.getElementById('profile-vehicle');
    const statusSelect = document.getElementById('profile-status');

    // Enforce 10-digit only input on the phone field
    phoneInput.setAttribute('maxlength', '10');
    phoneInput.setAttribute('inputmode', 'numeric');
    phoneInput.setAttribute('pattern', '[0-9]{10}');
    phoneInput.addEventListener('input', function () {
        // Strip any non-digit character as user types
        const clean = this.value.replace(/\D/g, '').slice(0, 10);
        if (this.value !== clean) this.value = clean;
    });
    phoneInput.addEventListener('keydown', function (e) {
        // Allow: backspace, delete, tab, escape, arrows, home, end
        const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (allowed.includes(e.key)) return;
        // Block non-digit keys
        if (!/^\d$/.test(e.key)) e.preventDefault();
    });

    // Add name attributes to form fields for validation
    nameInput.setAttribute('name', 'name');
    phoneInput.setAttribute('name', 'phone');
    vehicleInput.setAttribute('name', 'vehicle');
    statusSelect.setAttribute('name', 'status');

    function updateDisplayValues() {
        document.getElementById('profile-display-name').textContent = formData.name;
        document.getElementById('profile-display-phone').textContent = formData.phone;
        document.getElementById('profile-display-vehicle').textContent = formData.vehicle;
        
        const badge = document.getElementById('profile-status-badge');
        badge.textContent = formData.status;
        badge.className = 'badge';
        
        switch (formData.status) {
            case 'Available':
                badge.classList.add('badge-green');
                break;
            case 'On Duty':
                badge.classList.add('badge-blue');
                break;
            case 'Off Duty':
                badge.classList.add('badge-gray');
                break;
        }

        appState.profile = { ...formData };
        persistAppState();
        syncDashboardUserName();
    }

    function setEditMode(editing) {
        nameInput.disabled = !editing;
        phoneInput.disabled = !editing;
        vehicleInput.disabled = !editing;
        statusSelect.disabled = !editing;

        if (editing) {
            editBtn.style.display = 'none';
            formActions.style.display = 'flex';
        } else {
            editBtn.style.display = 'block';
            formActions.style.display = 'none';
            // Clear validation errors when exiting edit mode
            FormValidation.clearAllErrors(profileForm);
        }
    }

    function validateProfileForm() {
        // Validation rules
        const validationRules = {
            name: [
                { type: 'required', message: 'Full name' },
                { type: 'name', message: 'Full name' }
            ],
            phone: [
                { type: 'required', message: 'Phone number' },
                { type: 'phone' }
            ],
            vehicle: [
                { type: 'required', message: 'Vehicle number' },
                { type: 'vehicle' }
            ],
            status: [
                { type: 'required', message: 'Status' },
                { type: 'select', allowedValues: ['Available', 'On Duty', 'Off Duty'] }
            ]
        };
        
        return FormValidation.validateForm(profileForm, validationRules);
    }

    // Add real-time validation for profile fields
    function addProfileFieldValidation() {
        const inputs = profileForm.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                if (!input.disabled) {
                    validateProfileSingleField(input);
                }
            });
            
            input.addEventListener('input', function() {
                // Clear error on typing
                if (input.classList.contains('input-error')) {
                    FormValidation.removeError(input);
                }
            });
        });
    }

    // Function to validate a single profile field
    function validateProfileSingleField(inputElement) {
        const fieldName = inputElement.name || inputElement.id;
        const value = inputElement.value;
        
        let validationRules = [];
        
        switch(fieldName) {
            case 'name':
                validationRules = [
                    { type: 'required', message: 'Full name' },
                    { type: 'name', message: 'Full name' }
                ];
                break;
            case 'phone':
                validationRules = [
                    { type: 'required', message: 'Phone number' },
                    { type: 'phone' }
                ];
                break;
            case 'vehicle':
                validationRules = [
                    { type: 'required', message: 'Vehicle number' },
                    { type: 'vehicle' }
                ];
                break;
            case 'status':
                validationRules = [
                    { type: 'required', message: 'Status' },
                    { type: 'select', allowedValues: ['Available', 'On Duty', 'Off Duty'] }
                ];
                break;
        }
        
        // Run validation for this field
        for (const rule of validationRules) {
            let error = null;
            
            if (rule.type === 'required') {
                error = ValidationUtils.validateRequired(value, rule.message || fieldName);
            } else if (rule.type === 'name') {
                error = ValidationUtils.validateName(value, rule.message || fieldName);
            } else if (rule.type === 'phone') {
                error = ValidationUtils.validatePhone(value);
            } else if (rule.type === 'vehicle') {
                error = ValidationUtils.validateVehicle(value);
            } else if (rule.type === 'select') {
                error = ValidationUtils.validateSelect(value, rule.message || fieldName, rule.allowedValues);
            }
            
            if (error) {
                FormValidation.showError(inputElement, error);
                return;
            }
        }
        
        // If no errors, remove error state
        FormValidation.removeError(inputElement);
    }

    nameInput.value = formData.name;
    phoneInput.value = formData.phone;
    vehicleInput.value = formData.vehicle;
    statusSelect.value = formData.status;

    editBtn.addEventListener('click', function () {
        setEditMode(true);
        // Focus first field for better UX
        setTimeout(() => nameInput.focus(), 100);
    });

    saveBtn.addEventListener('click', function () {
        // Validate form before saving
        const isValid = validateProfileForm();
        
        if (!isValid) {
            // Focus first error field
            const firstError = profileForm.querySelector('.input-error');
            if (firstError) {
                firstError.focus();
            }
            return;
        }
        
        // If validation passes, save the data
        formData.name = nameInput.value.trim();
        formData.phone = phoneInput.value.trim();
        formData.vehicle = vehicleInput.value.trim().toUpperCase();
        formData.status = statusSelect.value;

        updateDisplayValues();
        setEditMode(false);
    });

    cancelBtn.addEventListener('click', function () {
        nameInput.value = formData.name;
        phoneInput.value = formData.phone;
        vehicleInput.value = formData.vehicle;
        statusSelect.value = formData.status;

        setEditMode(false);
    });

    // Add field validation
    addProfileFieldValidation();
    
    updateDisplayValues();
}

document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    // Initialize navigation history
    NavigationHistory.init();

    function showPage(pageId) {
        pages.forEach((page) => page.classList.remove('active'));
        navLinks.forEach((link) => link.classList.remove('active'));

        const targetPage = document.getElementById(pageId + '-page');
        if (targetPage) {
            targetPage.classList.add('active');
        }

        const activeLink = document.querySelector(`[data-page="${pageId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Update navigation history
        NavigationHistory.navigateToPage(pageId);
    }

    navLinks.forEach((link) => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            showPage(pageId);
            window.location.hash = pageId;
        });
    });

    function handleHashChange() {
        const hash = window.location.hash.slice(1);
        if (hash) {
            showPage(hash);
        }
    }

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    const headerEl = document.querySelector('.header-container');
    const logoContainer = document.querySelector('.header-container .logo-container');
    const mainContent = document.querySelector('.main-content');

    function goDashboard() {
        showPage('dashboard');
        window.location.hash = 'dashboard';
    }

    if (logoContainer) {
        logoContainer.addEventListener('click', goDashboard);
        logoContainer.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goDashboard();
            }
        });
    }

    if (headerEl && mainContent) {
        mainContent.addEventListener('scroll', function () {
            headerEl.classList.toggle('scrolled', mainContent.scrollTop > 50);
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

        const t = e.target;
        const tag = t && t.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) {
            return;
        }

        const activeLink = document.querySelector('.nav-link.active');
        if (!activeLink) return;

        const allLinks = Array.from(navLinks);
        const currentIndex = allLinks.indexOf(activeLink);
        if (currentIndex === -1) return;

        e.preventDefault();

        if (e.key === 'ArrowDown') {
            const nextIndex = (currentIndex + 1) % allLinks.length;
            allLinks[nextIndex].click();
            allLinks[nextIndex].focus();
        } else {
            const prevIndex = (currentIndex - 1 + allLinks.length) % allLinks.length;
            allLinks[prevIndex].click();
            allLinks[prevIndex].focus();
        }
    });

    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            if (confirm('Are you sure you want to logout?')) {
                alert('Logging out...');
            }
        });
    }

    // Export button functionality
    const exportBtn = document.querySelector('.btn-with-icon');
    if (exportBtn && exportBtn.textContent.includes('Export')) {
        exportBtn.addEventListener('click', exportCompletedTransports);
    }

    // Call Patient button functionality
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'call-patient-btn') {
            const activeRequest = getActiveTransportRequest();
            if (activeRequest) {
                ToastNotifications.info(`Calling ${activeRequest.patient} at ${activeRequest.contact}...`);
                // In a real app, this would integrate with phone system
                setTimeout(() => {
                    ToastNotifications.success(`Call initiated to ${activeRequest.patient}`);
                }, 1500);
            }
        }
    });

    // Initialize checklist persistence
    ChecklistManager.bindCheckboxes();

    // bindRequestCrudForm() - Removed as per SRS compliance (Ambulance Staff cannot create/edit requests)
    bindActiveTransportControls();
    resetRequestForm();
    initProfile();
    refreshAllViews();
    
    // Initialize validation tests if on validation tests page
    if (window.location.hash === '#validation-tests') {
        runValidationTests();
    }
});

// Validation Tests Integration
function runValidationTests() {
    const resultsDiv = document.getElementById('test-results');
    if (!resultsDiv) return;
    
    // Test cases
    const testCases = [
        // Required field tests
        { name: 'Empty name', test: () => ValidationUtils.validateRequired('', 'Name'), expected: 'Name is required' },
        { name: 'Empty email', test: () => ValidationUtils.validateEmail(''), expected: 'Email is required' },
        { name: 'Empty phone', test: () => ValidationUtils.validatePhone(''), expected: 'Phone number is required' },
        
        // Email validation tests
        { name: 'Valid email', test: () => ValidationUtils.validateEmail('test@example.com'), expected: null },
        { name: 'Invalid email - no @', test: () => ValidationUtils.validateEmail('testexample.com'), expected: 'Invalid email format' },
        { name: 'Invalid email - no domain', test: () => ValidationUtils.validateEmail('test@'), expected: 'Invalid email format' },
        { name: 'Invalid email - spaces', test: () => ValidationUtils.validateEmail('test @example.com'), expected: 'Invalid email format' },
        
        // Phone validation tests
        { name: 'Valid phone - US format', test: () => ValidationUtils.validatePhone('+1 (555) 123-4567'), expected: null },
        { name: 'Valid phone - simple', test: () => ValidationUtils.validatePhone('5551234567'), expected: null },
        { name: 'Valid phone - international', test: () => ValidationUtils.validatePhone('+44 20 1234 5678'), expected: null },
        { name: 'Invalid phone - letters', test: () => ValidationUtils.validatePhone('abc1234567'), expected: 'Invalid phone number format' },
        { name: 'Invalid phone - too short', test: () => ValidationUtils.validatePhone('123'), expected: 'Invalid phone number format' },
        
        // Name validation tests
        { name: 'Valid name', test: () => ValidationUtils.validateName('John Smith'), expected: null },
        { name: 'Valid name with hyphen', test: () => ValidationUtils.validateName('Mary-Jane Watson'), expected: null },
        { name: 'Valid name with apostrophe', test: () => ValidationUtils.validateName("O'Connor"), expected: null },
        { name: 'Invalid name - too short', test: () => ValidationUtils.validateName('A'), expected: 'Name must be at least 2 characters' },
        { name: 'Invalid name - numbers', test: () => ValidationUtils.validateName('John123'), expected: 'Name can only contain letters, spaces, hyphens, and apostrophes' },
        { name: 'Invalid name - special chars', test: () => ValidationUtils.validateName('John@Smith'), expected: 'Name can only contain letters, spaces, hyphens, and apostrophes' },
        { name: 'Invalid name - too long', test: () => ValidationUtils.validateName('A'.repeat(51)), expected: 'Name must be less than 50 characters' },
        
        // Vehicle validation tests
        { name: 'Valid vehicle', test: () => ValidationUtils.validateVehicle('AMB-123'), expected: null },
        { name: 'Valid vehicle - simple', test: () => ValidationUtils.validateVehicle('AMB123'), expected: null },
        { name: 'Invalid vehicle - too short', test: () => ValidationUtils.validateVehicle('AB'), expected: 'Vehicle number must be 3-10 characters (letters, numbers, hyphens only)' },
        { name: 'Invalid vehicle - too long', test: () => ValidationUtils.validateVehicle('AMB-12345678'), expected: 'Vehicle number must be 3-10 characters (letters, numbers, hyphens only)' },
        { name: 'Invalid vehicle - special chars', test: () => ValidationUtils.validateVehicle('AMB@123'), expected: 'Vehicle number must be 3-10 characters (letters, numbers, hyphens only)' },
        
        // Location validation tests
        { name: 'Valid location', test: () => ValidationUtils.validateLocation('123 Main Street, Downtown'), expected: null },
        { name: 'Valid location with number', test: () => ValidationUtils.validateLocation('Building #5, Oak Avenue'), expected: null },
        { name: 'Invalid location - too short', test: () => ValidationUtils.validateLocation('123'), expected: 'Location must be at least 5 characters' },
        { name: 'Invalid location - too long', test: () => ValidationUtils.validateLocation('A'.repeat(101)), expected: 'Location must be less than 100 characters' },
        { name: 'Invalid location - special chars', test: () => ValidationUtils.validateLocation('123 Main @ Street'), expected: 'Location contains invalid characters' }
    ];

    // Clear previous results
    resultsDiv.innerHTML = '';
    
    let passCount = 0;
    let failCount = 0;
    
    // Create test results container
    const testResultsHtml = testCases.map(testCase => {
        try {
            const result = testCase.test();
            const passed = result === testCase.expected;
            
            if (passed) {
                passCount++;
            } else {
                failCount++;
            }
            
            return `
                <div class="test-case ${passed ? 'pass' : 'fail'}">
                    <h3>${testCase.name}</h3>
                    <p><strong>Expected:</strong> ${testCase.expected || 'null'}</p>
                    <p><strong>Actual:</strong> ${result || 'null'}</p>
                    <div class="test-result">${passed ? '✅ PASS' : '❌ FAIL'}</div>
                </div>
            `;
            
        } catch (error) {
            failCount++;
            return `
                <div class="test-case fail">
                    <h3>${testCase.name}</h3>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <div class="test-result">❌ FAIL (Exception)</div>
                </div>
            `;
        }
    }).join('');
    
    // Add summary
    const summaryHtml = `
        <div class="test-summary">
            <h2>Test Summary</h2>
            <p><strong>Total Tests:</strong> ${testCases.length}</p>
            <p><strong>Passed:</strong> <span class="pass-count">${passCount}</span></p>
            <p><strong>Failed:</strong> <span class="fail-count">${failCount}</span></p>
            <p><strong>Success Rate:</strong> ${((passCount / testCases.length) * 100).toFixed(1)}%</p>
        </div>
    `;
    
    resultsDiv.innerHTML = testResultsHtml + summaryHtml;
    
    // Show notification
    ToastNotifications.info(`Validation tests completed: ${passCount}/${testCases.length} passed`);
}

// Add validation test runner to navigation
document.addEventListener('DOMContentLoaded', function() {
    const originalShowPage = window.showPage;
    window.showPage = function(pageId) {
        if (pageId === 'validation-tests') {
            setTimeout(() => runValidationTests(), 100);
        }
        return originalShowPage ? originalShowPage(pageId) : null;
    };
});

// Profile Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeProfile();
});

function initializeProfile() {
    // Profile editing functionality
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const cancelProfileBtn = document.getElementById('cancel-profile-btn');
    const profileForm = document.getElementById('profile-form');
    const profileInputs = profileForm ? profileForm.querySelectorAll('.form-input') : [];
    
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            enableProfileEditing();
        });
    }
    
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', function() {
            saveProfileChanges();
        });
    }
    
    if (cancelProfileBtn) {
        cancelProfileBtn.addEventListener('click', function() {
            cancelProfileEditing();
        });
    }
    
    function enableProfileEditing() {
        profileInputs.forEach(input => {
            input.disabled = false;
        });
        
        document.getElementById('profile-actions').style.display = 'flex';
        document.getElementById('edit-profile-btn').style.display = 'none';
    }
    
    function cancelProfileEditing() {
        // Reset to original values
        document.getElementById('profile-name').value = 'Alex Martinez';
        document.getElementById('profile-phone').value = '+1 (555) 987-6543';
        document.getElementById('profile-vehicle').value = 'AMB-05';
        document.getElementById('profile-status').value = 'Available';
        
        profileInputs.forEach(input => {
            input.disabled = true;
        });
        
        document.getElementById('profile-actions').style.display = 'none';
        document.getElementById('edit-profile-btn').style.display = 'block';
    }
    
    function saveProfileChanges() {
        // Validate form data
        const name = document.getElementById('profile-name').value.trim();
        const phone = document.getElementById('profile-phone').value.trim();
        const vehicle = document.getElementById('profile-vehicle').value.trim();
        const status = document.getElementById('profile-status').value;
        
        // Basic validation
        if (!name) {
            showNotification('Name is required', 'error');
            return;
        }
        
        if (!phone) {
            showNotification('Phone number is required', 'error');
            return;
        }
        
        if (!vehicle) {
            showNotification('Vehicle number is required', 'error');
            return;
        }
        
        // Phone number validation
        const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
        if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
            showNotification('Invalid phone number format', 'error');
            return;
        }
        
        // Vehicle number validation
        if (vehicle.length < 3 || vehicle.length > 10) {
            showNotification('Vehicle number must be 3-10 characters', 'error');
            return;
        }
        
        // Save to localStorage (in a real app, this would be sent to server)
        const profileData = {
            name,
            phone,
            vehicle,
            status,
            updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('ambulanceProfile', JSON.stringify(profileData));
        
        // Update UI
        updateProfileUI(profileData);
        
        // Disable editing
        profileInputs.forEach(input => {
            input.disabled = true;
        });
        
        document.getElementById('profile-actions').style.display = 'none';
        document.getElementById('edit-profile-btn').style.display = 'block';
        
        // Show success message
        showNotification('Profile updated successfully!', 'success');
    }
    
    function updateProfileUI(data) {
        // Update profile header
        const profileName = document.querySelector('.profile-name');
        if (profileName) profileName.textContent = data.name;
        
        // Update contact information
        const contactItems = document.querySelectorAll('.contact-item span');
        if (contactItems[0]) contactItems[0].textContent = data.phone;
        if (contactItems[1]) contactItems[1].textContent = data.vehicle;
        
        // Update status badge
        const statusBadge = document.querySelector('.status-badge');
        if (statusBadge) {
            const statusClass = data.status.toLowerCase().replace(' ', '-');
            statusBadge.className = `status-badge ${statusClass}`;
            statusBadge.innerHTML = `<span class="status-dot"></span>${data.status}`;
        }
    }
    
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#10b981';
                break;
            case 'error':
                notification.style.backgroundColor = '#ef4444';
                break;
            default:
                notification.style.backgroundColor = '#3b82f6';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Load saved profile data if exists
    function loadSavedProfile() {
        const savedProfile = localStorage.getItem('ambulanceProfile');
        if (savedProfile) {
            try {
                const profileData = JSON.parse(savedProfile);
                
                // Update form fields
                document.getElementById('profile-name').value = profileData.name || 'Alex Martinez';
                document.getElementById('profile-phone').value = profileData.phone || '+1 (555) 987-6543';
                document.getElementById('profile-vehicle').value = profileData.vehicle || 'AMB-05';
                document.getElementById('profile-status').value = profileData.status || 'Available';
                
                // Update UI elements
                updateProfileUI(profileData);
                
            } catch (error) {
                console.error('Error loading saved profile:', error);
            }
        }
    }
    
    // Initialize profile data
    loadSavedProfile();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+E to edit profile
        if (e.ctrlKey && e.key === 'e' && profileInputs[0]) {
            e.preventDefault();
            enableProfileEditing();
        }
        
        // Escape to cancel editing
        if (e.key === 'Escape' && document.getElementById('profile-actions') && document.getElementById('profile-actions').style.display === 'flex') {
            cancelProfileEditing();
        }
        
        // Ctrl+S to save when editing
        if (e.ctrlKey && e.key === 's' && document.getElementById('profile-actions') && document.getElementById('profile-actions').style.display === 'flex') {
            e.preventDefault();
            saveProfileChanges();
        }
    });
    
    // Add form validation on input
    profileInputs.forEach(input => {
        input.addEventListener('input', function() {
            // Clear any error states
            this.style.borderColor = '';
            
            // Real-time validation for specific fields
            if (this.id === 'profile-phone') {
                const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
                const cleanPhone = this.value.replace(/[\s\-\(\)]/g, '');
                
                if (cleanPhone.length > 0 && !phoneRegex.test(cleanPhone)) {
                    this.style.borderColor = '#ef4444';
                } else {
                    this.style.borderColor = '#10b981';
                }
            }
            
            if (this.id === 'profile-vehicle') {
                if (this.value.length > 0 && (this.value.length < 3 || this.value.length > 10)) {
                    this.style.borderColor = '#ef4444';
                } else {
                    this.style.borderColor = '#10b981';
                }
            }
        });
    });
}

// Missing initialization functions for seamless navigation
function initializeNavigation() {
    // Navigation is handled by SessionManager.setupNavigation()
    console.log('Navigation initialized');
}

function initializeDashboard() {
    // Use DynamicRenderer to render dashboard
    DynamicRenderer.init();
    console.log('Dashboard initialized dynamically');
}

function initializeAmbulanceRequests() {
    // Load ambulance requests
    loadAmbulanceRequests();
    console.log('Ambulance requests initialized');
}

function initializeAssignedDispatch() {
    // Load assigned dispatch
    loadAssignedDispatch();
    console.log('Assigned dispatch initialized');
}

function initializeActiveTransport() {
    // Load active transport
    loadActiveTransport();
    console.log('Active transport initialized');
}

function initializeCompletedTransports() {
    // Load completed transports
    loadCompletedTransports();
    console.log('Completed transports initialized');
}

function initializeLogout() {
    // Logout is handled by SessionManager.setupLogout()
    console.log('Logout initialized');
}

// Dynamic UI Rendering System
const DynamicRenderer = {
    // Get data from appState cache (populated by async loadAppState)
    getData: function() {
        const requests = appState.requests || [];

        return {
            requests: requests,
            stats: {
                pending:   requests.filter(r => r.status === 'pending').length,
                assigned:  requests.filter(r => r.status === 'assigned').length,
                active:    requests.filter(r => r.status === 'in_transit').length,
                completed: requests.filter(r => r.status === 'completed').length
            }
        };
    },

    // Async refresh: fetches live data from backend, then re-renders
    refreshAsync: async function() {
        try {
            const api = window.NexCareAPI;
            if (!api || !api.Ambulance) return;
            const res = await api.Ambulance.getAllRequests();
            const requests = (res && res.data) || [];
            const stats = {
                pending:   requests.filter(r => r.status && r.status.toLowerCase() === 'pending').length,
                assigned:  requests.filter(r => r.status && r.status.toLowerCase() === 'dispatched').length,
                active:    requests.filter(r => r.status && ['en route', 'picked up', 'at hospital'].includes(r.status.toLowerCase())).length,
                completed: requests.filter(r => r.status && r.status.toLowerCase() === 'completed').length
            };
            // Re-render with live data
            Object.keys(stats).forEach(key => {
                const el = document.getElementById(`stat-${key}`);
                if (el) el.textContent = stats[key];
            });
            this._liveRequests = requests;
            this.renderRecentRequests(true);
        } catch (e) {
            console.warn('Ambulance async refresh failed:', e);
        }
    },

    
    // Initialize dynamic rendering
    init: function() {
        this.renderDashboard();
        this.renderStats(false);
        this.renderRecentRequests(false);
        this.setupRoleBasedUI();
        // Kick off async refresh to populate with live backend data
        setTimeout(() => this.refreshAsync(), 100);
    },
    
    // Render dashboard statistics dynamically
    renderStats: function(isBackground = false) {
        const data = this.getData();
        const stats = data.stats;
        
        Object.keys(stats).forEach(key => {
            const element = document.getElementById(`stat-${key}`);
            if (element) {
                element.textContent = stats[key];
            }
        });
    },
    
    // Animate number counting
    animateNumber: function(element, start, end, duration) {
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * progress);
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    },
    
    // Render recent requests table dynamically
    renderRecentRequests: function(isBackground = false) {
        const data = this.getData();
        const tbody = document.getElementById('dashboard-recent-tbody');
        if (!tbody) return;
        
        // Clear existing content
        tbody.innerHTML = '';
        
        // Check for empty data
        if (data.requests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #6b7280;">
                        <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                        <p style="font-size: 16px; font-weight: 500; margin-bottom: 8px;">No ambulance requests found</p>
                        <p style="font-size: 14px;">New requests will appear here when they are created.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Generate table rows dynamically (Sorted newest first)
        const sortedRequests = [...data.requests]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        sortedRequests.forEach((request, index) => {
            const row = this.createRequestRow(request);
            tbody.appendChild(row);
            
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
            
            // SKIP ANIMATIONS IF BACKGROUND (FR-13)
            if (isBackground) {
                row.style.transition = 'none';
            }
        });
    },
    
    // Create individual request row
    createRequestRow: function(request) {
        const row = document.createElement('tr');
        row.style.cssText = `
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
        `;
        
        row.innerHTML = `
            <td>${request.id}</td>
            <td>${request.patient || 'Emergency Request'}</td>
            <td>${request.location || 'Unknown Location'}</td>
            <td>${request.time || '12:00 PM'}</td>
            <td>${this.createPriorityBadge(request.priority || 'high')}</td>
            <td>${this.createStatusBadge(request.status)}</td>
        `;
        
        // Add click handler for row selection
        row.addEventListener('click', () => {
            this.selectRequest(request);
        });
        
        // Add hover effects
        row.addEventListener('mouseenter', () => {
            row.style.backgroundColor = '#f9fafb';
        });
        
        row.addEventListener('mouseleave', () => {
            row.style.backgroundColor = '';
        });
        
        return row;
    },
    
    // Create priority badge dynamically
    createPriorityBadge: function(priority) {
        const colors = {
            high: '#ef4444',
            medium: '#f59e0b',
            low: '#10b981'
        };
        
        return `<span class="priority-badge ${priority}" style="background-color: ${colors[priority]}20; color: ${colors[priority]}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">${priority.charAt(0).toUpperCase() + priority.slice(1)}</span>`;
    },
    
    // Create status badge dynamically
    createStatusBadge: function(status) {
        const colors = {
            pending: '#6b7280',
            assigned: '#3b82f6',
            active: '#f59e0b',
            completed: '#10b981'
        };
        
        return `<span class="status-badge ${status}" style="background-color: ${colors[status]}20; color: ${colors[status]}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
    },
    
    // Select request and store in state
    selectRequest: function(request) {
        StateManager.setSelectedRequest(request);
        SessionManager.showNotification(`Selected request: ${request.id}`, 'info');
        
        // Highlight selected row
        const rows = document.querySelectorAll('#dashboard-recent-tbody tr');
        rows.forEach(row => row.style.backgroundColor = '');
        event.currentTarget.style.backgroundColor = '#e5e7eb';
    },
    
    // Setup role-based UI
    setupRoleBasedUI: function() {
        const user = SessionManager.currentUser;
        if (!user) return;
        
        // Show/hide elements based on user role
        this.updateUIForRole(user.role);
        
        // Add role-based event listeners
        this.addRoleBasedEventListeners(user.role);
    },
    
    // Update UI based on user role
    updateUIForRole: function(role) {
        // Super user can see all features
        if (role === 'superuser' || role === 'admin') {
            this.showAdminFeatures();
        } else {
            this.hideAdminFeatures();
        }
    },
    
    // Show admin features
    showAdminFeatures: function() {
        // Add admin buttons to table
        const tableHeaders = document.querySelector('#dashboard-recent-tbody').previousElementSibling;
        if (tableHeaders && !tableHeaders.querySelector('.actions-header')) {
            const actionsHeader = document.createElement('th');
            actionsHeader.className = 'actions-header';
            actionsHeader.textContent = 'Actions';
            actionsHeader.style.cssText = 'text-align: center; padding: 12px;';
            tableHeaders.querySelector('tr').appendChild(actionsHeader);
            
            // Add action buttons to each row
            const rows = document.querySelectorAll('#dashboard-recent-tbody tr');
            rows.forEach(row => {
                const actionsCell = document.createElement('td');
                actionsCell.innerHTML = this.createActionButtons();
                actionsCell.style.cssText = 'text-align: center; padding: 12px;';
                row.appendChild(actionsCell);
            });
        }
    },
    
    // Hide admin features
    hideAdminFeatures: function() {
        // Remove admin buttons
        const actionsHeaders = document.querySelectorAll('.actions-header');
        const actionCells = document.querySelectorAll('td:last-child');
        
        actionsHeaders.forEach(header => header.remove());
        actionCells.forEach(cell => {
            if (cell.innerHTML.includes('Edit') || cell.innerHTML.includes('Delete')) {
                cell.remove();
            }
        });
    },
    
    // Create action buttons for admin users
    createActionButtons: function() {
        return `
            <button onclick="DynamicRenderer.editRequest('${this.sampleData.requests[0].id}')" style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 4px; margin-right: 4px; cursor: pointer; font-size: 12px;">Edit</button>
            <button onclick="DynamicRenderer.deleteRequest('${this.sampleData.requests[0].id}')" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">Delete</button>
        `;
    },
    
    // Add role-based event listeners
    addRoleBasedEventListeners: function(role) {
        if (role === 'superuser' || role === 'admin') {
            // Add keyboard shortcuts for admin
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'n') {
                    e.preventDefault();
                    this.showCreateModal();
                }
            });
        }
    },
    
    // Edit request (admin only)
    editRequest: function(requestId) {
        const request = this.sampleData.requests.find(r => r.id === requestId);
        if (request) {
            SessionManager.showNotification(`Editing request: ${requestId}`, 'info');
            // In real app, this would open an edit modal
        }
    },
    
    // Delete request (admin only)
    deleteRequest: function(requestId) {
        if (confirm(`Are you sure you want to delete request ${requestId}?`)) {
            if (window.NexCareAPI && window.NexCareAPI.Ambulance) {
                window.NexCareAPI.Ambulance.cancelRequest(requestId);
                this.refreshData();
                SessionManager.showNotification(`Request ${requestId} deleted`, 'success');
            } else {
                SessionManager.showNotification('API not initialized', 'error');
            }
        }
    },
    
    // Show create modal (admin only)
    showCreateModal: function() {
        SessionManager.showNotification('Create request modal (admin feature)', 'info');
        // In real app, this would open a create modal
    },
    
    // Render dashboard dynamically
    renderDashboard: function() {
        // Update welcome message
        const userNameElement = document.getElementById('dashboard-user-name');
        if (userNameElement && SessionManager.currentUser) {
            userNameElement.textContent = SessionManager.currentUser.name;
        }
        
        // Render stats cards dynamically
        this.renderStatsCards();
    },
    
    // Render stats cards dynamically
    renderStatsCards: function(isBackground = false) {
        const statsContainer = document.querySelector('.stats-grid');
        if (!statsContainer) return;
        
        const data = this.getData();
        const statsConfig = [
            {
                id: 'pending',
                label: 'Pending Requests',
                value: data.stats.pending,
                icon: '⏰',
                color: '#f59e0b'
            },
            {
                id: 'assigned',
                label: 'Assigned Requests',
                value: data.stats.assigned,
                icon: '📋',
                color: '#3b82f6'
            },
            {
                id: 'active',
                label: 'Active Transport',
                value: data.stats.active,
                icon: '🚑',
                color: '#10b981'
            },
            {
                id: 'completed',
                label: 'Completed Today',
                value: data.stats.completed,
                icon: '✅',
                color: '#059669'
            }
        ];
        
        // Skip re-rendering cards during background refresh to prevent flickers
        if (isBackground) {
            statsConfig.forEach(stat => {
                const el = document.getElementById(`stat-${stat.id}`);
                if (el) el.textContent = stat.value;
            });
            return;
        }
        
        // Clear and rebuild stats cards
        statsContainer.innerHTML = '';
        
        statsConfig.forEach((stat, index) => {
            const card = this.createStatCard(stat);
            statsContainer.appendChild(card);
            
            // Animate card appearance
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
        });
    },
    
    // Create individual stat card
    createStatCard: function(stat) {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.style.cssText = `
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            cursor: pointer;
        `;
        
        card.innerHTML = `
            <div class="stat-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div class="stat-icon" style="width: 48px; height: 48px; border-radius: 12px; background: ${stat.color}20; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                    ${stat.icon}
                </div>
            </div>
            <h3 class="stat-label" style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">${stat.label}</h3>
            <p class="stat-value" id="stat-${stat.id}" style="font-size: 28px; font-weight: 700; color: #111827; margin: 0;">0</p>
        `;
        
        // Add hover effect
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px)';
            card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        });

        // Quick actions: click stat card to navigate
        card.addEventListener('click', () => {
            const map = {
                pending: 'ambulance-requests',
                assigned: 'assigned-dispatch',
                active: 'active-transport',
                completed: 'completed-transports'
            };
            const pageId = map[stat.id];
            if (!pageId) return;
            if (typeof SessionManager !== 'undefined' && SessionManager.navigateToPage) {
                SessionManager.navigateToPage(pageId);
            }
        });
        
        return card;
    },
    
    // Refresh all data
    refreshData: function() {
        this.renderDashboard();
        this.renderRecentRequests();
        SessionManager.showNotification('Data refreshed', 'success');
    }
};

function loadAmbulanceRequests() {
    // Use DynamicRenderer to load ambulance requests
    DynamicRenderer.renderRecentRequests();
    console.log('Ambulance requests loaded dynamically');
}

function loadAssignedDispatch() {
    // Load assigned dispatch data
    console.log('Assigned dispatch loaded');
}

function loadActiveTransport() {
    // Load active transport data
    console.log('Active transport loaded');
}

function loadCompletedTransports() {
    // Load completed transports data
    console.log('Completed transports loaded');
}

// Enhanced page transition with loading state
function showPageWithLoading(pageId) {
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Loading...</p>
    `;
    loadingIndicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9999;
        text-align: center;
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(loadingIndicator);
    
    // Navigate to page after short delay
    setTimeout(() => {
        SessionManager.navigateToPage(pageId);
        document.body.removeChild(loadingIndicator);
    }, 300);
}

// Auto-save functionality
function setupAutoSave() {
    // Save form data automatically
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                const formData = new FormData(form);
                const data = {};
                for (let [key, value] of formData.entries()) {
                    data[key] = value;
                }
                localStorage.setItem(`formData_${form.id}`, JSON.stringify(data));
            });
        });
    });
}

// Restore form data
function restoreFormData(formId) {
    const savedData = localStorage.getItem(`formData_${formId}`);
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            const form = document.getElementById(formId);
            if (form) {
                Object.keys(data).forEach(key => {
                    const input = form.querySelector(`[name="${key}"], #${key}`);
                    if (input) {
                        input.value = data[key];
                    }
                });
            }
        } catch (error) {
            console.error('Error restoring form data:', error);
        }
    }
}

// Initialize auto-save on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize session first
    if (typeof SessionManager !== 'undefined') {
        SessionManager.init();
    }
    
    setupAutoSave();
    
    // Restore form data for all forms
    const forms = document.querySelectorAll('form[id]');
    forms.forEach(form => {
        restoreFormData(form.id);
    });

    // Global UI event listeners
    ChecklistManager.bindCheckboxes();
    setupGlobalDelegation(); // ATTACH ONCE (FR-13)
    
    // START GLOBAL AUTO-REFRESH (FR-12)
    // Synchronizes the dashboard with patient requests every 5 seconds
    setInterval(() => {
        if (typeof refreshAllViews === 'function') {
            refreshAllViews(true); // BACKGROUND = Skip animations
        }
    }, 5000);
});
