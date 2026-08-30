// Doctor — profile and password.
//
// A doctor's directory entry is what the booking wizard shows patients, so the
// fields here are read-only apart from the password: the specialisation and
// hospital are set when the account is created and changing them would silently
// move the doctor out of the department a patient booked them in.

document.addEventListener('DOMContentLoaded', async () => {
    const user = fillHeader('Doctor');
    if (!user) return;

    document.getElementById('changePasswordBtn').addEventListener('click', changePassword);
    await loadProfile(user);
});

async function loadProfile(user) {
    let record = user;
    try {
        const res = await window.NexCareAPI.Auth.getCurrentUser(user.id);
        if (res.success && res.data) record = { ...user, ...res.data };
    } catch (err) {
        console.warn('Falling back to the cached session:', err.message);
    }

    // The consultation fee lives on the subscription, not the user record — it
    // is a commercial term, and the revenue model is what owns it.
    let subscription = null;
    try {
        const subRes = await window.NexCareAPI.Revenue.getMyDoctorSubscription();
        if (subRes.success) subscription = (subRes.data || [])[0] || null;
    } catch (err) {
        console.warn('Could not load the listing tier:', err.message);
    }

    setText('profileName', record.name || 'My profile');
    setText('profileSub', `${record.role === 'doctor' ? 'Doctor' : record.role} · ${record.email || ''}`);

    const rows = [
        ['Name', record.name],
        ['Email', record.email],
        ['Specialisation', record.dept || record.specialization || '—'],
        ['Hospital', record.hospitalId || '—'],
        ['Registration no.', record.registrationNo || '—'],
        ['Account status', record.status || '—'],
        ['Consultation fee', subscription ? money(subscription.consultationFee) : '—'],
        ['Listing tier', subscription ? subscription.planId : '—'],
    ];

    setHTML('profileFields', rows.map(([label, value]) => `
        <div class="field">
            <label>${esc(label)}</label>
            <input value="${esc(value ?? '—')}" readonly style="background:#F9FAFB;color:#6B7280;">
        </div>
    `).join('') + `
        <div class="field" style="grid-column:1/-1;">
            <p class="muted" style="margin:0;">
                Specialisation and hospital are set by your hospital's administrator.
                Your consultation fee and listing tier are yours to change, on the
                <a href="earnings.html">Earnings &amp; Plan</a> page.
            </p>
        </div>
    `);
}

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    if (!currentPassword || !newPassword) {
        notify('Enter both your current and your new password', 'error');
        return;
    }
    if (newPassword.length < 6) {
        notify('The new password must be at least 6 characters', 'error');
        return;
    }

    try {
        const res = await window.NexCareAPI.Auth.changePassword(currentPassword, newPassword);
        if (!res.success) {
            notify(res.message || 'Could not change your password', 'error');
            return;
        }
        notify('Password updated', 'success');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
    } catch (err) {
        console.error(err);
        notify('Could not change your password', 'error');
    }
}
