<!-- ============================================
     VEHICLE IMAGE GALLERY - READY TO PASTE
     ============================================
     Insert this code block into your vehicle-details.php
     Replace the existing image section with this gallery
-->

<!-- Image Gallery Section -->
<div class="vehicle-gallery-container">
  <!-- Main Image Display -->
  <div class="gallery-main-wrapper">
    <img 
      id="gallery-main-image" 
      src="uploads/<?php echo htmlspecialchars($car['image_main'] ?? $car['image_url'] ?? ''); ?>" 
      alt="<?php echo htmlspecialchars($car['name'] ?? 'Vehicle'); ?>"
      class="gallery-main-image"
    >
    <div class="gallery-main-overlay">
      <button class="gallery-fullscreen-btn" onclick="openGalleryFullscreen()" aria-label="Voir en plein écran">
        <i class="fas fa-expand"></i>
      </button>
    </div>
  </div>

  <!-- Thumbnails Gallery -->
  <?php if (!empty($car['images']) && is_array($car['images']) && count($car['images']) > 0): ?>
    <div class="gallery-thumbnails">
      <?php 
        // Add main image as first thumbnail if not already in array
        $mainImage = $car['image_main'] ?? $car['image_url'] ?? '';
        $allImages = array_merge([$mainImage], $car['images']);
        $allImages = array_unique($allImages); // Remove duplicates
        $allImages = array_filter($allImages); // Remove empty values
      ?>
      <?php foreach ($allImages as $index => $image): ?>
        <div class="thumbnail-item <?php echo $index === 0 ? 'active' : ''; ?>" 
             data-image-src="uploads/<?php echo htmlspecialchars($image); ?>"
             onclick="switchMainImage('uploads/<?php echo htmlspecialchars($image); ?>', this)">
          <img 
            src="uploads/<?php echo htmlspecialchars($image); ?>" 
            alt="Thumbnail <?php echo $index + 1; ?>"
            class="thumbnail-image"
            loading="lazy"
          >
        </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>

<!-- Fullscreen Modal -->
<div id="gallery-fullscreen-modal" class="gallery-fullscreen-modal" onclick="closeGalleryFullscreen()">
  <button class="gallery-modal-close" onclick="closeGalleryFullscreen()" aria-label="Fermer">&times;</button>
  <img id="gallery-modal-image" src="" alt="Fullscreen view" class="gallery-modal-image">
  <button class="gallery-modal-prev" onclick="navigateGallery(-1)" aria-label="Image précédente">
    <i class="fas fa-chevron-left"></i>
  </button>
  <button class="gallery-modal-next" onclick="navigateGallery(1)" aria-label="Image suivante">
    <i class="fas fa-chevron-right"></i>
  </button>
</div>

<style>
/* ============================================
   VEHICLE GALLERY CSS - GREEN THEME
   ============================================ */

.vehicle-gallery-container {
  width: 100%;
  margin-bottom: 2rem;
}

/* Main Image Wrapper */
.gallery-main-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 16px;
  overflow: hidden;
  background: #f3f4f6;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.gallery-main-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.4s ease-in-out;
  cursor: pointer;
}

.gallery-main-image.fade-out {
  opacity: 0;
}

.gallery-main-image.fade-in {
  opacity: 1;
}

.gallery-main-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.1) 100%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.gallery-main-wrapper:hover .gallery-main-overlay {
  opacity: 1;
}

.gallery-fullscreen-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #2F9E44;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  pointer-events: all;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.gallery-fullscreen-btn:hover {
  background: #2F9E44;
  color: white;
  transform: scale(1.1);
}

/* Thumbnails Gallery */
.gallery-thumbnails {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding: 0.5rem 0;
  scrollbar-width: thin;
  scrollbar-color: #2F9E44 #f3f4f6;
}

.gallery-thumbnails::-webkit-scrollbar {
  height: 6px;
}

.gallery-thumbnails::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.gallery-thumbnails::-webkit-scrollbar-thumb {
  background: #2F9E44;
  border-radius: 3px;
}

.gallery-thumbnails::-webkit-scrollbar-thumb:hover {
  background: #41B883;
}

.thumbnail-item {
  flex-shrink: 0;
  width: 100px;
  height: 75px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  background: #f3f4f6;
}

.thumbnail-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(47, 158, 68, 0.3);
}

.thumbnail-item.active {
  border-color: #2F9E44;
  box-shadow: 0 0 0 2px rgba(47, 158, 68, 0.2);
}

.thumbnail-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #2F9E44;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.thumbnail-item:hover .thumbnail-image {
  transform: scale(1.1);
}

/* Fullscreen Modal */
.gallery-fullscreen-modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.95);
  z-index: 10000;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  animation: fadeInModal 0.3s ease;
}

.gallery-fullscreen-modal.active {
  display: flex;
}

@keyframes fadeInModal {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.gallery-modal-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 8px;
  animation: zoomInModal 0.3s ease;
}

@keyframes zoomInModal {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.gallery-modal-close {
  position: absolute;
  top: 2rem;
  right: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10001;
}

.gallery-modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: rotate(90deg);
}

.gallery-modal-prev,
.gallery-modal-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10001;
}

.gallery-modal-prev {
  left: 2rem;
}

.gallery-modal-next {
  right: 2rem;
}

.gallery-modal-prev:hover,
.gallery-modal-next:hover {
  background: #2F9E44;
  border-color: #2F9E44;
  transform: translateY(-50%) scale(1.1);
}

/* Responsive Design */
@media (max-width: 768px) {
  .gallery-main-wrapper {
    aspect-ratio: 4 / 3;
    border-radius: 12px;
  }

  .thumbnail-item {
    width: 80px;
    height: 60px;
  }

  .gallery-modal-close {
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
  }

  .gallery-modal-prev,
  .gallery-modal-next {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }

  .gallery-modal-prev {
    left: 1rem;
  }

  .gallery-modal-next {
    right: 1rem;
  }
}
</style>

<script>
/* ============================================
   VEHICLE GALLERY JAVASCRIPT
   ============================================ */

let currentGalleryImages = [];
let currentGalleryIndex = 0;

// Initialize gallery on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeGallery();
});

function initializeGallery() {
  // Collect all images from thumbnails
  const thumbnails = document.querySelectorAll('.thumbnail-item');
  currentGalleryImages = Array.from(thumbnails).map(thumb => {
    return thumb.getAttribute('data-image-src');
  });
  
  // Set initial active state
  if (thumbnails.length > 0) {
    currentGalleryIndex = 0;
  }
}

// Switch main image when thumbnail is clicked
function switchMainImage(imageSrc, thumbnailElement) {
  const mainImage = document.getElementById('gallery-main-image');
  if (!mainImage) return;

  // Remove active class from all thumbnails
  document.querySelectorAll('.thumbnail-item').forEach(item => {
    item.classList.remove('active');
  });

  // Add active class to clicked thumbnail
  if (thumbnailElement) {
    thumbnailElement.classList.add('active');
  }

  // Fade out animation
  mainImage.classList.add('fade-out');

  // After fade out, change image and fade in
  setTimeout(() => {
    mainImage.src = imageSrc;
    mainImage.classList.remove('fade-out');
    mainImage.classList.add('fade-in');

    // Update current gallery index
    const thumbnails = Array.from(document.querySelectorAll('.thumbnail-item'));
    currentGalleryIndex = thumbnails.indexOf(thumbnailElement);
  }, 200);
}

// Open fullscreen modal
function openGalleryFullscreen() {
  const modal = document.getElementById('gallery-fullscreen-modal');
  const modalImage = document.getElementById('gallery-modal-image');
  const mainImage = document.getElementById('gallery-main-image');
  
  if (!modal || !modalImage || !mainImage) return;

  modalImage.src = mainImage.src;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Close fullscreen modal
function closeGalleryFullscreen() {
  const modal = document.getElementById('gallery-fullscreen-modal');
  if (!modal) return;

  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Navigate gallery in fullscreen
function navigateGallery(direction) {
  event.stopPropagation(); // Prevent closing modal
  
  if (currentGalleryImages.length === 0) return;

  currentGalleryIndex += direction;

  // Loop around
  if (currentGalleryIndex < 0) {
    currentGalleryIndex = currentGalleryImages.length - 1;
  } else if (currentGalleryIndex >= currentGalleryImages.length) {
    currentGalleryIndex = 0;
  }

  const modalImage = document.getElementById('gallery-modal-image');
  if (modalImage) {
    modalImage.style.opacity = '0';
    setTimeout(() => {
      modalImage.src = currentGalleryImages[currentGalleryIndex];
      modalImage.style.opacity = '1';
    }, 150);
  }

  // Update thumbnail active state
  const thumbnails = document.querySelectorAll('.thumbnail-item');
  thumbnails.forEach((thumb, index) => {
    thumb.classList.toggle('active', index === currentGalleryIndex);
  });
}

// Keyboard navigation in fullscreen
document.addEventListener('keydown', function(e) {
  const modal = document.getElementById('gallery-fullscreen-modal');
  if (!modal || !modal.classList.contains('active')) return;

  if (e.key === 'Escape') {
    closeGalleryFullscreen();
  } else if (e.key === 'ArrowLeft') {
    navigateGallery(-1);
  } else if (e.key === 'ArrowRight') {
    navigateGallery(1);
  }
});

// Prevent modal close when clicking on image
document.addEventListener('click', function(e) {
  const modal = document.getElementById('gallery-fullscreen-modal');
  const modalImage = document.getElementById('gallery-modal-image');
  
  if (modal && modal.classList.contains('active') && e.target === modalImage) {
    e.stopPropagation();
  }
});
</script>

