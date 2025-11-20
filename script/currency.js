/**
 * Currency Management System
 * Supports DH (Moroccan Dirham) and EUR (Euro)
 */

// Currency configuration
const CURRENCIES = {
    'EUR': {
        symbol: '€',
        name: 'Euro',
        locale: 'fr-FR',
        exchangeRate: 1.0 // Base currency
    },
    'MAD': {
        symbol: 'DH',
        name: 'Dirham Marocain',
        locale: 'fr-FR',
        exchangeRate: 10.8 // 1 EUR = 10.8 MAD (approximate)
    }
};

// Get currency from localStorage or default to EUR
function getCurrency() {
    return localStorage.getItem('currency') || 'EUR';
}

// Set currency preference
function setCurrency(currency) {
    if (CURRENCIES[currency]) {
        localStorage.setItem('currency', currency);
        // Trigger currency change event
        window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency } }));
        return true;
    }
    return false;
}

// Get current currency object
function getCurrentCurrency() {
    return CURRENCIES[getCurrency()];
}

// Format price with current currency
function formatPrice(price, currency = null) {
    if (price === null || price === undefined || isNaN(price)) {
        return '0,00';
    }

    const targetCurrency = currency || getCurrency();
    const curr = CURRENCIES[targetCurrency];
    const numPrice = parseFloat(price);
    
    // Convert if needed (prices are stored in EUR, convert to target currency)
    const convertedPrice = convertPrice(numPrice, targetCurrency);
    
    // Format number with locale
    const formatted = new Intl.NumberFormat(curr.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(convertedPrice);
    
    return formatted;
}

// Convert price between currencies
// Note: Prices in database are stored in EUR
function convertPrice(price, targetCurrency) {
    // Prices are always stored in EUR in the database
    if (targetCurrency === 'MAD') {
        return price * CURRENCIES.MAD.exchangeRate;
    }
    // If EUR, return as is
    return price;
}

// Format price with currency symbol
function formatPriceWithCurrency(price, currency = null) {
    const curr = currency ? CURRENCIES[currency] : getCurrentCurrency();
    const formatted = formatPrice(price, currency);
    return `${formatted} ${curr.symbol}`;
}

// Parse price from formatted string (handles both formats)
function parsePrice(priceString) {
    if (!priceString) return 0;
    
    // Remove currency symbols and spaces
    const cleaned = priceString
        .replace(/[€DH]/g, '')
        .replace(/\s/g, '')
        .replace(/,/g, '.');
    
    return parseFloat(cleaned) || 0;
}

// Initialize currency selector if element exists
function initCurrencySelector() {
    const selector = document.getElementById('currency-selector');
    if (!selector) return;
    
    // Set current currency
    selector.value = getCurrency();
    
    // Add change listener
    selector.addEventListener('change', (e) => {
        const newCurrency = e.target.value;
        if (setCurrency(newCurrency)) {
            // Reload page or update prices dynamically
            location.reload();
        }
    });
}

// Update all prices on page when currency changes
function updateAllPrices() {
    // This will be called when currency changes
    // Individual pages should implement their own update logic
    window.dispatchEvent(new CustomEvent('updatePrices'));
}

// Make functions globally available
window.getCurrency = getCurrency;
window.setCurrency = setCurrency;
window.getCurrentCurrency = getCurrentCurrency;
window.formatPrice = formatPrice;
window.formatPriceWithCurrency = formatPriceWithCurrency;
window.parsePrice = parsePrice;
window.CURRENCIES = CURRENCIES;

