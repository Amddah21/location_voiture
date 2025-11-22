<?php
/**
 * Page de tous les véhicules
 * Affiche tous les véhicules disponibles
 */

// Année actuelle pour le footer
$currentYear = date('Y');
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tous les véhicules - Cars Location voiture</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="styles.css">
  <style>
    .vehicles-page-header {
      background: linear-gradient(135deg, #2F9E44 0%, #41B883 100%);
      color: white;
      padding: 4rem 0 3rem;
      text-align: center;
    }
    .vehicles-page-header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    .vehicles-page-header p {
      font-size: 1.125rem;
      opacity: 0.9;
    }
    .vehicles-filters {
      background: white;
      padding: 2rem;
      margin: -2rem auto 3rem;
      max-width: 1200px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .vehicles-filters select,
    .vehicles-filters input {
      padding: 0.75rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }
    .vehicles-filters select:focus,
    .vehicles-filters input:focus {
      outline: none;
      border-color: #2F9E44;
    }
    .vehicles-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem 4rem;
    }
    .vehicles-grid-all {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    .vehicles-loading {
      text-align: center;
      padding: 4rem 2rem;
      color: #6b7280;
    }
    .vehicles-loading i {
      font-size: 3rem;
      color: #2F9E44;
      margin-bottom: 1rem;
    }
    .vehicles-empty {
      text-align: center;
      padding: 4rem 2rem;
      color: #6b7280;
    }
    .vehicles-empty i {
      font-size: 4rem;
      color: #d1d5db;
      margin-bottom: 1rem;
    }
    @media (max-width: 768px) {
      .vehicles-page-header h1 {
        font-size: 2rem;
      }
      .vehicles-filters {
        flex-direction: column;
        align-items: stretch;
      }
      .vehicles-filters select,
      .vehicles-filters input {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <!-- Header will be loaded here -->
  <div id="header-placeholder"></div>

  <main>
    <section class="vehicles-page-header">
      <div class="container">
        <h1>Tous les véhicules</h1>
        <p>Découvrez notre collection complète de véhicules premium</p>
      </div>
    </section>

    <div class="container">
      <div class="vehicles-filters">
        <label for="filter-type" style="font-weight: 600; color: #1f2937;">Type:</label>
        <select id="filter-type">
          <option value="">Tous les types</option>
          <option value="Économique">Économique</option>
          <option value="Compact">Compact</option>
          <option value="Luxe">Luxe</option>
          <option value="SUV">SUV</option>
          <option value="Cabriolet">Cabriolet</option>
        </select>

        <label for="filter-transmission" style="font-weight: 600; color: #1f2937;">Transmission:</label>
        <select id="filter-transmission">
          <option value="">Toutes</option>
          <option value="Auto">Automatique</option>
          <option value="Manuelle">Manuelle</option>
        </select>

        <label for="filter-price" style="font-weight: 600; color: #1f2937;">Prix max:</label>
        <input type="number" id="filter-price" placeholder="Prix maximum (DH)" min="0">

        <button type="button" id="filter-reset" class="btn btn-text" style="margin-left: auto;">
          Réinitialiser
        </button>
      </div>
    </div>

    <div class="vehicles-container">
      <div class="vehicles-loading" id="vehicles-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Chargement des véhicules...</p>
      </div>
      <div class="vehicles-grid-all" id="vehicles-grid-all" style="display: none;">
        <!-- Vehicles will be loaded here -->
      </div>
      <div class="vehicles-empty" id="vehicles-empty" style="display: none;">
        <i class="fas fa-car-side"></i>
        <h2>Aucun véhicule trouvé</h2>
        <p>Aucun véhicule ne correspond à vos critères de recherche.</p>
      </div>
    </div>
  </main>

  <!-- Footer will be loaded here -->
  <div id="footer-placeholder"></div>

  <script src="script/currency.js" defer></script>
  <script src="script/load-components.js" defer></script>
  <script>
    // API Configuration
    const API_BASE = 'backend.php';
    let allVehicles = [];
    let filteredVehicles = [];

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Format review count
    function formatReviewCount(count) {
      if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'k';
      }
      return count.toString();
    }

    // Format price with currency
    function formatPriceForDisplay(price) {
      if (typeof window.formatPriceWithCurrency === 'function') {
        return window.formatPriceWithCurrency(price);
      }
      const numPrice = parseFloat(price) || 0;
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numPrice) + ' DH';
    }

    // Load all vehicles (only available ones)
    async function loadAllVehicles() {
      const loadingEl = document.getElementById('vehicles-loading');
      const gridEl = document.getElementById('vehicles-grid-all');
      const emptyEl = document.getElementById('vehicles-empty');

      try {
        // Only fetch available vehicles
        const response = await fetch(`${API_BASE}?action=vehicles&available=true`);
        const result = await response.json();

        if (result.success && result.data && Array.isArray(result.data)) {
          // Filter to ensure only available vehicles are shown
          allVehicles = result.data.filter(vehicle => vehicle.available === true || vehicle.available === 1);
          filteredVehicles = allVehicles;
          
          loadingEl.style.display = 'none';
          displayVehicles(filteredVehicles);
        } else {
          loadingEl.style.display = 'none';
          emptyEl.style.display = 'block';
        }
      } catch (error) {
        console.error('Error loading vehicles:', error);
        loadingEl.style.display = 'none';
        emptyEl.style.display = 'block';
      }
    }

    // Display vehicles
    function displayVehicles(vehicles) {
      const gridEl = document.getElementById('vehicles-grid-all');
      const emptyEl = document.getElementById('vehicles-empty');

      if (vehicles.length === 0) {
        gridEl.style.display = 'none';
        emptyEl.style.display = 'block';
        return;
      }

      gridEl.style.display = 'grid';
      emptyEl.style.display = 'none';

      gridEl.innerHTML = vehicles.map(vehicle => {
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
            <img src="${escapeHtml(imageUrl)}" alt="${name}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${placeholderVehicleSVG}';">
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

    // Filter vehicles
    function filterVehicles() {
      const typeFilter = document.getElementById('filter-type').value;
      const transmissionFilter = document.getElementById('filter-transmission').value;
      const priceFilter = parseFloat(document.getElementById('filter-price').value) || 0;

      filteredVehicles = allVehicles.filter(vehicle => {
        // Always exclude unavailable vehicles
        if (vehicle.available === false || vehicle.available === 0) return false;
        if (typeFilter && vehicle.type !== typeFilter) return false;
        if (transmissionFilter && vehicle.transmission !== transmissionFilter) return false;
        if (priceFilter > 0 && parseFloat(vehicle.price_per_day) > priceFilter) return false;
        return true;
      });

      displayVehicles(filteredVehicles);
    }

    // Reset filters
    function resetFilters() {
      document.getElementById('filter-type').value = '';
      document.getElementById('filter-transmission').value = '';
      document.getElementById('filter-price').value = '';
      filteredVehicles = allVehicles;
      displayVehicles(filteredVehicles);
    }

    // Initialize page
    document.addEventListener('DOMContentLoaded', () => {
      loadAllVehicles();

      // Add event listeners for filters
      document.getElementById('filter-type').addEventListener('change', filterVehicles);
      document.getElementById('filter-transmission').addEventListener('change', filterVehicles);
      document.getElementById('filter-price').addEventListener('input', filterVehicles);
      document.getElementById('filter-reset').addEventListener('click', resetFilters);
    });
  </script>
</body>
</html>

