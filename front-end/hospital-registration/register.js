document.addEventListener('DOMContentLoaded', () => {
    // Setup form
    const registerForm = document.getElementById('hospitalRegisterForm');
    const registerBtn = document.getElementById('registerBtn');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('adminPassword');
    const errorAlert = document.getElementById('registerError');
    const successAlert = document.getElementById('registerSuccess');

    // Setup toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }

    // Handle form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Hide previous alerts
            errorAlert.classList.add('hidden');
            successAlert.classList.add('hidden');
            
            // Set loading state
            registerBtn.classList.add('loading');
            
            try {
                // Collect form data
                const formData = new FormData(registerForm);
                const hospitalData = {
                    name: formData.get('hospitalName'),
                    registrationNumber: formData.get('registrationNumber'),
                    type: formData.get('hospitalType'),
                    address: formData.get('address'),
                    city: formData.get('city'),
                    state: formData.get('state'),
                    pincode: formData.get('pincode'),
                    phone: formData.get('phone'),
                    email: formData.get('email'),
                    totalBeds: parseInt(formData.get('totalBeds')),
                    totalWards: parseInt(formData.get('totalWards')),
                    specialities: formData.get('specialties').split(',').map(s => s.trim()),
                    adminName: formData.get('adminName'),
                    adminEmail: formData.get('adminEmail'),
                    adminPassword: formData.get('adminPassword'),
                    // Default fields to match interface requirements
                    ownershipType: 'Private',
                    icuBeds: Math.floor(parseInt(formData.get('totalBeds')) * 0.2), // Mock ICU beds as 20%
                    emergency24x7: true,
                    ambulanceService: true
                };

                // Create the hospital and admin user in a single request (or backend handles it)
                // Let's call our API
                const response = await window.NexCareAPI.Hospitals.register(hospitalData);

                if (response.success) {
                    successAlert.textContent = 'Registration successful! Your hospital is now pending verification. A regional manager will review your application.';
                    successAlert.classList.remove('hidden');
                    registerForm.reset();
                } else {
                    throw new Error(response.message || 'Registration failed');
                }
            } catch (error) {
                errorAlert.textContent = error.message;
                errorAlert.classList.remove('hidden');
            } finally {
                // Remove loading state
                registerBtn.classList.remove('loading');
            }
        });
    }
});
