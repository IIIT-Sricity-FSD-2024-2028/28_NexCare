/**
 * NexCare Shared UI Components
 * Provides premium, library-free UI elements for the patient portal.
 */

const NexCareUI = (() => {
    /**
     * Shows a premium success modal.
     * @param {Object} options - Modal options.
     * @param {string} options.title - The title of the modal.
     * @param {string} options.message - The main message.
     * @param {string} options.details - Optional HTML details to show in a box.
     * @param {Function} options.onClose - Callback when the modal is closed.
     */
    function showSuccess({ title, message, details, onClose }) {
        const overlay = document.createElement('div');
        overlay.className = 'nexcare-modal-overlay';
        
        const container = document.createElement('div');
        container.className = 'nexcare-modal-container';
        
        // Success Icon
        const iconContainer = document.createElement('div');
        iconContainer.className = 'modal-icon-container';
        iconContainer.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
        
        // Title
        const titleEl = document.createElement('h2');
        titleEl.className = 'nexcare-modal-title';
        titleEl.textContent = title;
        
        // Message
        const messageEl = document.createElement('p');
        messageEl.className = 'nexcare-modal-message';
        messageEl.textContent = message;
        
        // Details Box (Optional)
        let detailsBox = null;
        if (details) {
            detailsBox = document.createElement('div');
            detailsBox.className = 'modal-details-box';
            detailsBox.innerHTML = details;
        }
        
        // Action Button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn-modal-close';
        closeBtn.textContent = 'Awesome, thanks!';
        
        const closeModal = () => {
            overlay.style.opacity = '0';
            container.style.transform = 'scale(0.9)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                if (onClose) onClose();
            }, 300);
        };
        
        closeBtn.onclick = closeModal;
        overlay.onclick = (e) => {
            if (e.target === overlay) closeModal();
        };
        
        // Assemble
        container.appendChild(iconContainer);
        container.appendChild(titleEl);
        container.appendChild(messageEl);
        if (detailsBox) container.appendChild(detailsBox);
        container.appendChild(closeBtn);
        overlay.appendChild(container);
        
        document.body.appendChild(overlay);
        
        // Prevent body scroll
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        
        // Restore body scroll on remove
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node === overlay) {
                        document.body.style.overflow = originalOverflow;
                        observer.disconnect();
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true });
    }

    /**
     * Shows an error modal.
     * @param {Object} options - Modal options.
     * @param {string} options.title - The title of the modal.
     * @param {string} options.message - The main error message.
     * @param {string} options.details - Optional HTML details to show in a box.
     * @param {Function} options.onClose - Callback when the modal is closed.
     * @param {Function} options.onRetry - Optional retry callback.
     */
    function showError({ title, message, details, onClose, onRetry }) {
        const overlay = document.createElement('div');
        overlay.className = 'nexcare-modal-overlay';
        
        const container = document.createElement('div');
        container.className = 'nexcare-modal-container nexcare-error-modal';
        
        // Error Icon
        const iconContainer = document.createElement('div');
        iconContainer.className = 'modal-icon-container modal-icon-error';
        iconContainer.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        `;
        
        // Title
        const titleEl = document.createElement('h2');
        titleEl.className = 'nexcare-modal-title';
        titleEl.textContent = title;
        
        // Message
        const messageEl = document.createElement('p');
        messageEl.className = 'nexcare-modal-message';
        messageEl.textContent = message;
        
        // Details Box (Optional)
        let detailsBox = null;
        if (details) {
            detailsBox = document.createElement('div');
            detailsBox.className = 'modal-details-box';
            detailsBox.innerHTML = details;
        }
        
        // Action Buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'modal-button-container';
        
        if (onRetry) {
            const retryBtn = document.createElement('button');
            retryBtn.className = 'btn-modal-retry';
            retryBtn.textContent = 'Try Again';
            retryBtn.onclick = () => {
                closeModal();
                onRetry();
            };
            buttonContainer.appendChild(retryBtn);
        }
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn-modal-close';
        closeBtn.textContent = onRetry ? 'Cancel' : 'OK';
        
        const closeModal = () => {
            overlay.style.opacity = '0';
            container.style.transform = 'scale(0.9)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                if (onClose) onClose();
            }, 300);
        };
        
        closeBtn.onclick = closeModal;
        buttonContainer.appendChild(closeBtn);
        
        overlay.onclick = (e) => {
            if (e.target === overlay) closeModal();
        };
        
        // Assemble
        container.appendChild(iconContainer);
        container.appendChild(titleEl);
        container.appendChild(messageEl);
        if (detailsBox) container.appendChild(detailsBox);
        container.appendChild(buttonContainer);
        overlay.appendChild(container);
        
        document.body.appendChild(overlay);
        
        // Prevent body scroll
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        
        // Restore body scroll on remove
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node === overlay) {
                        document.body.style.overflow = originalOverflow;
                        observer.disconnect();
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true });
    }

    /**
     * Shows a toast notification.
     * @param {Object} options - Toast options.
     * @param {string} options.message - The message to display.
     * @param {string} options.type - The type: 'success', 'error', 'warning', 'info'.
     * @param {number} options.duration - Duration in milliseconds (default: 3000).
     */
    function showToast({ message, type = 'info', duration = 3000 }) {
        const toast = document.createElement('div');
        toast.className = `nexcare-toast nexcare-toast-${type}`;
        
        // Icon based on type
        let icon = '';
        switch(type) {
            case 'success':
                icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                break;
            case 'error':
                icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
                break;
            case 'warning':
                icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
                break;
            default:
                icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
        }
        
        toast.innerHTML = `${icon}<span>${message}</span>`;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('nexcare-toast-show'), 10);
        
        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('nexcare-toast-show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, duration);
    }

    /**
     * Shows a loading overlay.

     * @param {string} message - Optional loading message.
     * @returns {Function} Function to hide the loading overlay.
     */
    function showLoading(message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.className = 'nexcare-loading-overlay';
        overlay.id = 'nexcare-loading-overlay';
        overlay.innerHTML = `
            <div class="nexcare-loading-spinner"></div>
            <div class="nexcare-loading-message">${message}</div>
        `;
        document.body.appendChild(overlay);
        
        return () => {
            const existingOverlay = document.getElementById('nexcare-loading-overlay');
            if (existingOverlay) {
                existingOverlay.style.opacity = '0';
                setTimeout(() => document.body.removeChild(existingOverlay), 300);
            }
        };
    }

    return {
        showSuccess,
        showError,
        showToast,
        showLoading
    };
})();

window.NexCareUI = NexCareUI;
