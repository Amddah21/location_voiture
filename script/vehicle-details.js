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
let similarVehiclesData = [];

// Display vehicle details
function displayVehicleDetails(vehicle) {
  // Store vehicle data for currency updates
  currentVehicleData = vehicle;
  
  // Hide loading, show content
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('vehicle-details').style.display = 'block';

  // Set page title
  document.title = `${vehicle.name} - Rentcars`;

  // Images array - use vehicle.images if available, otherwise fallback to image_url
  const images = vehicle.images && Array.isArray(vehicle.images) && vehicle.images.length > 0 
    ? vehicle.images 
    : (vehicle.image_url ? [vehicle.image_url] : ['data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDEyMDAgNTAwIj48cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSIjOWNhM2FmIj5JbWFnZSBub24gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=']);
  
  // Store images globally for navigation
  window.currentVehicleImages = images;
  window.currentImageIndex = 0;
  
  // Main image
  const mainImage = document.getElementById('vehicle-main-image');
  mainImage.src = images[0];
  mainImage.alt = vehicle.name;
  document.getElementById('modal-image').src = mainImage.src;
  
  // Display image gallery if multiple images
  if (images.length > 1) {
    displayImageGallery(images, vehicle.name);
  } else {
    // Hide gallery navigation if only one image
    const galleryNav = document.getElementById('image-gallery-nav');
    if (galleryNav) galleryNav.style.display = 'none';
    const thumbnails = document.getElementById('vehicle-images-thumbnails');
    if (thumbnails) thumbnails.style.display = 'none';
  }

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

// Display similar vehicles
function displaySimilarVehicles(vehicles) {
  similarVehiclesData = vehicles;
  updateSimilarVehiclesDisplay();
}

// Update similar vehicles display with current currency
function updateSimilarVehiclesDisplay() {
  const grid = document.getElementById('similar-vehicles-grid');
  
  if (similarVehiclesData.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: #6b7280; grid-column: 1 / -1;">Aucun véhicule similaire disponible.</p>';
    return;
  }

  grid.innerHTML = similarVehiclesData.map(vehicle => {
    const placeholderVehicleSVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgNDAwIDIwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOWNhM2FmIj5JbWFnZSBub24gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
    const imageUrl = vehicle.image_url || placeholderVehicleSVG;
    const rating = parseFloat(vehicle.rating || 4.5).toFixed(1);
    const price = parseFloat(vehicle.price_per_day || 0);
    
    return `
      <article class="vehicle-card">
        <a href="vehicle-details.html?id=${vehicle.id}">
          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(vehicle.name)}" onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgNDAwIDIwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOWNhM2FmIj5FcnJldXIgY2hhcmdlbWVudDwvdGV4dD48L3N2Zz4=';">
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

// Display image gallery
function displayImageGallery(images, vehicleName) {
  const galleryNav = document.getElementById('image-gallery-nav');
  const thumbnailsContainer = document.getElementById('vehicle-images-thumbnails');
  const imageContainer = document.querySelector('.vehicle-image-container');
  
  if (galleryNav) {
    galleryNav.style.display = 'flex';
    document.getElementById('current-image-num').textContent = '1';
    document.getElementById('total-images-num').textContent = images.length;
  }
  
  if (thumbnailsContainer && images.length > 1) {
    thumbnailsContainer.style.display = 'flex';
    thumbnailsContainer.innerHTML = images.map((imageUrl, index) => `
      <div class="image-thumbnail ${index === 0 ? 'active' : ''}" onclick="selectImage(${index})" role="button" tabindex="0" aria-label="Voir l'image ${index + 1}">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(vehicleName)} - Image ${index + 1}" loading="lazy">
      </div>
    `).join('');
    
    // Scroll active thumbnail into view
    setTimeout(() => {
      const activeThumb = thumbnailsContainer.querySelector('.image-thumbnail.active');
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 100);
  }

  // Add swipe gesture support for mobile
  if (imageContainer && images.length > 1) {
    setupSwipeGestures(imageContainer);
  }
}

// Setup swipe gestures for mobile
function setupSwipeGestures(container) {
  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartY = 0;
  let touchEndY = 0;
  const minSwipeDistance = 50;

  container.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Only trigger swipe if horizontal movement is greater than vertical (to avoid conflicts with scrolling)
    if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right - previous image
        changeImage(-1);
      } else {
        // Swipe left - next image
        changeImage(1);
      }
    }
  }
}

// Change image
function changeImage(direction) {
  if (!window.currentVehicleImages || window.currentVehicleImages.length <= 1) return;
  
  window.currentImageIndex += direction;
  
  // Wrap around
  if (window.currentImageIndex < 0) {
    window.currentImageIndex = window.currentVehicleImages.length - 1;
  } else if (window.currentImageIndex >= window.currentVehicleImages.length) {
    window.currentImageIndex = 0;
  }
  
  const mainImage = document.getElementById('vehicle-main-image');
  const modalImage = document.getElementById('modal-image');
  
  // Add fade effect
  mainImage.classList.add('fade-in');
  mainImage.style.opacity = '0.7';
  
  setTimeout(() => {
    mainImage.src = window.currentVehicleImages[window.currentImageIndex];
    if (modalImage) modalImage.src = window.currentVehicleImages[window.currentImageIndex];
    mainImage.style.opacity = '1';
    setTimeout(() => {
      mainImage.classList.remove('fade-in');
    }, 300);
  }, 150);
  
  // Update indicator
  document.getElementById('current-image-num').textContent = window.currentImageIndex + 1;
  
  // Update thumbnails
  const thumbnails = document.querySelectorAll('.image-thumbnail');
  const thumbnailsContainer = document.getElementById('vehicle-images-thumbnails');
  thumbnails.forEach((thumb, index) => {
    thumb.classList.toggle('active', index === window.currentImageIndex);
  });
  
  // Scroll active thumbnail into view on mobile
  if (thumbnailsContainer && window.innerWidth <= 768) {
    const activeThumb = thumbnailsContainer.querySelector('.image-thumbnail.active');
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }
}

// Select image from thumbnail
function selectImage(index) {
  window.currentImageIndex = index;
  changeImage(0);
}

// Make functions globally available
window.changeImage = changeImage;
window.selectImage = selectImage;
window.openImageFullscreen = openImageFullscreen;
window.closeImageFullscreen = closeImageFullscreen;

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
  
  // Keyboard navigation for image gallery
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeImageFullscreen();
    }
    
    // Arrow keys for image navigation (only when gallery is visible)
    const galleryNav = document.getElementById('image-gallery-nav');
    if (galleryNav && galleryNav.style.display !== 'none' && window.currentVehicleImages && window.currentVehicleImages.length > 1) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        changeImage(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        changeImage(1);
      }
    }
  });
});

