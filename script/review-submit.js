/**
 * Review Submission Script
 * Handles review form submission and vehicle loading
 */

const API_BASE = 'backend.php';

// Load vehicles for dropdown
async function loadVehicles() {
    try {
        const response = await fetch(`${API_BASE}?action=vehicles`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const select = document.getElementById('vehicle-select');
            if (select) {
                select.innerHTML = '<option value="">Sélectionner un véhicule...</option>' + 
                    data.data.map(v => `<option value="${v.id}">${escapeHtml(v.name)}</option>`).join('');
            }
        }
    } catch (error) {
        console.error('Error loading vehicles:', error);
    }
}

// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
    loadVehicles();
    
    // Hide messages on page load
    const successMsg = document.getElementById('success-message');
    const errorMsg = document.getElementById('error-message');
    if (successMsg) successMsg.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';
    
    const form = document.getElementById('review-form');
    if (form) {
        form.addEventListener('submit', handleReviewSubmit);
    }
});

async function handleReviewSubmit(e) {
    e.preventDefault();
    
    const form = e.target; // Get the form element from the event
    const submitBtn = document.getElementById('submit-btn');
    const successMsg = document.getElementById('success-message');
    const errorMsg = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    // Hide previous messages
    if (successMsg) successMsg.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';
    
    // Get form data
    const formData = new FormData(form);
    const rating = formData.get('rating');
    const comment = formData.get('comment').trim();
    
    if (!rating || !comment) {
        if (errorText) errorText.textContent = 'Veuillez remplir tous les champs obligatoires';
        if (errorMsg) errorMsg.style.display = 'block';
        return;
    }
    
    const data = {
        client_name: formData.get('client_name').trim(),
        client_email: formData.get('client_email')?.trim() || null,
        client_location: formData.get('client_location')?.trim() || null,
        vehicle_id: formData.get('vehicle_id') || null,
        rating: parseInt(rating), // Backend expects 'rating'
        comment: comment,
        service_rating: formData.get('service_rating') ? parseInt(formData.get('service_rating')) : null,
        car_rating: formData.get('car_rating') ? parseInt(formData.get('car_rating')) : null
    };
    
    // Disable submit button
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    }
    
    try {
        const response = await fetch(`${API_BASE}?action=reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        // Check if response is ok
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erreur serveur' }));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Ensure we have a valid result
        if (!result) {
            throw new Error('Réponse invalide du serveur');
        }
        
        if (result.success) {
            // Hide error message first
            if (errorMsg) errorMsg.style.display = 'none';
            // Show success message
            if (successMsg) {
                successMsg.style.display = 'block';
                // Scroll to success message
                setTimeout(() => {
                    successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
                // Auto-hide success message after 5 seconds
                setTimeout(() => {
                    successMsg.style.display = 'none';
                }, 5000);
            }
            
            // Reset form
            form.reset();
            // Reset vehicle dropdown
            const vehicleSelect = document.getElementById('vehicle-select');
            if (vehicleSelect) {
                vehicleSelect.value = '';
            }
            // Reset star ratings
            document.querySelectorAll('input[type="radio"][name="rating"]').forEach(r => r.checked = false);
            document.querySelectorAll('input[type="radio"][name="service_rating"]').forEach(r => r.checked = false);
            document.querySelectorAll('input[type="radio"][name="car_rating"]').forEach(r => r.checked = false);
        } else {
            // Hide success message first
            if (successMsg) successMsg.style.display = 'none';
            // Show error message
            if (errorText) errorText.textContent = result.error || 'Erreur lors de l\'envoi de l\'avis';
            if (errorMsg) {
                errorMsg.style.display = 'block';
                // Scroll to error message
                setTimeout(() => {
                    errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            }
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        // Hide success message first
        if (successMsg) successMsg.style.display = 'none';
        // Show error message
        if (errorText) errorText.textContent = 'Erreur de connexion. Veuillez réessayer.';
        if (errorMsg) {
            errorMsg.style.display = 'block';
            // Scroll to error message
            setTimeout(() => {
                errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer l\'avis';
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

