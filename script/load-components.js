/**
 * Component Loader
 * Loads header and footer components into pages
 */

// Get base path for components (works with XAMPP)
function getBasePath() {
  const path = window.location.pathname;
  const pathParts = path.split('/');
  // Remove filename and get directory
  pathParts.pop();
  return pathParts.join('/') || '';
}

// Fix image paths in loaded HTML based on current page location
function fixImagePaths(html, basePath) {
  // Get current page path and URL
  const currentPath = window.location.pathname;
  const currentUrl = window.location.href;
  const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
  
  // Find the project root (rental_car folder)
  let projectRoot = '';
  if (currentPath.includes('/rental_car/')) {
    projectRoot = '/rental_car';
  } else if (currentPath.startsWith('/rental_car')) {
    projectRoot = '/rental_car';
  }
  
  // Calculate relative path based on current page location
  const pathParts = currentPath.split('/').filter(p => p && p !== 'rental_car');
  const depth = pathParts.length > 1 ? pathParts.length - 1 : 0;
  
  // Try absolute path first, then relative as fallback
  let logoPath = projectRoot ? `${projectRoot}/logo/logo1.png` : '/logo/logo1.png';
  
  // If we're in a subdirectory, use relative path
  if (depth > 0 && !projectRoot) {
    logoPath = '../'.repeat(depth) + 'logo/logo1.png';
  } else if (depth > 0 && projectRoot) {
    // Still use absolute path for XAMPP
    logoPath = `${projectRoot}/logo/logo1.png`;
  }
  
  // Replace all logo path variations with the correct path
  const patterns = [
    /src=["']logo\/logo1\.png["']/gi,
    /src=["']\.\.\/\.\.\/logo\/logo1\.png["']/gi,
    /src=["']\.\.\/logo\/logo1\.png["']/gi,
    /src=["']\/logo\/logo1\.png["']/gi,
    /src=["']logo\/@logo1\.png["']/gi
  ];
  
  patterns.forEach(pattern => {
    html = html.replace(pattern, `src="${logoPath}"`);
  });
  
  // Debug: log the path being used
  console.log('Logo path set to:', logoPath, 'for page:', currentPath, 'depth:', depth);
  
  return html;
}

// Load header component
async function loadHeader() {
  try {
    const basePath = getBasePath();
    const headerPath = basePath ? `${basePath}/components/header/header.html` : 'components/header/header.html';
    const response = await fetch(headerPath);
    if (!response.ok) throw new Error('Failed to load header');
    
    const html = await response.text();
    const headerPlaceholder = document.getElementById('header-placeholder');
    
    if (headerPlaceholder) {
      // Fix logo paths before inserting HTML
      html = fixImagePaths(html, basePath);
      headerPlaceholder.innerHTML = html;
      
      // Verify logo image loads, if not try alternative paths
      const logoImg = headerPlaceholder.querySelector('.header-logo img');
      if (logoImg) {
        logoImg.onerror = function() {
          console.warn('Logo failed to load, trying alternative paths...');
          // Try relative path
          const currentPath = window.location.pathname;
          const pathParts = currentPath.split('/').filter(p => p);
          const depth = pathParts.length > 1 ? pathParts.length - 1 : 0;
          const altPath = depth === 0 ? 'logo/logo1.png' : '../'.repeat(depth) + 'logo/logo1.png';
          this.src = altPath;
        };
      }
      
      // Load header CSS
      const cssPath = basePath ? `${basePath}/components/header/header.css` : 'components/header/header.css';
      loadCSS(cssPath);
      
      // Initialize mobile menu
      initMobileMenu();
      
      // Initialize currency selector
      if (typeof initCurrencySelector === 'function') {
        initCurrencySelector();
      }
    }
  } catch (error) {
    console.error('Error loading header:', error);
  }
}

// Load footer component
async function loadFooter() {
  try {
    const basePath = getBasePath();
    const footerPath = basePath ? `${basePath}/components/footer/footer.html` : 'components/footer/footer.html';
    const response = await fetch(footerPath);
    if (!response.ok) throw new Error('Failed to load footer');
    
    const html = await response.text();
    const footerPlaceholder = document.getElementById('footer-placeholder');
    
    if (footerPlaceholder) {
      // Fix logo paths before inserting HTML
      html = fixImagePaths(html, basePath);
      footerPlaceholder.innerHTML = html;
      
      // Verify logo image loads, if not try alternative paths
      const logoImg = footerPlaceholder.querySelector('.footer-logo img');
      if (logoImg) {
        logoImg.onerror = function() {
          console.warn('Footer logo failed to load, trying alternative paths...');
          // Try relative path
          const currentPath = window.location.pathname;
          const pathParts = currentPath.split('/').filter(p => p);
          const depth = pathParts.length > 1 ? pathParts.length - 1 : 0;
          const altPath = depth === 0 ? 'logo/logo1.png' : '../'.repeat(depth) + 'logo/logo1.png';
          this.src = altPath;
        };
      }
      
      // Load footer CSS
      const cssPath = basePath ? `${basePath}/components/footer/footer.css` : 'components/footer/footer.css';
      loadCSS(cssPath);
      
      // Set current year
      const yearElement = document.getElementById('current-year');
      if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
      }
      
      // Load contacts dynamically
      loadFooterContacts();
    }
  } catch (error) {
    console.error('Error loading footer:', error);
  }
}

// Load CSS dynamically
function loadCSS(href) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  
  // Check if already loaded
  const existingLink = document.querySelector(`link[href="${href}"]`);
  if (!existingLink) {
    document.head.appendChild(link);
  }
}

// Initialize mobile menu toggle
function initMobileMenu() {
  const toggle = document.getElementById('mobile-menu-toggle');
  const nav = document.getElementById('main-nav');
  
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      nav.classList.toggle('active');
    });
    
    // Close menu when clicking on a link
    const navLinks = nav.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        nav.classList.remove('active');
      });
    });
  }
}

// Load contacts from API and populate footer
async function loadFooterContacts() {
  try {
    const response = await fetch('backend.php?action=contacts');
    const data = await response.json();
    
    if (data.success && data.data) {
      const contacts = data.data.filter(c => c.is_active);
      const contactList = document.getElementById('footer-contact');
      const socialMedia = document.getElementById('social-media');
      
      if (contactList) {
        contactList.innerHTML = contacts
          .filter(c => ['phone', 'email', 'address'].includes(c.contact_type))
          .map(contact => {
            const icon = contact.icon || getDefaultIcon(contact.contact_type);
            const value = contact.contact_type === 'phone' 
              ? `<a href="tel:${contact.value}">${contact.value}</a>`
              : contact.contact_type === 'email'
              ? `<a href="mailto:${contact.value}">${contact.value}</a>`
              : contact.value;
            
            return `<li><i class="${icon}"></i> ${value}</li>`;
          })
          .join('');
      }
      
      if (socialMedia) {
        const socialContacts = contacts.filter(c => 
          ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'whatsapp'].includes(c.contact_type)
        );
        
        if (socialContacts.length > 0) {
          socialMedia.innerHTML = socialContacts.map(contact => {
            const icon = contact.icon || getDefaultIcon(contact.contact_type);
            return `<a href="${contact.value}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="${contact.label}">
              <i class="${icon}"></i>
            </a>`;
          }).join('');
        } else {
          socialMedia.innerHTML = '<p style="color: #9ca3af; font-size: 0.875rem;">Aucun réseau social configuré</p>';
        }
      }
    }
  } catch (error) {
    console.error('Error loading contacts:', error);
    const contactList = document.getElementById('footer-contact');
    const socialMedia = document.getElementById('social-media');
    if (contactList) contactList.innerHTML = '<li>Erreur de chargement</li>';
    if (socialMedia) socialMedia.innerHTML = '<p style="color: #9ca3af;">Erreur de chargement</p>';
  }
}

function getDefaultIcon(type) {
  const icons = {
    'phone': 'fas fa-phone',
    'email': 'fas fa-envelope',
    'whatsapp': 'fab fa-whatsapp',
    'facebook': 'fab fa-facebook',
    'instagram': 'fab fa-instagram',
    'twitter': 'fab fa-twitter',
    'linkedin': 'fab fa-linkedin',
    'youtube': 'fab fa-youtube',
    'address': 'fas fa-map-marker-alt'
  };
  return icons[type] || 'fas fa-link';
}

// Load all components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  loadHeader();
  loadFooter();
});

