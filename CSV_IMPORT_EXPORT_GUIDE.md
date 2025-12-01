# CSV Import/Export Feature Guide

## Overview
The CuteCart POS system now supports bulk product management through CSV file import and export functionality.

## Features

### 📤 Export Products to CSV
- Exports all products to a CSV file
- Includes all product fields: ID, Name, Description, Price, Purchase Price, Stock, Category, Barcode
- File is automatically downloaded with timestamp: `products_YYYY-MM-DD.csv`

### 📥 Import Products from CSV
- Import products from a CSV file
- Supports both creating new products and updating existing ones
- Matching logic:
  - First checks by barcode (if provided)
  - Then checks by product name
  - If match found, updates the existing product
  - If no match, creates a new product
- Provides detailed import results with error reporting

### 📄 Sample CSV Template
- Download a pre-formatted sample CSV file
- Shows the correct format and required fields
- Includes example products for reference

## CSV File Format

### Required Columns
1. **ID** - Product ID (leave empty for auto-generation)
2. **Name** - Product name (required)
3. **Description** - Product description
4. **Price** - Selling price (required)
5. **Purchase Price** - Purchase/cost price
6. **Stock** - Current stock quantity
7. **Category** - Product category
8. **Barcode** - Product barcode

### Example CSV Format
```csv
ID,Name,Description,Price,Purchase Price,Stock,Category,Barcode
101,Laptop,15-inch laptop,999.99,500.00,25,Electronics,1234567890
102,Mouse,Wireless mouse,29.99,15.00,100,Accessories,0987654321
103,Keyboard,Mechanical keyboard,79.99,40.00,50,Accessories,1122334455
,"Product with ""Quotes""",Description with special chars,199.99,100.00,30,Home & Garden,1122334466
```

## How to Use

### Exporting Products
1. Navigate to the **Products** page
2. Click the **📤 Export CSV** button
3. The CSV file will be automatically downloaded
4. Open with Excel, Google Sheets, or any text editor

### Importing Products
1. Prepare your CSV file (or use the sample template)
2. Navigate to the **Products** page
3. Click the **📥 Import CSV** button
4. Select your CSV file
5. Confirm the import action
6. Review the import results

### Using the Sample Template
1. Click the **📄 Sample CSV** button
2. The sample file will be downloaded
3. Edit the file with your product data
4. Use it to import your products

## Import Rules

### Update vs Create
- **Update**: Products are matched by ID first, then barcode, then name. Matching products are updated.
- **Create**: If no matching product is found, a new product is created with auto-generated ID (if ID column is empty)

### Validation
- **Name** and **Price** are required fields
- Price and Purchase Price must be valid numbers
- Stock must be a valid integer
- Empty or invalid rows are skipped with error messages
- Quoted fields with embedded quotes are properly handled

### Error Handling
- Invalid rows are skipped and reported
- Import continues even if some rows fail
- Detailed error messages show which lines failed and why
- Maximum 5 errors shown in alert, full list in console

## Tips and Best Practices

### ✅ Do's
- Always download the sample CSV first to see the correct format
- Keep a backup of your CSV file before importing
- Review the import results carefully
- Use unique barcodes for better product matching
- Test with a small CSV file first

### ❌ Don'ts
- Don't use special characters in product names (quotes are handled automatically)
- Don't leave Name or Price fields empty
- Don't use non-numeric values for Price, Cost, or Stock
- Don't import very large files (>1000 products) at once

## Technical Details

### Backend Endpoints
- **GET** `/api/products/export/csv` - Export all products
- **POST** `/api/products/import/csv` - Import products from CSV data

### CSV Parsing
- Handles quoted fields with commas
- Trims whitespace from values
- Validates required fields
- Provides line-by-line error reporting

### Response Format (Import)
```json
{
  "success": true,
  "imported": 45,
  "total": 50,
  "errors": [
    "Line 3: Name and price are required",
    "Line 7: Invalid format"
  ]
}
```

## Troubleshooting

### Import Not Working
- Check CSV file format matches the sample
- Ensure Name and Price columns are filled
- Verify no special characters in the CSV
- Check browser console for detailed errors

### Export Not Downloading
- Check browser's download settings
- Ensure pop-ups are not blocked
- Try a different browser
- Check backend server is running

### Products Not Updating
- Verify barcode or name matches exactly
- Check for extra spaces in product names
- Ensure CSV encoding is UTF-8
- Review import results for errors

## Security Notes
- Only Manager and Admin roles can access Products page
- CSV import validates all data before saving
- Existing products are protected from accidental deletion
- All operations are logged in the backend

## Future Enhancements
- Support for product images in CSV
- Bulk delete via CSV
- Import history and rollback
- Excel file support (.xlsx)
- Scheduled imports

---

**Last Updated**: December 1, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
