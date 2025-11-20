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

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    loadDashboardData();
    setupEventListeners();
    animateStats();
    
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
        case 'clients':
            loadClients();
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
                <td><strong>${formatPriceWithCurrency ? formatPriceWithCurrency(vehicle.price_per_day) : parseFloat(vehicle.price_per_day).toFixed(2) + ' €'}</strong></td>
                <td>
                    <span class="status-badge ${vehicle.available ? 'status-active' : 'status-cancelled'}">
                        ${vehicle.available ? 'Disponible' : 'Indisponible'}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-secondary" onclick="editVehicle(${vehicle.id})" 
                                style="padding: 0.375rem 0.75rem; font-size: 0.8rem;"
                                title="Modifier">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                        <button class="btn-secondary" onclick="deleteVehicle(${vehicle.id})" 
                                style="padding: 0.375rem 0.75rem; font-size: 0.8rem; background: var(--danger); color: white;"
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
        const data = await response.json();
        
        if (data.success) {
            bookings = data.data;
            renderBookings(bookings);
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookings-tbody').innerHTML = 
            '<tr><td colspan="7" class="loading">Erreur lors du chargement</td></tr>';
    }
}

function renderBookings(bookingsList) {
    const tbody = document.getElementById('bookings-tbody');
    
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
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}<br>
                        <strong>Retour:</strong> ${returnDate.toLocaleDateString('fr-FR', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}<br>
                        <small style="color: var(--text-secondary);">${days} jour(s)</small>
                    </div>
                </td>
                <td><strong style="color: var(--primary);">${formatPriceWithCurrency ? formatPriceWithCurrency(booking.total_price) : parseFloat(booking.total_price).toFixed(2) + ' €'}</strong></td>
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
    const modal = document.getElementById('vehicle-modal');
    if (!modal) {
        createVehicleModal();
    }
    
    const form = document.getElementById('vehicle-form');
    const modalTitle = document.querySelector('#vehicle-modal .modal-title');
    
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
        document.getElementById('vehicle-available').checked = vehicle.available !== false;
        
        // Show existing image if available
        if (vehicle.image_url) {
            updateImagePreview(vehicle.image_url);
        } else {
            resetImagePreview();
        }
    } else {
        // Add mode
        modalTitle.textContent = 'Ajouter un véhicule';
        form.dataset.mode = 'add';
        form.reset();
        document.getElementById('vehicle-available').checked = true;
        resetImagePreview();
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
                            <label for="vehicle-price">Prix par jour (EUR) *</label>
                            <small style="color: #6b7280; display: block; margin-top: 0.25rem;">Les prix sont stockés en EUR et convertis automatiquement selon la devise sélectionnée</small>
                            <input type="number" id="vehicle-price" name="price_per_day" required step="0.01" min="0" placeholder="Ex: 1200.00">
                        </div>
                        <div class="form-group">
                            <label for="vehicle-image">Image du véhicule</label>
                            <div class="image-upload-container">
                                <input type="file" id="vehicle-image-file" name="image_file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" style="display: none;">
                                <div class="image-upload-preview" id="image-preview">
                                    <div class="image-upload-placeholder">
                                        <i class="fas fa-image"></i>
                                        <span>Cliquez pour télécharger ou glisser-déposer</span>
                                    </div>
                                </div>
                                <button type="button" class="btn-image-upload" onclick="document.getElementById('vehicle-image-file').click()">
                                    <i class="fas fa-upload"></i> Choisir une image
                                </button>
                                <input type="hidden" id="vehicle-image" name="image_url">
                                <div class="image-url-fallback" style="margin-top: 0.5rem;">
                                    <small>Ou entrez une URL:</small>
                                    <input type="url" id="vehicle-image-url" placeholder="https://..." style="margin-top: 0.25rem; width: 100%; padding: 0.5rem; font-size: 0.875rem;">
                                </div>
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
                        <label class="checkbox-label">
                            <input type="checkbox" id="vehicle-available" name="available" checked>
                            <span>Véhicule disponible</span>
                        </label>
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
}

function setupImageUpload() {
    const fileInput = document.getElementById('vehicle-image-file');
    const imagePreview = document.getElementById('image-preview');
    const imageUrlInput = document.getElementById('vehicle-image-url');
    
    if (!fileInput) return;
    
    // File input change
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await uploadImage(file);
        }
    });
    
    // Drag and drop
    imagePreview.addEventListener('dragover', (e) => {
        e.preventDefault();
        imagePreview.classList.add('dragover');
    });
    
    imagePreview.addEventListener('dragleave', () => {
        imagePreview.classList.remove('dragover');
    });
    
    imagePreview.addEventListener('drop', async (e) => {
        e.preventDefault();
        imagePreview.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            await uploadImage(file);
        } else {
            showToast('Veuillez déposer une image valide', 'error');
        }
    });
    
    // Click to upload
    imagePreview.addEventListener('click', () => {
        fileInput.click();
    });
    
    // URL input change
    if (imageUrlInput) {
        imageUrlInput.addEventListener('change', (e) => {
            const url = e.target.value.trim();
            if (url) {
                document.getElementById('vehicle-image').value = url;
                updateImagePreview(url);
            }
        });
    }
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
    
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '<div class="uploading"><i class="fas fa-spinner fa-spin"></i> Téléchargement...</div>';
    
    try {
        const response = await fetch('upload_image.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('vehicle-image').value = data.image_url;
            document.getElementById('vehicle-image-url').value = '';
            updateImagePreview(data.image_url);
            showToast('Image téléchargée avec succès', 'success');
        } else {
            showToast(data.error || 'Erreur lors du téléchargement', 'error');
            resetImagePreview();
        }
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Erreur lors du téléchargement', 'error');
        resetImagePreview();
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
    
    // Get image URL from hidden input or URL input
    const imageUrl = document.getElementById('vehicle-image').value || 
                     document.getElementById('vehicle-image-url').value || 
                     null;
    
    const data = {
        name: document.getElementById('vehicle-name').value.trim(),
        type: document.getElementById('vehicle-type').value,
        price_per_day: parseFloat(document.getElementById('vehicle-price').value),
        image_url: imageUrl || null,
        passengers: parseInt(document.getElementById('vehicle-passengers').value) || 4,
        transmission: document.getElementById('vehicle-transmission').value || 'Auto',
        doors: parseInt(document.getElementById('vehicle-doors').value) || 4,
        rating: parseFloat(document.getElementById('vehicle-rating').value) || 4.5,
        available: document.getElementById('vehicle-available').checked ? 1 : 0
    };
    
    // Validate required fields
    if (!data.name || !data.type || !data.price_per_day) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
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

function editVehicle(id) {
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
        showVehicleModal(vehicle);
    } else {
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

