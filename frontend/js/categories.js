/**
 * Car Categorization System
 * Automatically sorts cars into Premium, Standard, and Budget categories based on price
 */

// Price thresholds for categorization
// These can be adjusted based on your pricing structure
const PRICE_THRESHOLDS = {
  PREMIUM_MIN: 100,      // Cars >= 100€/day are Premium
  STANDARD_MIN: 50,      // Cars >= 50€/day but < 100€/day are Standard
  BUDGET_MAX: 50         // Cars < 50€/day are Budget
};

// Category configuration
const CATEGORIES = {
  premium: {
    id: 'premium',
    name: 'Premium',
    gridId: 'premium-grid',
    countId: 'premium-count',
    minPrice: PRICE_THRESHOLDS.PREMIUM_MIN,
    icon: 'fas fa-crown',
    badgeClass: 'premium-badge'
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    gridId: 'standard-grid',
    countId: 'standard-count',
    minPrice: PRICE_THRESHOLDS.STANDARD_MIN,
    maxPrice: PRICE_THRESHOLDS.PREMIUM_MIN - 0.01,
    icon: 'fas fa-car',
    badgeClass: 'standard-badge'
  },
  budget: {
    id: 'budget',
    name: 'Budget',
    gridId: 'budget-grid',
    countId: 'budget-count',
    maxPrice: PRICE_THRESHOLDS.STANDARD_MIN - 0.01,
    icon: 'fas fa-tag',
    badgeClass: 'budget-badge'
  }
};

/**
 * Categorize a vehicle based on its price
 * @param {Object} vehicle - Vehicle object with price_per_day
 * @returns {string} Category ID ('premium', 'standard', or 'budget')
 */
function categorizeVehicle(vehicle) {
  const price = parseFloat(vehicle.price_per_day || 0);

  if (price >= PRICE_THRESHOLDS.PREMIUM_MIN) {
    return 'premium';
  } else if (price >= PRICE_THRESHOLDS.STANDARD_MIN && price < PRICE_THRESHOLDS.PREMIUM_MIN) {
    return 'standard';
  } else {
    return 'budget';
  }
}

/**
 * Sort vehicles into categories
 * @param {Array} vehicles - Array of vehicle objects
 * @returns {Object} Object with categorized vehicles
 */
function sortVehiclesIntoCategories(vehicles) {
  const categorized = {
    premium: [],
    standard: [],
    budget: []
  };

  vehicles.forEach(vehicle => {
    const category = categorizeVehicle(vehicle);
    categorized[category].push(vehicle);
  });

  // Sort each category by price (descending for premium, ascending for others)
  categorized.premium.sort((a, b) => parseFloat(b.price_per_day) - parseFloat(a.price_per_day));
  categorized.standard.sort((a, b) => parseFloat(b.price_per_day) - parseFloat(a.price_per_day));
  categorized.budget.sort((a, b) => parseFloat(a.price_per_day) - parseFloat(b.price_per_day));

  return categorized;
}

/**
 * Display vehicles in a category grid
 * @param {Array} vehicles - Array of vehicles to display
 * @param {string} gridId - ID of the grid container
 */
function displayCategoryVehicles(vehicles, gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  if (vehicles.length === 0) {
    grid.innerHTML = `
      <div class="empty-category">
        <i class="fas fa-inbox"></i>
        <p>Aucun véhicule disponible dans cette catégorie</p>
      </div>
    `;
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
      <article class="category-vehicle-card">
        <div class="vehicle-image-wrapper">
          <img src="${escapeHtml(imageUrl)}" alt="${name}" onerror="this.src='https://via.placeholder.com/400x200?text=Image+Error'">
          <div class="vehicle-overlay">
            <a href="vehicle-details.html?id=${vehicleId}" class="btn-view-details">
              <i class="fas fa-eye"></i>
              Voir détails
            </a>
          </div>
        </div>
        <div class="vehicle-card-content">
          <div class="vehicle-header">
            <h4 class="vehicle-name">${name}</h4>
            <div class="vehicle-rating">
              <i class="fas fa-star"></i>
              <span>${rating}</span>
              <span class="review-count">(${formatReviewCount(reviewCount)})</span>
            </div>
          </div>
          <div class="vehicle-specs">
            <span class="spec-item">
              <i class="fas fa-users"></i>
              ${passengers}
            </span>
            <span class="spec-item">
              <i class="fas fa-cog"></i>
              ${transmission}
            </span>
            <span class="spec-item">
              <i class="fas fa-snowflake"></i>
              ${airConditioning ? 'Oui' : 'Non'}
            </span>
          </div>
          <div class="vehicle-footer">
            <div class="vehicle-price">
              <span class="price-amount">${formatPrice(price)} €</span>
              <span class="price-period">/jour</span>
            </div>
            <a href="vehicle-details.html?id=${vehicleId}" class="btn-category">
              Réserver
              <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Update category count badge
 * @param {string} countId - ID of the count element
 * @param {number} count - Number of vehicles
 */
function updateCategoryCount(countId, count) {
  const countElement = document.getElementById(countId);
  if (countElement) {
    countElement.textContent = count;
  }
}

/**
 * Load and display categorized vehicles
 */
async function loadCategorizedVehicles() {
  try {
    const response = await fetch(`${API_BASE}?action=vehicles&available=true`);
    const result = await response.json();

    if (result.success && result.data) {
      // Filter available vehicles
      const availableVehicles = result.data.filter(v => v.available === true || v.available === 1);
      
      // Sort into categories
      const categorized = sortVehiclesIntoCategories(availableVehicles);

      // Display each category
      displayCategoryVehicles(categorized.premium, CATEGORIES.premium.gridId);
      displayCategoryVehicles(categorized.standard, CATEGORIES.standard.gridId);
      displayCategoryVehicles(categorized.budget, CATEGORIES.budget.gridId);

      // Update counts
      updateCategoryCount(CATEGORIES.premium.countId, categorized.premium.length);
      updateCategoryCount(CATEGORIES.standard.countId, categorized.standard.length);
      updateCategoryCount(CATEGORIES.budget.countId, categorized.budget.length);
    } else {
      showCategoryError('Erreur lors du chargement des véhicules.');
    }
  } catch (error) {
    console.error('Error loading categorized vehicles:', error);
    showCategoryError('Erreur de connexion. Veuillez rafraîchir la page.');
  }
}

/**
 * Show error message in category grids
 * @param {string} message - Error message
 */
function showCategoryError(message) {
  const grids = ['premium-grid', 'standard-grid', 'budget-grid'];
  grids.forEach(gridId => {
    const grid = document.getElementById(gridId);
    if (grid) {
      grid.innerHTML = `
        <div class="error-category">
          <i class="fas fa-exclamation-triangle"></i>
          <p>${message}</p>
        </div>
      `;
    }
  });
}

/**
 * Helper function to escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format price with thousand separators
 */
function formatPrice(price) {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}

/**
 * Format review count
 */
function formatReviewCount(count) {
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return count.toString();
}

// Initialize categories when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Use the same API_BASE from script.js or define it
  if (typeof API_BASE === 'undefined') {
    window.API_BASE = '../backend/backend.php';
  }
  // Small delay to ensure API_BASE is available
  setTimeout(() => {
    loadCategorizedVehicles();
  }, 100);
});

