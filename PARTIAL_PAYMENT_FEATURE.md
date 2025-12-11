# Partial Payment Feature

## Overview
The partial payment feature allows customers to split their payment across two payment methods (Cash and UPI). This is useful when customers want to pay part of the amount in cash and the remaining through digital payment methods. The system automatically calculates the remaining balance when you enter an amount in either field.

## Features

### 1. Split Payment Support
- **Cash**: Accept cash payments
- **UPI**: Accept UPI/digital wallet payments
- **Auto-populate**: When entering an amount in one field, the remaining balance automatically populates in the other field

### 2. Real-time Validation
- Automatically calculates total paid amount
- Shows difference if payment doesn't match invoice total
- Visual feedback (green for valid, red for invalid)
- Prevents saving if amounts don't match

### 3. Invoice Display
- Shows payment breakdown on invoices
- Displays individual payment method amounts
- Clear indication of split payment in invoice list

## How to Use

### Creating a Split Payment Invoice

1. **Add Products to Cart**
   - Search and add products as usual
   - Cart will calculate subtotal, tax, and total

2. **Enable Split Payment**
   - Click the "+ Split Payment" button in the payment section
   - Button will turn blue when active

3. **Enter Payment Amounts**
   - Enter the amount received in Cash - UPI amount auto-populates with remaining balance
   - OR enter the amount received via UPI - Cash amount auto-populates with remaining balance
   - The system will show "Total Paid" and validate against invoice total

4. **Validation**
   - Total Paid must equal Invoice Total
   - If amounts don't match, difference is shown in red
   - Cannot save invoice until amounts match

5. **Generate Invoice**
   - Click "Generate Invoice" button
   - Review the invoice preview showing payment breakdown
   - Click "Save Sale" to complete

### Example Scenario

**Invoice Total: ₹1,500**

Customer wants to pay:
- ₹500 in Cash
- ₹1,000 via UPI

Steps:
1. Click "+ Split Payment"
2. Enter 500 in Cash field
3. UPI field automatically shows 1000 (remaining balance)
4. System shows "Total Paid: ₹1,500" in green
5. Generate and save invoice

## Database Changes

### Migration
A migration script has been added to support existing databases:
```bash
node backend/src/database/migrate-payment-splits.js
```

### New Columns in `invoices` table:
- `cash_amount` (REAL) - Amount paid in cash
- `upi_amount` (REAL) - Amount paid via UPI
- `card_amount` (REAL) - Amount paid via card (deprecated, always 0)

### Payment Method Values:
- `cash` - Full payment in cash
- `upi` - Full payment via UPI
- `split` - Partial payment (combination of cash and UPI)

## API Changes

### Invoice Creation Endpoint
**POST** `/api/invoices`

New fields in request body:
```json
{
  "payment_method": "split",
  "cash_amount": 500,
  "upi_amount": 1000,
  ...other fields
}
```

### Invoice Response
```json
{
  "id": 1,
  "invoice_number": "INV00001",
  "total": 1500,
  "payment_method": "split",
  "cash_amount": 500,
  "upi_amount": 1000,
  ...other fields
}
```

## UI Components

### Billing Component
- Toggle button for split payment
- Three input fields for payment amounts
- Real-time validation display
- Payment summary section

### Invoice Preview
- Shows payment breakdown for split payments
- Displays individual amounts with icons
- Clear labeling of payment methods

### Invoice List
- Payment breakdown in invoice details modal
- Statistics updated to include all payment methods

## Edit Invoice Feature

### Editing Payment Split
- Managers and sales persons can edit existing invoices
- **Invoice total cannot be changed** (read-only field)
- Payment method can be changed between Cash, UPI, or Split Payment
- When editing split payment:
  - Enter amount in Cash field → UPI auto-populates with remaining balance
  - Enter amount in UPI field → Cash auto-populates with remaining balance
  - Total paid must equal invoice total to save changes
  - Save button is disabled if amounts don't match

## Benefits

1. **Flexibility**: Customers can use multiple payment methods
2. **Accuracy**: Auto-populate feature ensures correct amounts
3. **Transparency**: Clear display of payment breakdown
4. **Reporting**: Track revenue by payment method
5. **Customer Satisfaction**: Accommodates customer preferences
6. **Easy Corrections**: Edit payment split without changing invoice total

## Technical Details

### Frontend
- **Component**: `billing.component.ts`
- **Template**: `billing.component.html`
- **Styles**: `billing.component.css`
- **Model**: `invoice.model.ts` (updated)

### Backend
- **Route**: `backend/src/routes/invoices.js`
- **Database**: `backend/src/database/init.js`
- **Migration**: `backend/src/database/migrate-payment-splits.js`

## Future Enhancements

- [x] Auto-populate remaining amount
- [x] Edit payment split in existing invoices
- [ ] Payment method-wise daily reports
- [ ] Payment history tracking
- [ ] Refund support for split payments
