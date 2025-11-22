<?php
/**
 * Page principale - Location de Voitures
 * Version PHP avec intégration backend
 */

// Configuration de la base de données
define('DB_HOST', 'localhost');
define('DB_NAME', 'location_voiture');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Fonction pour obtenir les statistiques depuis la base de données
function getStats()
{
  try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Compter les clients satisfaits (tous les clients uniques qui ont fait au moins une réservation)
    $stmt = $pdo->query("SELECT COUNT(DISTINCT id) as count FROM clients WHERE total_bookings > 0");
    $happyCustomers = (int)$stmt->fetchColumn();
    
    // Si aucun client dans la table clients, compter depuis bookings
    if ($happyCustomers === 0) {
      $stmt = $pdo->query("SELECT COUNT(DISTINCT customer_email) as count FROM bookings WHERE customer_email IS NOT NULL AND customer_email != ''");
      $happyCustomers = (int)$stmt->fetchColumn();
    }

    // Compter les avis 5 étoiles réels depuis la table reviews
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM reviews WHERE rating = 5 AND is_approved = 1");
    $fiveStarReviews = (int)$stmt->fetchColumn();
    
    // Si aucun avis 5 étoiles, compter les avis avec rating >= 4.5
    if ($fiveStarReviews === 0) {
      $stmt = $pdo->query("SELECT COUNT(*) as count FROM reviews WHERE rating >= 4.5 AND is_approved = 1");
      $fiveStarReviews = (int)$stmt->fetchColumn();
    }
    
    // Si toujours 0, compter depuis les véhicules avec rating >= 4.5
    if ($fiveStarReviews === 0) {
      $stmt = $pdo->query("SELECT COUNT(*) as count FROM vehicles WHERE rating >= 4.5");
      $fiveStarReviews = (int)$stmt->fetchColumn();
    }

    // Compter les villes distinctes depuis les réservations
    $stmt = $pdo->query("SELECT COUNT(DISTINCT pickup_location) as count FROM bookings WHERE pickup_location IS NOT NULL AND pickup_location != ''");
    $citiesServed = (int)$stmt->fetchColumn();
    
    // Si aucune ville trouvée, utiliser une valeur par défaut réaliste
    if ($citiesServed === 0) {
      $citiesServed = 1; // Au moins la ville principale
    }

    // Formater les valeurs
    $happyCustomersFormatted = $happyCustomers >= 1000 
      ? number_format($happyCustomers / 1000, 1, ',', '') . 'k+' 
      : ($happyCustomers > 0 ? number_format($happyCustomers, 0, ',', '') . '+' : '0');
    
    $fiveStarReviewsFormatted = $fiveStarReviews >= 1000 
      ? number_format($fiveStarReviews / 1000, 1, ',', '') . 'k' 
      : ($fiveStarReviews > 0 ? number_format($fiveStarReviews, 0, ',', '') : '0');
    
    $citiesServedFormatted = $citiesServed . '+';

    return [
      'happy_customers' => $happyCustomersFormatted,
      'five_star_reviews' => $fiveStarReviewsFormatted,
      'cities_served' => $citiesServedFormatted
    ];
  } catch (PDOException $e) {
    // En cas d'erreur, essayer de retourner des valeurs minimales réalistes
    error_log("Error getting stats: " . $e->getMessage());
    return [
      'happy_customers' => '0',
      'five_star_reviews' => '0',
      'cities_served' => '1+'
    ];
  }
}

// Fonction pour obtenir l'offre active actuelle
function getActiveOffer()
{
  try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Récupérer l'offre active actuelle (dans la période de validité)
    $stmt = $pdo->prepare("
      SELECT o.*, v.name as vehicle_name, v.image_url as vehicle_image, v.price_per_day as vehicle_price
      FROM offers o
      LEFT JOIN vehicles v ON o.vehicle_id = v.id
      WHERE o.is_active = 1
        AND CURDATE() BETWEEN o.start_date AND o.end_date
      ORDER BY o.created_at DESC
      LIMIT 1
    ");
    $stmt->execute();
    $offer = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($offer) {
      // Calculer le prix avec la réduction
      $originalPrice = (float)$offer['vehicle_price'];
      $discountValue = (float)$offer['discount_value'];
      $finalPrice = $originalPrice;

      if ($offer['offer_type'] === 'percentage') {
        $finalPrice = $originalPrice * (1 - $discountValue / 100);
      } elseif ($offer['offer_type'] === 'fixed_amount') {
        $finalPrice = max(0, $originalPrice - $discountValue);
      }

      $offer['final_price'] = $finalPrice;
      $offer['original_price'] = $originalPrice;
      
      // Utiliser l'image de l'offre si disponible, sinon l'image du véhicule
      $offer['display_image'] = !empty($offer['image_url']) ? $offer['image_url'] : $offer['vehicle_image'];
    }

    return $offer ? $offer : null;
  } catch (PDOException $e) {
    error_log("Error getting active offer: " . $e->getMessage());
    return null;
  }
}

// Récupérer les statistiques
$stats = getStats();

// Récupérer l'offre active
$activeOffer = getActiveOffer();

// Année actuelle pour le footer
$currentYear = date('Y');
?>
<!DOCTYPE html>
<html lang="fr">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cars Location voiture · Location de Voitures Premium</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="styles.css">
</head>

<body>
  <!-- Header will be loaded here -->
  <div id="header-placeholder"></div>

  <main>
    <section class="hero" id="book">
      <div class="container hero__grid">
        <div class="hero__content">
          <p class="eyebrow">Trouvez, réservez et louez une voiture facilement</p>
          <h1>Conduisez la voiture de vos rêves en quelques minutes</h1>
          <p class="hero__summary">
            Où que vous soyez, Cars Location voiture vous livre la voiture parfaite. Accédez à des milliers de véhicules
            premium avec
            des options de prise en charge et de retour flexibles.
          </p>

          <div class="hero__stats">
            <div>
              <strong><?php echo htmlspecialchars($stats['happy_customers']); ?></strong>
              <span>Clients satisfaits</span>
            </div>
            <div>
              <strong><?php echo htmlspecialchars($stats['five_star_reviews']); ?></strong>
              <span>Avis 5 étoiles</span>
            </div>
            <div>
              <strong><?php echo htmlspecialchars($stats['cities_served']); ?></strong>
              <span>Villes desservies</span>
            </div>
          </div>
        </div>
        <div class="hero__visual">
          <div class="hero__glow"></div>
          <?php if ($activeOffer): ?>
            <img src="<?php echo htmlspecialchars($activeOffer['display_image'] ?: 'images/carhero.png'); ?>" 
                 alt="<?php echo htmlspecialchars($activeOffer['vehicle_name'] ?: 'Véhicule en promotion'); ?>" 
                 loading="eager" decoding="async"
                 onerror="this.onerror=null;this.src='images/carhero.png';">
            <div class="hero__card">
              <p><?php echo htmlspecialchars($activeOffer['title'] ?: 'Offre spéciale'); ?></p>
              <h3><?php echo htmlspecialchars($activeOffer['vehicle_name'] ?: 'Véhicule premium'); ?></h3>
              <span><?php 
                $price = number_format($activeOffer['final_price'], 2, ',', ' ');
                echo $price . ' DH';
                if ($activeOffer['offer_type'] === 'percentage') {
                  echo ' / jour (-' . number_format($activeOffer['discount_value'], 0) . '%)';
                } else {
                  echo ' / jour';
                }
              ?></span>
              <?php if ($activeOffer['vehicle_id']): ?>
                <a href="vehicle-details.html?id=<?php echo (int)$activeOffer['vehicle_id']; ?>" 
                   class="hero__card-link" style="display: block; margin-top: 0.5rem; color: #2F9E44; text-decoration: none; font-weight: 600;">
                  Voir les détails →
                </a>
              <?php endif; ?>
            </div>
          <?php else: ?>
            <img src="images/carhero.png" alt="Blue sports car" loading="eager" decoding="async">
            <div class="hero__card">
              <p>Offre week-end luxe</p>
              <h3>Audi R8 2024</h3>
              <span>799 € / week-end</span>
            </div>
          <?php endif; ?>
        </div>
      </div>
      <div class="container booking-card">
        <form class="booking-form" id="search-form" method="GET" action="#search-results">
          <div class="form-field">
            <label for="location">Localisation</label>
            <input id="location" name="location" type="text" placeholder="Rechercher votre localisation"
              value="<?php echo isset($_GET['location']) ? htmlspecialchars($_GET['location']) : ''; ?>" required>
          </div>
          <div class="form-field">
            <label for="pickup-date">Date de prise en charge</label>
            <input id="pickup-date" name="pickup_date" type="date"
              value="<?php echo isset($_GET['pickup_date']) ? htmlspecialchars($_GET['pickup_date']) : ''; ?>" required>
          </div>
          <div class="form-field">
            <label for="return-date">Date de retour</label>
            <input id="return-date" name="return_date" type="date"
              value="<?php echo isset($_GET['return_date']) ? htmlspecialchars($_GET['return_date']) : ''; ?>" required>
          </div>
          <div class="form-field">
            <label for="vehicle-type">Type de véhicule</label>
            <select id="vehicle-type" name="vehicle_type">
              <option value="Tous types" <?php echo (!isset($_GET['vehicle_type']) || $_GET['vehicle_type'] === 'Tous types') ? 'selected' : ''; ?>>Tous types</option>
              <option value="Économique" <?php echo (isset($_GET['vehicle_type']) && $_GET['vehicle_type'] === 'Économique') ? 'selected' : ''; ?>>Économique</option>
              <option value="Compact" <?php echo (isset($_GET['vehicle_type']) && $_GET['vehicle_type'] === 'Compact') ? 'selected' : ''; ?>>Compact</option>
              <option value="Luxe" <?php echo (isset($_GET['vehicle_type']) && $_GET['vehicle_type'] === 'Luxe') ? 'selected' : ''; ?>>Luxe</option>
              <option value="SUV" <?php echo (isset($_GET['vehicle_type']) && $_GET['vehicle_type'] === 'SUV') ? 'selected' : ''; ?>>SUV</option>
              <option value="Cabriolet" <?php echo (isset($_GET['vehicle_type']) && $_GET['vehicle_type'] === 'Cabriolet') ? 'selected' : ''; ?>>Cabriolet</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">
            Rechercher la disponibilité
          </button>
        </form>
      </div>
      <div class="container" id="search-results"
        style="display: <?php echo isset($_GET['location']) ? 'block' : 'none'; ?>; margin-top: 2rem;"></div>
    </section>

    <section class="brands-section-2025" id="brands-section">
      <div class="brands-container">
        <div class="brands-header">
          <span class="brands-badge">NOS PARTENAIRES</span>
          <h2 class="brands-title">Marques de confiance</h2>
        </div>
        <div class="brands-grid-2025" id="brands-grid-2025">
          <!-- Brands will be loaded dynamically -->
          <div class="brands-loading">Chargement des marques...</div>
        </div>
      </div>
    </section>

    <section class="section services" id="services">
      <div class="container">
        <p class="section-tag">Offres de location populaires</p>
        <h2 class="section-title">Voitures sélectionnées pour chaque voyage</h2>
        <div class="cards-grid cards-grid--4" id="vehicles-grid">
          <!-- Vehicles will be loaded dynamically from API -->
        </div>
        <div class="section__cta">
          <a href="all-vehicles.php" class="btn btn-text">Voir tous les véhicules →</a>
        </div>
      </div>
    </section>

    <section class="section why-us" id="why-us">
      <div class="container why-us__grid">
        <div class="why-us__visual">
          <img src="images/Audi.png" alt="Luxury car interior">
        </div>
        <div class="why-us__content">
          <p class="section-tag">Pourquoi nous choisir</p>
          <h2>Un service exceptionnel à chaque location</h2>
          <ul class="feature-list">
            <li>
              <span class="feature-icon">💰</span>
              <div>
                <h3>Meilleur prix garanti</h3>
                <p>Trouvez un tarif inférieur et nous vous remboursons 100% de la différence. Aucun frais caché.</p>
              </div>
            </li>
            <li>
              <span class="feature-icon">👨‍✈️</span>
              <div>
                <h3>Chauffeurs professionnels</h3>
                <p>Besoin d'un chauffeur ? Nos experts vérifiés sont prêts quand vous le souhaitez.</p>
              </div>
            </li>
            <li>
              <span class="feature-icon">⚡</span>
              <div>
                <h3>Livraison 24h</h3>
                <p>Planifiez une livraison à votre domicile, bureau ou hôtel en quelques heures.</p>
              </div>
            </li>
            <li>
              <span class="feature-icon">🛠️</span>
              <div>
                <h3>Support permanent</h3>
                <p>Chat en direct, téléphone et assistance conciergerie disponibles tous les jours de la semaine.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="section how-it-works" id="how-it-works">
      <div class="container">
        <p class="section-tag">Comment ça marche</p>
        <h2 class="section-title">Louez une voiture en trois étapes simples</h2>
        <div class="cards-grid">
          <article class="info-card">
            <div class="info-card__icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
              </svg>
            </div>
            <h3>Choisissez la localisation</h3>
            <p>Sélectionnez n'importe quelle ville, aéroport ou hôtel et nous vous montrerons les meilleurs points de
              prise en charge à proximité.</p>
          </article>
          <article class="info-card">
            <div class="info-card__icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 5h16v2H4zm4 4h8v2H8zm-4 4h16v6H4zm2 2v2h12v-2z" />
              </svg>
            </div>
            <h3>Sélectionnez vos dates</h3>
            <p>Choisissez des dates précises de prise en charge et de retour pour bénéficier des meilleurs tarifs
              quotidiens et hebdomadaires.</p>
          </article>
          <article class="info-card">
            <div class="info-card__icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 11h14l1 5H4zm11-4h2l1 3H5l1-3h2l1-2h6zM6 17h2v2H6zm10 0h2v2h-2z" />
              </svg>
            </div>
            <h3>Réservez votre voiture</h3>
            <p>Confirmez instantanément, recevez une clé numérique et nous vous livrons la voiture directement.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section testimonials" id="reviews">
      <div class="container">
        <p class="section-tag">Témoignages</p>
        <h2 class="section-title">Ce que disent nos clients</h2>
        <div class="cards-grid cards-grid--3" id="reviews-grid">
          <!-- Reviews will be loaded dynamically from API -->
          <div style="text-align: center; padding: 2rem; color: #6b7280;">
            <i class="fas fa-spinner fa-spin"></i> Chargement des avis...
          </div>
        </div>
        <div class="section__cta" style="margin-top: 2rem; text-align: center;">
          <a href="review-submit.html" class="btn btn-primary">
            <i class="fas fa-star"></i> Laisser un avis
          </a>
        </div>
      </div>
    </section>

  </main>

  <footer class="footer" id="contact">
    <div class="container footer__grid">
      <div>
        <a class="brand brand--footer" href="#top">
          <img src="logo/logo1.png" alt="Cars Location voiture logo"
            onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCAxMDAgNTAiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNTAiIGZpbGw9IiMyRjlFNDQiIHJ4PSI0Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZm9udC13ZWlnaHQ9IjYwMCIgZmlsbD0iI2ZmZiI+Q2FyczwvdGV4dD48L3N2Zz4=';">
          <div style="display: flex; flex-direction: column; gap: 0.125rem;">
            <span style="font-size: 1.25rem; font-weight: 700; color: var(--primary, #2F9E44);">Cars</span>
            <span
              style="font-size: 0.875rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary, #64748b);">Location
              voiture</span>
          </div>
        </a>
        <p>Locations premium avec service conciergerie, disponibles dans plus de 120 villes dans le monde.</p>
      </div>
      <div>
        <h4>Notre Produit</h4>
        <ul>
          <li><a href="#services">Catalogue de voitures</a></li>
          <li><a href="#book">Réservation instantanée</a></li>
          <li><a href="#why-us">Conciergerie</a></li>
          <li><a href="#reviews">Témoignages</a></li>
        </ul>
      </div>
      <div>
        <h4>Ressources</h4>
        <ul>
          <li><a href="#">Centre d'aide</a></li>
          <li><a href="#">Exigences pour les chauffeurs</a></li>
          <li><a href="#">Partenaires d'assurance</a></li>
          <li><a href="#">Guide des tarifs</a></li>
        </ul>
      </div>
      <div>
        <h4>Suivez-nous</h4>
        <ul class="footer__socials">
          <li><a href="#">Instagram</a></li>
          <li><a href="#">LinkedIn</a></li>
          <li><a href="#">Twitter</a></li>
          <li><a href="#">YouTube</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <div class="container footer__bottom-inner">
        <span>© <?php echo htmlspecialchars($currentYear); ?> Cars Location voiture. Tous droits réservés.</span>
        <div class="footer__legal">
          <a href="#">Politique de confidentialité</a>
          <a href="#">Conditions d'utilisation</a>
        </div>
      </div>
    </div>
  </footer>

  <!-- Enhanced Booking Modal with Calendar -->
  <div id="booking-modal" class="modal" style="display: none;">
    <div class="modal-content booking-modal-enhanced">
      <div class="modal-header">
        <h2>Modifier la recherche</h2>
        <button class="modal-close" aria-label="Fermer">&times;</button>
      </div>
      
      <form id="booking-form">
        <input type="hidden" id="booking-vehicle-id">
        
        <!-- Location Section -->
        <div class="booking-section">
          <label for="booking-location" class="booking-label">
            Lieu de prise en charge
          </label>
          <div class="input-with-clear">
            <input type="text" id="booking-location" class="booking-input" placeholder="Entrez votre adresse" required>
            <button type="button" class="clear-input" id="clear-location" style="display: none;">&times;</button>
          </div>
        </div>

        <!-- Same Location Checkbox -->
        <div class="booking-section">
          <label class="checkbox-label">
            <input type="checkbox" id="same-location" checked>
            <span>Restitution au même endroit</span>
          </label>
        </div>

        <!-- Date and Time Section -->
        <div class="booking-datetime-section">
          <!-- Pickup Date/Time -->
          <div class="datetime-group">
            <label class="datetime-label">Prise en charge</label>
            <div class="datetime-inputs">
              <div class="date-input-wrapper">
                <input type="text" id="booking-pickup-date" class="date-input" readonly required>
                <button type="button" class="date-picker-btn" id="pickup-date-btn">
                  <i class="fas fa-calendar-alt"></i>
                </button>
              </div>
              <div class="time-input-wrapper">
                <select id="booking-pickup-time" class="time-select" required>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00" selected>11:00</option>
                  <option value="12:00">12:00</option>
                  <option value="13:00">13:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Return Date/Time -->
          <div class="datetime-group">
            <label class="datetime-label">Restitution</label>
            <div class="datetime-inputs">
              <div class="date-input-wrapper">
                <input type="text" id="booking-return-date" class="date-input" readonly required>
                <button type="button" class="date-picker-btn" id="return-date-btn">
                  <i class="fas fa-calendar-check"></i>
                </button>
              </div>
              <div class="time-input-wrapper">
                <select id="booking-return-time" class="time-select" required>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00" selected>11:00</option>
                  <option value="12:00">12:00</option>
                  <option value="13:00">13:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Hidden datetime inputs for form submission -->
        <input type="hidden" id="booking-pickup" name="pickup_date">
        <input type="hidden" id="booking-return" name="return_date">

        <!-- Calendar Widget -->
        <div class="calendar-widget" id="calendar-widget" style="display: none;">
          <div class="calendar-container">
            <div class="calendar-month" id="calendar-month-1"></div>
            <div class="calendar-month" id="calendar-month-2"></div>
          </div>
          <div class="calendar-summary" id="calendar-summary"></div>
        </div>

        <!-- Customer Information Section -->
        <div class="booking-section-divider">
          <h3>Informations client</h3>
        </div>

        <div class="form-field">
          <label for="customer-name">Nom complet</label>
          <input type="text" id="customer-name" required>
        </div>
        <div class="form-field">
          <label for="customer-email">Email</label>
          <input type="email" id="customer-email" required>
        </div>
        <div class="form-field">
          <label for="customer-phone">Téléphone</label>
          <input type="tel" id="customer-phone" required>
        </div>
        <div class="form-field">
          <label for="customer-password">Mot de passe</label>
          <input type="password" id="customer-password" placeholder="Créez un mot de passe pour votre compte" required>
          <small style="color: #666; font-size: 0.85rem;">Ce mot de passe vous permettra de vous connecter à votre compte client</small>
        </div>

        <!-- Booking Summary -->
        <div id="booking-total" class="booking-total"></div>
        
        <button type="submit" class="btn btn-primary btn-booking-submit">Confirmer la réservation</button>
      </form>
    </div>
  </div>

  <script src="script/currency.js" defer></script>
  <script src="script/load-components.js" defer></script>
  <script src="script/script.js" defer></script>
</body>

</html>