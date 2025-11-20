// Update hero price when currency changes
if (document.getElementById('hero-price')) {
    const heroPriceEl = document.getElementById('hero-price');
    const updateHeroPrice = () => {
        if (typeof formatPriceWithCurrency === 'function') {
            heroPriceEl.textContent = formatPriceWithCurrency(799) + ' / week-end';
        }
    };
    
    // Update on currency change
    window.addEventListener('currencyChanged', updateHeroPrice);
    
    // Update on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateHeroPrice);
    } else {
        updateHeroPrice();
    }
}

