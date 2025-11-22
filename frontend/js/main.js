/**
 * Main Application JavaScript
 * Consolidated from script.js and related files
 * Updated for new frontend/backend structure
 */

// API Configuration - updated path
const API_BASE = '/rental_car/backend/controllers/backend.php';

// Menu toggle functionality (if needed for legacy navbar)
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.classList.toggle("is-active", isOpen);

    const spans = menuToggle.querySelectorAll("span");
    if (spans.length === 3) {
      spans[0].style.transform = isOpen ? "translateY(9px) rotate(45deg)" : "";
      spans[1].style.opacity = isOpen ? "0" : "";
      spans[2].style.transform = isOpen ? "translateY(-9px) rotate(-45deg)" : "";
    }
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (navLinks.classList.contains("is-open")) {
        navLinks.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.classList.remove("is-active");
        menuToggle.querySelectorAll("span").forEach((span) => {
          span.style.transform = "";
          span.style.opacity = "";
        });
      }
    });
  });
}

// Current year element
const currentYearEl = document.querySelector("#current-year");
if (currentYearEl) {
  currentYearEl.textContent = new Date().getFullYear();
}

// Navbar scroll effect
const navbar = document.querySelector(".navbar");
if (navbar) {
  const handleScroll = () => {
    if (window.scrollY > 12) {
      navbar.classList.add("is-scrolled");
    } else {
      navbar.classList.remove("is-scrolled");
    }
  };
  handleScroll();
  window.addEventListener("scroll", handleScroll);
}

// Load vehicles on page load
document.addEventListener('DOMContentLoaded', () => {
  loadVehicles();
  setupSearchForm();
  setupBookingModal();
});

// Load vehicles from API
async function loadVehicles() {
  const grid = document.getElementById('vehicles-grid');
  if (grid) {
    grid.innerHTML = '<p style="text-align: center; padding: 2rem;">Chargement des véhicules...</p>';
  }
  
  try {
    const response = await fetch(`${API_BASE}?action=vehicles&available=true`);
    const result = await response.json();
    
    if (result.success && result.data) {
      const availableVehicles = result.data.filter(v => v.available === true || v.available === 1);
      if (availableVehicles.length > 0) {
        displayVehicles(availableVehicles.slice(0, 8));
      } else {
        showLoadingError('Aucun véhicule disponible pour le moment.');
      }
    } else {
      showLoadingError('Erreur lors du chargement des véhicules.');
    }
  } catch (error) {
    console.error('Error loading vehicles:', error);
    showLoadingError('Erreur de connexion. Veuillez rafraîchir la page.');
  }
}

function showLoadingError(message) {
  const grid = document.getElementById('vehicles-grid');
  if (grid) {
    grid.innerHTML = `<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">${message}</p>`;
  }
}

// Display vehicles in the grid
function displayVehicles(vehicles) {
  const grid = document.getElementById('vehicles-grid');
  if (!grid) return;

  if (vehicles.length === 0) {
    grid.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">Aucun véhicule disponible pour le moment.</p>';
    return;
  }

  grid.innerHTML = vehicles.map(vehicle => {
    const name = escapeHtml(vehicle.name || 'Véhicule');
    const imageUrl = vehicle.image_url || 'https://via.placeholder.com/400x200?text=No+Image';
    const rating = parseFloat(vehicle.rating || 4.5).toFixed(1);
    const reviewCount = vehicle.review_count || 0;
    const passengers = vehicle.passengers || 4;
    const transmission = escapeHtml(vehicle.transmission || 'Auto');
    const airConditioning = vehicle.air_conditioning !== false && vehicle.air_conditioning !== 0;
    const doors = vehicle.doors || 4;
    const price = parseFloat(vehicle.price_per_day || 0).toFixed(2);
    const vehicleId = vehicle.id;

    return `
      <article class="vehicle-card">
        <img src="${escapeHtml(imageUrl)}" alt="${name}" loading="lazy" decoding="async" onerror="this.src='https://via.placeholder.com/400x200?text=Image+Error'">
        <div class="vehicle-card__body">
          <div class="vehicle-card__header">
            <h3>${name}</h3>
            <span class="vehicle-card__rating">⭐ ${rating} · ${formatReviewCount(reviewCount)} avis</span>
          </div>
          <ul class="vehicle-card__specs">
            <li>👥 ${passengers} passager${passengers !== 1 ? 's' : ''}</li>
            <li>⚙️ ${transmission}</li>
            <li>❄️ ${airConditioning ? 'Climatisation' : 'Sans climatisation'}</li>
            <li>🚪 ${doors} port${doors !== 1 ? 'es' : 'e'}</li>
          </ul>
          <div class="vehicle-card__footer">
            <span class="vehicle-card__price">${formatPriceForDisplay(price)}<span>/jour</span></span>
            <a href="vehicle-details.html?id=${vehicleId}" class="btn btn-outline">Voir détails</a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Use global formatPriceWithCurrency from currency.js
function formatPriceForDisplay(price) {
  if (typeof window.formatPriceWithCurrency === 'function') {
    return window.formatPriceWithCurrency(price);
  }
  const numPrice = parseFloat(price) || 0;
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numPrice) + ' €';
}

function formatReviewCount(count) {
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return count.toString();
}

// Setup search form
function setupSearchForm() {
  const form = document.getElementById('search-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const location = document.getElementById('location').value;
    const pickupDate = document.getElementById('pickup-date').value;
    const returnDate = document.getElementById('return-date').value;
    const vehicleType = document.getElementById('vehicle-type').value;

    if (!location || !pickupDate || !returnDate) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const params = new URLSearchParams({
        location,
        pickup_date: pickupDate,
        return_date: returnDate,
        vehicle_type: vehicleType
      });

      const response = await fetch(`${API_BASE}?action=search&${params}`);
      const result = await response.json();

      if (result.success) {
        displaySearchResults(result.data, { location, pickupDate, returnDate });
      } else {
        alert('Recherche échouée : ' + (result.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Erreur lors de la recherche de véhicules. Veuillez réessayer.');
    }
  });
}

// Display search results
function displaySearchResults(vehicles, searchParams) {
  const resultsDiv = document.getElementById('search-results');
  if (!resultsDiv) return;

  if (vehicles.length === 0) {
    resultsDiv.innerHTML = '<p style="text-align: center; padding: 2rem;">Aucun véhicule disponible pour les dates et la localisation sélectionnées.</p>';
    resultsDiv.style.display = 'block';
    return;
  }

  resultsDiv.innerHTML = `
    <h3 style="margin-bottom: 1.5rem;">Véhicules disponibles (${vehicles.length})</h3>
    <div class="cards-grid cards-grid--4">
      ${vehicles.map(vehicle => {
        const name = escapeHtml(vehicle.name || 'Véhicule');
        const imageUrl = escapeHtml(vehicle.image_url || 'https://via.placeholder.com/400x200');
        return `
        <article class="vehicle-card">
          <img src="${imageUrl}" alt="${name}" loading="lazy" decoding="async" onerror="this.src='https://via.placeholder.com/400x200?text=Image+Error'">
          <div class="vehicle-card__body">
            <div class="vehicle-card__header">
              <h3>${name}</h3>
              <span class="vehicle-card__rating">⭐ ${parseFloat(vehicle.rating || 4.5).toFixed(1)} · ${formatReviewCount(vehicle.review_count || 0)} avis</span>
            </div>
            <ul class="vehicle-card__specs">
              <li>👥 ${vehicle.passengers || 4} passager${(vehicle.passengers || 4) !== 1 ? 's' : ''}</li>
              <li>⚙️ ${escapeHtml(vehicle.transmission || 'Auto')}</li>
              <li>❄️ ${vehicle.air_conditioning ? 'Climatisation' : 'Sans climatisation'}</li>
              <li>🚪 ${vehicle.doors || 4} port${(vehicle.doors || 4) !== 1 ? 'es' : 'e'}</li>
            </ul>
            <div class="vehicle-card__footer">
              <span class="vehicle-card__price">${formatPriceForDisplay(vehicle.price_per_day)}<span>/jour</span></span>
              <a href="vehicle-details.html?id=${vehicle.id}" class="btn btn-outline">Voir détails</a>
            </div>
          </div>
        </article>
      `;
      }).join('')}
    </div>
  `;
  resultsDiv.style.display = 'block';
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Booking modal functions
function openBookingModal(vehicleId, location = '', pickupDate = '', returnDate = '') {
  const modal = document.getElementById('booking-modal');
  const vehicleIdInput = document.getElementById('booking-vehicle-id');
  const locationInput = document.getElementById('booking-location');
  const pickupInput = document.getElementById('booking-pickup');
  const returnInput = document.getElementById('booking-return');

  if (!modal || !vehicleIdInput) return;

  vehicleIdInput.value = vehicleId;
  if (location) locationInput.value = location;
  if (pickupDate) pickupInput.value = pickupDate + 'T09:00';
  if (returnDate) returnInput.value = returnDate + 'T17:00';

  modal.style.display = 'block';
  calculateBookingTotal();
}

function setupBookingModal() {
  const modal = document.getElementById('booking-modal');
  const closeBtn = document.querySelector('.modal-close');
  const form = document.getElementById('booking-form');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitBooking();
    });
  }

  const pickupInput = document.getElementById('booking-pickup');
  const returnInput = document.getElementById('booking-return');
  if (pickupInput) pickupInput.addEventListener('change', calculateBookingTotal);
  if (returnInput) returnInput.addEventListener('change', calculateBookingTotal);
}

async function calculateBookingTotal() {
  const vehicleId = document.getElementById('booking-vehicle-id').value;
  const pickupInput = document.getElementById('booking-pickup');
  const returnInput = document.getElementById('booking-return');
  const totalDiv = document.getElementById('booking-total');

  if (!vehicleId || !pickupInput || !returnInput || !totalDiv) return;

  try {
    const response = await fetch(`${API_BASE}?action=vehicles&id=${vehicleId}`);
    const result = await response.json();

    if (result.success && result.data) {
      const vehicle = result.data;
      const pickup = new Date(pickupInput.value);
      const returnDate = new Date(returnInput.value);
      
      if (pickup && returnDate && returnDate > pickup) {
        const days = Math.ceil((returnDate - pickup) / (1000 * 60 * 60 * 24));
        const total = vehicle.price_per_day * days;
        totalDiv.innerHTML = `Total : <span style="color: var(--primary);">${formatPriceForDisplay(total)}</span> pour ${days} jour${days !== 1 ? 's' : ''}`;
      } else {
        totalDiv.innerHTML = '';
      }
    }
  } catch (error) {
    console.error('Error calculating total:', error);
  }
}

async function submitBooking() {
  const form = document.getElementById('booking-form');
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Traitement en cours...';

  try {
    const bookingData = {
      vehicle_id: parseInt(document.getElementById('booking-vehicle-id').value),
      customer_name: document.getElementById('customer-name').value,
      customer_email: document.getElementById('customer-email').value,
      customer_phone: document.getElementById('customer-phone').value,
      password: document.getElementById('customer-password').value,
      pickup_location: document.getElementById('booking-location').value,
      pickup_date: document.getElementById('booking-pickup').value,
      return_date: document.getElementById('booking-return').value
    };

    const response = await fetch(`${API_BASE}?action=bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

    const result = await response.json();

    if (result.success) {
      window.location.href = `booking-confirmation.html?id=${result.booking_id}`;
    } else {
      alert('Échec de la réservation : ' + (result.error || 'Erreur inconnue'));
    }
  } catch (error) {
    console.error('Booking error:', error);
    alert('Erreur lors de l\'envoi de la réservation. Veuillez réessayer.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// Make openBookingModal available globally
window.openBookingModal = openBookingModal;

