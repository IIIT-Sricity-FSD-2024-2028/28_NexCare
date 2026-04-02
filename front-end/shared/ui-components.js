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

    return {
        showSuccess
    };
})();

window.NexCareUI = NexCareUI;
