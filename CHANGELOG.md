# CuteCart - Changelog

## Recent Updates - December 1, 2025

### Features Added

#### 1. Invoice Edit Functionality
- **Edit Button**: Added edit button next to view button in invoices list
- **Edit Modal**: Users can now edit customer information and payment method
- **Fields Editable**:
  - Customer Name
  - Customer Phone
  - Payment Method (Cash/Card/UPI)
- **Backend Endpoint**: `PUT /api/invoices/:id` for updating invoice details

#### 2. CSV Import/Export Fixes
- **Column Name Fix**: Changed `Cost` to `Purchase Price` to match database schema
- **Improved CSV Parser**: Handles quoted fields with embedded quotes properly
- **Better Error Messages**: Line-by-line error reporting during import
- **Sample CSV Updated**: Includes examples with special characters
- **Auto-ID Generation**: Products without ID get auto-generated sequential IDs

#### 3. Product Management
- **Delete Restriction Removed**: Can now delete any product, even if sold in invoices
- **CSV Format**: Standardized to 8 columns (removed Created At from export)

### Bug Fixes

#### 1. Save Sale Button
- **Issue**: Button stuck on "Saving..." and dialog not closing
- **Root Cause**: CORS configuration and Angular change detection timing
- **Fixes Applied**:
  - Updated CORS to explicitly allow frontend origin
  - Added `setTimeout` wrapper for state changes
  - Added explicit change detection triggers
  - Prevented double-click with `isSaving` flag
  - Added 30-second timeout for requests

#### 2. localStorage Access Errors
- **Issue**: "Access to storage is not allowed" error
- **Fix**: Added safe wrapper methods for all localStorage operations
- **Features**:
  - Availability check on service initialization
  - Try-catch blocks around all storage access
  - Silent failure when storage unavailable
  - Works in incognito/private mode (without persistence)

#### 3. Security & Authentication
- **JWT Middleware**: All API routes protected except `/api/auth`
- **Auth Interceptor**: Automatically includes JWT token in requests
- **Error Handling**: Graceful handling of storage access errors

### Code Quality Improvements

#### Cleanup
- Removed all `console.log` debug statements
- Removed all `console.error` statements
- Replaced with user-friendly error messages where appropriate
- Silent error handling for non-critical failures
- Cleaned up unused imports

#### Error Handling
- User-facing alerts for critical errors
- Silent failures for non-critical operations
- Timeout protection on API calls
- CORS error detection and messaging

### API Endpoints

#### New
- `PUT /api/invoices/:id` - Update invoice customer info and payment method

#### Modified
- `GET /api/products/export/csv` - Updated column headers
- `POST /api/products/import/csv` - Improved parsing and validation
- `DELETE /api/products/:id` - Removed sold product restriction

### Configuration Changes

#### Backend (`server.js`)
```javascript
// CORS Configuration
cors({
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})
```

### Files Modified

#### Frontend
- `src/app/billing/billing.component.ts` - Save sale fixes, timeout, change detection
- `src/app/billing/billing.component.html` - Saving indicator
- `src/app/invoices/invoices.component.ts` - Edit functionality
- `src/app/invoices/invoices.component.html` - Edit button and modal
- `src/app/products/products.component.ts` - CSV sample update, error cleanup
- `src/app/services/api.service.ts` - updateInvoice method, cleanup
- `src/app/services/auth.service.ts` - Safe localStorage wrappers
- `src/app/interceptors/auth.interceptor.ts` - Error handling

#### Backend
- `src/server.js` - CORS configuration
- `src/routes/invoices.js` - Update endpoint
- `src/routes/products.js` - CSV fixes, delete restriction removal

### Testing
- ✅ Invoice save and dialog close
- ✅ Invoice edit functionality
- ✅ CSV import with special characters
- ✅ CSV export with correct columns
- ✅ Product deletion
- ✅ localStorage error handling
- ✅ CORS requests

### Documentation
- Created `TROUBLESHOOTING.md` - Common issues and solutions
- Updated `CSV_IMPORT_EXPORT_GUIDE.md` - Correct format and examples
- Created `test_products.csv` - Sample test file

### Known Limitations
- Invoice items cannot be edited (only customer info and payment method)
- Deleted products remain in historical invoices (by design)
- localStorage unavailable in some contexts (gracefully handled)

---

**Version**: 1.1.0  
**Last Updated**: December 1, 2025  
**Status**: ✅ Production Ready
