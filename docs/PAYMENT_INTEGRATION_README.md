# Payment Integration System

This document outlines the comprehensive payment system integration that has been implemented to properly handle full payments and installment-based payments for housing society bookings.

## Overview

The payment system has been redesigned to support:

1. **Full Payment System** - Allow bookings with any amount paid upfront (including zero)
2. **Configurable Payment Plans** - Admin-managed payment plans for different plot sizes
3. **Manual Payment Addition** - Add payments manually with proof uploads
4. **Payment Tracking** - Complete payment history and pending amount tracking
5. **Payment Proof Management** - Upload and manage payment screenshots/documents

## Database Schema Changes

### New Entities

#### 1. PaymentPlan Entity
```typescript
- id: string (UUID)
- name: string
- description: string
- plotSizeMarla: number
- plotPrice: number
- downPaymentAmount?: number
- downPaymentPercentage?: number
- monthlyPayment: number
- quarterlyPayment?: number
- biYearlyPayment?: number
- tenureMonths: number (default: 24)
- status: 'active' | 'inactive'
- notes?: string
```

#### 2. PaymentProof Entity
```typescript
- id: string (UUID)
- paymentId: string
- fileName: string
- filePath: string
- fileSize: number
- mimeType: string
- proofType: 'screenshot' | 'bank_slip' | 'receipt' | 'cheque' | 'other'
- description?: string
- uploadedBy: string
```

### Updated Entities

#### 1. Booking Entity
Added fields:
- `paidAmount: number` - Total amount actually paid
- `pendingAmount: number` - Remaining amount to be paid

#### 2. PaymentSchedule Entity
Added field:
- `paymentPlanId?: string` - Reference to payment plan used

#### 3. Payment Entity
Added relationship:
- `paymentProofs: PaymentProof[]` - Associated proof documents

#### 4. User Entity
Added relationship:
- `uploadedPaymentProofs: PaymentProof[]` - Proofs uploaded by user

## API Endpoints

### Payment Plans Management

#### Admin Endpoints
- `GET /api/v1/payment-plans` - Get all payment plans
- `GET /api/v1/payment-plans/active` - Get active payment plans
- `GET /api/v1/payment-plans/by-plot-size?plotSizeMarla=X` - Get plans by plot size
- `POST /api/v1/payment-plans` - Create new payment plan
- `GET /api/v1/payment-plans/:id` - Get specific payment plan
- `PATCH /api/v1/payment-plans/:id` - Update payment plan
- `DELETE /api/v1/payment-plans/:id` - Delete payment plan
- `POST /api/v1/payment-plans/:id/validate` - Validate payment plan calculations

### Booking Payment Management

#### Payment Operations
- `POST /api/v1/bookings/:bookingId/payments` - Add manual payment
- `GET /api/v1/bookings/:bookingId/payments` - Get all payments for booking
- `GET /api/v1/bookings/:bookingId/payments/summary` - Get payment summary

#### Payment Proof Management
- `POST /api/v1/bookings/:bookingId/payments/:paymentId/proof` - Upload payment proof
- `DELETE /api/v1/bookings/:bookingId/payments/proof/:proofId` - Delete payment proof

## Frontend Features

### 1. Enhanced Booking Form

#### New Features:
- **Payment Plan Selection**: Auto-suggest compatible plans based on plot size
- **Initial Payment Field**: Allow any amount from 0 to total amount
- **Zero Down Payment Support**: Remove mandatory down payment requirement
- **Real-time Calculation**: Show pending amount as user types

#### Payment Plan Integration:
- Automatically populate payment terms when plan is selected
- Show plan details (monthly, quarterly, bi-yearly payments)
- Support custom plans alongside predefined ones

### 2. Booking Details Page Enhancement

#### Payment Management Section:
- **Payment Summary**: Visual cards showing total, paid, pending amounts
- **Payment History**: Complete list of all payments made
- **Add Payment Button**: Quick access to manual payment addition
- **Payment Proof Upload**: Direct upload for each payment
- **Payment Status Tracking**: Visual indicators for payment status

#### Features:
- Real-time payment calculations
- Payment proof gallery
- Payment method tracking
- Processed by user information

### 3. Admin Payment Plans Interface

#### Management Features:
- **Create/Edit Plans**: Full CRUD operations for payment plans
- **Plan Validation**: Automatic validation of payment calculations
- **Status Management**: Active/inactive plan status
- **Search & Filter**: Find plans by size, status, or name
- **Plan Details**: Complete breakdown of payment structure

#### Plan Configuration:
- Plot size and price mapping
- Flexible down payment (amount or percentage)
- Monthly payment amounts
- Optional quarterly and bi-yearly payments
- Configurable tenure (1-120 months)

## Payment Types

### 1. Full Payment
- Customer pays any amount upfront (can be 0)
- No installments created
- Remaining amount tracked as pending
- Manual payments can be added anytime
- Payment proofs can be uploaded for each transaction

### 2. Installment Payment
- Uses configurable payment plans
- Supports monthly, quarterly, and bi-yearly payments
- Flexible down payment requirements
- Automatic installment schedule generation
- Manual payment addition with installment mapping

## Payment Plan Examples

### Example 1: 5 Marla Plot Plan
```json
{
  "name": "5 Marla Standard Plan",
  "plotSizeMarla": 5.0,
  "plotPrice": 2500000,
  "downPaymentPercentage": 20,
  "monthlyPayment": 85000,
  "quarterlyPayment": 50000,
  "tenureMonths": 24
}
```

### Example 2: 10 Marla Premium Plan
```json
{
  "name": "10 Marla Premium Plan",
  "plotSizeMarla": 10.0,
  "plotPrice": 5000000,
  "downPaymentAmount": 1000000,
  "monthlyPayment": 170000,
  "biYearlyPayment": 200000,
  "tenureMonths": 24
}
```

## Business Logic

### Payment Calculation
1. **Down Payment**: Can be fixed amount or percentage of plot price
2. **Remaining Amount**: Plot price minus any down payment
3. **Monthly Installments**: Fixed monthly amount as per plan
4. **Additional Payments**: Quarterly/bi-yearly payments are optional extras
5. **Total Validation**: System ensures all payments cover the plot price

### Payment Processing
1. **Manual Addition**: Staff can add payments with any amount
2. **Proof Upload**: Each payment can have multiple proof documents
3. **Status Tracking**: Payments have status (pending, completed, failed)
4. **Amount Validation**: Cannot exceed remaining pending amount
5. **Real-time Updates**: Booking amounts update immediately

### Payment Plan Validation
- Ensures monthly payments × tenure ≥ remaining amount after down payment
- Validates additional quarterly/bi-yearly payments fit within tenure
- Prevents overlapping payment schedules
- Checks plot size compatibility

## File Upload System

### Payment Proof Upload
- **Supported Formats**: Images (JPG, PNG, GIF) and PDFs
- **File Size Limit**: 10MB per file
- **Storage Location**: `/uploads/payment-proofs/`
- **File Naming**: Timestamp + random suffix + original extension
- **Security**: File type validation and virus scanning recommended

### Proof Types
- `screenshot` - Mobile app/web screenshots
- `bank_slip` - Bank transaction slips
- `receipt` - Official receipts
- `cheque` - Cheque images
- `other` - Other proof types

## Security Considerations

### Access Control
- Payment addition requires `manage_payments` permission
- Payment plan management requires `manage_payment_plans` permission
- File uploads are restricted to authenticated users
- Payment proofs are linked to the uploader

### Data Validation
- All monetary amounts are validated for positive values
- File uploads are validated for type and size
- Payment amounts cannot exceed pending amounts
- Payment plan calculations are server-side validated

## Migration Guide

### Database Migration
Run the provided migration file:
```bash
npm run migration:run
```

### Existing Data
- Existing bookings will have `paidAmount = 0` and `pendingAmount = totalAmount`
- Payment schedules will work without payment plans (backward compatible)
- No data loss during migration

## Usage Examples

### Creating a Payment Plan
```typescript
const paymentPlan = await paymentPlanService.create({
  name: "5 Marla Economy Plan",
  description: "Affordable payment plan for 5 marla plots",
  plotSizeMarla: 5.0,
  plotPrice: 2000000,
  downPaymentPercentage: 15,
  monthlyPayment: 75000,
  tenureMonths: 24
});
```

### Adding a Manual Payment
```typescript
const payment = await bookingPaymentService.addManualPayment({
  bookingId: "booking-uuid",
  amount: 100000,
  paymentMethod: "bank_transfer",
  referenceNumber: "TXN123456",
  notes: "Initial payment received"
});
```

### Uploading Payment Proof
```typescript
const proof = await bookingPaymentService.uploadPaymentProof({
  paymentId: "payment-uuid",
  fileName: "bank_receipt.jpg",
  filePath: "/uploads/payment-proofs/receipt-123.jpg",
  fileSize: 245760,
  mimeType: "image/jpeg",
  proofType: "bank_slip",
  description: "Bank transfer receipt"
});
```

## Testing

### Unit Tests
- Payment calculation logic
- Payment plan validation
- File upload validation
- Amount validation

### Integration Tests
- Payment addition workflow
- Payment proof upload
- Payment plan CRUD operations
- Booking payment integration

### User Acceptance Tests
- Zero payment booking creation
- Manual payment addition
- Payment proof upload
- Payment plan management

## Future Enhancements

### Planned Features
1. **Automated Payment Reminders** - SMS/Email notifications for due payments
2. **Payment Gateway Integration** - Online payment processing
3. **Bulk Payment Processing** - Import payments from bank files
4. **Payment Analytics** - Detailed payment reporting and analytics
5. **Mobile App Integration** - Mobile payment management
6. **Payment Scheduling** - Automated recurring payment setup

### Technical Improvements
1. **Payment Webhooks** - Real-time payment status updates
2. **Payment Reconciliation** - Automatic bank statement matching
3. **Advanced Reporting** - Custom payment reports
4. **Payment Audit Trail** - Complete payment history tracking
5. **Multi-currency Support** - Support for different currencies

## Support

For technical support or questions about the payment integration system, please contact the development team or refer to the main project documentation.

## Changelog

### Version 1.0.0 (Current)
- Initial payment integration implementation
- Payment plans management
- Manual payment addition
- Payment proof upload system
- Enhanced booking form
- Admin payment plans interface
- Database schema updates
- API endpoints implementation
