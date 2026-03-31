class NexCareLogo extends HTMLElement {
    connectedCallback() {
        // Use Shadow DOM so logo styles never leak into pages
        if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                }

                .logo {
                    display: inline-flex;
                    align-items: center;
                    gap: 14px;
                    cursor: pointer;
                    font-family: 'JetBrains Mono', monospace;
                    user-select: none;
                }

                .logo-icon-container {
                    background-color: #0066CC;
                    width: 45px;
                    height: 45px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 5px;
                    flex-shrink: 0;
                }

                .logo-icon-container svg {
                    width: 30px;
                    height: 30px;
                    stroke: #ffffff;
                    stroke-width: 1.5;
                }

                .logo-text {
                    font-size: 41.25px;
                    font-weight: 800;
                    letter-spacing: -1.5px;
                    line-height: 0.8;
                    display: inline-flex;
                    align-items: center;
                    white-space: nowrap;
                }

                .logo-text .nex {
                    color: #0077B6;
                    transition: color 0.3s ease;
                }

                .logo-text .care {
                    color: #000000;
                    transition: color 0.3s ease;
                }

                .logo:hover .nex { color: #000000; }
                .logo:hover .care { color: #0077B6; }

                @media (max-width: 768px) {
                    .logo-text { font-size: 32px; }
                    .logo-icon-container { width: 38px; height: 38px; }
                    .logo-icon-container svg { width: 24px; height: 24px; }
                }
            </style>

            <div class="logo" part="logo">
                <div class="logo-icon-container" part="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                </div>
                <span class="logo-text" part="text">
                    <span class="nex">NEX</span><span class="care">CARE</span>
                </span>
            </div>
        `;
    }
}

// Register the custom element if it hasn't been defined yet
if (!customElements.get('nex-care-logo')) {
    customElements.define('nex-care-logo', NexCareLogo);
}