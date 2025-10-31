// Application state
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || [];
let appointments = JSON.parse(localStorage.getItem('appointments')) || [];
let doctors = JSON.parse(localStorage.getItem('doctors')) || [
    { id: 1, name: "Dr. Ayesha Khan", specialty: "Cardiology", available: true },
    { id: 2, name: "Dr. Bilal Ahmed", specialty: "Dermatology", available: true },
    { id: 3, name: "Dr. Sara Javed", specialty: "Pediatrics", available: true },
    { id: 4, name: "Dr. Omar Farooq", specialty: "Orthopedics", available: true }
];

// Initialize default admin user if not exists
if (!users.find(u => u.username === 'admin')) {
    users.push({
        id: 1,
        name: "Admin User",
        email: "admin@clinic.com",
        username: "admin",
        password: "1234",
        type: "admin"
    });
    localStorage.setItem('users', JSON.stringify(users));
}

// Initialize doctors in localStorage if not exists
if (!localStorage.getItem('doctors')) {
    localStorage.setItem('doctors', JSON.stringify(doctors));
}

// DOM Elements
const sections = {
    home: document.getElementById('home-section'),
    login: document.getElementById('login-section'),
    register: document.getElementById('register-section'),
    doctors: document.getElementById('doctors-section'),
    book: document.getElementById('book-section'),
    appointments: document.getElementById('appointments-section'),
    admin: document.getElementById('admin-section')
};

const navLinks = {
    home: document.getElementById('nav-home'),
    doctors: document.getElementById('nav-doctors'),
    appointments: document.getElementById('nav-appointments'),
    admin: document.getElementById('nav-admin')
};

const buttons = {
    login: document.getElementById('btn-login'),
    register: document.getElementById('btn-register'),
    logout: document.getElementById('btn-logout')
};

const forms = {
    login: document.getElementById('login-form'),
    register: document.getElementById('register-form'),
    book: document.getElementById('book-form')
};

// Show a specific section and hide others
function showSection(sectionName) {
    Object.values(sections).forEach(section => {
        section.classList.add('hidden');
    });
    sections[sectionName].classList.remove('hidden');
}

// Show alert message
function showAlert(elementId, message, type) {
    const alertElement = document.getElementById(elementId);
    alertElement.textContent = message;
    alertElement.className = `alert alert-${type}`;
    alertElement.classList.remove('hidden');
    
    setTimeout(() => {
        alertElement.classList.add('hidden');
    }, 5000);
}

// Login function
function login(username, password) {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update UI based on user type
        if (currentUser.type === 'admin') {
            navLinks.admin.classList.remove('hidden');
        } else {
            navLinks.admin.classList.add('hidden');
        }
        
        buttons.login.classList.add('hidden');
        buttons.register.classList.add('hidden');
        buttons.logout.classList.remove('hidden');
        
        showAlert('login-alert', 'Login successful!', 'success');
        showSection('home');
        
        // Update appointments display if on that page
        if (sections.appointments.classList.contains('hidden') === false) {
            displayAppointments();
        }
        
        return true;
    } else {
        showAlert('login-alert', 'Invalid username or password', 'danger');
        return false;
    }
}

// Logout function
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    
    buttons.login.classList.remove('hidden');
    buttons.register.classList.remove('hidden');
    buttons.logout.classList.add('hidden');
    navLinks.admin.classList.add('hidden');
    
    showSection('home');
}

// Register function
function register(userData) {
    // Check if username already exists
    if (users.find(u => u.username === userData.username)) {
        showAlert('register-alert', 'Username already exists', 'danger');
        return false;
    }
    
    // Check if email already exists
    if (users.find(u => u.email === userData.email)) {
        showAlert('register-alert', 'Email already registered', 'danger');
        return false;
    }
    
    // Add new user
    const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        ...userData
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    showAlert('register-alert', 'Registration successful! Please login.', 'success');
    showSection('login');
    
    return true;
}

// Book appointment function
function bookAppointment(appointmentData) {
    const newAppointment = {
        id: appointments.length > 0 ? Math.max(...appointments.map(a => a.id)) + 1 : 1,
        ...appointmentData,
        status: 'booked',
        patientId: currentUser.id,
        patientName: currentUser.name
    };
    
    // Check if the time slot is already booked
    const existingAppointment = appointments.find(a => 
        a.doctorId === appointmentData.doctorId && 
        a.date === appointmentData.date && 
        a.time === appointmentData.time &&
        a.status !== 'cancelled'
    );
    
    if (existingAppointment) {
        showAlert('book-alert', 'This time slot is already booked. Please choose another.', 'danger');
        return false;
    }
    
    appointments.push(newAppointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    showAlert('book-alert', 'Appointment booked successfully!', 'success');
    forms.book.reset();
    
    return true;
}

// Cancel appointment function
function cancelAppointment(appointmentId) {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
        appointment.status = 'cancelled';
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        // Refresh appointments display
        displayAppointments();
        if (currentUser.type === 'admin') {
            displayAdminAppointments();
        }
        
        return true;
    }
    return false;
}

// Confirm appointment function (admin only)
function confirmAppointment(appointmentId) {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
        appointment.status = 'confirmed';
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        // Refresh appointments display
        displayAdminAppointments();
        
        return true;
    }
    return false;
}

// Display doctors in the doctors section
function displayDoctors() {
    const doctorsList = document.getElementById('doctors-list');
    doctorsList.innerHTML = '';
    
    doctors.forEach(doctor => {
        const doctorCard = document.createElement('div');
        doctorCard.className = 'card';
        doctorCard.innerHTML = `
            <div class="card-header">
                <h3>${doctor.name}</h3>
            </div>
            <div class="card-body">
                <p><strong>Specialty:</strong> ${doctor.specialty}</p>
                <p><strong>Availability:</strong> ${doctor.available ? 'Available' : 'Not Available'}</p>
                ${currentUser && currentUser.type === 'patient' ? 
                    `<button class="btn btn-primary" onclick="showBookSection(${doctor.id})">Book Appointment</button>` : ''}
            </div>
        `;
        doctorsList.appendChild(doctorCard);
    });
}

// Display user appointments
function displayAppointments() {
    const upcomingList = document.getElementById('upcoming-list');
    const pastList = document.getElementById('past-list');
    
    upcomingList.innerHTML = '';
    pastList.innerHTML = '';
    
    if (!currentUser) return;
    
    const userAppointments = appointments.filter(a => 
        (currentUser.type === 'patient' && a.patientId === currentUser.id) ||
        (currentUser.type === 'doctor' && a.doctorId === currentUser.id)
    );
    
    const now = new Date();
    
    userAppointments.forEach(appointment => {
        const appointmentDate = new Date(appointment.date);
        const isPast = appointmentDate < now;
        
        const doctor = doctors.find(d => d.id === appointment.doctorId);
        const doctorName = doctor ? doctor.name : 'Unknown Doctor';
        
        const appointmentItem = document.createElement('li');
        appointmentItem.className = 'appointment-item';
        appointmentItem.innerHTML = `
            <div class="appointment-info">
                <h4>Appointment with ${doctorName}</h4>
                <p><strong>Date:</strong> ${appointment.date} | <strong>Time:</strong> ${appointment.time}</p>
                <p><strong>Reason:</strong> ${appointment.reason || 'Not specified'}</p>
            </div>
            <div>
                <span class="status status-${appointment.status}">${appointment.status}</span>
                ${!isPast && appointment.status === 'booked' ? 
                    `<button class="btn btn-danger" onclick="cancelAppointment(${appointment.id})">Cancel</button>` : ''}
            </div>
        `;
        
        if (isPast) {
            pastList.appendChild(appointmentItem);
        } else {
            upcomingList.appendChild(appointmentItem);
        }
    });
    
    if (upcomingList.children.length === 0) {
        upcomingList.innerHTML = '<li class="appointment-item">No upcoming appointments</li>';
    }
    
    if (pastList.children.length === 0) {
        pastList.innerHTML = '<li class="appointment-item">No past appointments</li>';
    }
}

// Display all appointments for admin
function displayAdminAppointments() {
    const adminAppointmentsList = document.getElementById('admin-appointments-list');
    adminAppointmentsList.innerHTML = '';
    
    appointments.forEach(appointment => {
        const doctor = doctors.find(d => d.id === appointment.doctorId);
        const doctorName = doctor ? doctor.name : 'Unknown Doctor';
        
        const appointmentItem = document.createElement('li');
        appointmentItem.className = 'appointment-item';
        appointmentItem.innerHTML = `
            <div class="appointment-info">
                <h4>Appointment with ${doctorName}</h4>
                <p><strong>Patient:</strong> ${appointment.patientName}</p>
                <p><strong>Date:</strong> ${appointment.date} | <strong>Time:</strong> ${appointment.time}</p>
                <p><strong>Reason:</strong> ${appointment.reason || 'Not specified'}</p>
            </div>
            <div>
                <span class="status status-${appointment.status}">${appointment.status}</span>
                ${appointment.status === 'booked' ? 
                    `<button class="btn btn-success" onclick="confirmAppointment(${appointment.id})">Confirm</button>` : ''}
                ${appointment.status !== 'cancelled' ? 
                    `<button class="btn btn-danger" onclick="cancelAppointment(${appointment.id})">Cancel</button>` : ''}
            </div>
        `;
        
        adminAppointmentsList.appendChild(appointmentItem);
    });
    
    if (adminAppointmentsList.children.length === 0) {
        adminAppointmentsList.innerHTML = '<li class="appointment-item">No appointments found</li>';
    }
}

// Display doctors for admin management
function displayAdminDoctors() {
    const adminDoctorsList = document.getElementById('admin-doctors-list');
    adminDoctorsList.innerHTML = '';
    
    doctors.forEach(doctor => {
        const doctorCard = document.createElement('div');
        doctorCard.className = 'card';
        doctorCard.innerHTML = `
            <div class="card-header">
                <h3>${doctor.name}</h3>
            </div>
            <div class="card-body">
                <p><strong>Specialty:</strong> ${doctor.specialty}</p>
                <p><strong>Availability:</strong> ${doctor.available ? 'Available' : 'Not Available'}</p>
                <div style="margin-top: 10px;">
                    <button class="btn btn-secondary" onclick="toggleDoctorAvailability(${doctor.id})">
                        ${doctor.available ? 'Set Unavailable' : 'Set Available'}
                    </button>
                    <button class="btn btn-danger" onclick="removeDoctor(${doctor.id})">Remove</button>
                </div>
            </div>
        `;
        adminDoctorsList.appendChild(doctorCard);
    });
}

// Toggle doctor availability
function toggleDoctorAvailability(doctorId) {
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor) {
        doctor.available = !doctor.available;
        localStorage.setItem('doctors', JSON.stringify(doctors));
        displayAdminDoctors();
        displayDoctors();
    }
}

// Remove doctor
function removeDoctor(doctorId) {
    if (confirm('Are you sure you want to remove this doctor?')) {
        doctors = doctors.filter(d => d.id !== doctorId);
        localStorage.setItem('doctors', JSON.stringify(doctors));
        displayAdminDoctors();
        displayDoctors();
        
        // Also remove any appointments with this doctor
        appointments = appointments.filter(a => a.doctorId !== doctorId);
        localStorage.setItem('appointments', JSON.stringify(appointments));
        displayAdminAppointments();
    }
}

// Show book section with specific doctor pre-selected
function showBookSection(doctorId) {
    if (!currentUser) {
        showSection('login');
        return;
    }
    
    const doctorSelect = document.getElementById('book-doctor');
    doctorSelect.value = doctorId;
    showSection('book');
}

// Populate doctor dropdown in booking form
function populateDoctorDropdown() {
    const doctorSelect = document.getElementById('book-doctor');
    doctorSelect.innerHTML = '<option value="">Select a doctor</option>';
    
    doctors.filter(d => d.available).forEach(doctor => {
        const option = document.createElement('option');
        option.value = doctor.id;
        option.textContent = `${doctor.name} - ${doctor.specialty}`;
        doctorSelect.appendChild(option);
    });
}

// Initialize the application
function init() {
    // Load data from localStorage
    users = JSON.parse(localStorage.getItem('users')) || users;
    appointments = JSON.parse(localStorage.getItem('appointments')) || appointments;
    doctors = JSON.parse(localStorage.getItem('doctors')) || doctors;
    
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        
        if (currentUser.type === 'admin') {
            navLinks.admin.classList.remove('hidden');
        }
        
        buttons.login.classList.add('hidden');
        buttons.register.classList.add('hidden');
        buttons.logout.classList.remove('hidden');
    }
    
    // Set minimum date for booking to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('book-date').min = today;
    
    // Populate doctor dropdown
    populateDoctorDropdown();
    
    // Display initial data
    displayDoctors();
    displayAppointments();
    if (currentUser && currentUser.type === 'admin') {
        displayAdminAppointments();
        displayAdminDoctors();
    }
    
    // Event Listeners
    // Navigation
    navLinks.home.addEventListener('click', () => showSection('home'));
    navLinks.doctors.addEventListener('click', () => {
        showSection('doctors');
        displayDoctors();
    });
    navLinks.appointments.addEventListener('click', () => {
        if (!currentUser) {
            showSection('login');
            return;
        }
        showSection('appointments');
        displayAppointments();
    });
    navLinks.admin.addEventListener('click', () => {
        showSection('admin');
        displayAdminAppointments();
        displayAdminDoctors();
    });
    
    // Auth buttons
    buttons.login.addEventListener('click', () => showSection('login'));
    buttons.register.addEventListener('click', () => showSection('register'));
    buttons.logout.addEventListener('click', logout);
    
    // Form submissions
    forms.login.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        login(username, password);
    });
    
    forms.register.addEventListener('submit', (e) => {
        e.preventDefault();
        const userData = {
            name: document.getElementById('register-name').value,
            email: document.getElementById('register-email').value,
            username: document.getElementById('register-username').value,
            password: document.getElementById('register-password').value,
            type: document.getElementById('register-type').value
        };
        register(userData);
    });
    
    forms.book.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentUser) {
            showAlert('book-alert', 'Please login to book an appointment', 'danger');
            return;
        }
        
        const appointmentData = {
            doctorId: parseInt(document.getElementById('book-doctor').value),
            date: document.getElementById('book-date').value,
            time: document.getElementById('book-time').value,
            reason: document.getElementById('book-reason').value
        };
        
        bookAppointment(appointmentData);
    });
    
    // Tab functionality
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            // Update active tab
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}-appointments`).classList.add('active');
            
            if (tabName === 'all-appointments') {
                displayAdminAppointments();
            } else if (tabName === 'manage-doctors') {
                displayAdminDoctors();
            }
        });
    });
    
    // Add new doctor functionality
    document.getElementById('btn-add-doctor').addEventListener('click', () => {
        const name = prompt("Enter doctor's name:");
        if (!name) return;
        
        const specialty = prompt("Enter doctor's specialty:");
        if (!specialty) return;
        
        const newDoctor = {
            id: doctors.length > 0 ? Math.max(...doctors.map(d => d.id)) + 1 : 1,
            name: name,
            specialty: specialty,
            available: true
        };
        
        doctors.push(newDoctor);
        localStorage.setItem('doctors', JSON.stringify(doctors));
        
        displayAdminDoctors();
        displayDoctors();
        populateDoctorDropdown();
    });
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);