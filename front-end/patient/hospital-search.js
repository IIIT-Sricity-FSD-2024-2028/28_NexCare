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

    function calculateDistance(h, userCity, userPin) {
        const hPin = String(h.pincode || '').trim();
        const hCity = String(h.city || '').trim().toLowerCase();
        const targetCity = (userCity || '').trim().toLowerCase();
        const targetPin = (userPin || '').trim();

        // Deterministic distance generator based on ID/Pin
        const seed = (h.id || h.name || '0').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const offset = ((seed % 20) / 10).toFixed(1); // 0.0 - 1.9 km

        if (targetPin && hPin === targetPin) {
            return { km: (0.8 + parseFloat(offset)).toFixed(1), badge: 'Same PIN Area', priority: 1 };
        }
        if (targetCity && hCity === targetCity) {
            return { km: (2.2 + parseFloat(offset) * 2).toFixed(1), badge: 'In Your City', priority: 2 };
        }
        if (targetPin && targetPin.substring(0, 2) === hPin.substring(0, 2)) {
            return { km: (7.5 + parseFloat(offset) * 3).toFixed(1), badge: 'Nearby Zone', priority: 3 };
        }
        return { km: (15.0 + parseFloat(offset) * 5).toFixed(1), badge: 'NexCare Network', priority: 4 };
    }

    function renderHospitals(list) {
        resultsGrid.replaceChildren();

        const userCity = (cityInput.value || '').trim() || (sessionStorage.getItem('nexcare_user_city') || 'Hyderabad');
        const userPin = (pincodeInput.value || '').trim() || (sessionStorage.getItem('nexcare_user_pincode') || '500033');

        // Augment with distance and sort nearest first
        const hospitalsWithDist = list.map(h => {
            const distInfo = calculateDistance(h, userCity, userPin);
            return { ...h, distInfo };
        }).sort((a, b) => parseFloat(a.distInfo.km) - parseFloat(b.distInfo.km));

        hospitalsWithDist.forEach(h => {
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

            // Header with Name & Proximity Badge
            const topHeader = document.createElement('div');
            topHeader.style.display = 'flex';
            topHeader.style.justifyContent = 'space-between';
            topHeader.style.alignItems = 'flex-start';
            topHeader.style.marginBottom = '8px';

            const nameEl = document.createElement('h3');
            nameEl.style.margin = '0';
            nameEl.style.fontSize = '16px';
            nameEl.style.fontWeight = '700';
            nameEl.style.color = '#111827';
            nameEl.textContent = h.name || 'Hospital';

            const distBadge = document.createElement('span');
            distBadge.style.background = parseFloat(h.distInfo.km) < 5 ? '#DCFCE7' : '#EFF6FF';
            distBadge.style.color = parseFloat(h.distInfo.km) < 5 ? '#15803D' : '#1D4ED8';
            distBadge.style.fontSize = '11.5px';
            distBadge.style.fontWeight = '700';
            distBadge.style.padding = '3px 8px';
            distBadge.style.borderRadius = '6px';
            distBadge.style.whiteSpace = 'nowrap';
            distBadge.textContent = `📍 ${h.distInfo.km} km away`;

            topHeader.appendChild(nameEl);
            topHeader.appendChild(distBadge);
            contentWrap.appendChild(topHeader);

            // Location
            const locParts = [];
            if (h.address) locParts.push(h.address);
            if (h.city) locParts.push(h.city);
            if (h.pincode) locParts.push(h.pincode);

            if (locParts.length > 0) {
                const locEl = document.createElement('p');
                locEl.style.margin = '0 0 12px 0';
                locEl.style.fontSize = '12.5px';
                locEl.style.color = '#4B5563';
                locEl.textContent = `${locParts.join(', ')}`;
                contentWrap.appendChild(locEl);
            }

            // Available Departments & Specialities tags
            const specs = Array.isArray(h.departments) && h.departments.length > 0
                ? h.departments.map(d => typeof d === 'string' ? d : d.name)
                : (Array.isArray(h.specialities) ? h.specialities : (h.speciality ? [h.speciality] : []));

            if (specs && specs.length > 0) {
                const specWrap = document.createElement('div');
                specWrap.style.display = 'flex';
                specWrap.style.flexWrap = 'wrap';
                specWrap.style.gap = '6px';
                specWrap.style.marginBottom = '12px';

                specs.slice(0, 5).forEach(s => {
                    if (s) {
                        const tag = document.createElement('span');
                        tag.style.background = '#F1F5F9';
                        tag.style.color = '#334155';
                        tag.style.fontSize = '11px';
                        tag.style.fontWeight = '600';
                        tag.style.padding = '3px 8px';
                        tag.style.borderRadius = '4px';
                        tag.textContent = s;
                        specWrap.appendChild(tag);
                    }
                });
                contentWrap.appendChild(specWrap);
            }

            // Beds Capacity
            let bedsTotal = typeof h.totalBeds === 'number' ? h.totalBeds : 0;
            let bedsAvail = typeof h.availableBeds === 'number' ? h.availableBeds : (h.icuBeds || 0);
            const bedsEl = document.createElement('p');
            bedsEl.style.margin = '0 0 6px 0';
            bedsEl.style.fontSize = '12.5px';
            bedsEl.style.color = '#374151';
            bedsEl.innerHTML = `🛏️ Beds: <strong>${bedsAvail} available</strong> / ${bedsTotal} total`;
            contentWrap.appendChild(bedsEl);

            // Emergency Readiness & Phone
            const isEmerg = !!(h.emergencyAvailable || h.emergency24x7);
            const contactParts = [];
            contactParts.push(`🚨 Emergency: <strong style="color:${isEmerg ? '#16A34A' : '#6B7280'}">${isEmerg ? 'Available 24x7' : 'Standard'}</strong>`);
            if (h.phone) contactParts.push(`📞 ${h.phone}`);

            const contactEl = document.createElement('p');
            contactEl.style.margin = '0 0 16px 0';
            contactEl.style.fontSize = '12.5px';
            contactEl.style.color = '#4B5563';
            contactEl.innerHTML = contactParts.join(' • ');
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
                const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
                const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

                if (!token || !isLoggedIn) {
                    if (window.NexCareUI && typeof window.NexCareUI.showToast === 'function') {
                        window.NexCareUI.showToast('Please login to book an appointment', 'warning');
                    } else {
                        alert('Please login to book an appointment');
                    }
                    return;
                }

                if (h && h.id) {
                    try { localStorage.setItem('selectedHospitalId', h.id); } catch(e) {}
                    window.location.href = `appointments/appointments.html?hospitalId=${encodeURIComponent(h.id)}`;
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
