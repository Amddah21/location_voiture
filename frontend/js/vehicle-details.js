/**
 * Vehicle Details Page JavaScript
 * Loads and displays vehicle details dynamically
 */

// API Configuration
const API_BASE = typeof window.API_BASE !== 'undefined' ? window.API_BASE : 'backend.php';

// Get vehicle ID from URL
function getVehicleIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Load vehicle details
async function loadVehicleDetails() {
  const vehicleId = getVehicleIdFromURL();
  
  if (!vehicleId) {
    showError();
    return;
  }

  try {
    const response = await fetch(`${API_BASE}?action=vehicles&id=${vehicleId}`);
    const data = await response.json();

    if (data.success && data.data) {
      displayVehicleDetails(data.data);
      loadSimilarVehicles(data.data.type, vehicleId);
    } else {
      showError();
    }
  } catch (error) {
    console.error('Error loading vehicle details:', error);
    showError();
  }
}

// Store current vehicle data globally for currency updates
let currentVehicleData = null;

// Display vehicle details
function displayVehicleDetails(vehicle) {
  // Store vehicle data for currency updates
  currentVehicleData = vehicle;
  
  // Hide loading, show content
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('vehicle-details').style.display = 'block';

  // Set page title
  document.title = `${vehicle.name} - Rentcars`;

  // Main image
  const mainImage = document.getElementById('vehicle-main-image');
  mainImage.src = vehicle.image_url || 'https://via.placeholder.com/1200x500?text=No+Image';
  mainImage.alt = vehicle.name;
  document.getElementById('modal-image').src = mainImage.src;

  // Vehicle name
  document.getElementById('vehicle-name').textContent = vehicle.name;
  document.getElementById('breadcrumb-name').textContent = vehicle.name;

  // Rating
  const rating = parseFloat(vehicle.rating || 4.5);
  const stars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  let starsHTML = '';
  for (let i = 0; i < 5; i++) {
    if (i < stars) {
      starsHTML += '<i class="fas fa-star"></i>';
    } else if (i === stars && hasHalfStar) {
      starsHTML += '<i class="fas fa-star-half-alt"></i>';
    } else {
      starsHTML += '<i class="far fa-star"></i>';
    }
  }
  
  document.getElementById('rating-stars').innerHTML = starsHTML;
  document.getElementById('rating-value').textContent = rating.toFixed(1);
  document.getElementById('review-count').textContent = `(${formatNumber(vehicle.review_count || 0)} avis)`;

  // Update prices
  updateVehiclePrices(vehicle);

  // Availability
  const availabilityBadge = document.getElementById('availability-badge');
  if (vehicle.available) {
    availabilityBadge.className = 'availability-badge';
    availabilityBadge.innerHTML = '<i class="fas fa-check-circle"></i><span>Disponible</span>';
  } else {
    availabilityBadge.className = 'availability-badge unavailable';
    availabilityBadge.innerHTML = '<i class="fas fa-times-circle"></i><span>Indisponible</span>';
    document.querySelector('.btn-book-now').disabled = true;
    document.querySelector('.btn-book-now').style.opacity = '0.5';
    document.querySelector('.btn-book-now').style.cursor = 'not-allowed';
  }

  // Specs
  document.getElementById('spec-passengers').textContent = vehicle.passengers || 4;
  document.getElementById('spec-transmission').textContent = vehicle.transmission || 'Auto';
  document.getElementById('spec-ac').textContent = vehicle.air_conditioning ? 'Oui' : 'Non';
  document.getElementById('spec-doors').textContent = vehicle.doors || 4;

  // Description - Use database description if available, otherwise generate one
  // Always use the exact description from database if it exists (even if empty or short)
  const description = (vehicle.description !== null && vehicle.description !== undefined)
    ? vehicle.description 
    : generateDescription(vehicle);
  document.getElementById('vehicle-description').textContent = description;

  // Features
  const features = generateFeatures(vehicle);
  document.getElementById('features-list').innerHTML = features.map(feature => 
    `<li><i class="fas fa-check"></i> ${feature}</li>`
  ).join('');

  // Set minimum dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const pickupInput = document.getElementById('pickup-date');
  const returnInput = document.getElementById('return-date');
  
  pickupInput.min = formatDateTimeLocal(tomorrow);
  returnInput.min = formatDateTimeLocal(tomorrow);

  // Store vehicle ID for booking
  document.getElementById('booking-form').dataset.vehicleId = vehicle.id;
}

// Generate vehicle description
function generateDescription(vehicle) {
  const typeLabels = {
    'Économique': 'véhicule économique',
    'Compact': 'véhicule compact',
    'Luxe': 'véhicule de luxe',
    'SUV': 'SUV',
    'Cabriolet': 'cabriolet',
    'Luxury': 'véhicule de luxe'
  };

  const typeLabel = typeLabels[vehicle.type] || 'véhicule';
  
  return `${vehicle.name} est un ${typeLabel} premium offrant confort, performance et style. 
  Idéal pour ${vehicle.passengers || 4} passagers, ce véhicule dispose de ${vehicle.doors || 4} portes 
  et d'une transmission ${vehicle.transmission || 'automatique'}. 
  ${vehicle.air_conditioning ? 'Équipé de la climatisation' : ''} pour votre confort. 
  Parfait pour vos déplacements en ville ou sur route.`;
}

// Generate features list
function generateFeatures(vehicle) {
  const features = [];
  
  features.push(`${vehicle.passengers || 4} passagers`);
  features.push(`${vehicle.doors || 4} portes`);
  features.push(`Transmission ${vehicle.transmission || 'automatique'}`);
  
  if (vehicle.air_conditioning) {
    features.push('Climatisation');
  }
  
  features.push('Assurance incluse');
  features.push('Kilométrage illimité');
  features.push('Assistance 24/7');
  
  const typeLabels = {
    'Économique': 'Économique en carburant',
    'Luxe': 'Intérieur premium',
    'SUV': 'Grand espace de chargement',
    'Cabriolet': 'Toit ouvrant'
  };
  
  if (typeLabels[vehicle.type]) {
    features.push(typeLabels[vehicle.type]);
  }
  
  return features;
}

// Load similar vehicles
async function loadSimilarVehicles(type, excludeId) {
  try {
    const response = await fetch(`${API_BASE}?action=vehicles&type=${encodeURIComponent(type)}`);
    const data = await response.json();

    if (data.success && data.data) {
      const similar = data.data
        .filter(v => v.id != excludeId && v.available)
        .slice(0, 4);
      
      displaySimilarVehicles(similar);
    }
  } catch (error) {
    console.error('Error loading similar vehicles:', error);
  }
}

// Store similar vehicles for currency updates
let similarVehiclesData = [];

// Display similar vehicles
function displaySimilarVehicles(vehicles) {
  similarVehiclesData = vehicles;
  const grid = document.getElementById('similar-vehicles-grid');
  
  if (vehicles.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: #6b7280; grid-column: 1 / -1;">Aucun véhicule similaire disponible.</p>';
    return;
  }

  updateSimilarVehiclesDisplay();
}

// Update similar vehicles display with current currency
function updateSimilarVehiclesDisplay() {
  const grid = document.getElementById('similar-vehicles-grid');
  
  if (similarVehiclesData.length === 0) return;

  grid.innerHTML = similarVehiclesData.map(vehicle => {
    const imageUrl = vehicle.image_url || 'https://via.placeholder.com/400x200?text=No+Image';
    const rating = parseFloat(vehicle.rating || 4.5).toFixed(1);
    const price = parseFloat(vehicle.price_per_day || 0);
    
    return `
      <article class="vehicle-card">
        <a href="vehicle-details.html?id=${vehicle.id}">
          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(vehicle.name)}" onerror="this.src='https://via.placeholder.com/400x200?text=Image+Error'">
        </a>
        <div class="vehicle-card__body">
          <div class="vehicle-card__header">
            <h3>${escapeHtml(vehicle.name)}</h3>
            <span class="vehicle-card__rating">⭐ ${rating} · ${formatNumber(vehicle.review_count || 0)} avis</span>
          </div>
          <ul class="vehicle-card__specs">
            <li>👥 ${vehicle.passengers || 4} passager${vehicle.passengers !== 1 ? 's' : ''}</li>
            <li>⚙️ ${escapeHtml(vehicle.transmission || 'Auto')}</li>
            <li>❄️ ${vehicle.air_conditioning ? 'Climatisation' : 'Sans climatisation'}</li>
            <li>🚪 ${vehicle.doors || 4} port${vehicle.doors !== 1 ? 'es' : 'e'}</li>
          </ul>
          <div class="vehicle-card__footer">
            <span class="vehicle-card__price">${formatPrice(price)}<span>/jour</span></span>
            <a href="vehicle-details.html?id=${vehicle.id}" class="btn btn-outline">Voir détails</a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// Update vehicle prices with current currency
function updateVehiclePrices(vehicle) {
  if (!vehicle) vehicle = currentVehicleData;
  if (!vehicle) return;
  
  const price = parseFloat(vehicle.price_per_day || 0);
  
  // Use formatPriceWithCurrency if available, otherwise use formatPrice
  let priceFormatted;
  if (typeof window.formatPriceWithCurrency === 'function') {
    priceFormatted = window.formatPriceWithCurrency(price);
  } else {
    priceFormatted = formatPrice(price);
  }
  
  const priceAmount = document.getElementById('price-amount');
  const summaryPriceDay = document.getElementById('summary-price-day');
  
  if (priceAmount) {
    priceAmount.textContent = priceFormatted;
  }
  if (summaryPriceDay) {
    summaryPriceDay.textContent = priceFormatted;
    // Recalculate booking total if dates are set
    calculateBookingTotal();
  }
}

// Show error state
function showError() {
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('error-state').style.display = 'flex';
}

// Format price
function formatPrice(price) {
  if (typeof window.formatPriceWithCurrency === 'function') {
    return window.formatPriceWithCurrency(price);
  }
  // Fallback if currency.js not loaded
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price) + ' €';
}

// Format number
function formatNumber(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

// Format datetime-local
function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Calculate booking total
function calculateBookingTotal() {
  const pickupInput = document.getElementById('pickup-date');
  const returnInput = document.getElementById('return-date');
  const priceDayElement = document.getElementById('summary-price-day');
  
  if (!pickupInput || !returnInput || !priceDayElement) return;
  
  // Get price from element - handle French format (1 200,00 €) or (1200.00 €)
  const priceText = priceDayElement.textContent.trim();
  const priceDay = parseFloat(priceText.replace(/[^\d,.]/g, '').replace(/\s/g, '').replace(',', '.')) || 0;
  
  if (pickupInput.value && returnInput.value && priceDay > 0) {
    const pickup = new Date(pickupInput.value);
    const returnDate = new Date(returnInput.value);
    
    if (returnDate > pickup) {
      const days = Math.ceil((returnDate - pickup) / (1000 * 60 * 60 * 24));
      const total = priceDay * days;
      
      const daysElement = document.getElementById('summary-days');
      const totalElement = document.getElementById('summary-total');
      
      if (daysElement) {
        daysElement.textContent = `${days} jour${days !== 1 ? 's' : ''}`;
      }
      if (totalElement) {
        totalElement.textContent = formatPrice(total);
      }
    } else {
      const daysElement = document.getElementById('summary-days');
      const totalElement = document.getElementById('summary-total');
      if (daysElement) daysElement.textContent = '-';
      if (totalElement) totalElement.textContent = '-';
    }
  } else {
    const daysElement = document.getElementById('summary-days');
    const totalElement = document.getElementById('summary-total');
    if (daysElement) daysElement.textContent = '-';
    if (totalElement) totalElement.textContent = '-';
  }
}

// Image fullscreen
function openImageFullscreen() {
  const modal = document.getElementById('image-modal');
  modal.classList.add('active');
}

function closeImageFullscreen() {
  const modal = document.getElementById('image-modal');
  modal.classList.remove('active');
}

// Handle booking form
function setupBookingForm() {
  const form = document.getElementById('booking-form');
  const pickupInput = document.getElementById('pickup-date');
  const returnInput = document.getElementById('return-date');
  
  // Calculate total when dates change
  pickupInput.addEventListener('change', calculateBookingTotal);
  returnInput.addEventListener('change', calculateBookingTotal);
  
  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const vehicleId = form.dataset.vehicleId;
    const pickupLocation = document.getElementById('pickup-location').value;
    const pickupDate = document.getElementById('pickup-date').value;
    const returnDate = document.getElementById('return-date').value;
    
    if (!pickupLocation || !pickupDate || !returnDate) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    
    // Check if booking modal exists (from index.php)
    if (typeof openBookingModal === 'function') {
      // Open booking modal with pre-filled data
      openBookingModal(vehicleId, pickupLocation, pickupDate.split('T')[0], returnDate.split('T')[0]);
    } else {
      // Redirect to index.php with booking parameters to use the booking modal there
      window.location.href = `index.php?book=${vehicleId}&location=${encodeURIComponent(pickupLocation)}&pickup=${pickupDate.split('T')[0]}&return=${returnDate.split('T')[0]}`;
    }
  });
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  loadVehicleDetails();
  setupBookingForm();
  
  // Initialize currency selector
  if (typeof initCurrencySelector === 'function') {
    initCurrencySelector();
  }
  
  // Listen for currency changes
  window.addEventListener('currencyChanged', () => {
    // Update main vehicle price
    if (currentVehicleData) {
      updateVehiclePrices(currentVehicleData);
    }
    // Update similar vehicles prices
    if (similarVehiclesData.length > 0) {
      updateSimilarVehiclesDisplay();
    }
  });
  
  // Close modal on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeImageFullscreen();
    }
  });
});

