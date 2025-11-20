<?php
/**
 * Admin Login Page
 * Beautiful login page with modern design and animations
 */

session_start();

// Redirect if already logged in
if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
    header('Location: admin_dashboard.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - Rentcars</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="admin_styles.css">
</head>
<body class="admin-login-page">
    <div class="login-container">
        <div class="login-background">
            <div class="animated-shapes">
                <div class="shape shape-1"></div>
                <div class="shape shape-2"></div>
                <div class="shape shape-3"></div>
                <div class="shape shape-4"></div>
            </div>
        </div>
        
        <div class="login-card">
            <div class="login-header">
                <div class="logo-container">
                    <img src="images/logo.png" alt="Rentcars Logo" class="logo">
                    <h1>Rentcars</h1>
                </div>
                <h2>Admin Panel</h2>
                <p>Connectez-vous pour accéder au tableau de bord</p>
            </div>

            <form id="login-form" class="login-form">
                <div class="form-group">
                    <label for="email">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        Email
                    </label>
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        placeholder="admin@rentcars.com" 
                        required
                        autocomplete="email"
                    >
                </div>

                <div class="form-group">
                    <label for="password">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        Mot de passe
                    </label>
                    <div class="password-input-wrapper">
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            placeholder="••••••••" 
                            required
                            autocomplete="current-password"
                        >
                        <button type="button" class="toggle-password" aria-label="Toggle password visibility">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="form-options">
                    <label class="checkbox-label">
                        <input type="checkbox" id="remember" name="remember">
                        <span>Se souvenir de moi</span>
                    </label>
                    <a href="#" class="forgot-password">Mot de passe oublié?</a>
                </div>

                <button type="submit" class="btn-login">
                    <span class="btn-text">Se connecter</span>
                    <span class="btn-loader" style="display: none;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                        </svg>
                    </span>
                </button>

                <div id="error-message" class="error-message" style="display: none;"></div>
            </form>

            <div class="login-footer">
                <p>Compte par défaut: <code>admin@rentcars.com</code> / <code>admin123</code></p>
            </div>
        </div>
    </div>

    <script>
        const loginForm = document.getElementById('login-form');
        const errorMessage = document.getElementById('error-message');
        const btnLogin = document.querySelector('.btn-login');
        const btnText = document.querySelector('.btn-text');
        const btnLoader = document.querySelector('.btn-loader');
        const togglePassword = document.querySelector('.toggle-password');
        const passwordInput = document.getElementById('password');

        // Toggle password visibility
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.classList.toggle('active');
        });

        // Handle form submission
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Reset error
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';

            // Show loading state
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
            btnLogin.disabled = true;

            const formData = new FormData(loginForm);
            formData.append('action', 'login');

            try {
                const response = await fetch('admin_auth.php', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    // Success - redirect to dashboard
                    btnLogin.classList.add('success');
                    setTimeout(() => {
                        window.location.href = 'admin_dashboard.php';
                    }, 500);
                } else {
                    // Error - show message
                    errorMessage.textContent = data.message || 'Erreur de connexion';
                    errorMessage.style.display = 'block';
                    btnLogin.classList.add('error');
                    setTimeout(() => {
                        btnLogin.classList.remove('error');
                    }, 2000);
                }
            } catch (error) {
                errorMessage.textContent = 'Erreur de connexion au serveur';
                errorMessage.style.display = 'block';
            } finally {
                // Reset loading state
                btnText.style.display = 'inline';
                btnLoader.style.display = 'none';
                btnLogin.disabled = false;
            }
        });

        // Add focus animations
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            input.addEventListener('blur', function() {
                if (!this.value) {
                    this.parentElement.classList.remove('focused');
                }
            });
        });
    </script>
</body>
</html>

