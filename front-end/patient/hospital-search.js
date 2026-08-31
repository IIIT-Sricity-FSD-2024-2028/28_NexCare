document.addEventListener('DOMContentLoaded', () => {
    const specialitySelect = document.getElementById('specialitySelect');
    const cityInput = document.getElementById('cityInput');
    const pincodeInput = document.getElementById('pincodeInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resultsGrid = document.getElementById('resultsGrid');
    const statusContainer = document.getElementById('statusContainer');

    // 1. Auth check and routing setup
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const userRole = sessionStorage.getItem('nexcare_current_role') || localStorage.getItem('nexcare_current_role');
    
    if (token && userRole === 'patient') {
        // Update Home links to point to Patient Dashboard
        const navHome = document.querySelector('.nav-item[href="../landing/landing.html"]');
        if (navHome) navHome.href = 'dashboard.html';

        const backBtn = document.getElementById('backToDashboardBtn');
        if (backBtn) {
            backBtn.href = 'dashboard.html';
            backBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M10 12L4 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Back to Dashboard
            `;
        }

        const loginBtn = document.querySelector('.nav-item[href="../auth/login.html"]');
        if (loginBtn) {
            loginBtn.style.display = 'none';
        }
    }

    async function fetchHospitals() {
        showLoadingState();

        const specVal = (specialitySelect.value || '').trim();
        const cityVal = (cityInput.value || '').trim();
        const pinVal = (pincodeInput.value || '').trim();

        let hospitalsList = [];

        try {
            let res = null;
            if (window.NexCareAPI && window.NexCareAPI.Hospitals) {
                res = await window.NexCareAPI.Hospitals.getAll({
                    speciality: specVal,
                    city: cityVal,
                    pincode: pinVal
                });
            }

            if (res && res.success) {
                const rawData = res.data;
                if (Array.isArray(rawData)) {
                    hospitalsList = rawData;
                } else if (rawData && Array.isArray(rawData.data)) {
                    hospitalsList = rawData.data;
                } else if (rawData && Array.isArray(rawData.hospitals)) {
                    hospitalsList = rawData.hospitals;
                }
            } else {
                throw new Error((res && res.message) || "Failed to retrieve hospitals from API");
            }
            
            // Hospital directory responses already contain live aggregate bed
            // capacity and specialities. Individual bed allocations remain a
            // private staff-only resource.
        } catch (err) {
            console.error("Backend unavailable or returned error for hospital search:", err);
            hospitalsList = [];
            statusContainer.textContent = 'Unable to load hospital data. Please check the connection and try again.';
            statusContainer.style.color = '#B91C1C';
        }

        if (hospitalsList.length) clearStatusState();

        if (!Array.isArray(hospitalsList) || hospitalsList.length === 0) {
            showEmptyState();
        } else {
            renderHospitals(hospitalsList);
        }
    }

    function showLoadingState() {
        resultsGrid.replaceChildren();
        statusContainer.replaceChildren();

        const loadingBox = document.createElement('div');
        loadingBox.style.gridColumn = '1 / -1';
        loadingBox.style.padding = '32px';
        loadingBox.style.textAlign = 'center';
        loadingBox.style.color = '#4B5563';
        loadingBox.style.fontSize = '15px';
        loadingBox.style.fontWeight = '500';
        loadingBox.textContent = 'Loading matching hospitals...';

        statusContainer.appendChild(loadingBox);
    }

    function clearStatusState() {
        statusContainer.replaceChildren();
    }

    function showDemoBadge() {
        const badgeBox = document.createElement('div');
        badgeBox.style.padding = '10px 16px';
        badgeBox.style.marginBottom = '16px';
        badgeBox.style.background = '#FEF3C7';
        badgeBox.style.border = '1px solid #F59E0B';
        badgeBox.style.borderRadius = '8px';
        badgeBox.style.color = '#92400E';
        badgeBox.style.fontSize = '13px';
        badgeBox.style.fontWeight = '500';
        badgeBox.style.display = 'flex';
        badgeBox.style.alignItems = 'center';
        badgeBox.style.gap = '8px';

        badgeBox.innerHTML = `<span>⚠️ <strong>Demo Mode:</strong> Backend server is offline or unreachable. Displaying fallback mock hospital data.</span>`;
        statusContainer.appendChild(badgeBox);
    }

    function showEmptyState() {
        resultsGrid.replaceChildren();

        const emptyBox = document.createElement('div');
        emptyBox.style.gridColumn = '1 / -1';
        emptyBox.style.padding = '40px 20px';
        emptyBox.style.textAlign = 'center';
        emptyBox.style.background = '#FFFFFF';
        emptyBox.style.border = '1px dashed #D1D5DB';
        emptyBox.style.borderRadius = '12px';

        const title = document.createElement('h3');
        title.style.margin = '0 0 8px 0';
        title.style.color = '#1F2937';
        title.style.fontSize = '16px';
        title.style.fontWeight = '600';
        title.textContent = 'No hospitals match the selected filters.';

        const subtitle = document.createElement('p');
        subtitle.style.margin = '0';
        subtitle.style.color = '#6B7280';
        subtitle.style.fontSize = '14px';
        subtitle.textContent = 'Try adjusting or clearing your speciality, city, or PIN code filters.';

        emptyBox.appendChild(title);
        emptyBox.appendChild(subtitle);
        resultsGrid.appendChild(emptyBox);
    }

    function renderHospitals(list) {
        resultsGrid.replaceChildren();

        list.forEach(h => {
            const card = document.createElement('div');
            card.style.background = '#FFFFFF';
            card.style.border = '1px solid #E5E7EB';
            card.style.borderRadius = '12px';
            card.style.padding = '20px';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.justifyContent = 'space-between';
            card.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';

            const contentWrap = document.createElement('div');

            // Hospital Name
            const nameEl = document.createElement('h3');
            nameEl.style.margin = '0 0 10px 0';
            nameEl.style.fontSize = '16px';
            nameEl.style.fontWeight = '700';
            nameEl.style.color = '#111827';
            nameEl.textContent = h.name || 'Hospital';
            contentWrap.appendChild(nameEl);

            // Location
            const locParts = [];
            if (h.address) locParts.push(h.address);
            if (h.city) locParts.push(h.city);
            if (h.pincode) locParts.push(h.pincode);

            if (locParts.length > 0) {
                const locEl = document.createElement('p');
                locEl.style.margin = '0 0 12px 0';
                locEl.style.fontSize = '13px';
                locEl.style.color = '#4B5563';
                locEl.textContent = `📍 ${locParts.join(', ')}`;
                contentWrap.appendChild(locEl);
            }

            // Specialities tags
            const specs = Array.isArray(h.specialities) ? h.specialities : (Array.isArray(h.specialties) ? h.specialties : (h.speciality ? [h.speciality] : []));
            if (specs && specs.length > 0) {
                const specWrap = document.createElement('div');
                specWrap.style.display = 'flex';
                specWrap.style.flexWrap = 'wrap';
                specWrap.style.gap = '6px';
                specWrap.style.marginBottom = '12px';

                specs.forEach(s => {
                    if (s) {
                        const tag = document.createElement('span');
                        tag.style.background = '#EFF6FF';
                        tag.style.color = '#1D4ED8';
                        tag.style.fontSize = '12px';
                        tag.style.fontWeight = '500';
                        tag.style.padding = '3px 8px';
                        tag.style.borderRadius = '4px';
                        tag.textContent = s;
                        specWrap.appendChild(tag);
                    }
                });
                contentWrap.appendChild(specWrap);
            }

            // Aggregate bed capacity is calculated by the backend directory.
            let bedsTotal = typeof h.totalBeds === 'number' ? h.totalBeds : 0;
            let bedsAvail = typeof h.availableBeds === 'number' ? h.availableBeds : (h.icuBeds || 0);
            const bedsEl = document.createElement('p');
            bedsEl.style.margin = '0 0 6px 0';
            bedsEl.style.fontSize = '13px';
            bedsEl.style.color = '#374151';
            bedsEl.textContent = `🛏️ Beds: ${bedsAvail} available / ${bedsTotal} total`;
            contentWrap.appendChild(bedsEl);

            // Emergency & Phone
            const isEmerg = !!(h.emergencyAvailable || h.emergency24x7);
            const contactParts = [];
            contactParts.push(`🚨 Emergency: ${isEmerg ? 'Available 24x7' : 'No'}`);
            if (h.phone) contactParts.push(`📞 ${h.phone}`);

            const contactEl = document.createElement('p');
            contactEl.style.margin = '0 0 16px 0';
            contactEl.style.fontSize = '13px';
            contactEl.style.color = '#4B5563';
            contactEl.textContent = contactParts.join(' • ');
            contentWrap.appendChild(contactEl);

            card.appendChild(contentWrap);

            // Action button
            const actionBtn = document.createElement('button');
            actionBtn.className = 'btn-primary-sm';
            actionBtn.style.width = '100%';
            actionBtn.style.marginTop = '12px';
            actionBtn.style.textAlign = 'center';
            actionBtn.textContent = 'Book Appointment';
            actionBtn.onclick = () => {
                // Check if user is logged in
                const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
                const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

                if (!token || !isLoggedIn) {
                    alert('Please login to book an appointment');
                    return;
                }

                // User is logged in, proceed to booking
                if (h && h.id) {
                    try { localStorage.setItem('selectedHospitalId', h.id); } catch(e) {}
                    window.location.href = pageLink('appointments/appointments', { hospitalId: h.id });
                } else {
                    window.location.href = 'appointments/appointments.html';
                }
            };
            card.appendChild(actionBtn);

            resultsGrid.appendChild(card);
        });
    }

    // Event Listeners
    searchBtn.addEventListener('click', () => {
        fetchHospitals();
    });

    clearBtn.addEventListener('click', () => {
        specialitySelect.value = '';
        cityInput.value = '';
        pincodeInput.value = '';
        fetchHospitals();
    });

    [cityInput, pincodeInput].forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                fetchHospitals();
            }
        });
    });

    // Initial load
    fetchHospitals();
});
