<?php
/**
 * Admin Dashboard
 * Main admin panel with statistics, bookings, vehicles management, and activity logs
 */

require_once 'admin_auth.php';

$auth = new AdminAuth();
$auth->requireLogin();

$admin = $auth->getCurrentAdmin();
$stats = $auth->getStats();
?>
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Cars Location voiture</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="admin_styles.css">
</head>

<body class="admin-dashboard">
    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="sidebar-header">
            <div class="logo-container">
                <img src="logo/logo1.png" alt="Cars Location voiture Logo" class="logo"
                    onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCAxMDAgNTAiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNTAiIGZpbGw9IiMyRjlFNDQiIHJ4PSI0Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZm9udC13ZWlnaHQ9IjYwMCIgZmlsbD0iI2ZmZiI+Q2FyczwvdGV4dD48L3N2Zz4=';">
                <div class="logo-text">
                    <span class="logo-main">Cars</span>
                    <span class="logo-subtitle">Location voiture</span>
                </div>
            </div>
        </div>

        <nav class="sidebar-nav">
            <a href="#dashboard" class="nav-item active" data-section="dashboard">
                <i class="fas fa-chart-line"></i>
                <span>Tableau de bord</span>
            </a>
            <a href="#vehicles" class="nav-item" data-section="vehicles">
                <i class="fas fa-car"></i>
                <span>Véhicules</span>
            </a>
            <a href="#bookings" class="nav-item" data-section="bookings">
                <i class="fas fa-calendar-check"></i>
                <span>Réservations</span>
            </a>
            <a href="#logs" class="nav-item" data-section="logs">
                <i class="fas fa-history"></i>
                <span>Journal d'activité</span>
            </a>
            <a href="#contacts" class="nav-item" data-section="contacts">
                <i class="fas fa-address-book"></i>
                <span>Contacts</span>
            </a>
            <a href="#brands" class="nav-item" data-section="brands">
                <i class="fas fa-tags"></i>
                <span>Marques</span>
            </a>
            <a href="#offers" class="nav-item" data-section="offers">
                <i class="fas fa-percent"></i>
                <span>Offres & Promotions</span>
            </a>
            <a href="#reviews" class="nav-item" data-section="reviews">
                <i class="fas fa-star"></i>
                <span>Avis clients</span>
            </a>
            <a href="#clients" class="nav-item" data-section="clients">
                <i class="fas fa-users"></i>
                <span>Clients</span>
            </a>
            <a href="#settings" class="nav-item" data-section="settings">
                <i class="fas fa-cog"></i>
                <span>Paramètres</span>
            </a>
        </nav>

        <div class="sidebar-footer">
            <div class="admin-profile">
                <div class="admin-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="admin-info">
                    <strong><?php echo htmlspecialchars($admin['name']); ?></strong>
                    <span><?php echo htmlspecialchars($admin['email']); ?></span>
                </div>
            </div>
            <button class="btn-logout" id="logout-btn">
                <i class="fas fa-sign-out-alt"></i>
                <span>Déconnexion</span>
            </button>
        </div>
    </aside>

    <!-- Sidebar Overlay for Mobile -->
    <div class="sidebar-overlay" id="sidebar-overlay"></div>

    <!-- Main Content -->
    <main class="main-content">
        <!-- Top Bar -->
        <header class="top-bar">
            <div class="top-bar-left">
                <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle menu">
                    <i class="fas fa-bars"></i>
                </button>
                <h1 class="page-title">Tableau de bord</h1>
                <p class="page-subtitle">Bienvenue, <?php echo htmlspecialchars($admin['name']); ?>!</p>
            </div>
            <div class="top-bar-right">
                <div class="notifications">
                    <button class="notification-btn" id="notification-btn">
                        <i class="fas fa-bell"></i>
                        <span class="badge" id="notification-badge">0</span>
                    </button>
                    <div class="notification-dropdown" id="notification-dropdown">
                        <div class="notification-header">
                            <h3>Notifications</h3>
                            <button class="notification-close-btn" onclick="closeNotifications()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="notification-list" id="notification-list">
                            <div class="notification-loading">Chargement...</div>
                        </div>
                        <div class="notification-footer">
                            <a href="#" onclick="showSection('bookings'); closeNotifications(); return false;">Voir
                                toutes les réservations</a>
                        </div>
                    </div>
                </div>
                <a href="index.php" class="btn-view-site" target="_blank">
                    <i class="fas fa-external-link-alt"></i>
                    <span>Voir le site</span>
                </a>
            </div>
        </header>

        <!-- Dashboard Section -->
        <section id="dashboard-section" class="content-section active">
            <!-- Stats Cards -->
            <div class="stats-grid">
                <div class="stat-card stat-card-primary">
                    <div class="stat-icon">
                        <i class="fas fa-car"></i>
                    </div>
                    <div class="stat-content">
                        <h3>Véhicules</h3>
                        <p class="stat-value" data-target="<?php echo $stats['total_vehicles'] ?? 0; ?>">0</p>
                        <span class="stat-label"><?php echo $stats['available_vehicles'] ?? 0; ?> disponibles</span>
                    </div>
                    <div class="stat-wave"></div>
                </div>

                <div class="stat-card stat-card-success">
                    <div class="stat-icon">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="stat-content">
                        <h3>Réservations</h3>
                        <p class="stat-value" data-target="<?php echo $stats['total_bookings'] ?? 0; ?>">0</p>
                        <span class="stat-label"><?php echo $stats['pending_bookings'] ?? 0; ?> en attente</span>
                    </div>
                    <div class="stat-wave"></div>
                </div>

                <div class="stat-card stat-card-warning">
                    <div class="stat-icon">
                        <i class="fas fa-coins"></i>
                    </div>
                    <div class="stat-content">
                        <h3>Revenus totaux</h3>
                        <p class="stat-value"
                            data-target="<?php echo number_format($stats['total_revenue'] ?? 0, 0, ',', ' '); ?>">0</p>
                        <span class="stat-label">DH</span>
                    </div>
                    <div class="stat-wave"></div>
                </div>

                <div class="stat-card stat-card-info">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-content">
                        <h3>Ce mois</h3>
                        <p class="stat-value"
                            data-target="<?php echo number_format($stats['month_revenue'] ?? 0, 0, ',', ' '); ?>">0</p>
                        <span class="stat-label">DH de revenus</span>
                    </div>
                    <div class="stat-wave"></div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions">
                <h2>Actions rapides</h2>
                <div class="actions-grid">
                    <button class="action-btn" onclick="showSection('vehicles')">
                        <i class="fas fa-plus-circle"></i>
                        <span>Ajouter un véhicule</span>
                    </button>
                    <button class="action-btn" onclick="showSection('bookings')">
                        <i class="fas fa-list"></i>
                        <span>Voir les réservations</span>
                    </button>
                    <button class="action-btn" onclick="showSection('logs')">
                        <i class="fas fa-history"></i>
                        <span>Journal d'activité</span>
                    </button>
                    <button class="action-btn" onclick="refreshStats()">
                        <i class="fas fa-sync-alt"></i>
                        <span>Actualiser</span>
                    </button>
                </div>
            </div>
        </section>

        <!-- Vehicles Section -->
        <section id="vehicles-section" class="content-section">
            <div class="section-header">
                <h2>Gestion des véhicules</h2>
                <button class="btn-primary" onclick="addVehicle()">
                    <i class="fas fa-plus"></i>
                    <span>Ajouter un véhicule</span>
                </button>
            </div>
            <div class="table-container">
                <table class="data-table" id="vehicles-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nom</th>
                            <th>Type</th>
                            <th>Prix/jour</th>
                            <th>Disponible</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="vehicles-tbody">
                        <tr>
                            <td colspan="6" class="loading">Chargement...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Bookings Section -->
        <section id="bookings-section" class="content-section">
            <div class="section-header">
                <div>
                    <h2>Réservations</h2>
                    <p class="section-subtitle">Toutes les réservations de véhicules par les clients</p>
                </div>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <button class="btn-secondary" onclick="loadBookings()" title="Actualiser">
                        <i class="fas fa-sync-alt"></i>
                        <span>Actualiser</span>
                    </button>
                    <div class="filter-group">
                        <select id="booking-filter" class="filter-select" onchange="filterBookings(this.value)">
                            <option value="all">Toutes</option>
                            <option value="pending">En attente</option>
                            <option value="confirmed">Confirmées</option>
                            <option value="active">Actives</option>
                            <option value="completed">Terminées</option>
                            <option value="cancelled">Annulées</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table" id="bookings-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Client</th>
                            <th>Véhicule</th>
                            <th>Dates</th>
                            <th>Prix</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="bookings-tbody">
                        <tr>
                            <td colspan="7" class="loading">Chargement...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Logs Section -->
        <section id="logs-section" class="content-section">
            <div class="section-header">
                <h2>Journal d'activité</h2>
                <button class="btn-secondary" onclick="refreshLogs()">
                    <i class="fas fa-sync-alt"></i>
                    <span>Actualiser</span>
                </button>
            </div>
            <div class="logs-container" id="logs-container">
                <div class="loading">Chargement des logs...</div>
            </div>
        </section>

        <!-- Contacts Section -->
        <section id="contacts-section" class="content-section">
            <div class="section-header">
                <h2>Gestion des contacts</h2>
                <button class="btn-primary" onclick="addContact()">
                    <i class="fas fa-plus"></i>
                    <span>Ajouter un contact</span>
                </button>
            </div>
            <div class="contacts-grid" id="contacts-grid">
                <div class="loading">Chargement des contacts...</div>
            </div>
        </section>

        <!-- Brands Section -->
        <section id="brands-section" class="content-section">
            <div class="section-header">
                <h2>Gestion des marques</h2>
                <button class="btn-primary" onclick="addBrand()">
                    <i class="fas fa-plus"></i>
                    <span>Ajouter une marque</span>
                </button>
            </div>
            <div class="table-container">
                <table class="data-table" id="brands-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Logo</th>
                            <th>Nom</th>
                            <th>Ordre</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="brands-tbody">
                        <tr>
                            <td colspan="6" class="loading">Chargement...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Offers Section -->
        <section id="offers-section" class="content-section">
            <div class="section-header">
                <div>
                    <h2>Gestion des offres et promotions</h2>
                    <p class="section-subtitle">Créez et gérez les offres spéciales et promotions pour vos véhicules</p>
                </div>
                <button class="btn-primary" onclick="addOffer()">
                    <i class="fas fa-plus"></i>
                    <span>Ajouter une offre</span>
                </button>
            </div>
            <div class="table-container">
                <table class="data-table" id="offers-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Titre</th>
                            <th>Type</th>
                            <th>Réduction</th>
                            <th>Véhicule</th>
                            <th>Date début</th>
                            <th>Date fin</th>
                            <th>Statut</th>
                            <th>Ventes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="offers-tbody">
                        <tr>
                            <td colspan="10" class="loading">Chargement des offres...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Reviews Section -->
        <section id="reviews-section" class="content-section">
            <div class="section-header">
                <div>
                    <h2>Gestion des avis clients</h2>
                    <p class="section-subtitle">Approuvez, modifiez ou supprimez les avis des clients</p>
                </div>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <button class="btn-secondary" onclick="loadReviews()" title="Actualiser">
                        <i class="fas fa-sync-alt"></i>
                        <span>Actualiser</span>
                    </button>
                    <div class="filter-group">
                        <select id="review-filter" class="filter-select" onchange="filterReviews(this.value)">
                            <option value="all">Tous les avis</option>
                            <option value="approved">Approuvés</option>
                            <option value="pending">En attente</option>
                            <option value="featured">Mis en avant</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table" id="reviews-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Client</th>
                            <th>Véhicule</th>
                            <th>Note globale</th>
                            <th>Service</th>
                            <th>Véhicule</th>
                            <th>Commentaire</th>
                            <th>Statut</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="reviews-tbody">
                        <tr>
                            <td colspan="10" class="loading">Chargement des avis...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Clients Section -->
        <section id="clients-section" class="content-section">
            <div class="section-header">
                <h2>Gestion des clients</h2>
                <p class="section-subtitle">Liste de tous les clients ayant effectué des réservations</p>
            </div>
            <div class="clients-container">
                <div class="clients-table-container">
                    <table class="clients-table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Téléphone</th>
                                <th>Email</th>
                                <th>Réservations</th>
                                <th>Dernière réservation</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="clients-table-body">
                            <tr>
                                <td colspan="6" class="loading">Chargement des clients...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- Settings Section -->
        <section id="settings-section" class="content-section">
            <div class="section-header">
                <h2>Paramètres</h2>
            </div>
            <div class="settings-container">
                <!-- Account Information -->
                <div class="settings-card">
                    <h3>Informations du compte</h3>
                    <div class="settings-form">
                        <div class="form-group">
                            <label>Nom complet</label>
                            <input type="text" id="admin-name" value="<?php echo htmlspecialchars($admin['name']); ?>"
                                readonly>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="admin-email"
                                value="<?php echo htmlspecialchars($admin['email']); ?>" readonly>
                        </div>
                    </div>
                </div>

                <!-- Change Password -->
                <div class="settings-card">
                    <h3>Changer le mot de passe</h3>
                    <form id="change-password-form" class="settings-form">
                        <div class="form-group">
                            <label for="current-password">Mot de passe actuel *</label>
                            <input type="password" id="current-password" name="current_password" required>
                        </div>
                        <div class="form-group">
                            <label for="new-password">Nouveau mot de passe *</label>
                            <input type="password" id="new-password" name="new_password" required minlength="6">
                            <small style="color: #6b7280; display: block; margin-top: 0.25rem;">Minimum 6
                                caractères</small>
                        </div>
                        <div class="form-group">
                            <label for="confirm-password">Confirmer le nouveau mot de passe *</label>
                            <input type="password" id="confirm-password" name="confirm_password" required minlength="6">
                        </div>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-key"></i>
                            Changer le mot de passe
                        </button>
                    </form>
                </div>

                <!-- Admin Management -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <h3>Gestion des administrateurs</h3>
                        <button class="btn-primary" onclick="showAddAdminModal()">
                            <i class="fas fa-plus"></i>
                            <span>Ajouter un administrateur</span>
                        </button>
                    </div>
                    <div class="admins-table-container">
                        <table class="admins-table">
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Email</th>
                                    <th>Statut</th>
                                    <th>Date de création</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="admins-table-body">
                                <tr>
                                    <td colspan="5" class="loading">Chargement des administrateurs...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- Toast Notification -->
    <div id="toast" class="toast"></div>

    <script src="script/admin_dashboard.js"></script>
    <style>
        /* Modal Styles */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        }

        .modal.show {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
        }

        .modal-content {
            position: relative;
            background: white;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-xl);
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            z-index: 1001;
            animation: slideUp 0.3s ease;
        }

        .modal-large {
            max-width: 800px;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid var(--gray-200);
        }

        .modal-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0;
        }

        .modal-close {
            width: 36px;
            height: 36px;
            border: none;
            background: var(--gray-100);
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            transition: var(--transition);
        }

        .modal-close:hover {
            background: var(--gray-200);
            color: var(--text-primary);
        }

        .modal-form {
            padding: 1.5rem;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .form-group label {
            display: block;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
        }

        .form-group input,
        .form-group select {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--gray-300);
            border-radius: var(--radius-md);
            font-size: 0.95rem;
            transition: var(--transition);
        }

        .form-group input:focus,
        .form-group select:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
            width: auto;
            cursor: pointer;
        }

        .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--gray-200);
        }

        /* Image Upload Styles */
        .image-upload-container {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .image-upload-preview {
            position: relative;
            width: 100%;
            min-height: 200px;
            border: 2px dashed var(--gray-300);
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: var(--transition);
            background: var(--gray-50);
            overflow: hidden;
        }

        .image-upload-preview:hover {
            border-color: var(--primary);
            background: var(--gray-100);
        }

        .image-upload-preview.dragover {
            border-color: var(--primary);
            background: rgba(99, 102, 241, 0.1);
        }

        .image-upload-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-secondary);
            padding: 2rem;
        }

        .image-upload-placeholder i {
            font-size: 3rem;
            color: var(--gray-400);
        }

        .image-upload-placeholder span {
            font-size: 0.875rem;
            text-align: center;
        }

        .preview-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            min-height: 200px;
        }

        .remove-image {
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            width: 32px;
            height: 32px;
            border: none;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: var(--transition);
        }

        .remove-image:hover {
            background: var(--danger);
            transform: scale(1.1);
        }

        .btn-image-upload {
            padding: 0.625rem 1rem;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: var(--radius-md);
            font-weight: 500;
            cursor: pointer;
            transition: var(--transition);
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            width: fit-content;
        }

        .btn-image-upload:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }

        .uploading {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            padding: 2rem;
            color: var(--primary);
        }

        .uploading i {
            font-size: 2rem;
        }

        .image-url-fallback {
            padding-top: 0.5rem;
            border-top: 1px solid var(--gray-200);
        }

        .image-url-fallback small {
            color: var(--text-secondary);
            font-size: 0.8rem;
        }

        @media (max-width: 768px) {
            .form-row {
                grid-template-columns: 1fr;
            }
        }
    </style>
</body>

</html>