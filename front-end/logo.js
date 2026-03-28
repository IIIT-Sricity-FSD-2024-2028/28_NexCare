class NexCareLogo extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="logo">
                <div class="logo-icon-container">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                </div>
                <span class="logo-text">
                    <span class="nex">NEX</span><span class="care">CARE</span>
                </span>
            </div>
        `;
    }
}

// Register the custom element
if (!customElements.get('nex-care-logo')) {
    customElements.define('nex-care-logo', NexCareLogo);
}