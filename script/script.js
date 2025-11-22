const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const currentYearEl = document.querySelector("#current-year");

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

// L'année est maintenant gérée par PHP dans index.php
// Cette ligne est conservée pour compatibilité si l'élément existe toujours
if (currentYearEl) {
  currentYearEl.textContent = new Date().getFullYear();
}

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

// API Configuration
const API_BASE = 'backend.php';

// Load vehicles on page load
document.addEventListener('DOMContentLoaded', () => {
  loadHeader();
  
  // Check if there's a brand filter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const brandParam = urlParams.get('brand');
  
  loadVehicles(brandParam || null);
  loadReviews();
  setupSearchForm();
  setupBookingModal();
  initBrandCards();
});

// Initialize Brand Cards with Enhanced Animations - Load from API
async function initBrandCards() {
  const brandsGrid = document.getElementById('brands-grid');
  
  if (!brandsGrid) {
    return;
  }
  
  try {
    // Load brands from API
    const response = await fetch('backend.php?action=car_brands');
    
    if (!response.ok) {
      throw new Error('Failed to load brands');
    }
    
    const brands = await response.json();
    
    if (!brands || brands.length === 0) {
      brandsGrid.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">Aucune marque disponible</p>';
      return;
    }
    
    // Helper function to get absolute URL
    function getImageUrl(url) {
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      const baseUrl = window.location.origin;
      const pathname = window.location.pathname;
      const basePath = pathname.substring(0, pathname.lastIndexOf('/')) || '';
      if (url.startsWith('/')) return baseUrl + url;
      return baseUrl + basePath + '/' + url;
    }
    
    // Duplicate brands array for infinite loop effect (add brands 2 more times)
    const duplicatedBrands = [...brands, ...brands];
    const totalBrands = brands.length;
    const rotationSpeed = 4; // seconds per logo
    
    // Render brand cards with clean design
    brandsGrid.innerHTML = brands.map((brand, cardIndex) => {
      const imageUrl = getImageUrl(brand.logo_url);
      const placeholderSVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100'%3E%3Crect fill='%23f3f4f6' width='200' height='100'/%3E%3Ctext fill='%239ca3af' font-family='Arial' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(brand.name)}%3C/text%3E%3C/svg%3E`;
      
      return `
      <div class="brand-card" 
           data-brand="${escapeHtml(brand.name)}" 
           data-brand-slug="${brand.name.toLowerCase().replace(/\s+/g, '-')}" 
           style="--card-delay: ${cardIndex * 0.08}s;"
           title="Cliquez pour voir les voitures ${escapeHtml(brand.name)}">
        <div class="brand-logo-wrapper">
          <img src="${escapeHtml(imageUrl)}" 
               alt="${escapeHtml(brand.name)}" 
               class="brand-logo" 
               loading="lazy"
               onerror="this.onerror=null; this.src='${placeholderSVG}';">
        </div>
      </div>
    `;
    }).join('');
    
    // Initialize animations for loaded cards
    setupBrandCardsAnimations();
    
  } catch (error) {
    console.error('Error loading brands:', error);
    brandsGrid.innerHTML = '<p style="text-align: center; padding: 2rem; color: #e74c3c;">Erreur lors du chargement des marques</p>';
  }
}

// Setup animations for brand cards
function setupBrandCardsAnimations() {
  const brandCards = document.querySelectorAll('.brand-card');
  const brandLogos = document.querySelectorAll('.brand-logo');
  
  // Image error handling - use local SVG placeholder
  const placeholderSVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjAwIDEwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOWNhM2FmIj5Mb2dvPC90ZXh0Pjwvc3ZnPg==';
  
  brandLogos.forEach((logo) => {
    logo.addEventListener('error', function() {
      this.src = placeholderSVG;
    });
    
    // Remove loading class when image loads
    logo.addEventListener('load', function() {
      const card = this.closest('.brand-card');
      if (card) {
        card.classList.remove('loading');
      }
    });
  });
  
  // Intersection Observer for performance - animate only when visible
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });
    
    brandCards.forEach(card => {
      observer.observe(card);
    });
  } else {
    // Fallback for browsers without IntersectionObserver
    brandCards.forEach(card => {
      card.classList.add('in-view');
    });
  }
  
  // Add click interaction to filter vehicles by brand
  brandCards.forEach(card => {
    card.addEventListener('click', function() {
      const brandName = this.getAttribute('data-brand');
      
      if (brandName) {
        // Add visual feedback
        this.style.animation = 'none';
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
          this.style.animation = '';
          this.style.transform = '';
        }, 200);
        
        // Filter and display vehicles by brand
        filterVehiclesByBrand(brandName);
      }
    });
    
    // Pause rotation on hover and show current logo
    card.addEventListener('mouseenter', function() {
      const slides = this.querySelectorAll('.brand-logo-slide');
      slides.forEach(slide => {
        const computedStyle = window.getComputedStyle(slide);
        if (parseFloat(computedStyle.opacity) > 0.7) {
          // This is the visible slide - enhance it
          slide.style.opacity = '1';
          slide.style.zIndex = '10';
          slide.style.transform = 'scale(1.2) translateY(0) rotateY(0deg)';
        }
      });
    });
    
    card.addEventListener('mouseleave', function() {
      const slides = this.querySelectorAll('.brand-logo-slide');
      slides.forEach(slide => {
        slide.style.opacity = '';
        slide.style.zIndex = '';
        slide.style.transform = '';
      });
    });
  });
}

// Store all vehicles globally for filtering
let allVehicles = [];

// Load vehicles from API - Dynamic loading from database
async function loadVehicles(brandFilter = null) {
  const grid = document.getElementById('vehicles-grid');
  if (grid) {
    grid.innerHTML = '<p style="text-align: center; padding: 2rem;">Chargement des véhicules...</p>';
  }
  
  try {
    // Try to get available vehicles first, if none found, get all vehicles
    let response = await fetch(`${API_BASE}?action=vehicles&available=true`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    let result = await response.json();
    console.log('Vehicles API response:', result); // Debug log
    
    if (result.success && result.data && Array.isArray(result.data)) {
      // Filter available vehicles
      let availableVehicles = result.data.filter(v => v.available === true || v.available === 1 || v.available === '1');
      
      // If no available vehicles, try to get all vehicles
      if (availableVehicles.length === 0) {
        console.log('No available vehicles found, fetching all vehicles...');
        response = await fetch(`${API_BASE}?action=vehicles`);
        result = await response.json();
        if (result.success && result.data && Array.isArray(result.data)) {
          availableVehicles = result.data;
        }
      }
      
      // Store all vehicles globally
      allVehicles = availableVehicles;
      
      // Apply brand filter if provided
      if (brandFilter) {
        availableVehicles = filterVehiclesByBrandName(availableVehicles, brandFilter);
      }
      
      console.log('Vehicles to display:', availableVehicles); // Debug log
      
      if (availableVehicles.length > 0) {
        displayVehicles(availableVehicles, brandFilter); // Show filtered vehicles
      } else {
        const message = brandFilter 
          ? `Aucun véhicule ${brandFilter} trouvé.` 
          : 'Aucun véhicule trouvé. Veuillez ajouter des véhicules dans le panneau d\'administration et les marquer comme disponibles.';
        showLoadingError(message);
      }
    } else {
      console.error('API response error:', result);
      showLoadingError(result.error || 'Erreur lors du chargement des véhicules.');
    }
  } catch (error) {
    console.error('Error loading vehicles:', error);
    showLoadingError('Erreur de connexion: ' + error.message + '. Veuillez rafraîchir la page.');
  }
}

// Filter vehicles by brand name
function filterVehiclesByBrandName(vehicles, brandName) {
  if (!brandName || brandName.trim() === '') return vehicles;
  
  // Normalize brand name for matching (case-insensitive, handle variations)
  const normalizedBrand = brandName.toLowerCase().trim();
  
  // Common brand name variations and how they appear in vehicle names
  const brandVariations = {
    'mercedes': ['mercedes', 'mercedes-benz', 'benz'],
    'audi': ['audi'],
    'bmw': ['bmw'],
    'ford': ['ford'],
    'renault': ['renault'],
    'peugeot': ['peugeot'],
    'citroen': ['citroen', 'citroën'],
    'citroën': ['citroen', 'citroën'],
    'dacia': ['dacia'],
    'opel': ['opel'],
    'kia': ['kia'],
    'toyota': ['toyota'],
    'honda': ['honda'],
    'nissan': ['nissan'],
    'volkswagen': ['volkswagen', 'vw'],
    'volvo': ['volvo'],
    'jaguar': ['jaguar'],
    'porsche': ['porsche'],
    'ferrari': ['ferrari'],
    'lamborghini': ['lamborghini'],
    'maserati': ['maserati']
  };
  
  // Find matching variations
  let searchTerms = [normalizedBrand];
  for (const [key, variations] of Object.entries(brandVariations)) {
    if (variations.some(v => normalizedBrand.includes(v) || v.includes(normalizedBrand))) {
      searchTerms = variations;
      break;
    }
  }
  
  // Filter vehicles whose name contains any of the search terms
  return vehicles.filter(vehicle => {
    const vehicleName = (vehicle.name || '').toLowerCase();
    return searchTerms.some(term => vehicleName.includes(term));
  });
}

// Filter vehicles by brand and scroll to vehicles section
function filterVehiclesByBrand(brandName) {
  if (!brandName) return;
  
  // Scroll to vehicles section smoothly
  const vehiclesSection = document.getElementById('services') || document.querySelector('.section.services');
  if (vehiclesSection) {
    vehiclesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  // Filter vehicles
  if (allVehicles.length > 0) {
    // Use cached vehicles for faster filtering
    const filteredVehicles = filterVehiclesByBrandName(allVehicles, brandName);
    displayVehicles(filteredVehicles, brandName);
    
    // Show notification
    showBrandFilterNotification(brandName, filteredVehicles.length);
  } else {
    // Load vehicles with brand filter
    loadVehicles(brandName);
  }
  
  // Update URL with brand parameter (without reloading page)
  const url = new URL(window.location);
  url.searchParams.set('brand', encodeURIComponent(brandName));
  window.history.pushState({ brand: brandName }, '', url);
}

// Show notification when filtering by brand
function showBrandFilterNotification(brandName, count) {
  // Remove existing notification if any
  const existingNotification = document.getElementById('brand-filter-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'brand-filter-notification';
  notification.className = 'brand-filter-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-check-circle"></i>
      <span>Affichage de <strong>${count}</strong> véhicule${count > 1 ? 's' : ''} ${escapeHtml(brandName)}</span>
      <button class="notification-close" onclick="clearBrandFilter()">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  // Insert before vehicles grid
  const vehiclesGrid = document.getElementById('vehicles-grid');
  const servicesSection = document.getElementById('services') || document.querySelector('.section.services');
  if (servicesSection && vehiclesGrid) {
    servicesSection.insertBefore(notification, vehiclesGrid);
    
    // Animate in
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (notification) {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }
}

// Clear brand filter and show all vehicles
function clearBrandFilter() {
  // Remove notification
  const notification = document.getElementById('brand-filter-notification');
  if (notification) {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }
  
  // Show all vehicles
  if (allVehicles.length > 0) {
    displayVehicles(allVehicles.slice(0, 8));
  } else {
    loadVehicles();
  }
  
  // Remove brand parameter from URL
  const url = new URL(window.location);
  url.searchParams.delete('brand');
  window.history.pushState({}, '', url);
}

// Make clearBrandFilter available globally
window.clearBrandFilter = clearBrandFilter;

function showLoadingError(message) {
  const grid = document.getElementById('vehicles-grid');
  if (grid) {
    grid.innerHTML = `<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">${message}</p>`;
  }
}

// Display vehicles in the grid
function displayVehicles(vehicles, brandFilter = null) {
  const grid = document.getElementById('vehicles-grid');
  if (!grid) return;

  if (vehicles.length === 0) {
    const message = brandFilter 
      ? `<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">Aucun véhicule ${escapeHtml(brandFilter)} disponible pour le moment.</p>` 
      : '<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">Aucun véhicule disponible pour le moment.</p>';
    grid.innerHTML = message;
    return;
  }
  
  // Limit to 20 vehicles when filtering, 8 otherwise
  const maxVehicles = brandFilter ? 20 : 8;
  const vehiclesToShow = vehicles.slice(0, maxVehicles);

  grid.innerHTML = vehiclesToShow.map(vehicle => {
    // Escape HTML to prevent XSS and handle missing data
    const name = escapeHtml(vehicle.name || 'Véhicule');
    const placeholderVehicleSVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgNDAwIDIwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOWNhM2FmIj5JbWFnZSBub24gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
    const imageUrl = vehicle.image_url || placeholderVehicleSVG;
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
        <img src="${escapeHtml(imageUrl)}" alt="${name}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgNDAwIDIwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOWNhM2FmIj5FcnJldXIgY2hhcmdlbWVudDwvdGV4dD48L3N2Zz4=';">
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
// If not available, provide a fallback
function formatPriceForDisplay(price) {
  if (typeof window.formatPriceWithCurrency === 'function') {
    return window.formatPriceWithCurrency(price);
  }
  // Fallback if currency.js not loaded - default to MAD
  const numPrice = parseFloat(price) || 0;
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numPrice) + ' DH';
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

  const placeholderVehicleSVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgNDAwIDIwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOWNhM2FmIj5JbWFnZSBub24gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
  const errorVehicleSVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgNDAwIDIwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOWNhM2FmIj5FcnJldXIgY2hhcmdlbWVudDwvdGV4dD48L3N2Zz4=';
  
  resultsDiv.innerHTML = `
    <h3 style="margin-bottom: 1.5rem;">Véhicules disponibles (${vehicles.length})</h3>
    <div class="cards-grid cards-grid--4">
      ${vehicles.map(vehicle => {
        const name = escapeHtml(vehicle.name || 'Véhicule');
        const imageUrl = escapeHtml(vehicle.image_url || placeholderVehicleSVG);
        return `
        <article class="vehicle-card">
          <img src="${imageUrl}" alt="${name}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${errorVehicleSVG}'">
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
  const pickupDateInput = document.getElementById('booking-pickup-date');
  const returnDateInput = document.getElementById('booking-return-date');
  const pickupTimeInput = document.getElementById('booking-pickup-time');
  const returnTimeInput = document.getElementById('booking-return-time');
  const pickupHidden = document.getElementById('booking-pickup');
  const returnHidden = document.getElementById('booking-return');

  if (!modal || !vehicleIdInput) return;

  vehicleIdInput.value = vehicleId;
  
  // Set location
  if (location && locationInput) {
    locationInput.value = location;
    const clearBtn = document.getElementById('clear-location');
    if (clearBtn) clearBtn.style.display = 'flex';
  }
  
  // Parse and set dates
  if (pickupDate) {
    const pickup = new Date(pickupDate);
    selectedPickupDate = pickup;
    if (pickupDateInput) pickupDateInput.value = formatDateForDisplay(pickup);
    if (pickupTimeInput) pickupTimeInput.value = '11:00';
    if (pickupHidden) pickupHidden.value = formatDateTimeLocal(pickup);
  }
  
  if (returnDate) {
    const returnD = new Date(returnDate);
    selectedReturnDate = returnD;
    if (returnDateInput) returnDateInput.value = formatDateForDisplay(returnD);
    if (returnTimeInput) returnTimeInput.value = '11:00';
    if (returnHidden) returnHidden.value = formatDateTimeLocal(returnD);
  }
  
  // Update calendar if dates are set
  if (pickupDate || returnDate) {
    if (pickupDate) {
      currentCalendarMonth = new Date(pickupDate);
    }
    renderCalendar();
  }

  modal.style.display = 'block';
  
  // Show calendar if dates are set
  const calendarWidget = document.getElementById('calendar-widget');
  if (calendarWidget && (pickupDate || returnDate)) {
    calendarWidget.style.display = 'block';
  }
  
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

  // Setup calendar functionality
  setupBookingCalendar();
  
  // Setup location clear button
  setupLocationClear();
  
  // Setup same location checkbox
  setupSameLocationCheckbox();
  
  // Setup date/time inputs
  setupDateTimeInputs();
  
  // Recalculate total when dates/times change
  const pickupDateInput = document.getElementById('booking-pickup-date');
  const returnDateInput = document.getElementById('booking-return-date');
  const pickupTimeInput = document.getElementById('booking-pickup-time');
  const returnTimeInput = document.getElementById('booking-return-time');
  
  if (pickupDateInput) pickupDateInput.addEventListener('change', updateBookingDates);
  if (returnDateInput) returnDateInput.addEventListener('change', updateBookingDates);
  if (pickupTimeInput) pickupTimeInput.addEventListener('change', updateBookingDates);
  if (returnTimeInput) returnTimeInput.addEventListener('change', updateBookingDates);
}

// Calendar functionality
let currentCalendarMonth = new Date();
let selectedPickupDate = null;
let selectedReturnDate = null;

function setupBookingCalendar() {
  const pickupDateBtn = document.getElementById('pickup-date-btn');
  const returnDateBtn = document.getElementById('return-date-btn');
  const calendarWidget = document.getElementById('calendar-widget');
  
  if (pickupDateBtn) {
    pickupDateBtn.addEventListener('click', () => {
      calendarWidget.style.display = calendarWidget.style.display === 'none' ? 'block' : 'block';
      renderCalendar();
    });
  }
  
  if (returnDateBtn) {
    returnDateBtn.addEventListener('click', () => {
      calendarWidget.style.display = calendarWidget.style.display === 'none' ? 'block' : 'block';
      renderCalendar();
    });
  }
  
  // Initialize calendar with current month
  currentCalendarMonth = new Date();
  renderCalendar();
}

function renderCalendar() {
  const month1 = document.getElementById('calendar-month-1');
  const month2 = document.getElementById('calendar-month-2');
  
  if (!month1 || !month2) return;
  
  // Render first month (current)
  const month1Date = new Date(currentCalendarMonth);
  month1.innerHTML = renderMonth(month1Date, 1);
  
  // Render second month (next)
  const month2Date = new Date(currentCalendarMonth);
  month2Date.setMonth(month2Date.getMonth() + 1);
  month2.innerHTML = renderMonth(month2Date, 2);
  
  // Attach event listeners
  attachCalendarListeners();
  updateCalendarSummary();
}

function renderMonth(date, monthIndex) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  let html = `
    <div class="calendar-header">
      <button class="calendar-nav-btn" onclick="navigateCalendar(${monthIndex}, -1)">
        <i class="fas fa-chevron-left"></i>
      </button>
      <div class="calendar-month-title">${monthNames[month]} ${year}</div>
      <button class="calendar-nav-btn" onclick="navigateCalendar(${monthIndex}, 1)">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
    <div class="calendar-weekdays">
      ${dayNames.map(day => `<div class="calendar-weekday">${day}</div>`).join('')}
    </div>
    <div class="calendar-days">
  `;
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    html += '<div class="calendar-day other-month"></div>';
  }
  
  // Days of the month
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const isPast = currentDate < today;
    const isSelectedStart = selectedPickupDate && isSameDay(currentDate, selectedPickupDate);
    const isSelectedEnd = selectedReturnDate && isSameDay(currentDate, selectedReturnDate);
    const isInRange = selectedPickupDate && selectedReturnDate && 
                      currentDate > selectedPickupDate && currentDate < selectedReturnDate;
    
    let classes = 'calendar-day';
    if (isPast) classes += ' disabled';
    if (isSelectedStart) classes += ' selected-start';
    if (isSelectedEnd) classes += ' selected-end';
    if (isInRange) classes += ' in-range';
    
    html += `<div class="${classes}" data-date="${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}" data-month="${monthIndex}">${day}</div>`;
  }
  
  html += '</div>';
  return html;
}

function navigateCalendar(monthIndex, direction) {
  if (monthIndex === 1) {
    currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + direction);
  } else {
    const nextMonth = new Date(currentCalendarMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1 + direction);
    if (direction === -1) {
      currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + direction);
    } else {
      currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + direction);
    }
  }
  renderCalendar();
}

function attachCalendarListeners() {
  const days = document.querySelectorAll('.calendar-day:not(.disabled):not(.other-month)');
  days.forEach(day => {
    day.addEventListener('click', () => {
      const dateStr = day.getAttribute('data-date');
      if (!dateStr) return;
      
      const [year, month, dayNum] = dateStr.split('-').map(Number);
      const clickedDate = new Date(year, month - 1, dayNum);
      
      if (!selectedPickupDate || (selectedPickupDate && selectedReturnDate)) {
        // Start new selection
        selectedPickupDate = clickedDate;
        selectedReturnDate = null;
      } else if (selectedPickupDate && !selectedReturnDate) {
        // Select return date
        if (clickedDate <= selectedPickupDate) {
          // If clicked date is before pickup, make it the new pickup
          selectedReturnDate = selectedPickupDate;
          selectedPickupDate = clickedDate;
        } else {
          selectedReturnDate = clickedDate;
        }
      }
      
      updateDateInputs();
      renderCalendar();
      updateBookingDates();
    });
  });
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function updateDateInputs() {
  const pickupDateInput = document.getElementById('booking-pickup-date');
  const returnDateInput = document.getElementById('booking-return-date');
  
  if (pickupDateInput && selectedPickupDate) {
    pickupDateInput.value = formatDateForDisplay(selectedPickupDate);
  }
  
  if (returnDateInput && selectedReturnDate) {
    returnDateInput.value = formatDateForDisplay(selectedReturnDate);
  }
}

function formatDateForDisplay(date) {
  const days = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 
                  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

function updateCalendarSummary() {
  const summary = document.getElementById('calendar-summary');
  if (!summary) return;
  
  if (selectedPickupDate && selectedReturnDate) {
    const days = Math.ceil((selectedReturnDate - selectedPickupDate) / (1000 * 60 * 60 * 24));
    const pickupStr = formatDateForDisplay(selectedPickupDate);
    const returnStr = formatDateForDisplay(selectedReturnDate);
    summary.textContent = `${pickupStr} – ${returnStr} (${days} jour${days !== 1 ? 's' : ''})`;
  } else if (selectedPickupDate) {
    summary.textContent = `Sélectionnez la date de retour`;
  } else {
    summary.textContent = `Sélectionnez les dates de location`;
  }
}

function setupLocationClear() {
  const locationInput = document.getElementById('booking-location');
  const clearBtn = document.getElementById('clear-location');
  
  if (locationInput && clearBtn) {
    locationInput.addEventListener('input', () => {
      clearBtn.style.display = locationInput.value ? 'flex' : 'none';
    });
    
    clearBtn.addEventListener('click', () => {
      locationInput.value = '';
      clearBtn.style.display = 'none';
    });
  }
}

function setupSameLocationCheckbox() {
  const sameLocationCheckbox = document.getElementById('same-location');
  const returnLocationInput = document.getElementById('return-location');
  
  if (sameLocationCheckbox) {
    sameLocationCheckbox.addEventListener('change', (e) => {
      // If checkbox is checked, hide return location (if exists)
      // For now, we'll just handle the checkbox state
    });
  }
}

function setupDateTimeInputs() {
  const pickupDateInput = document.getElementById('booking-pickup-date');
  const returnDateInput = document.getElementById('booking-return-date');
  
  if (pickupDateInput) {
    pickupDateInput.addEventListener('click', () => {
      document.getElementById('calendar-widget').style.display = 'block';
      renderCalendar();
    });
  }
  
  if (returnDateInput) {
    returnDateInput.addEventListener('click', () => {
      document.getElementById('calendar-widget').style.display = 'block';
      renderCalendar();
    });
  }
}

function updateBookingDates() {
  // Update hidden datetime-local inputs for form submission
  const pickupDateInput = document.getElementById('booking-pickup-date');
  const returnDateInput = document.getElementById('booking-return-date');
  const pickupTimeInput = document.getElementById('booking-pickup-time');
  const returnTimeInput = document.getElementById('booking-return-time');
  const pickupHidden = document.getElementById('booking-pickup');
  const returnHidden = document.getElementById('booking-return');
  
  if (selectedPickupDate && pickupTimeInput && pickupHidden) {
    const [hours, minutes] = pickupTimeInput.value.split(':');
    selectedPickupDate.setHours(parseInt(hours), parseInt(minutes));
    pickupHidden.value = formatDateTimeLocal(selectedPickupDate);
  }
  
  if (selectedReturnDate && returnTimeInput && returnHidden) {
    const [hours, minutes] = returnTimeInput.value.split(':');
    selectedReturnDate.setHours(parseInt(hours), parseInt(minutes));
    returnHidden.value = formatDateTimeLocal(selectedReturnDate);
  }
  
  calculateBookingTotal();
}

function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Make navigateCalendar available globally
window.navigateCalendar = navigateCalendar;

async function calculateBookingTotal() {
  const vehicleId = document.getElementById('booking-vehicle-id').value;
  const pickupHidden = document.getElementById('booking-pickup');
  const returnHidden = document.getElementById('booking-return');
  const totalDiv = document.getElementById('booking-total');

  if (!vehicleId || !totalDiv) return;

  // Use selected dates if available, otherwise use hidden inputs
  let pickup, returnDate;
  
  if (selectedPickupDate && selectedReturnDate) {
    pickup = new Date(selectedPickupDate);
    returnDate = new Date(selectedReturnDate);
    const pickupTimeInput = document.getElementById('booking-pickup-time');
    const returnTimeInput = document.getElementById('booking-return-time');
    if (pickupTimeInput) {
      const [hours, minutes] = pickupTimeInput.value.split(':');
      pickup.setHours(parseInt(hours), parseInt(minutes));
    }
    if (returnTimeInput) {
      const [hours, minutes] = returnTimeInput.value.split(':');
      returnDate.setHours(parseInt(hours), parseInt(minutes));
    }
  } else if (pickupHidden && returnHidden && pickupHidden.value && returnHidden.value) {
    pickup = new Date(pickupHidden.value);
    returnDate = new Date(returnHidden.value);
  } else {
    totalDiv.innerHTML = '';
    return;
  }

  if (!pickup || !returnDate || returnDate <= pickup) {
    totalDiv.innerHTML = '';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}?action=vehicles&id=${vehicleId}`);
    const result = await response.json();

    if (result.success && result.data) {
      const vehicle = result.data;
      const days = Math.ceil((returnDate - pickup) / (1000 * 60 * 60 * 24));
      const total = vehicle.price_per_day * days;
      totalDiv.innerHTML = `Total : <span style="color: var(--primary);">${formatPriceForDisplay(total)}</span> pour ${days} jour${days !== 1 ? 's' : ''}`;
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
      pickup_date: document.getElementById('booking-pickup')?.value || formatDateTimeLocal(selectedPickupDate),
      return_date: document.getElementById('booking-return')?.value || formatDateTimeLocal(selectedReturnDate)
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
      // Redirect to confirmation page
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

// Load and display reviews
async function loadReviews() {
  const grid = document.getElementById('reviews-grid');
  if (!grid) return;
  
  try {
    const response = await fetch(`${API_BASE}?action=reviews&approved=true&limit=6`);
    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      displayReviews(result.data);
    } else {
      // Show default testimonials if no reviews
      grid.innerHTML = `
        <article class="testimonial-card">
          <div class="testimonial-card__rating">★★★★★</div>
          <p>"Réserver avec Cars Location voiture est sans effort. La voiture est arrivée impeccable et à l'heure."</p>
          <div class="testimonial-card__author">
            <img src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=80" alt="Portrait client" loading="lazy" decoding="async">
            <div>
              <strong>Charlie Johnson</strong>
              <span>New York, USA</span>
            </div>
          </div>
        </article>
        <article class="testimonial-card">
          <div class="testimonial-card__rating">★★★★★</div>
          <p>"Je me suis senti très en sécurité avec Cars Location voiture. Le support était rapide et le chauffeur professionnel."</p>
          <div class="testimonial-card__author">
            <img src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80" alt="Portrait client" loading="lazy" decoding="async">
            <div>
              <strong>Sarah Wilson</strong>
              <span>Toronto, Canada</span>
            </div>
          </div>
        </article>
        <article class="testimonial-card">
          <div class="testimonial-card__rating">★★★★☆</div>
          <p>"Excellent choix de véhicules et l'application rend la gestion des réservations très simple."</p>
          <div class="testimonial-card__author">
            <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80" alt="Portrait client" loading="lazy" decoding="async">
            <div>
              <strong>Emma Reed</strong>
              <span>Londres, UK</span>
            </div>
          </div>
        </article>
      `;
    }
  } catch (error) {
    console.error('Error loading reviews:', error);
    grid.innerHTML = '<p style="text-align: center; padding: 2rem; color: #6b7280;">Erreur lors du chargement des avis.</p>';
  }
}

function displayReviews(reviews) {
  const grid = document.getElementById('reviews-grid');
  if (!grid) return;

  grid.innerHTML = reviews.map(review => {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const name = escapeHtml(review.client_name);
    const location = review.client_location ? escapeHtml(review.client_location) : 'Client';
    const comment = escapeHtml(review.comment);
    
    // Generate avatar based on name (simple hash)
    const avatarIndex = review.id % 10;
    const avatarUrl = `https://images.unsplash.com/photo-${1502685104226 + avatarIndex}?auto=format&fit=crop&w=200&q=80`;
    
    return `
      <article class="testimonial-card">
        <div class="testimonial-card__rating">${stars}</div>
        <p>"${comment}"</p>
        <div class="testimonial-card__author">
          <img src="${avatarUrl}" alt="${name}" loading="lazy" decoding="async" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&size=200'">
          <div>
            <strong>${name}</strong>
            <span>${location}</span>
            ${review.vehicle_name ? `<small style="color: #9ca3af; font-size: 0.85rem; display: block; margin-top: 0.25rem;">${escapeHtml(review.vehicle_name)}</small>` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

