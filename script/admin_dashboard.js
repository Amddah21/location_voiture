/**
 * Admin Dashboard JavaScript
 * Handles all dashboard interactions, data loading, and API calls
 */

// Global state
let currentSection = 'dashboard';
let vehicles = [];
let bookings = [];
let logs = [];
let clients = [];

// Price formatting function (fallback if currency.js not loaded)
function formatPriceWithCurrency(price) {
    const numPrice = parseFloat(price) || 0;
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numPrice) + ' DH';
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    loadDashboardData();
    setupEventListeners();
    setupMobileMenu();
    animateStats();
    loadNotifications(); // Load notifications on page load
    
    // Load vehicles if vehicles section is active
    if (currentSection === 'vehicles') {
        loadVehicles();
    }
});

// Navigation
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section);
        });
    });
}

function showSection(section) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const navItem = document.querySelector(`[data-section="${section}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }

    // Update content
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    const sectionEl = document.getElementById(`${section}-section`);
    if (sectionEl) {
        sectionEl.classList.add('active');
    }

    currentSection = section;

    // Load section-specific data
    switch(section) {
        case 'vehicles':
            loadVehicles();
            break;
        case 'bookings':
            loadBookings();
            break;
        case 'logs':
            loadLogs();
            break;
        case 'contacts':
            loadContacts();
            break;
        case 'brands':
            loadBrands();
            break;
        case 'offers':
            loadOffers();
            break;
        case 'reviews':
            loadReviews();
            break;
        case 'clients':
            loadClients();
            break;
        case 'settings':
            loadAdmins();
            setupPasswordChangeForm();
            break;
    }
}

// Event Listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Booking filter
    const bookingFilter = document.getElementById('booking-filter');
    if (bookingFilter) {
        bookingFilter.addEventListener('change', (e) => {
            filterBookings(e.target.value);
        });
    }
    
    // Notification button
    const notificationBtn = document.getElementById('notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleNotifications();
        });
    }
    
    // Close notifications when clicking outside
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('notification-dropdown');
        const btn = document.getElementById('notification-btn');
        if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
            closeNotifications();
        }
    });
}

// Mobile Menu
function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });
    }

    // Close sidebar when clicking overlay
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    });

    // Close sidebar when clicking a nav item on mobile
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            }
        });
    });

    // Close sidebar on window resize if it becomes desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        }
    });
}

// Logout
async function handleLogout() {
    if (!confirm('Êtes-vous sûr de vouloir vous déconnecter?')) return;

    try {
        const formData = new FormData();
        formData.append('action', 'logout');

        const response = await fetch('admin_auth.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            window.location.href = 'admin_login.php';
        }
    } catch (error) {
        showToast('Erreur lors de la déconnexion', 'error');
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        const formData = new FormData();
        formData.append('action', 'get_stats');

        const response = await fetch('admin_auth.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            updateStats(data.data);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function refreshStats() {
    loadDashboardData();
    animateStats();
    showToast('Statistiques actualisées', 'success');
}

// Animate Stats
function animateStats() {
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(stat => {
        const target = parseInt(stat.dataset.target.replace(/\s/g, '')) || 0;
        animateValue(stat, 0, target, 1000);
    });
}

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        
        // Format number with spaces for thousands
        if (end > 1000) {
            element.textContent = current.toLocaleString('fr-FR');
        } else {
            element.textContent = current;
        }
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function updateStats(stats) {
    // Stats are already displayed from PHP, but we can update them dynamically
    console.log('Stats updated:', stats);
}

// Load Vehicles
async function loadVehicles() {
    const tbody = document.getElementById('vehicles-tbody');
    if (!tbody) return;
    
    // Show loading state
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Chargement...</td></tr>';
    
    try {
        const response = await fetch('backend.php?action=vehicles');
        const data = await response.json();
        
        if (data.success) {
            vehicles = data.data || [];
            renderVehicles(vehicles);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">Erreur: ' + (data.error || 'Erreur inconnue') + '</td></tr>';
        }
    } catch (error) {
        console.error('Error loading vehicles:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Erreur lors du chargement: ' + error.message + '</td></tr>';
    }
}

function renderVehicles(vehiclesList) {
    const tbody = document.getElementById('vehicles-tbody');
    if (!tbody) return;
    
    if (vehiclesList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Aucun véhicule trouvé. Cliquez sur "Ajouter un véhicule" pour en créer un.</td></tr>';
        return;
    }

    tbody.innerHTML = vehiclesList.map(vehicle => {
        const imagePreview = vehicle.image_url ? 
            `<img src="${escapeHtml(vehicle.image_url)}" alt="${escapeHtml(vehicle.name)}" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px; margin-right: 0.5rem;">` : 
            '<div style="width: 60px; height: 40px; background: var(--gray-200); border-radius: 4px; display: inline-block; margin-right: 0.5rem;"></div>';
        
        return `
            <tr>
                <td>${vehicle.id}</td>
                <td>
                    <div style="display: flex; align-items: center;">
                        ${imagePreview}
                        <strong>${escapeHtml(vehicle.name)}</strong>
                    </div>
                </td>
                <td><span class="status-badge">${escapeHtml(vehicle.type)}</span></td>
                <td><strong>${formatPriceWithCurrency(vehicle.price_per_day)}</strong></td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <span class="status-badge ${vehicle.available ? 'status-active' : 'status-cancelled'}">
                            <i class="fas fa-${vehicle.available ? 'check-circle' : 'times-circle'}" style="margin-right: 0.25rem;"></i>
                            ${vehicle.available ? 'Disponible' : 'Indisponible'}
                        </span>
                        ${vehicle.available_from || vehicle.available_to ? `
                            <div style="background: ${vehicle.available ? '#fef3c7' : '#fee2e2'}; border-left: 3px solid ${vehicle.available ? '#f59e0b' : '#ef4444'}; padding: 0.5rem; border-radius: 4px; margin-top: 0.25rem;">
                                <small style="color: ${vehicle.available ? '#92400e' : '#991b1b'}; font-size: 0.7rem; display: block; font-weight: 600;">
                                    <i class="fas fa-calendar-times"></i> Période d'indisponibilité:
                                </small>
                                <small style="color: ${vehicle.available ? '#92400e' : '#991b1b'}; font-size: 0.65rem; display: block; margin-top: 0.25rem;">
                                    ${vehicle.available_from ? 'Du: <strong>' + new Date(vehicle.available_from + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + '</strong>' : ''}
                                    ${vehicle.available_from && vehicle.available_to ? ' ' : ''}
                                    ${vehicle.available_to ? 'Au: <strong>' + new Date(vehicle.available_to + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + '</strong>' : ''}
                                    ${vehicle.available_from && !vehicle.available_to ? ' (jusqu\'à nouvel ordre)' : ''}
                                </small>
                            </div>
                        ` : ''}
                        <button class="btn-toggle-availability ${vehicle.available ? 'btn-toggle-disable' : 'btn-toggle-enable'}" 
                                onclick="toggleVehicleAvailability(${vehicle.id}, ${vehicle.available ? 0 : 1})" 
                                title="${vehicle.available ? 'Marquer comme indisponible' : 'Marquer comme disponible'}">
                            <i class="fas fa-${vehicle.available ? 'ban' : 'check'}"></i>
                            ${vehicle.available ? 'Désactiver' : 'Activer'}
                        </button>
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit-action" onclick="editVehicle(${vehicle.id})" 
                                title="Modifier">
                            <i class="fas fa-edit"></i>
                            <span>Modifier</span>
                        </button>
                        <button class="btn-action btn-delete-action" onclick="deleteVehicle(${vehicle.id})" 
                                title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Load Bookings
async function loadBookings() {
    try {
        const response = await fetch('backend.php?action=bookings');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Bookings API response:', data); // Debug log
        
        if (data.success && data.data) {
            // Ensure data.data is an array
            if (Array.isArray(data.data)) {
                bookings = data.data;
                console.log('Loaded bookings:', bookings.length); // Debug log
                renderBookings(bookings);
                // Update notifications when bookings are loaded
                loadNotifications();
            } else {
                console.error('Bookings data is not an array:', data.data);
                document.getElementById('bookings-tbody').innerHTML = 
                    '<tr><td colspan="7" class="error">Erreur: Format de données invalide</td></tr>';
            }
        } else {
            console.error('API returned error:', data);
            document.getElementById('bookings-tbody').innerHTML = 
                `<tr><td colspan="7" class="error">${data.error || 'Erreur lors du chargement'}</td></tr>`;
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookings-tbody').innerHTML = 
            `<tr><td colspan="7" class="error">Erreur: ${error.message}</td></tr>`;
    }
}

function renderBookings(bookingsList) {
    const tbody = document.getElementById('bookings-tbody');
    
    // Ensure bookingsList is an array
    if (!Array.isArray(bookingsList)) {
        console.error('Bookings data is not an array:', bookingsList);
        tbody.innerHTML = '<tr><td colspan="7" class="error">Erreur: Format de données invalide</td></tr>';
        return;
    }
    
    if (bookingsList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Aucune réservation trouvée</td></tr>';
        return;
    }

    tbody.innerHTML = bookingsList.map(booking => {
        const pickupDate = new Date(booking.pickup_date);
        const returnDate = new Date(booking.return_date);
        const days = Math.ceil((returnDate - pickupDate) / (1000 * 60 * 60 * 24));
        const phone = booking.customer_phone || '';
        
        return `
            <tr>
                <td><strong>#${booking.id}</strong></td>
                <td>
                    <strong>${escapeHtml(booking.customer_name)}</strong><br>
                    <small style="color: var(--text-secondary);">
                        <i class="fas fa-envelope"></i> ${escapeHtml(booking.customer_email)}
                    </small>
                    ${phone ? `<br><small style="color: var(--text-secondary);">
                        <i class="fas fa-phone"></i> 
                        <a href="tel:${escapeHtml(phone)}" style="color: var(--primary); text-decoration: none;">
                            ${escapeHtml(phone)}
                        </a>
                    </small>` : ''}
                </td>
                <td>
                    <strong>${escapeHtml(booking.vehicle_name || 'N/A')}</strong>
                    ${booking.pickup_location ? `<br><small style="color: var(--text-secondary);">
                        <i class="fas fa-map-marker-alt"></i> ${escapeHtml(booking.pickup_location)}
                    </small>` : ''}
                </td>
                <td>
                    <div style="font-size: 0.9rem;">
                        <strong>Départ:</strong> ${pickupDate.toLocaleDateString('fr-FR', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric'
                        })} ${pickupDate.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}<br>
                        <strong>Retour:</strong> ${returnDate.toLocaleDateString('fr-FR', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric'
                        })} ${returnDate.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}<br>
                        <small style="color: var(--text-secondary);">${days} jour(s)</small>
                    </div>
                </td>
                <td><strong style="color: var(--primary);">${formatPriceWithCurrency ? formatPriceWithCurrency(booking.total_price) : parseFloat(booking.total_price).toFixed(2) + ' DH'}</strong></td>
                <td>
                    <span class="status-badge status-${booking.status}">
                        ${getStatusLabel(booking.status)}
                    </span>
                </td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <div style="display: flex; gap: 0.25rem;">
                            <button class="btn-secondary" onclick="updateBookingStatus(${booking.id}, 'confirmed')" 
                                    style="padding: 0.25rem 0.5rem; font-size: 0.75rem; flex: 1;" 
                                    ${booking.status === 'confirmed' ? 'disabled' : ''}
                                    title="Confirmer">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn-secondary" onclick="updateBookingStatus(${booking.id}, 'cancelled')" 
                                    style="padding: 0.25rem 0.5rem; font-size: 0.75rem; flex: 1; background: var(--danger); color: white;"
                                    title="Annuler">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div style="display: flex; gap: 0.25rem; margin-top: 0.25rem;">
                            ${phone ? `
                                <button class="btn-icon" onclick="callClient('${escapeHtml(phone)}')" 
                                        style="padding: 0.25rem 0.5rem; font-size: 0.75rem; flex: 1;"
                                        title="Appeler">
                                    <i class="fas fa-phone"></i>
                                </button>
                                <button class="btn-icon btn-whatsapp" onclick="whatsappClient('${escapeHtml(phone)}')" 
                                        style="padding: 0.25rem 0.5rem; font-size: 0.75rem; flex: 1;"
                                        title="WhatsApp">
                                    <i class="fab fa-whatsapp"></i>
                                </button>
                            ` : ''}
                            <button class="btn-icon" onclick="emailClient('${escapeHtml(booking.customer_email)}')" 
                                    style="padding: 0.25rem 0.5rem; font-size: 0.75rem; flex: 1;"
                                    title="Email">
                                <i class="fas fa-envelope"></i>
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterBookings(status) {
    if (status === 'all') {
        renderBookings(bookings);
    } else {
        const filtered = bookings.filter(b => b.status === status);
        renderBookings(filtered);
    }
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'En attente',
        'confirmed': 'Confirmée',
        'active': 'Active',
        'completed': 'Terminée',
        'cancelled': 'Annulée'
    };
    return labels[status] || status;
}

// Load Logs
async function loadLogs() {
    try {
        const formData = new FormData();
        formData.append('action', 'get_logs');
        formData.append('limit', '50');

        const response = await fetch('admin_auth.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.success) {
            logs = data.data;
            renderLogs(logs);
        }
    } catch (error) {
        console.error('Error loading logs:', error);
        document.getElementById('logs-container').innerHTML = 
            '<div class="loading">Erreur lors du chargement des logs</div>';
    }
}

function renderLogs(logsList) {
    const container = document.getElementById('logs-container');
    
    if (logsList.length === 0) {
        container.innerHTML = '<div class="loading">Aucun log trouvé</div>';
        return;
    }

    container.innerHTML = logsList.map(log => {
        const date = new Date(log.created_at);
        const iconClass = getLogIconClass(log.action);
        
        return `
            <div class="log-item">
                <div class="log-icon ${iconClass}">
                    <i class="fas fa-${getLogIcon(log.action)}"></i>
                </div>
                <div class="log-content">
                    <div class="log-action">${escapeHtml(log.action.toUpperCase())}</div>
                    <div class="log-description">${escapeHtml(log.description || 'Aucune description')}</div>
                    <div class="log-meta">
                        <span>${escapeHtml(log.admin_email)}</span>
                        <span>${date.toLocaleString('fr-FR')}</span>
                        <span>${escapeHtml(log.ip_address || 'N/A')}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function refreshLogs() {
    loadLogs();
    showToast('Journal actualisé', 'success');
}

function getLogIcon(action) {
    const icons = {
        'login': 'sign-in-alt',
        'logout': 'sign-out-alt',
        'create': 'plus',
        'update': 'edit',
        'delete': 'trash',
        'view': 'eye'
    };
    return icons[action.toLowerCase()] || 'circle';
}

function getLogIconClass(action) {
    const classes = {
        'login': 'login',
        'logout': 'logout',
        'create': 'create',
        'update': 'update',
        'delete': 'delete'
    };
    return classes[action.toLowerCase()] || 'create';
}

// Vehicle Management
function addVehicle() {
    showVehicleModal();
}

function showVehicleModal(vehicle = null) {
    let modal = document.getElementById('vehicle-modal');
    if (!modal) {
        createVehicleModal();
        modal = document.getElementById('vehicle-modal');
    }
    
    if (!modal) {
        console.error('Failed to create vehicle modal');
        showToast('Erreur: Impossible d\'ouvrir le formulaire', 'error');
        return;
    }
    
    const form = document.getElementById('vehicle-form');
    const modalTitle = document.querySelector('#vehicle-modal .modal-title');
    
    if (!form || !modalTitle) {
        console.error('Form or modal title not found');
        showToast('Erreur: Éléments du formulaire introuvables', 'error');
        return;
    }
    
    if (vehicle) {
        // Edit mode
        modalTitle.textContent = 'Modifier le véhicule';
        form.dataset.mode = 'edit';
        form.dataset.vehicleId = vehicle.id;
        
        // Populate form
        document.getElementById('vehicle-name').value = vehicle.name || '';
        document.getElementById('vehicle-type').value = vehicle.type || '';
        document.getElementById('vehicle-price').value = vehicle.price_per_day || '';
        document.getElementById('vehicle-image').value = vehicle.image_url || '';
        document.getElementById('vehicle-image-url').value = vehicle.image_url || '';
        document.getElementById('vehicle-passengers').value = vehicle.passengers || 4;
        document.getElementById('vehicle-transmission').value = vehicle.transmission || 'Auto';
        document.getElementById('vehicle-doors').value = vehicle.doors || 4;
        document.getElementById('vehicle-rating').value = vehicle.rating || 4.5;
        document.getElementById('vehicle-description').value = vehicle.description || '';
        document.getElementById('vehicle-available').checked = vehicle.available !== false;
        
        // Set availability dates
        const fromDateInput = document.getElementById('vehicle-available-from');
        const toDateInput = document.getElementById('vehicle-available-to');
        const today = new Date().toISOString().split('T')[0];
        
        if (vehicle.available_from) {
            const fromDate = new Date(vehicle.available_from + 'T00:00:00');
            fromDateInput.value = fromDate.toISOString().split('T')[0];
            // Update min date for "to" date
            toDateInput.setAttribute('min', fromDateInput.value);
        } else {
            fromDateInput.value = '';
            toDateInput.setAttribute('min', today);
        }
        
        if (vehicle.available_to) {
            const toDate = new Date(vehicle.available_to + 'T00:00:00');
            toDateInput.value = toDate.toISOString().split('T')[0];
        } else {
            toDateInput.value = '';
        }
        
        // Load existing images
        vehicleImages = vehicle.images && Array.isArray(vehicle.images) ? [...vehicle.images] : 
                       (vehicle.image_url ? [vehicle.image_url] : []);
        updateImagesGallery();
    } else {
        // Add mode
        modalTitle.textContent = 'Ajouter un véhicule';
        form.dataset.mode = 'add';
        form.reset();
        document.getElementById('vehicle-available').checked = true;
        
        // Reset date inputs
        const today = new Date().toISOString().split('T')[0];
        const fromDateInput = document.getElementById('vehicle-available-from');
        const toDateInput = document.getElementById('vehicle-available-to');
        if (fromDateInput) {
            fromDateInput.value = '';
            fromDateInput.setAttribute('min', today);
        }
        if (toDateInput) {
            toDateInput.value = '';
            toDateInput.setAttribute('min', today);
        }
        
        // Reset images
        vehicleImages = [];
        updateImagesGallery();
    }
    
    document.getElementById('vehicle-modal').classList.add('show');
}

function createVehicleModal() {
    const modalHTML = `
        <div id="vehicle-modal" class="modal">
            <div class="modal-overlay" onclick="closeVehicleModal()"></div>
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h2 class="modal-title">Ajouter un véhicule</h2>
                    <button class="modal-close" onclick="closeVehicleModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="vehicle-form" class="modal-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="vehicle-name">Nom du véhicule *</label>
                            <input type="text" id="vehicle-name" name="name" required placeholder="Ex: Audi R8">
                        </div>
                        <div class="form-group">
                            <label for="vehicle-type">Type *</label>
                            <select id="vehicle-type" name="type" required>
                                <option value="">Sélectionner...</option>
                                <option value="Économique">Économique</option>
                                <option value="Compact">Compact</option>
                                <option value="Luxe">Luxe</option>
                                <option value="SUV">SUV</option>
                                <option value="Cabriolet">Cabriolet</option>
                                <option value="Luxury">Luxury</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="vehicle-price">Prix par jour (MAD/DH) *</label>
                            <small style="color: #6b7280; display: block; margin-top: 0.25rem;">Les prix sont stockés en MAD (Dirham Marocain) et convertis automatiquement selon la devise sélectionnée</small>
                            <input type="number" id="vehicle-price" name="price_per_day" required step="0.01" min="0" placeholder="Ex: 12960.00">
                        </div>
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label for="vehicle-images">
                                <i class="fas fa-images" style="margin-right: 0.5rem; color: var(--primary);"></i>
                                Images du véhicule (plusieurs images possibles)
                            </label>
                            <div class="images-upload-container" style="margin-top: 0.5rem;">
                                <input type="file" id="vehicle-images-file" name="images_file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" multiple style="display: none;">
                                <div id="images-gallery" class="images-gallery" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                                    <!-- Images will be added here -->
                                </div>
                                <button type="button" class="btn-image-upload" onclick="document.getElementById('vehicle-images-file').click()" style="width: 100%; padding: 1rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                                    <i class="fas fa-plus"></i> Ajouter des images
                                </button>
                                <div class="image-url-fallback" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-300);">
                                    <small style="display: block; margin-bottom: 0.5rem; color: #6b7280;">Ou ajoutez une URL d'image:</small>
                                    <div style="display: flex; gap: 0.5rem;">
                                        <input type="url" id="vehicle-image-url" placeholder="https://..." style="flex: 1; padding: 0.5rem; font-size: 0.875rem; border: 1px solid var(--gray-300); border-radius: 4px;">
                                        <button type="button" onclick="addImageFromURL()" style="padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">
                                            <i class="fas fa-plus"></i> Ajouter
                                        </button>
                                    </div>
                                </div>
                                <input type="hidden" id="vehicle-images-data" name="images">
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="vehicle-passengers">Nombre de passagers</label>
                            <input type="number" id="vehicle-passengers" name="passengers" min="1" max="9" value="4">
                        </div>
                        <div class="form-group">
                            <label for="vehicle-transmission">Transmission</label>
                            <select id="vehicle-transmission" name="transmission">
                                <option value="Auto">Automatique</option>
                                <option value="Manuel">Manuelle</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="vehicle-doors">Nombre de portes</label>
                            <input type="number" id="vehicle-doors" name="doors" min="2" max="5" value="4">
                        </div>
                        <div class="form-group">
                            <label for="vehicle-rating">Note (0-5)</label>
                            <input type="number" id="vehicle-rating" name="rating" step="0.1" min="0" max="5" value="4.5">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="vehicle-description">Description du véhicule</label>
                        <textarea id="vehicle-description" name="description" rows="4" placeholder="Décrivez les caractéristiques, équipements et avantages de ce véhicule..."></textarea>
                        <small style="color: #6b7280; display: block; margin-top: 0.25rem;">Cette description sera affichée sur la page de détails du véhicule</small>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="vehicle-available" name="available" checked>
                                <span>Véhicule disponible</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="vehicle-available-from">
                                <i class="fas fa-calendar-alt" style="margin-right: 0.5rem; color: var(--primary);"></i>
                                Indisponible du (optionnel)
                            </label>
                            <input type="date" id="vehicle-available-from" name="available_from" 
                                   placeholder="Date de début d'indisponibilité"
                                   style="padding: 0.75rem; border: 2px solid var(--gray-300); border-radius: 8px; font-size: 1rem; width: 100%;">
                            <small style="color: #6b7280; display: block; margin-top: 0.25rem;">
                                <i class="fas fa-info-circle"></i> Date de début de la période d'indisponibilité (ex: maintenance, réparation)
                            </small>
                        </div>
                        <div class="form-group">
                            <label for="vehicle-available-to">
                                <i class="fas fa-calendar-check" style="margin-right: 0.5rem; color: var(--primary);"></i>
                                Indisponible jusqu'au (optionnel)
                            </label>
                            <input type="date" id="vehicle-available-to" name="available_to" 
                                   placeholder="Date de fin d'indisponibilité"
                                   style="padding: 0.75rem; border: 2px solid var(--gray-300); border-radius: 8px; font-size: 1rem; width: 100%;">
                            <small style="color: #6b7280; display: block; margin-top: 0.25rem;">
                                <i class="fas fa-info-circle"></i> Date de fin de la période d'indisponibilité. Laisser vide pour période ouverte.
                            </small>
                        </div>
                    </div>
                    <div class="form-group" style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem; border-radius: 8px; margin-top: 0.5rem;">
                        <small style="color: #92400e; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-lightbulb"></i>
                            <strong>Astuce:</strong> Utilisez ces dates pour bloquer des périodes d'indisponibilité (maintenance, réparation, etc.). 
                            Si les deux dates sont vides, le véhicule est disponible selon son statut général ci-dessus.
                        </small>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="closeVehicleModal()">Annuler</button>
                        <button type="submit" class="btn-primary">
                            <span class="btn-text">Enregistrer</span>
                            <span class="btn-loader" style="display: none;">
                                <i class="fas fa-spinner fa-spin"></i>
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add form submit handler
    const form = document.getElementById('vehicle-form');
    form.addEventListener('submit', handleVehicleSubmit);
    
    // Setup image upload handlers
    setupImageUpload();
    
    // Setup date validation
    setupDateValidation();
}

function setupDateValidation() {
    const fromDateInput = document.getElementById('vehicle-available-from');
    const toDateInput = document.getElementById('vehicle-available-to');
    
    if (!fromDateInput || !toDateInput) return;
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    fromDateInput.setAttribute('min', today);
    toDateInput.setAttribute('min', today);
    
    // When "from" date changes, update "to" date minimum
    fromDateInput.addEventListener('change', function() {
        const fromDate = this.value;
        if (fromDate) {
            toDateInput.setAttribute('min', fromDate);
            // If "to" date is before "from" date, clear it
            if (toDateInput.value && toDateInput.value < fromDate) {
                toDateInput.value = '';
                showToast('La date de fin doit être après la date de début', 'error');
            }
        } else {
            toDateInput.setAttribute('min', today);
        }
    });
    
    // Validate when "to" date changes
    toDateInput.addEventListener('change', function() {
        const toDate = this.value;
        const fromDate = fromDateInput.value;
        
        if (toDate && fromDate && toDate < fromDate) {
            this.value = '';
            showToast('La date de fin doit être après la date de début', 'error');
            this.style.borderColor = '#ef4444';
            setTimeout(() => {
                this.style.borderColor = '';
            }, 3000);
        } else {
            this.style.borderColor = '';
        }
    });
}

// Store vehicle images array
let vehicleImages = [];

function setupImageUpload() {
    const fileInput = document.getElementById('vehicle-images-file');
    const imagesGallery = document.getElementById('images-gallery');
    
    if (!fileInput || !imagesGallery) return;
    
    // File input change - handle multiple files
    fileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
            await uploadImage(file);
        }
        // Reset input to allow same file selection
        fileInput.value = '';
    });
    
    // Drag and drop
    imagesGallery.addEventListener('dragover', (e) => {
        e.preventDefault();
        imagesGallery.classList.add('dragover');
    });
    
    imagesGallery.addEventListener('dragleave', () => {
        imagesGallery.classList.remove('dragover');
    });
    
    imagesGallery.addEventListener('drop', async (e) => {
        e.preventDefault();
        imagesGallery.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                await uploadImage(file);
            }
        }
    });
}

function addImageFromURL() {
    const urlInput = document.getElementById('vehicle-image-url');
    const url = urlInput.value.trim();
    
    if (!url) {
        showToast('Veuillez entrer une URL valide', 'error');
        return;
    }
    
    // Validate URL
    try {
        new URL(url);
    } catch (e) {
        showToast('URL invalide', 'error');
        return;
    }
    
    // Add image to gallery
    addImageToGallery(url);
    urlInput.value = '';
}

function addImageToGallery(imageUrl) {
    if (vehicleImages.includes(imageUrl)) {
        showToast('Cette image est déjà ajoutée', 'warning');
        return;
    }
    
    vehicleImages.push(imageUrl);
    updateImagesGallery();
}

function removeImageFromGallery(imageUrl) {
    vehicleImages = vehicleImages.filter(img => img !== imageUrl);
    updateImagesGallery();
}

function updateImagesGallery() {
    const gallery = document.getElementById('images-gallery');
    if (!gallery) return;
    
    // Update hidden input
    document.getElementById('vehicle-images-data').value = JSON.stringify(vehicleImages);
    
    if (vehicleImages.length === 0) {
        gallery.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #6b7280;"><i class="fas fa-images" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>Aucune image. Cliquez sur "Ajouter des images" pour commencer.</div>';
        return;
    }
    
    gallery.innerHTML = vehicleImages.map((imageUrl, index) => `
        <div class="image-gallery-item" style="position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 2px solid var(--gray-300); background: var(--gray-100);">
            <img src="${escapeHtml(imageUrl)}" alt="Image ${index + 1}" style="width: 100%; height: 100%; object-fit: cover;">
            <button type="button" onclick="removeImageFromGallery('${escapeHtml(imageUrl)}')" style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                <i class="fas fa-times"></i>
            </button>
            <div style="position: absolute; bottom: 0.5rem; left: 0.5rem; background: rgba(0, 0, 0, 0.7); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                Image ${index + 1}
            </div>
        </div>
    `).join('');
}

async function uploadImage(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Veuillez sélectionner une image valide', 'error');
        return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('L\'image est trop grande. Maximum: 5MB', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch('upload_image.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            addImageToGallery(data.image_url);
            showToast('Image téléchargée avec succès', 'success');
        } else {
            showToast(data.error || 'Erreur lors du téléchargement', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Erreur lors du téléchargement', 'error');
    }
}

function updateImagePreview(imageUrl) {
    const preview = document.getElementById('image-preview');
    preview.innerHTML = `
        <img src="${escapeHtml(imageUrl)}" alt="Preview" class="preview-image">
        <button type="button" class="remove-image" onclick="removeImage()" title="Supprimer l'image">
            <i class="fas fa-times"></i>
        </button>
    `;
}

function removeImage() {
    document.getElementById('vehicle-image').value = '';
    document.getElementById('vehicle-image-url').value = '';
    document.getElementById('vehicle-image-file').value = '';
    resetImagePreview();
}

function resetImagePreview() {
    const preview = document.getElementById('image-preview');
    preview.innerHTML = `
        <div class="image-upload-placeholder">
            <i class="fas fa-image"></i>
            <span>Cliquez pour télécharger ou glisser-déposer</span>
        </div>
    `;
}

function closeVehicleModal() {
    const modal = document.getElementById('vehicle-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

async function handleVehicleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const mode = form.dataset.mode;
    const vehicleId = form.dataset.vehicleId;
    
    // Get images array
    const imagesData = document.getElementById('vehicle-images-data');
    let images = [];
    if (imagesData && imagesData.value) {
        try {
            images = JSON.parse(imagesData.value);
        } catch (e) {
            console.error('Error parsing images:', e);
        }
    }
    
    // Set primary image_url from first image if available
    const imageUrl = images.length > 0 ? images[0] : null;
    
    const data = {
        name: document.getElementById('vehicle-name').value.trim(),
        type: document.getElementById('vehicle-type').value,
        price_per_day: parseFloat(document.getElementById('vehicle-price').value),
        image_url: imageUrl,
        images: images,
        passengers: parseInt(document.getElementById('vehicle-passengers').value) || 4,
        transmission: document.getElementById('vehicle-transmission').value || 'Auto',
        doors: parseInt(document.getElementById('vehicle-doors').value) || 4,
        rating: parseFloat(document.getElementById('vehicle-rating').value) || 4.5,
        description: document.getElementById('vehicle-description').value.trim() || null,
        available: document.getElementById('vehicle-available').checked ? 1 : 0,
        available_from: document.getElementById('vehicle-available-from').value || null,
        available_to: document.getElementById('vehicle-available-to').value || null
    };
    
    // Validate required fields
    if (!data.name || !data.type || !data.price_per_day) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    // Validate date range
    if (data.available_from && data.available_to) {
        const fromDate = new Date(data.available_from);
        const toDate = new Date(data.available_to);
        if (toDate < fromDate) {
            showToast('La date de fin doit être après la date de début', 'error');
            return;
        }
    }
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    // Show loading
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    submitBtn.disabled = true;
    
    try {
        let response;
        if (mode === 'edit' && vehicleId) {
            // Update existing vehicle
            response = await fetch(`backend.php?action=vehicles&id=${vehicleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } else {
            // Create new vehicle
            response = await fetch('backend.php?action=vehicles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast(mode === 'edit' ? 'Véhicule modifié avec succès' : 'Véhicule ajouté avec succès', 'success');
            closeVehicleModal();
            // Small delay to ensure database is updated
            setTimeout(() => {
                loadVehicles(); // Refresh the list
                loadDashboardData(); // Refresh stats
            }, 500);
        } else {
            showToast(result.error || 'Erreur lors de l\'enregistrement', 'error');
        }
    } catch (error) {
        console.error('Error saving vehicle:', error);
        showToast('Erreur lors de l\'enregistrement: ' + error.message, 'error');
    } finally {
        // Reset button
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
    }
}

async function editVehicle(id) {
    // Convert id to number for comparison
    const vehicleId = typeof id === 'string' ? parseInt(id) : id;
    
    console.log('editVehicle called with id:', vehicleId, 'vehicles array length:', vehicles.length);
    
    // Try to find vehicle in cached array first
    let vehicle = vehicles.find(v => {
        const vid = typeof v.id === 'string' ? parseInt(v.id) : v.id;
        return vid === vehicleId;
    });
    
    console.log('Vehicle found in cache:', vehicle ? 'Yes' : 'No');
    
    // If not found, fetch from API
    if (!vehicle) {
        try {
            console.log('Fetching vehicle from API...');
            const response = await fetch(`backend.php?action=vehicles&id=${vehicleId}`);
            const data = await response.json();
            
            if (data.success && data.data) {
                vehicle = data.data;
                console.log('Vehicle fetched from API:', vehicle);
            } else {
                console.error('Vehicle not found in API:', data);
                showToast('Véhicule non trouvé', 'error');
                return;
            }
        } catch (error) {
            console.error('Error fetching vehicle:', error);
            showToast('Erreur lors du chargement du véhicule', 'error');
            return;
        }
    }
    
    if (vehicle) {
        console.log('Opening modal for vehicle:', vehicle);
        showVehicleModal(vehicle);
    } else {
        console.error('Vehicle is null or undefined');
        showToast('Véhicule non trouvé', 'error');
    }
}

async function deleteVehicle(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule? Cette action est irréversible.')) return;

    try {
        const response = await fetch(`backend.php?action=vehicles&id=${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (data.success) {
            showToast('Véhicule supprimé avec succès', 'success');
            loadVehicles();
            loadDashboardData(); // Refresh stats
        } else {
            showToast(data.error || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
}

// Booking Management
async function updateBookingStatus(id, status) {
    if (!confirm(`Êtes-vous sûr de vouloir ${status === 'confirmed' ? 'confirmer' : 'annuler'} cette réservation ?`)) {
        return;
    }
    try {
        const response = await fetch(`backend.php?action=bookings&id=${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: status })
        });

        const data = await response.json();
        
        if (data.success) {
            showToast('Statut mis à jour', 'success');
            loadBookings();
            loadNotifications(); // Refresh notifications after status update
        } else {
            showToast('Erreur lors de la mise à jour', 'error');
        }
    } catch (error) {
        showToast('Erreur lors de la mise à jour', 'error');
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Contact Management
let contacts = [];

async function loadContacts() {
    const grid = document.getElementById('contacts-grid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="loading">Chargement des contacts...</div>';
    
    try {
        const response = await fetch('backend.php?action=contacts');
        const data = await response.json();
        
        if (data.success) {
            contacts = data.data || [];
            renderContacts(contacts);
        } else {
            grid.innerHTML = '<div class="loading">Erreur: ' + (data.error || 'Erreur inconnue') + '</div>';
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
        grid.innerHTML = '<div class="loading">Erreur lors du chargement</div>';
    }
}

function renderContacts(contactsList) {
    const grid = document.getElementById('contacts-grid');
    if (!grid) return;
    
    if (contactsList.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>Aucun contact configuré. Cliquez sur "Ajouter un contact" pour commencer.</p></div>';
        return;
    }
    
    grid.innerHTML = contactsList.map(contact => {
        const icon = contact.icon || 'fas fa-link';
        const isActive = contact.is_active !== false;
        
        return `
            <div class="contact-card ${!isActive ? 'inactive' : ''}">
                <div class="contact-header">
                    <div class="contact-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="contact-info">
                        <h3>${escapeHtml(contact.label)}</h3>
                        <span class="contact-type">${escapeHtml(contact.contact_type)}</span>
                    </div>
                    <div class="contact-status">
                        <span class="status-badge ${isActive ? 'status-active' : 'status-cancelled'}">
                            ${isActive ? 'Actif' : 'Inactif'}
                        </span>
                    </div>
                </div>
                <div class="contact-value">
                    <p>${escapeHtml(contact.value)}</p>
                </div>
                <div class="contact-actions">
                    <button class="btn-secondary" onclick="editContact(${contact.id})" style="padding: 0.375rem 0.75rem; font-size: 0.8rem;">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn-secondary" onclick="deleteContact(${contact.id})" style="padding: 0.375rem 0.75rem; font-size: 0.8rem; background: var(--danger); color: white;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function addContact() {
    showContactModal();
}

function showContactModal(contact = null) {
    const modal = document.getElementById('contact-modal');
    if (!modal) {
        createContactModal();
    }
    
    const form = document.getElementById('contact-form');
    const modalTitle = document.querySelector('#contact-modal .modal-title');
    
    if (contact) {
        modalTitle.textContent = 'Modifier le contact';
        form.dataset.mode = 'edit';
        form.dataset.contactId = contact.id;
        
        document.getElementById('contact-type').value = contact.contact_type || '';
        document.getElementById('contact-label').value = contact.label || '';
        document.getElementById('contact-value').value = contact.value || '';
        document.getElementById('contact-icon').value = contact.icon || '';
        document.getElementById('contact-active').checked = contact.is_active !== false;
        document.getElementById('contact-order').value = contact.display_order || 0;
    } else {
        modalTitle.textContent = 'Ajouter un contact';
        form.dataset.mode = 'add';
        form.reset();
        document.getElementById('contact-active').checked = true;
        document.getElementById('contact-order').value = 0;
    }
    
    document.getElementById('contact-modal').classList.add('show');
}

function createContactModal() {
    const modalHTML = `
        <div id="contact-modal" class="modal">
            <div class="modal-overlay" onclick="closeContactModal()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Ajouter un contact</h2>
                    <button class="modal-close" onclick="closeContactModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="contact-form" class="modal-form">
                    <div class="form-group">
                        <label for="contact-type">Type de contact *</label>
                        <select id="contact-type" name="contact_type" required>
                            <option value="">Sélectionner...</option>
                            <option value="phone">Téléphone</option>
                            <option value="email">Email</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="facebook">Facebook</option>
                            <option value="instagram">Instagram</option>
                            <option value="twitter">Twitter</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="youtube">YouTube</option>
                            <option value="address">Adresse</option>
                            <option value="website">Site Web</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="contact-label">Label *</label>
                        <input type="text" id="contact-label" name="label" required placeholder="Ex: Téléphone principal">
                    </div>
                    
                    <div class="form-group">
                        <label for="contact-value">Valeur *</label>
                        <input type="text" id="contact-value" name="value" required placeholder="Ex: +33 6 12 34 56 78 ou https://facebook.com/...">
                    </div>
                    
                    <div class="form-group">
                        <label for="contact-icon">Icône (FontAwesome)</label>
                        <input type="text" id="contact-icon" name="icon" placeholder="Ex: fas fa-phone (laissé vide pour icône par défaut)">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="contact-order">Ordre d'affichage</label>
                            <input type="number" id="contact-order" name="display_order" min="0" value="0">
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="contact-active" name="is_active" checked>
                                <span>Contact actif</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="closeContactModal()">Annuler</button>
                        <button type="submit" class="btn-primary">
                            <span class="btn-text">Enregistrer</span>
                            <span class="btn-loader" style="display: none;">
                                <i class="fas fa-spinner fa-spin"></i>
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const form = document.getElementById('contact-form');
    form.addEventListener('submit', handleContactSubmit);
}

function closeContactModal() {
    const modal = document.getElementById('contact-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

async function handleContactSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const mode = form.dataset.mode;
    const contactId = form.dataset.contactId;
    
    const data = {
        contact_type: document.getElementById('contact-type').value,
        label: document.getElementById('contact-label').value.trim(),
        value: document.getElementById('contact-value').value.trim(),
        icon: document.getElementById('contact-icon').value.trim() || null,
        is_active: document.getElementById('contact-active').checked ? 1 : 0,
        display_order: parseInt(document.getElementById('contact-order').value) || 0
    };
    
    if (!data.contact_type || !data.label || !data.value) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    submitBtn.disabled = true;
    
    try {
        let response;
        if (mode === 'edit' && contactId) {
            response = await fetch(`backend.php?action=contacts&id=${contactId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            response = await fetch('backend.php?action=contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast(mode === 'edit' ? 'Contact modifié avec succès' : 'Contact ajouté avec succès', 'success');
            closeContactModal();
            setTimeout(() => {
                loadContacts();
            }, 500);
        } else {
            showToast(result.error || 'Erreur lors de l\'enregistrement', 'error');
        }
    } catch (error) {
        console.error('Error saving contact:', error);
        showToast('Erreur lors de l\'enregistrement', 'error');
    } finally {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
    }
}

function editContact(id) {
    const contact = contacts.find(c => c.id === id);
    if (contact) {
        showContactModal(contact);
    } else {
        showToast('Contact non trouvé', 'error');
    }
}

async function deleteContact(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact?')) return;

    try {
        const response = await fetch(`backend.php?action=contacts&id=${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (data.success) {
            showToast('Contact supprimé avec succès', 'success');
            loadContacts();
        } else {
            showToast(data.error || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Error deleting contact:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
}

// Make functions globally available
window.showSection = showSection;
window.refreshStats = refreshStats;
window.refreshLogs = refreshLogs;
window.addVehicle = addVehicle;
window.editVehicle = editVehicle;
window.deleteVehicle = deleteVehicle;

// Toggle vehicle availability
async function toggleVehicleAvailability(id, newStatus) {
    try {
        const vehicle = vehicles.find(v => v.id == id);
        if (!vehicle) {
            showToast('Véhicule non trouvé', 'error');
            return;
        }

        const response = await fetch(`backend.php?action=vehicles/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                available: newStatus
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast(`Véhicule ${newStatus ? 'activé' : 'désactivé'} avec succès`, 'success');
            loadVehicles();
        } else {
            showToast(result.error || 'Erreur lors de la mise à jour', 'error');
        }
    } catch (error) {
        console.error('Error toggling vehicle availability:', error);
        showToast('Erreur lors de la mise à jour', 'error');
    }
}

window.toggleVehicleAvailability = toggleVehicleAvailability;
// Notification functions
let notifications = [];
let unreadNotificationsCount = 0;

async function loadNotifications() {
    try {
        const response = await fetch('backend.php?action=bookings');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data && Array.isArray(data.data)) {
            // Get pending and new bookings (created in last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            // Sort by created_at descending and filter
            const filteredBookings = data.data.filter(booking => {
                if (!booking.created_at) return false;
                const createdDate = new Date(booking.created_at);
                return booking.status === 'pending' || createdDate >= sevenDaysAgo;
            });
            
            // Sort by created_at descending
            filteredBookings.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA;
            });
            
            notifications = filteredBookings.slice(0, 10); // Limit to 10 most recent
            
            // Count unread (pending status only)
            unreadNotificationsCount = data.data.filter(b => b.status === 'pending').length;
            
            updateNotificationBadge();
            
            // Note: renderNotifications() will be called by openNotifications() if dropdown is open
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function renderNotifications() {
    const list = document.getElementById('notification-list');
    if (!list) return;
    
    if (notifications.length === 0) {
        list.innerHTML = '<div class="notification-empty">Aucune notification</div>';
        return;
    }
    
    list.innerHTML = notifications.map(notification => {
        const date = new Date(notification.created_at);
        const vehicleName = notification.vehicle_name || 'Véhicule';
        const status = notification.status || 'pending';
        const isPending = status === 'pending';
        
        return `
            <div class="notification-item ${isPending ? 'unread' : ''}" onclick="handleNotificationClick(${notification.id})">
                <div class="notification-icon">
                    <i class="fas fa-${isPending ? 'clock' : 'check-circle'}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">
                        ${isPending ? '<strong>Nouvelle réservation</strong>' : 'Réservation ' + getStatusLabel(status)}
                    </div>
                    <div class="notification-text">
                        ${escapeHtml(notification.customer_name)} - ${escapeHtml(vehicleName)}
                    </div>
                    <div class="notification-time">
                        ${date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (badge) {
        if (unreadNotificationsCount > 0) {
            badge.textContent = unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function toggleNotifications() {
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) return;
    
    if (dropdown.classList.contains('active')) {
        closeNotifications();
    } else {
        openNotifications();
    }
}

async function openNotifications() {
    const dropdown = document.getElementById('notification-dropdown');
    const btn = document.getElementById('notification-btn');
    if (dropdown) {
        dropdown.classList.add('active');
        if (btn) {
            btn.classList.add('active');
        }
        // Load notifications and render them
        await loadNotifications();
        renderNotifications();
    }
}

function closeNotifications() {
    const dropdown = document.getElementById('notification-dropdown');
    const btn = document.getElementById('notification-btn');
    if (dropdown) {
        dropdown.classList.remove('active');
    }
    if (btn) {
        btn.classList.remove('active');
    }
}

function handleNotificationClick(bookingId) {
    // Switch to bookings section and filter to this booking
    showSection('bookings');
    closeNotifications();
    // Scroll to the booking in the table (if needed)
    setTimeout(() => {
        loadBookings();
    }, 100);
}

// Make functions available globally
window.closeNotifications = closeNotifications;
window.toggleNotifications = toggleNotifications;
window.handleNotificationClick = handleNotificationClick;
window.updateBookingStatus = updateBookingStatus;
window.closeVehicleModal = closeVehicleModal;
window.removeImage = removeImage;
window.addContact = addContact;
window.editContact = editContact;
window.deleteContact = deleteContact;
window.closeContactModal = closeContactModal;

// Client Management
async function loadClients() {
    const tbody = document.getElementById('clients-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Chargement des clients...</td></tr>';
    
    try {
        const response = await fetch('backend.php?action=clients');
        const data = await response.json();
        
        if (data.success) {
            clients = data.data || [];
            renderClients(clients);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">Erreur: ' + (data.error || 'Erreur inconnue') + '</td></tr>';
        }
    } catch (error) {
        console.error('Error loading clients:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Erreur lors du chargement</td></tr>';
    }
}

function renderClients(clientsList) {
    const tbody = document.getElementById('clients-table-body');
    if (!tbody) return;
    
    if (clientsList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Aucun client enregistré</td></tr>';
        return;
    }
    
    tbody.innerHTML = clientsList.map(client => {
        const lastBooking = client.last_booking_date 
            ? new Date(client.last_booking_date).toLocaleDateString('fr-FR', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            })
            : 'Aucune';
        
        return `
            <tr>
                <td><strong>${escapeHtml(client.name)}</strong></td>
                <td>
                    <a href="tel:${escapeHtml(client.phone)}" class="contact-link">
                        <i class="fas fa-phone"></i> ${escapeHtml(client.phone)}
                    </a>
                </td>
                <td>
                    ${client.email 
                        ? `<a href="mailto:${escapeHtml(client.email)}" class="contact-link">
                            <i class="fas fa-envelope"></i> ${escapeHtml(client.email)}
                           </a>`
                        : '<span class="text-muted">-</span>'
                    }
                </td>
                <td><span class="badge">${client.total_bookings || 0}</span></td>
                <td>${lastBooking}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="contactClient('${escapeHtml(client.phone)}', '${escapeHtml(client.email || '')}')" 
                                class="btn-icon" title="Contacter">
                            <i class="fas fa-phone"></i>
                        </button>
                        ${client.email 
                            ? `<button onclick="emailClient('${escapeHtml(client.email)}')" 
                                      class="btn-icon" title="Envoyer un email">
                                 <i class="fas fa-envelope"></i>
                               </button>`
                            : ''
                        }
                        <button onclick="whatsappClient('${escapeHtml(client.phone)}')" 
                                class="btn-icon btn-whatsapp" title="WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function contactClient(phone, email) {
    const options = [];
    if (phone) options.push(`Téléphoner: ${phone}`);
    if (email) options.push(`Email: ${email}`);
    
    if (options.length > 0) {
        alert('Options de contact:\n' + options.join('\n'));
    }
}

function emailClient(email) {
    window.location.href = `mailto:${email}`;
}

function whatsappClient(phone) {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
}

function callClient(phone) {
    window.location.href = `tel:${phone}`;
}

window.contactClient = contactClient;
window.emailClient = emailClient;
window.whatsappClient = whatsappClient;
window.callClient = callClient;

// Admin Management Functions
let admins = [];

async function loadAdmins() {
    try {
        const response = await fetch('backend.php?action=admins', {
            credentials: 'same-origin'
        });
        const data = await response.json();
        
        if (data.success && data.data) {
            admins = data.data;
            displayAdmins(admins);
        } else {
            document.getElementById('admins-table-body').innerHTML = 
                '<tr><td colspan="5" class="loading">Erreur: ' + (data.error || 'Erreur inconnue') + '</td></tr>';
        }
    } catch (error) {
        console.error('Error loading admins:', error);
        document.getElementById('admins-table-body').innerHTML = 
            '<tr><td colspan="5" class="loading">Erreur lors du chargement</td></tr>';
    }
}

function displayAdmins(adminsList) {
    const tbody = document.getElementById('admins-table-body');
    if (!tbody) return;

    if (adminsList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">Aucun administrateur trouvé</td></tr>';
        return;
    }

    tbody.innerHTML = adminsList.map(admin => {
        const statusClass = admin.is_active ? 'status-active' : 'status-inactive';
        const statusText = admin.is_active ? 'Actif' : 'Inactif';
        const createdDate = new Date(admin.created_at).toLocaleDateString('fr-FR');
        
        return `
            <tr>
                <td><strong>${escapeHtml(admin.full_name)}</strong></td>
                <td>${escapeHtml(admin.email)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${createdDate}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="editAdmin(${admin.id})" class="btn-icon" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="toggleAdminStatus(${admin.id}, ${admin.is_active ? 0 : 1})" 
                                class="btn-icon" title="${admin.is_active ? 'Désactiver' : 'Activer'}">
                            <i class="fas fa-${admin.is_active ? 'ban' : 'check'}"></i>
                        </button>
                        <button onclick="deleteAdmin(${admin.id})" 
                                class="btn-icon btn-danger" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function setupPasswordChangeForm() {
    const form = document.getElementById('change-password-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            showToast('Les nouveaux mots de passe ne correspondent pas', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('Le mot de passe doit contenir au moins 6 caractères', 'error');
            return;
        }

        try {
            const response = await fetch('backend.php?action=admins/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            });

            const result = await response.json();

            if (result.success) {
                showToast('Mot de passe changé avec succès', 'success');
                form.reset();
            } else {
                showToast(result.error || 'Erreur lors du changement de mot de passe', 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showToast('Erreur lors du changement de mot de passe', 'error');
        }
    });
}

function showAddAdminModal() {
    showAdminModal();
}

function showAdminModal(admin = null) {
    const modal = document.getElementById('admin-modal');
    if (modal) {
        modal.remove();
    }

    const modalHTML = `
        <div id="admin-modal" class="modal show">
            <div class="modal-overlay" onclick="closeAdminModal()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">${admin ? 'Modifier l\'administrateur' : 'Ajouter un administrateur'}</h2>
                    <button class="modal-close" onclick="closeAdminModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="admin-form" class="modal-form">
                    <div class="form-group">
                        <label for="admin-full-name">Nom complet *</label>
                        <input type="text" id="admin-full-name" name="full_name" required 
                               value="${admin ? escapeHtml(admin.full_name) : ''}" 
                               placeholder="Ex: John Doe">
                    </div>
                    <div class="form-group">
                        <label for="admin-email-input">Email *</label>
                        <input type="email" id="admin-email-input" name="email" required 
                               value="${admin ? escapeHtml(admin.email) : ''}" 
                               placeholder="Ex: admin@rentcars.com">
                    </div>
                    <div class="form-group">
                        <label for="admin-password">Mot de passe ${admin ? '(laisser vide pour ne pas changer)' : '*'}</label>
                        <input type="password" id="admin-password" name="password" 
                               ${admin ? '' : 'required'} minlength="6"
                               placeholder="Minimum 6 caractères">
                        ${admin ? '<small style="color: #6b7280;">Laisser vide pour conserver le mot de passe actuel</small>' : ''}
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="admin-is-active" name="is_active" ${admin ? (admin.is_active ? 'checked' : '') : 'checked'}>
                            <span>Compte actif</span>
                        </label>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="closeAdminModal()">Annuler</button>
                        <button type="submit" class="btn-primary">
                            <span class="btn-text">${admin ? 'Enregistrer' : 'Créer'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const form = document.getElementById('admin-form');
    form.dataset.mode = admin ? 'edit' : 'add';
    if (admin) {
        form.dataset.adminId = admin.id;
    }

    form.addEventListener('submit', handleAdminSubmit);
}

function closeAdminModal() {
    const modal = document.getElementById('admin-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

async function handleAdminSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const mode = form.dataset.mode;
    const adminId = form.dataset.adminId;

    const data = {
        full_name: document.getElementById('admin-full-name').value.trim(),
        email: document.getElementById('admin-email-input').value.trim(),
        is_active: document.getElementById('admin-is-active').checked ? 1 : 0
    };

    const password = document.getElementById('admin-password').value;
    if (password) {
        data.password = password;
    }

    if (!data.full_name || !data.email) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    if (mode === 'add' && !password) {
        showToast('Le mot de passe est requis pour un nouvel administrateur', 'error');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    const originalText = submitBtn.querySelector('.btn-text').textContent;
    submitBtn.querySelector('.btn-text').textContent = 'Traitement...';

    try {
        let response;
        if (mode === 'edit' && adminId) {
            response = await fetch(`backend.php?action=admins/${adminId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify(data)
            });
        } else {
            response = await fetch('backend.php?action=admins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify(data)
            });
        }

        const result = await response.json();

        if (result.success) {
            showToast(mode === 'edit' ? 'Administrateur modifié avec succès' : 'Administrateur créé avec succès', 'success');
            closeAdminModal();
            setTimeout(() => {
                loadAdmins();
            }, 500);
        } else {
            console.error('Admin save error:', result);
            const errorMsg = result.error || 'Erreur lors de l\'enregistrement';
            showToast(errorMsg, 'error');
            
            // If unauthorized, suggest reloading
            if (result.error && result.error.includes('Unauthorized')) {
                setTimeout(() => {
                    if (confirm('Votre session a expiré. Voulez-vous recharger la page pour vous reconnecter?')) {
                        window.location.reload();
                    }
                }, 2000);
            }
        }
    } catch (error) {
        console.error('Error saving admin:', error);
        showToast('Erreur lors de l\'enregistrement: ' + (error.message || 'Erreur inconnue'), 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = originalText;
    }
}

function editAdmin(id) {
    const admin = admins.find(a => a.id == id);
    if (admin) {
        showAdminModal(admin);
    } else {
        showToast('Administrateur non trouvé', 'error');
    }
}

async function toggleAdminStatus(id, newStatus) {
    const admin = admins.find(a => a.id == id);
    if (!admin) {
        showToast('Administrateur non trouvé', 'error');
        return;
    }

    try {
        const response = await fetch(`backend.php?action=admins/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                is_active: newStatus
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast(`Administrateur ${newStatus ? 'activé' : 'désactivé'} avec succès`, 'success');
            loadAdmins();
        } else {
            showToast(result.error || 'Erreur lors de la mise à jour', 'error');
        }
    } catch (error) {
        console.error('Error toggling admin status:', error);
        showToast('Erreur lors de la mise à jour', 'error');
    }
}

async function deleteAdmin(id) {
    const admin = admins.find(a => a.id == id);
    if (!admin) {
        showToast('Administrateur non trouvé', 'error');
        return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'administrateur "${admin.full_name}" ? Cette action est irréversible.`)) {
        return;
    }

    try {
        const response = await fetch(`backend.php?action=admins/${id}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Administrateur supprimé avec succès', 'success');
            loadAdmins();
        } else {
            showToast(result.error || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Error deleting admin:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
}

// ============================================
// BRANDS MANAGEMENT
// ============================================
let brands = [];

async function loadBrands() {
    try {
        const response = await fetch('backend.php?action=car_brands', {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load brands');
        }
        
        brands = await response.json();
        displayBrands();
    } catch (error) {
        console.error('Error loading brands:', error);
        document.getElementById('brands-tbody').innerHTML = 
            '<tr><td colspan="6" class="error">Erreur lors du chargement des marques</td></tr>';
    }
}

function displayBrands() {
    const tbody = document.getElementById('brands-tbody');
    
    if (!brands || brands.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">Aucune marque trouvée</td></tr>';
        return;
    }
    
    // Helper function to get absolute URL for images
    function getImageUrl(relativeUrl) {
        if (!relativeUrl) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="50"%3E%3Crect fill="%23ddd" width="100" height="50"/%3E%3Ctext fill="%23999" font-family="Arial" font-size="10" x="50%" y="50%" text-anchor="middle" dy=".3em"%3ELogo%3C/text%3E%3C/svg%3E';
        if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
            return relativeUrl;
        }
        const baseUrl = window.location.origin;
        const pathname = window.location.pathname;
        const basePath = pathname.substring(0, pathname.lastIndexOf('/')) || '';
        if (relativeUrl.startsWith('/')) {
            return baseUrl + relativeUrl;
        } else {
            return baseUrl + basePath + '/' + relativeUrl;
        }
    }
    
    // Create placeholder data URI for failed images
    const placeholderDataUri = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="50"%3E%3Crect fill="%23f3f4f6" width="100" height="50"/%3E%3Ctext fill="%239ca3af" font-family="Arial" font-size="10" x="50%" y="50%" text-anchor="middle" dy=".3em"%3ELogo%3C/text%3E%3C/svg%3E';
    
    tbody.innerHTML = brands.map(brand => {
        const imageUrl = getImageUrl(brand.logo_url);
        return `
        <tr>
            <td>${brand.id}</td>
            <td>
                <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(brand.name)}" 
                     class="brand-logo-preview" 
                     onerror="this.onerror=null; this.src='${placeholderDataUri}'"
                     loading="lazy">
            </td>
            <td><strong>${escapeHtml(brand.name)}</strong></td>
            <td>${brand.display_order}</td>
            <td>
                <span class="badge ${brand.is_active ? 'badge-success' : 'badge-danger'}">
                    ${brand.is_active ? 'Actif' : 'Inactif'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="editBrand(${brand.id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteBrand(${brand.id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    }).join('');
}

function addBrand() {
    showBrandModal();
}

function editBrand(id) {
    const brand = brands.find(b => b.id == id);
    if (!brand) {
        showToast('Marque non trouvée', 'error');
        return;
    }
    showBrandModal(brand);
}

function showBrandModal(brand = null) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'brand-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeBrandModal()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">${brand ? 'Modifier la marque' : 'Ajouter une marque'}</h2>
                <button class="modal-close" onclick="closeBrandModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="brand-form" class="modal-form">
                <div class="form-group">
                    <label for="brand-name">Nom de la marque *</label>
                    <input type="text" id="brand-name" name="name" required 
                           value="${brand ? escapeHtml(brand.name) : ''}" 
                           placeholder="Ex: Mercedes-Benz">
                </div>
                <div class="form-group">
                    <label for="brand-logo-url">Logo de la marque *</label>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <input type="file" id="brand-logo-file" name="logo_file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml" style="display: none;">
                            <button type="button" class="btn-secondary" onclick="document.getElementById('brand-logo-file').click()" style="flex: 1; padding: 0.75rem; background: var(--primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-size: 0.95rem;">
                                <i class="fas fa-upload"></i> Parcourir et télécharger
                            </button>
                        </div>
                        <div style="padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md); border: 1px solid var(--gray-200);">
                            <small style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-weight: 600;">OU</small>
                            <label for="brand-logo-url" style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">Entrez une URL</label>
                            <input type="text" id="brand-logo-url" name="logo_url" 
                                   value="${brand ? escapeHtml(brand.logo_url) : ''}" 
                                   placeholder="https://example.com/logo.png ou images/logos/logo.png"
                                   style="width: 100%; padding: 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-size: 0.95rem;"
                                   data-original-required="true">
                            <small style="display: block; margin-top: 0.5rem; color: var(--text-secondary);">Format accepté: PNG, SVG, JPG, GIF, WebP</small>
                        </div>
                    </div>
                    <div id="brand-logo-upload-status" style="margin-top: 0.75rem; display: none;"></div>
                </div>
                <div class="form-group">
                    <label for="brand-display-order">Ordre d'affichage</label>
                    <input type="number" id="brand-display-order" name="display_order" 
                           value="${brand ? brand.display_order : 0}" min="0">
                    <small>Les marques sont triées par ordre croissant</small>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="brand-is-active" name="is_active" 
                               ${brand && brand.is_active ? 'checked' : 'checked'}>
                        Marque active
                    </label>
                </div>
                <div id="brand-logo-preview" class="brand-logo-preview-container" style="display: none; margin-top: 1rem;">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);">Aperçu du logo:</label>
                    <div style="display: inline-block; padding: 1rem; background: var(--gray-50); border: 2px solid var(--gray-200); border-radius: var(--radius-md);">
                        <img id="brand-logo-preview-img" src="" alt="Aperçu du logo" 
                             style="max-width: 200px; max-height: 100px; width: auto; height: auto; object-fit: contain; display: block;">
                    </div>
                </div>
            </form>
            <div class="modal-actions">
                <button type="button" class="btn-secondary" onclick="closeBrandModal()">Annuler</button>
                <button type="submit" form="brand-form" class="btn-primary">
                    ${brand ? 'Modifier' : 'Ajouter'}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Setup file upload
    const logoFileInput = document.getElementById('brand-logo-file');
    const logoUrlInput = document.getElementById('brand-logo-url');
    const previewContainer = document.getElementById('brand-logo-preview');
    const previewImg = document.getElementById('brand-logo-preview-img');
    const uploadStatus = document.getElementById('brand-logo-upload-status');
    let uploadedLogoUrl = null;
    
    // Helper function to get absolute URL
    function getAbsoluteUrl(relativeUrl) {
        if (!relativeUrl) return '';
        if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
            return relativeUrl;
        }
        // Get base URL from current location
        const baseUrl = window.location.origin;
        const pathname = window.location.pathname;
        // Remove filename from path (e.g., admin_dashboard.php)
        const basePath = pathname.substring(0, pathname.lastIndexOf('/')) || '';
        
        // If URL already starts with /, use as is, otherwise add base path
        if (relativeUrl.startsWith('/')) {
            return baseUrl + relativeUrl;
        } else {
            return baseUrl + basePath + '/' + relativeUrl;
        }
    }
    
    // Handle file selection - show preview first, then upload
    if (logoFileInput) {
        logoFileInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
            if (!allowedTypes.includes(file.type)) {
                uploadStatus.innerHTML = '<span style="color: var(--danger);"><i class="fas fa-exclamation-circle"></i> Type de fichier non autorisé. Utilisez PNG, SVG, JPG, GIF ou WebP.</span>';
                uploadStatus.style.display = 'block';
                return;
            }
            
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                uploadStatus.innerHTML = '<span style="color: var(--danger);"><i class="fas fa-exclamation-circle"></i> Fichier trop volumineux. Taille maximale: 5MB.</span>';
                uploadStatus.style.display = 'block';
                return;
            }
            
            // Show preview immediately using FileReader (before upload)
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                previewContainer.style.display = 'block';
                previewImg.onerror = null; // Reset error handler
            };
            reader.readAsDataURL(file);
            
            // Show upload status
            uploadStatus.innerHTML = '<span style="color: var(--info);"><i class="fas fa-spinner fa-spin"></i> Téléchargement en cours...</span>';
            uploadStatus.style.display = 'block';
            
            // Upload file
            try {
                const formData = new FormData();
                formData.append('logo', file);
                
                const response = await fetch('upload_brand_logo.php', {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    uploadedLogoUrl = result.image_url;
                    logoUrlInput.value = result.image_url;
                    // Remove required attribute and clear validation since we have a file uploaded
                    logoUrlInput.removeAttribute('required');
                    if (logoUrlInput.setCustomValidity) {
                        logoUrlInput.setCustomValidity(''); // Clear any validation errors
                    }
                    // Remove any error styling
                    logoUrlInput.style.borderColor = 'var(--gray-300)';
                    // Update preview with server URL (absolute path)
                    const absoluteUrl = getAbsoluteUrl(result.image_url);
                    previewImg.src = absoluteUrl;
                    previewImg.onerror = function() {
                        // Fallback to data URL (local preview) if server URL fails
                        if (reader.result) {
                            this.src = reader.result;
                        }
                    };
                    previewContainer.style.display = 'block';
                    uploadStatus.innerHTML = '<span style="color: var(--success);"><i class="fas fa-check-circle"></i> Logo téléchargé avec succès!</span>';
                    // Clear status after 3 seconds
                    setTimeout(() => {
                        uploadStatus.style.display = 'none';
                    }, 3000);
                } else {
                    uploadStatus.innerHTML = `<span style="color: var(--danger);"><i class="fas fa-exclamation-circle"></i> ${result.error || 'Erreur lors du téléchargement'}</span>`;
                    // Keep preview if it was shown
                    if (previewImg.src && previewImg.src.startsWith('data:')) {
                        // Preview stays visible
                    } else {
                        previewContainer.style.display = 'none';
                    }
                }
            } catch (error) {
                console.error('Upload error:', error);
                uploadStatus.innerHTML = '<span style="color: var(--danger);"><i class="fas fa-exclamation-circle"></i> Erreur lors du téléchargement du fichier.</span>';
                // Keep preview if it was shown
                if (previewImg.src && previewImg.src.startsWith('data:')) {
                    // Preview stays visible
                } else {
                    previewContainer.style.display = 'none';
                }
            }
        });
    }
    
    // Preview logo when URL changes
    if (logoUrlInput) {
        logoUrlInput.addEventListener('input', function() {
            const url = this.value.trim();
            if (url) {
                const absoluteUrl = getAbsoluteUrl(url);
                previewImg.src = absoluteUrl;
                previewContainer.style.display = 'block';
                previewImg.onerror = function() {
                    // Try original URL if absolute doesn't work
                    if (absoluteUrl !== url) {
                        this.src = url;
                        this.onerror = function() {
                            // Use data URI placeholder instead of external URL
                            this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="100"%3E%3Crect fill="%23f3f4f6" width="200" height="100"/%3E%3Ctext fill="%239ca3af" font-family="Arial" font-size="12" x="50%" y="50%" text-anchor="middle" dy=".3em"%3ELogo introuvable%3C/text%3E%3C/svg%3E';
                        };
                    } else {
                        // Use data URI placeholder instead of external URL
                        this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="100"%3E%3Crect fill="%23f3f4f6" width="200" height="100"/%3E%3Ctext fill="%239ca3af" font-family="Arial" font-size="12" x="50%" y="50%" text-anchor="middle" dy=".3em"%3ELogo introuvable%3C/text%3E%3C/svg%3E';
                    }
                };
                // If URL is provided, mark as valid and remove required from file input
                if (url && (url.startsWith('http') || url.startsWith('/'))) {
                    if (logoFileInput) {
                        logoFileInput.removeAttribute('required');
                    }
                }
            } else if (!uploadedLogoUrl) {
                previewContainer.style.display = 'none';
                // Restore required if no file uploaded
                if (!uploadedLogoUrl) {
                    const originalRequired = logoUrlInput.getAttribute('data-original-required');
                    if (originalRequired === 'true') {
                        logoUrlInput.setAttribute('required', 'required');
                    }
                }
            }
        });
        
        // Validate that either file or URL is provided before form submission
        logoUrlInput.addEventListener('blur', function() {
            const url = this.value.trim();
            if (!url && !uploadedLogoUrl) {
                this.setAttribute('required', 'required');
                if (this.setCustomValidity) {
                    this.setCustomValidity('Veuillez télécharger un logo ou entrer une URL');
                }
                this.style.borderColor = 'var(--danger)';
            } else if (url || uploadedLogoUrl) {
                this.removeAttribute('required');
                if (this.setCustomValidity) {
                    this.setCustomValidity(''); // Clear validation error
                }
                this.style.borderColor = 'var(--gray-300)';
            }
        });
        
        // Also validate on input to clear errors immediately
        logoUrlInput.addEventListener('input', function() {
            const url = this.value.trim();
            if (url || uploadedLogoUrl) {
                if (this.setCustomValidity) {
                    this.setCustomValidity(''); // Clear validation error
                }
                this.style.borderColor = 'var(--gray-300)';
            }
        });
    }
    
    // Trigger preview if editing
    if (brand && brand.logo_url) {
        const absoluteUrl = getAbsoluteUrl(brand.logo_url);
        previewImg.src = absoluteUrl;
                previewImg.onerror = function() {
                    // Try original URL if absolute doesn't work
                    if (absoluteUrl !== brand.logo_url) {
                        this.src = brand.logo_url;
                        this.onerror = function() {
                            // Use data URI placeholder instead of external URL
                            this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="100"%3E%3Crect fill="%23f3f4f6" width="200" height="100"/%3E%3Ctext fill="%239ca3af" font-family="Arial" font-size="12" x="50%" y="50%" text-anchor="middle" dy=".3em"%3ELogo introuvable%3C/text%3E%3C/svg%3E';
                        };
                    } else {
                        // Use data URI placeholder instead of external URL
                        this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="100"%3E%3Crect fill="%23f3f4f6" width="200" height="100"/%3E%3Ctext fill="%239ca3af" font-family="Arial" font-size="12" x="50%" y="50%" text-anchor="middle" dy=".3em"%3ELogo introuvable%3C/text%3E%3C/svg%3E';
                    }
                };
        previewContainer.style.display = 'block';
        logoUrlInput.value = brand.logo_url;
    }
    
    // Handle form submission
    document.getElementById('brand-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleBrandSubmit(brand ? brand.id : null);
    });
}

async function handleBrandSubmit(brandId) {
    const form = document.getElementById('brand-form');
    const formData = new FormData(form);
    const isActiveCheckbox = document.getElementById('brand-is-active');
    const logoUrlInput = document.getElementById('brand-logo-url');
    
    // Get logo URL - use uploaded file URL if available, otherwise use URL input
    let logoUrl = logoUrlInput ? logoUrlInput.value.trim() : '';
    
    // Validate that either file or URL is provided
    if (!logoUrl) {
        showToast('Veuillez télécharger un logo ou entrer une URL', 'error');
        return;
    }
    
    const data = {
        name: formData.get('name'),
        logo_url: logoUrl,
        display_order: parseInt(formData.get('display_order')) || 0,
        is_active: isActiveCheckbox && isActiveCheckbox.checked ? 1 : 0
    };
    
    // Validate required fields
    if (!data.name || !data.logo_url) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    try {
        const url = brandId 
            ? `backend.php?action=car_brands/${brandId}`
            : 'backend.php?action=car_brands';
        
        const response = await fetch(url, {
            method: brandId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(brandId ? 'Marque modifiée avec succès' : 'Marque ajoutée avec succès', 'success');
            closeBrandModal();
            loadBrands();
        } else {
            showToast(result.error || 'Erreur lors de l\'opération', 'error');
        }
    } catch (error) {
        console.error('Error saving brand:', error);
        showToast('Erreur lors de l\'opération', 'error');
    }
}

function closeBrandModal() {
    const modal = document.getElementById('brand-modal');
    if (modal) {
        modal.remove();
    }
}

async function deleteBrand(id) {
    const brand = brands.find(b => b.id == id);
    if (!brand) {
        showToast('Marque non trouvée', 'error');
        return;
    }
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la marque "${brand.name}" ? Cette action est irréversible.`)) {
        return;
    }
    
    try {
        const response = await fetch(`backend.php?action=car_brands/${id}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Marque supprimée avec succès', 'success');
            loadBrands();
        } else {
            showToast(result.error || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Error deleting brand:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
}

// Make functions globally available
window.showAddAdminModal = showAddAdminModal;
window.closeAdminModal = closeAdminModal;
window.editAdmin = editAdmin;
window.toggleAdminStatus = toggleAdminStatus;
window.deleteAdmin = deleteAdmin;
window.addBrand = addBrand;
window.editBrand = editBrand;
window.deleteBrand = deleteBrand;
window.closeBrandModal = closeBrandModal;
window.addImageFromURL = addImageFromURL;
window.removeImageFromGallery = removeImageFromGallery;

// Offers Management Functions
let offers = [];

async function loadOffers() {
    try {
        const response = await fetch('backend.php?action=offers', {
            credentials: 'same-origin'
        });
        const data = await response.json();
        
        if (data.success && data.data) {
            offers = data.data;
            displayOffers(offers);
        } else {
            document.getElementById('offers-tbody').innerHTML = 
                '<tr><td colspan="10" class="loading">Erreur: ' + (data.error || 'Erreur inconnue') + '</td></tr>';
        }
    } catch (error) {
        console.error('Error loading offers:', error);
        document.getElementById('offers-tbody').innerHTML = 
            '<tr><td colspan="10" class="loading">Erreur lors du chargement</td></tr>';
    }
}

function displayOffers(offersList) {
    const tbody = document.getElementById('offers-tbody');
    if (!tbody) return;

    if (offersList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="loading">Aucune offre trouvée. Cliquez sur "Ajouter une offre" pour en créer une.</td></tr>';
        return;
    }

    tbody.innerHTML = offersList.map(offer => {
        const statusClass = offer.is_active ? 'status-active' : 'status-cancelled';
        const statusText = offer.is_active ? 'Active' : 'Inactive';
        const startDate = new Date(offer.start_date).toLocaleDateString('fr-FR');
        const endDate = new Date(offer.end_date).toLocaleDateString('fr-FR');
        
        let discountDisplay = '';
        if (offer.offer_type === 'percentage') {
            discountDisplay = `${offer.discount_value}%`;
        } else if (offer.offer_type === 'fixed_amount') {
            discountDisplay = `${offer.discount_value} DH`;
        } else {
            discountDisplay = `${offer.discount_value} jours gratuits`;
        }
        
        return `
            <tr>
                <td>${offer.id}</td>
                <td><strong>${escapeHtml(offer.title)}</strong></td>
                <td><span class="status-badge">${escapeHtml(offer.offer_type)}</span></td>
                <td><strong style="color: var(--success);">${discountDisplay}</strong></td>
                <td>${offer.vehicle_name ? escapeHtml(offer.vehicle_name) : '<span style="color: var(--text-secondary);">Tous véhicules</span>'}</td>
                <td>${startDate}</td>
                <td>${endDate}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td><strong>${offer.sales_count || 0}</strong></td>
                <td>
                    <div class="action-buttons">
                        <button onclick="editOffer(${offer.id})" class="btn-icon" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="toggleOfferStatus(${offer.id}, ${offer.is_active ? 0 : 1})" 
                                class="btn-icon" title="${offer.is_active ? 'Désactiver' : 'Activer'}">
                            <i class="fas fa-${offer.is_active ? 'ban' : 'check'}"></i>
                        </button>
                        <button onclick="deleteOffer(${offer.id})" 
                                class="btn-icon btn-danger" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function addOffer() {
    showOfferModal();
}

function showOfferModal(offer = null) {
    const modal = document.getElementById('offer-modal');
    if (modal) {
        modal.remove();
    }

    const modalHTML = `
        <div id="offer-modal" class="modal show">
            <div class="modal-overlay" onclick="closeOfferModal()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">${offer ? 'Modifier l\'offre' : 'Ajouter une offre'}</h2>
                    <button class="modal-close" onclick="closeOfferModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="offer-form" class="modal-form">
                    <div class="form-group">
                        <label for="offer-title">Titre de l'offre *</label>
                        <input type="text" id="offer-title" name="title" required 
                               value="${offer ? escapeHtml(offer.title) : ''}" 
                               placeholder="Ex: Réduction de 20%">
                    </div>
                    <div class="form-group">
                        <label for="offer-description">Description</label>
                        <textarea id="offer-description" name="description" rows="3" 
                                  placeholder="Description détaillée de l'offre">${offer ? escapeHtml(offer.description || '') : ''}</textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="offer-type">Type d'offre *</label>
                            <select id="offer-type" name="offer_type" required>
                                <option value="">Sélectionner...</option>
                                <option value="percentage" ${offer && offer.offer_type === 'percentage' ? 'selected' : ''}>Pourcentage (%)</option>
                                <option value="fixed_amount" ${offer && offer.offer_type === 'fixed_amount' ? 'selected' : ''}>Montant fixe (DH)</option>
                                <option value="free_days" ${offer && offer.offer_type === 'free_days' ? 'selected' : ''}>Jours gratuits</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="offer-discount">Valeur de la réduction *</label>
                            <input type="number" id="offer-discount" name="discount_value" required 
                                   step="0.01" min="0" 
                                   value="${offer ? offer.discount_value : ''}" 
                                   placeholder="Ex: 20">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="offer-vehicle">Véhicule (optionnel)</label>
                        <select id="offer-vehicle" name="vehicle_id">
                            <option value="">Tous les véhicules</option>
                        </select>
                        <small style="color: #6b7280;">Laisser vide pour appliquer à tous les véhicules</small>
                    </div>
                    <div class="form-group">
                        <label for="offer-image">Image de l'offre (optionnel)</label>
                        <div style="display: flex; gap: 1rem; align-items: flex-start;">
                            <div style="flex: 1;">
                                <input type="url" id="offer-image" name="image_url" 
                                       value="${offer ? (offer.image_url || '') : ''}" 
                                       placeholder="https://example.com/image.jpg ou choisir un fichier">
                                <small style="color: #6b7280; display: block; margin-top: 0.5rem;">URL de l'image ou choisir un fichier ci-dessous</small>
                            </div>
                            <div>
                                <label for="offer-image-file" class="btn-secondary" style="cursor: pointer; padding: 0.5rem 1rem; display: inline-block; margin: 0;">
                                    <i class="fas fa-folder-open"></i> Parcourir
                                </label>
                                <input type="file" id="offer-image-file" name="image_file" accept="image/*" style="display: none;">
                            </div>
                        </div>
                        <div id="offer-image-preview" style="margin-top: 1rem; ${offer && offer.image_url ? '' : 'display: none;'}">
                            <img id="offer-image-preview-img" src="${offer && offer.image_url ? offer.image_url : ''}" 
                                 alt="Aperçu" style="max-width: 200px; max-height: 150px; border-radius: 8px; border: 2px solid #e5e7eb; object-fit: cover;">
                            <button type="button" id="offer-image-remove" class="btn-text" style="margin-left: 0.5rem; color: #ef4444;">
                                <i class="fas fa-times"></i> Supprimer
                            </button>
                        </div>
                        <small style="color: #6b7280; display: block; margin-top: 0.5rem;">Si vide, l'image du véhicule sera utilisée.</small>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="offer-start-date">Date de début *</label>
                            <input type="date" id="offer-start-date" name="start_date" required 
                                   value="${offer ? offer.start_date : ''}">
                        </div>
                        <div class="form-group">
                            <label for="offer-end-date">Date de fin *</label>
                            <input type="date" id="offer-end-date" name="end_date" required 
                                   value="${offer ? offer.end_date : ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="offer-max-uses">Utilisations maximales (optionnel)</label>
                            <input type="number" id="offer-max-uses" name="max_uses" min="1" 
                                   value="${offer && offer.max_uses ? offer.max_uses : ''}" 
                                   placeholder="Illimité si vide">
                            <small style="color: #6b7280;">Nombre maximum de fois que l'offre peut être utilisée</small>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="offer-active" name="is_active" ${offer ? (offer.is_active ? 'checked' : '') : 'checked'}>
                                <span>Offre active</span>
                            </label>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="closeOfferModal()">Annuler</button>
                        <button type="submit" class="btn-primary">
                            <span class="btn-text">${offer ? 'Enregistrer' : 'Créer'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const form = document.getElementById('offer-form');
    form.dataset.mode = offer ? 'edit' : 'add';
    if (offer) {
        form.dataset.offerId = offer.id;
    }

    form.addEventListener('submit', handleOfferSubmit);
    
    // Setup image file upload
    const imageFileInput = document.getElementById('offer-image-file');
    const imageUrlInput = document.getElementById('offer-image');
    const imagePreview = document.getElementById('offer-image-preview');
    const imagePreviewImg = document.getElementById('offer-image-preview-img');
    const imageRemoveBtn = document.getElementById('offer-image-remove');
    
    if (imageFileInput) {
        imageFileInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    showToast('Veuillez sélectionner un fichier image', 'error');
                    e.target.value = '';
                    return;
                }
                
                // Validate file size (5MB max)
                if (file.size > 5 * 1024 * 1024) {
                    showToast('Le fichier est trop volumineux (max 5MB)', 'error');
                    e.target.value = '';
                    return;
                }
                
                // Upload image
                const formData = new FormData();
                formData.append('image', file);
                
                try {
                    const response = await fetch('upload_image.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });
                    
                    const result = await response.json();
                    
                    if (result.success && result.image_url) {
                        imageUrlInput.value = result.image_url;
                        imagePreviewImg.src = result.image_url;
                        imagePreview.style.display = 'block';
                        showToast('Image uploadée avec succès', 'success');
                    } else {
                        showToast(result.error || 'Erreur lors de l\'upload', 'error');
                        e.target.value = '';
                    }
                } catch (error) {
                    console.error('Upload error:', error);
                    showToast('Erreur de connexion lors de l\'upload', 'error');
                    e.target.value = '';
                }
            }
        });
    }
    
    // Update preview when URL changes
    if (imageUrlInput) {
        imageUrlInput.addEventListener('input', function() {
            if (this.value) {
                imagePreviewImg.src = this.value;
                imagePreview.style.display = 'block';
            } else {
                imagePreview.style.display = 'none';
            }
        });
    }
    
    // Remove image
    if (imageRemoveBtn) {
        imageRemoveBtn.addEventListener('click', function() {
            imageUrlInput.value = '';
            imageFileInput.value = '';
            imagePreview.style.display = 'none';
        });
    }
    
    // Load vehicles for dropdown after modal is inserted
    loadVehiclesForOffer().then(() => {
        // Set vehicle if editing - wait for vehicles to load first
        if (offer) {
            const vehicleSelect = document.getElementById('offer-vehicle');
            if (vehicleSelect) {
                if (offer.vehicle_id) {
                    vehicleSelect.value = String(offer.vehicle_id);
                } else {
                    vehicleSelect.value = ''; // Set to "Tous les véhicules"
                }
            }
            // Show preview if offer has image
            if (offer.image_url) {
                imagePreviewImg.src = offer.image_url;
                imagePreview.style.display = 'block';
            }
        }
    });
}

async function loadVehiclesForOffer() {
    try {
        const response = await fetch('backend.php?action=vehicles', {
            credentials: 'same-origin'
        });
        const data = await response.json();
        
        if (data.success && data.data) {
            const vehiclesList = data.data;
            const select = document.getElementById('offer-vehicle');
            if (select) {
                const currentValue = select.value; // Save current selection
                select.innerHTML = '<option value="">Tous les véhicules</option>' + 
                    vehiclesList.map(v => `<option value="${v.id}">${escapeHtml(v.name)}</option>`).join('');
                // Restore selection if it was set
                if (currentValue) {
                    select.value = currentValue;
                }
            }
        }
    } catch (error) {
        console.error('Error loading vehicles for offer:', error);
    }
}

function closeOfferModal() {
    const modal = document.getElementById('offer-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

async function handleOfferSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const mode = form.dataset.mode;
    const offerId = form.dataset.offerId;

    const data = {
        title: document.getElementById('offer-title').value.trim(),
        description: document.getElementById('offer-description').value.trim() || null,
        offer_type: document.getElementById('offer-type').value,
        discount_value: parseFloat(document.getElementById('offer-discount').value),
        vehicle_id: document.getElementById('offer-vehicle').value ? parseInt(document.getElementById('offer-vehicle').value) : null,
        image_url: document.getElementById('offer-image').value.trim() || null,
        start_date: document.getElementById('offer-start-date').value,
        end_date: document.getElementById('offer-end-date').value,
        max_uses: document.getElementById('offer-max-uses').value || null,
        is_active: document.getElementById('offer-active').checked ? 1 : 0
    };

    if (!data.title || !data.offer_type || !data.discount_value || !data.start_date || !data.end_date) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    const originalText = submitBtn.querySelector('.btn-text').textContent;
    submitBtn.querySelector('.btn-text').textContent = 'Traitement...';

    try {
        let response;
        if (mode === 'edit' && offerId) {
            response = await fetch(`backend.php?action=offers/${offerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify(data)
            });
        } else {
            response = await fetch('backend.php?action=offers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify(data)
            });
        }

        const result = await response.json();

        if (result.success) {
            showToast(mode === 'edit' ? 'Offre modifiée avec succès' : 'Offre créée avec succès', 'success');
            closeOfferModal();
            setTimeout(() => {
                loadOffers();
            }, 500);
        } else {
            showToast(result.error || 'Erreur lors de l\'enregistrement', 'error');
        }
    } catch (error) {
        console.error('Error saving offer:', error);
        showToast('Erreur lors de l\'enregistrement', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = originalText;
    }
}

function editOffer(id) {
    const offer = offers.find(o => o.id == id);
    if (offer) {
        showOfferModal(offer);
    } else {
        showToast('Offre non trouvée', 'error');
    }
}

async function toggleOfferStatus(id, newStatus) {
    try {
        const response = await fetch(`backend.php?action=offers/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                is_active: newStatus
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast(`Offre ${newStatus ? 'activée' : 'désactivée'} avec succès`, 'success');
            loadOffers();
        } else {
            showToast(result.error || 'Erreur lors de la mise à jour', 'error');
        }
    } catch (error) {
        console.error('Error toggling offer status:', error);
        showToast('Erreur lors de la mise à jour', 'error');
    }
}

async function deleteOffer(id) {
    const offer = offers.find(o => o.id == id);
    if (!offer) {
        showToast('Offre non trouvée', 'error');
        return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'offre "${offer.title}" ? Cette action est irréversible.`)) {
        return;
    }

    try {
        const response = await fetch(`backend.php?action=offers/${id}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Offre supprimée avec succès', 'success');
            loadOffers();
        } else {
            showToast(result.error || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Error deleting offer:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
}

// Make functions globally available
window.addOffer = addOffer;
window.closeOfferModal = closeOfferModal;
window.editOffer = editOffer;
window.toggleOfferStatus = toggleOfferStatus;
window.deleteOffer = deleteOffer;

// Reviews Management Functions
let reviews = [];
let reviewFilter = 'all';

async function loadReviews() {
    try {
        const response = await fetch('backend.php?action=reviews&approved=false', {
            credentials: 'same-origin'
        });
        const data = await response.json();
        
        if (data.success && data.data) {
            reviews = data.data;
            filterReviews(reviewFilter);
        } else {
            document.getElementById('reviews-tbody').innerHTML = 
                '<tr><td colspan="10" class="loading">Erreur: ' + (data.error || 'Erreur inconnue') + '</td></tr>';
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        document.getElementById('reviews-tbody').innerHTML = 
            '<tr><td colspan="10" class="loading">Erreur lors du chargement</td></tr>';
    }
}

function filterReviews(filter) {
    reviewFilter = filter;
    let filteredReviews = reviews;
    
    if (filter === 'approved') {
        filteredReviews = reviews.filter(r => r.is_approved);
    } else if (filter === 'pending') {
        filteredReviews = reviews.filter(r => !r.is_approved);
    } else if (filter === 'featured') {
        filteredReviews = reviews.filter(r => r.is_featured);
    }
    
    displayReviews(filteredReviews);
}

function displayReviews(reviewsList) {
    const tbody = document.getElementById('reviews-tbody');
    if (!tbody) return;

    if (reviewsList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="loading">Aucun avis trouvé.</td></tr>';
        return;
    }

    tbody.innerHTML = reviewsList.map(review => {
        const statusClass = review.is_approved ? 'status-active' : 'status-pending';
        const statusText = review.is_approved ? 'Approuvé' : 'En attente';
        const createdDate = new Date(review.created_at).toLocaleDateString('fr-FR');
        
        const stars = (rating) => {
            if (!rating) return '-';
            return '★'.repeat(rating) + '☆'.repeat(5 - rating);
        };
        
        const commentPreview = review.comment.length > 100 
            ? review.comment.substring(0, 100) + '...' 
            : review.comment;
        
        return `
            <tr>
                <td>${review.id}</td>
                <td>
                    <strong>${escapeHtml(review.client_name)}</strong><br>
                    <small style="color: var(--text-secondary);">${escapeHtml(review.client_email || 'N/A')}</small><br>
                    <small style="color: var(--text-secondary);">${escapeHtml(review.client_location || '')}</small>
                </td>
                <td>${review.vehicle_name ? escapeHtml(review.vehicle_name) : '<span style="color: var(--text-secondary);">Général</span>'}</td>
                <td><strong style="color: #f59e0b; font-size: 1.1rem;">${stars(review.rating)}</strong></td>
                <td>${review.service_rating ? stars(review.service_rating) : '-'}</td>
                <td>${review.car_rating ? stars(review.car_rating) : '-'}</td>
                <td style="max-width: 300px;">
                    <div title="${escapeHtml(review.comment)}">${escapeHtml(commentPreview)}</div>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    ${review.is_featured ? '<br><small style="color: var(--primary);">⭐ Mis en avant</small>' : ''}
                </td>
                <td>${createdDate}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="toggleReviewApproval(${review.id}, ${review.is_approved ? 0 : 1})" 
                                class="btn-icon" title="${review.is_approved ? 'Désapprouver' : 'Approuver'}">
                            <i class="fas fa-${review.is_approved ? 'ban' : 'check'}"></i>
                        </button>
                        <button onclick="toggleReviewFeatured(${review.id}, ${review.is_featured ? 0 : 1})" 
                                class="btn-icon" title="${review.is_featured ? 'Retirer des favoris' : 'Mettre en avant'}">
                            <i class="fas fa-star" style="color: ${review.is_featured ? '#f59e0b' : '#ddd'}"></i>
                        </button>
                        <button onclick="deleteReview(${review.id})" 
                                class="btn-icon btn-danger" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function toggleReviewApproval(id, newStatus) {
    try {
        const response = await fetch(`backend.php?action=reviews/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                is_approved: newStatus
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast(`Avis ${newStatus ? 'approuvé' : 'désapprouvé'} avec succès`, 'success');
            loadReviews();
        } else {
            showToast(result.error || 'Erreur lors de la mise à jour', 'error');
        }
    } catch (error) {
        console.error('Error toggling review approval:', error);
        showToast('Erreur lors de la mise à jour', 'error');
    }
}

async function toggleReviewFeatured(id, newStatus) {
    try {
        const response = await fetch(`backend.php?action=reviews/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                is_featured: newStatus
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast(`Avis ${newStatus ? 'mis en avant' : 'retiré des favoris'} avec succès`, 'success');
            loadReviews();
        } else {
            showToast(result.error || 'Erreur lors de la mise à jour', 'error');
        }
    } catch (error) {
        console.error('Error toggling review featured:', error);
        showToast('Erreur lors de la mise à jour', 'error');
    }
}

async function deleteReview(id) {
    const review = reviews.find(r => r.id == id);
    if (!review) {
        showToast('Avis non trouvé', 'error');
        return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'avis de "${review.client_name}" ? Cette action est irréversible.`)) {
        return;
    }

    try {
        const response = await fetch(`backend.php?action=reviews/${id}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Avis supprimé avec succès', 'success');
            loadReviews();
        } else {
            showToast(result.error || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
}

// Make functions globally available
window.loadReviews = loadReviews;
window.filterReviews = filterReviews;
window.toggleReviewApproval = toggleReviewApproval;
window.toggleReviewFeatured = toggleReviewFeatured;
window.deleteReview = deleteReview;

