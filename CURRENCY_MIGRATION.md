# Currency Migration: EUR to MAD (Moroccan Dirham)

## ⚠️ Important: Database Migration Required

The application has been updated to use **MAD (Moroccan Dirham)** as the base currency instead of EUR. However, if your database currently contains prices in EUR, you need to migrate them to MAD.

## Migration Steps

### Option 1: Update Existing Prices (Recommended)

If you have existing vehicles with prices in EUR, you need to convert them to MAD:

```sql
-- Convert all existing prices from EUR to MAD
-- Exchange rate: 1 EUR = 10.8 MAD
UPDATE vehicles 
SET price_per_day = price_per_day * 10.8;

-- Convert booking prices
UPDATE bookings 
SET total_price = total_price * 10.8;
```

### Option 2: Start Fresh

If you don't have important data, you can:
1. Delete existing vehicles/bookings
2. Add new vehicles with prices in MAD

## What Has Been Changed

### ✅ Files Updated

1. **Currency Default**: Changed from EUR to MAD
   - `frontend/js/currency.js`
   - `script/currency.js`

2. **Currency Conversion Logic**: Reversed to treat MAD as base currency
   - Prices stored in MAD
   - Converted to EUR if user selects EUR

3. **Admin Dashboard**:
   - Price input label: "Prix par jour (MAD/DH) *"
   - Description: "Les prix sont stockés en MAD"
   - Revenue stats show "DH" instead of "€"

4. **Currency Selector**: MAD appears first in dropdown

## Current Exchange Rate

- **1 EUR = 10.8 MAD**
- Prices are stored in MAD
- If user selects EUR, prices are divided by 10.8

## Testing Checklist

After migration:
- [ ] Verify vehicle prices display correctly in MAD
- [ ] Test currency selector (MAD ↔ EUR)
- [ ] Check admin dashboard revenue stats
- [ ] Verify new vehicle creation with MAD prices
- [ ] Test booking calculations

## Notes

- All new vehicles should be added with prices in MAD
- The conversion happens automatically when users switch currencies
- Database stores prices in MAD (after migration)

---

**Status**: Code updated. Database migration required if you have existing EUR prices.

