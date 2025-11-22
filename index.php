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
function getStats() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Compter les clients satisfaits (réservations complétées)
        $stmt = $pdo->query("SELECT COUNT(DISTINCT customer_email) as count FROM bookings WHERE status = 'completed'");
        $happyCustomers = $stmt->fetchColumn();
        
        // Compter les avis 5 étoiles
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM vehicles WHERE rating >= 4.5");
        $fiveStarReviews = $stmt->fetchColumn();
        
        // Villes desservies (fixe pour l'instant)
        $citiesServed = 120;
        
        return [
            'happy_customers' => $happyCustomers > 0 ? number_format($happyCustomers / 1000, 1) . 'k+' : '2,4k+',
            'five_star_reviews' => $fiveStarReviews > 0 ? number_format($fiveStarReviews / 1000, 1) . 'k' : '1,8k',
            'cities_served' => $citiesServed . '+'
        ];
    } catch (PDOException $e) {
        // En cas d'erreur, retourner des valeurs par défaut
        return [
            'happy_customers' => '2,4k+',
            'five_star_reviews' => '1,8k',
            'cities_served' => '120+'
        ];
    }
}

// Récupérer les statistiques
$stats = getStats();

// Année actuelle pour le footer
$currentYear = date('Y');
?>
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rentcars · Location de Voitures Premium</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
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
              Où que vous soyez, Rentcars vous livre la voiture parfaite. Accédez à des milliers de véhicules premium avec des options de prise en charge et de retour flexibles.
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
            <img src="images/carhero.png" alt="Blue sports car" loading="eager" decoding="async">
            <div class="hero__card">
              <p>Offre week-end luxe</p>
              <h3>Audi R8 2024</h3>
              <span>799 € / week-end</span>
            </div>
          </div>
        </div>
        <div class="container booking-card">
          <form class="booking-form" id="search-form" method="GET" action="#search-results">
            <div class="form-field">
              <label for="location">Localisation</label>
              <input id="location" name="location" type="text" placeholder="Rechercher votre localisation" value="<?php echo isset($_GET['location']) ? htmlspecialchars($_GET['location']) : ''; ?>" required>
            </div>
            <div class="form-field">
              <label for="pickup-date">Date de prise en charge</label>
              <input id="pickup-date" name="pickup_date" type="date" value="<?php echo isset($_GET['pickup_date']) ? htmlspecialchars($_GET['pickup_date']) : ''; ?>" required>
            </div>
            <div class="form-field">
              <label for="return-date">Date de retour</label>
              <input id="return-date" name="return_date" type="date" value="<?php echo isset($_GET['return_date']) ? htmlspecialchars($_GET['return_date']) : ''; ?>" required>
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
        <div class="container" id="search-results" style="display: <?php echo isset($_GET['location']) ? 'block' : 'none'; ?>; margin-top: 2rem;"></div>
      </section>

      <section class="partner-logos">
        <div class="container partner-logos__inner">
          <span>Honda</span>
          <span>Jaguar</span>
          <span>Nissan</span>
          <span>Volvo</span>
          <span>Audi</span>
          <span>Acura</span>
        </div>
      </section>

      <section class="section how-it-works" id="how-it-works">
        <div class="container">
          <p class="section-tag">Comment ça marche</p>
          <h2 class="section-title">Louez une voiture en trois étapes simples</h2>
          <div class="cards-grid">
            <article class="info-card">
              <div class="info-card__icon">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/></svg>
              </div>
              <h3>Choisissez la localisation</h3>
              <p>Sélectionnez n'importe quelle ville, aéroport ou hôtel et nous vous montrerons les meilleurs points de prise en charge à proximité.</p>
            </article>
            <article class="info-card">
              <div class="info-card__icon">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v2H4zm4 4h8v2H8zm-4 4h16v6H4zm2 2v2h12v-2z"/></svg>
              </div>
              <h3>Sélectionnez vos dates</h3>
              <p>Choisissez des dates précises de prise en charge et de retour pour bénéficier des meilleurs tarifs quotidiens et hebdomadaires.</p>
            </article>
            <article class="info-card">
              <div class="info-card__icon">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11h14l1 5H4zm11-4h2l1 3H5l1-3h2l1-2h6zM6 17h2v2H6zm10 0h2v2h-2z"/></svg>
              </div>
              <h3>Réservez votre voiture</h3>
              <p>Confirmez instantanément, recevez une clé numérique et nous vous livrons la voiture directement.</p>
            </article>
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

      <section class="section services" id="services">
        <div class="container">
          <p class="section-tag">Offres de location populaires</p>
          <h2 class="section-title">Voitures sélectionnées pour chaque voyage</h2>
          <div class="cards-grid cards-grid--4" id="vehicles-grid">
            <!-- Vehicles will be loaded dynamically from API -->
          </div>
          <div class="section__cta">
            <a href="#" class="btn btn-text">Voir tous les véhicules →</a>
          </div>
        </div>
      </section>

      <section class="section testimonials" id="reviews">
        <div class="container">
          <p class="section-tag">Témoignages</p>
          <h2 class="section-title">Ce que disent nos clients</h2>
          <div class="cards-grid cards-grid--3">
            <article class="testimonial-card">
              <div class="testimonial-card__rating">★★★★★</div>
              <p>"Réserver avec Rentcars est sans effort. La voiture est arrivée impeccable et à l'heure."</p>
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
              <p>"Je me suis senti très en sécurité avec Rentcars. Le support était rapide et le chauffeur professionnel."</p>
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
          </div>
        </div>
      </section>

    </main>

    <footer class="footer" id="contact">
      <div class="container footer__grid">
        <div>
          <a class="brand brand--footer" href="#top">
            <img src="logo/logo1.png" alt="Rentcars logo">
            <span>Rentcars</span>
          </a>
          <p>Locations premium avec service conciergerie, disponibles dans plus de 120 villes dans le monde.</p>
          <div class="footer__contact">
            <a href="tel:+18005551234">+1 (800) 555-1234</a>
            <a href="mailto:hello@rentcars.com">hello@rentcars.com</a>
          </div>
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
          <span>© <?php echo htmlspecialchars($currentYear); ?> Rentcars. Tous droits réservés.</span>
          <div class="footer__legal">
            <a href="#">Politique de confidentialité</a>
            <a href="#">Conditions d'utilisation</a>
          </div>
        </div>
      </div>
    </footer>

    <!-- Booking Modal -->
    <div id="booking-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <span class="modal-close">&times;</span>
        <h2>Complétez votre réservation</h2>
        <form id="booking-form">
          <input type="hidden" id="booking-vehicle-id">
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
          <div class="form-field">
            <label>Lieu de prise en charge</label>
            <input type="text" id="booking-location" required>
          </div>
          <div class="form-field">
            <label>Date de prise en charge</label>
            <input type="datetime-local" id="booking-pickup" required>
          </div>
          <div class="form-field">
            <label>Date de retour</label>
            <input type="datetime-local" id="booking-return" required>
          </div>
          <div id="booking-total" style="margin: 1rem 0; font-size: 1.2rem; font-weight: 600;"></div>
          <button type="submit" class="btn btn-primary">Confirmer la réservation</button>
        </form>
      </div>
    </div>

    <script src="script/currency.js" defer></script>
    <script src="script/load-components.js" defer></script>
    <script src="script/script.js" defer></script>
  </body>
</html>

