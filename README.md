# PlotVault Backend

A robust, scalable backend API for PlotVault - a comprehensive real estate management platform built with NestJS, TypeScript, and PostgreSQL.

## 🚀 Features

### Core API Modules
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Complete user lifecycle management
- **Plot Management**: Plot CRUD operations with advanced filtering
- **Customer Management**: Comprehensive CRM functionality
- **Booking System**: Advanced booking and payment management
- **Financial Management**: Accounting, payments, and financial reporting
- **Document Management**: Secure file upload and management
- **Communication**: Messaging and notification system
- **Marketing**: Lead generation and marketing automation
- **Construction**: Project tracking and milestone management
- **Analytics**: Business intelligence and reporting
- **Audit Logging**: Comprehensive activity tracking

### Technical Features
- **RESTful API**: Well-structured REST endpoints
- **Type Safety**: Full TypeScript implementation
- **Database ORM**: TypeORM with PostgreSQL
- **Validation**: Request validation with class-validator
- **Documentation**: Auto-generated Swagger/OpenAPI docs
- **Security**: JWT authentication, CORS, rate limiting
- **File Upload**: Multipart file handling
- **Email Service**: SMTP email integration
- **Background Jobs**: Queue-based job processing
- **Health Checks**: Application health monitoring
- **Logging**: Structured logging with Winston
- **Testing**: Comprehensive test suite

## 🛠️ Tech Stack

- **Framework**: NestJS 10
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI
- **File Upload**: Multer
- **Email**: Nodemailer
- **Logging**: Winston
- **Testing**: Jest
- **Deployment**: Railway/Docker

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn
- Git

### Setup
1. Clone the repository:
```bash
git clone https://github.com/Fahad602/plotvault-backend.git
cd plotvault-backend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up PostgreSQL database:
```sql
CREATE DATABASE plotvault;
CREATE USER plotvault_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE plotvault TO plotvault_user;
```

4. Create environment file:
```bash
cp .env.example .env
```

5. Configure environment variables:
```env
# Database
DATABASE_URL=postgresql://plotvault_user:your_password@localhost:5432/plotvault

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Application
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

6. Run database migrations:
```bash
npm run migration:run
```

7. Seed the database (optional):
```bash
npm run seed
```

8. Start the development server:
```bash
npm run start:dev
```

9. API will be available at [http://localhost:3001](http://localhost:3001)
10. API documentation at [http://localhost:3001/api](http://localhost:3001/api)

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── analytics/          # Analytics module
│   ├── auth/               # Authentication module
│   ├── audit/              # Audit logging module
│   ├── bookings/           # Booking management module
│   ├── common/             # Common entities and utilities
│   ├── communication/     # Communication module
│   ├── construction/       # Construction management module
│   ├── crm/               # CRM module
│   ├── customers/          # Customer management module
│   ├── dashboard/          # Dashboard module
│   ├── database/           # Database configuration and migrations
│   ├── documents/          # Document management module
│   ├── finance/            # Financial management module
│   ├── health/             # Health check module
│   ├── leads/              # Lead management module
│   ├── marketing/          # Marketing module
│   ├── plots/              # Plot management module
│   ├── users/              # User management module
│   ├── app.module.ts       # Root application module
│   └── main.ts             # Application entry point
├── uploads/                # File upload directory
├── dist/                   # Compiled JavaScript output
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── nest-cli.json           # NestJS CLI configuration
└── Dockerfile              # Docker configuration
```

## 🔧 Development

### Available Scripts
```bash
npm run start              # Start production server
npm run start:dev          # Start development server with watch
npm run start:debug        # Start debug server
npm run build              # Build for production
npm run lint               # Run ESLint
npm run test               # Run unit tests
npm run test:e2e           # Run E2E tests
npm run test:cov           # Run tests with coverage
npm run migration:generate # Generate new migration
npm run migration:run      # Run pending migrations
npm run migration:revert    # Revert last migration
npm run seed               # Seed database with sample data
```

### Database Management
```bash
# Generate migration
npm run migration:generate -- src/migrations/AddNewTable

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert

# Seed database
npm run seed
```

### Code Quality
- **ESLint**: Code linting with NestJS rules
- **TypeScript**: Type checking and safety
- **Prettier**: Code formatting (configured)
- **Husky**: Git hooks for quality checks

## 📚 API Documentation

### Base URL
```
Development: http://localhost:3001/api/v1
Production: https://your-domain.com/api/v1
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### API Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - User logout

#### Users
- `GET /users` - Get all users (Admin only)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (Admin only)

#### Plots
- `GET /plots` - Get all plots with filtering
- `GET /plots/:id` - Get plot by ID
- `POST /plots` - Create new plot (Admin only)
- `PUT /plots/:id` - Update plot (Admin only)
- `DELETE /plots/:id` - Delete plot (Admin only)

#### Customers
- `GET /customers` - Get all customers
- `GET /customers/:id` - Get customer by ID
- `POST /customers` - Create new customer
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer

#### Bookings
- `GET /bookings` - Get all bookings
- `GET /bookings/:id` - Get booking by ID
- `POST /bookings` - Create new booking
- `PUT /bookings/:id` - Update booking
- `DELETE /bookings/:id` - Cancel booking

#### Finance
- `GET /finance/payments` - Get payment records
- `GET /finance/transactions` - Get transaction history
- `POST /finance/payments` - Record payment
- `GET /finance/reports` - Generate financial reports

### Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": []
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔐 Security

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Role-Based Access**: Admin, Manager, Sales, Accountant roles
- **Password Hashing**: bcrypt with salt rounds
- **Token Expiration**: Configurable token lifetime
- **Refresh Tokens**: Secure token refresh mechanism

### Data Protection
- **Input Validation**: Comprehensive request validation
- **SQL Injection**: TypeORM query builder protection
- **XSS Protection**: Input sanitization
- **CORS**: Configurable cross-origin policies
- **Rate Limiting**: Request rate limiting
- **Helmet**: Security headers

### File Upload Security
- **File Type Validation**: Allowed file types
- **Size Limits**: Maximum file size restrictions
- **Virus Scanning**: File content validation
- **Secure Storage**: Encrypted file storage

## 🗄️ Database Schema

### Core Entities
- **Users**: User accounts and authentication
- **Plots**: Plot information and status
- **Customers**: Customer profiles and data
- **Bookings**: Booking records and payments
- **Payments**: Payment transactions
- **Documents**: File uploads and metadata
- **AuditLogs**: Activity tracking
- **Activities**: User activity logs

### Relationships
- Users → Bookings (One-to-Many)
- Customers → Bookings (One-to-Many)
- Plots → Bookings (One-to-Many)
- Bookings → Payments (One-to-Many)
- Users → AuditLogs (One-to-Many)

## 🧪 Testing

### Testing Strategy
- **Unit Tests**: Service and controller testing
- **Integration Tests**: Database integration testing
- **E2E Tests**: Full API endpoint testing
- **Load Tests**: Performance and scalability testing

### Running Tests
```bash
npm run test              # Run unit tests
npm run test:e2e          # Run E2E tests
npm run test:cov          # Run tests with coverage
npm run test:watch        # Run tests in watch mode
```

### Test Coverage
- **Services**: 90%+ coverage
- **Controllers**: 85%+ coverage
- **Guards**: 95%+ coverage
- **Overall**: 85%+ coverage

## 🚀 Deployment

### Railway (Recommended)
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Docker
```bash
# Build image
docker build -t plotvault-backend .

# Run container
docker run -p 3001:3001 plotvault-backend
```

### Manual Deployment
```bash
npm run build
npm run start:prod
```

### Environment Variables
```env
# Production
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-production-secret
FRONTEND_URL=https://your-frontend-domain.com
```

## 📊 Monitoring & Logging

### Health Checks
- **Application Health**: `/health` endpoint
- **Database Health**: Connection status
- **Memory Usage**: RAM and CPU monitoring
- **Response Time**: API performance metrics

### Logging
- **Structured Logging**: JSON format logs
- **Log Levels**: Error, Warn, Info, Debug
- **Log Rotation**: Automatic log file rotation
- **Centralized Logging**: External log aggregation

### Metrics
- **Request Count**: API endpoint usage
- **Response Time**: Performance metrics
- **Error Rate**: Error tracking
- **Database Performance**: Query performance

## 🔄 Background Jobs

### Job Types
- **Email Sending**: Asynchronous email delivery
- **File Processing**: Image resizing and optimization
- **Report Generation**: Scheduled report creation
- **Data Cleanup**: Periodic data maintenance
- **Notification Sending**: Push notification delivery

### Queue Management
- **Redis Queue**: Job queue with Redis
- **Job Retry**: Automatic retry on failure
- **Job Monitoring**: Job status tracking
- **Dead Letter Queue**: Failed job handling

## 📧 Email Service

### Email Types
- **Welcome Emails**: User registration confirmation
- **Password Reset**: Password reset links
- **Booking Confirmations**: Booking confirmation emails
- **Payment Receipts**: Payment confirmation emails
- **Notifications**: System notifications

### SMTP Configuration
- **Gmail**: Gmail SMTP support
- **SendGrid**: SendGrid integration
- **Custom SMTP**: Custom SMTP server support
- **Templates**: HTML email templates

## 🔍 Search & Filtering

### Advanced Search
- **Full-Text Search**: PostgreSQL full-text search
- **Filtering**: Multi-criteria filtering
- **Sorting**: Multiple sort options
- **Pagination**: Cursor-based pagination
- **Search Suggestions**: Auto-complete suggestions

### Search Features
- **Plot Search**: By location, size, price
- **Customer Search**: By name, email, phone
- **Booking Search**: By date, status, customer
- **Document Search**: By filename, type, date

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Standards
- Follow TypeScript best practices
- Use meaningful variable names
- Add JSDoc comments for complex functions
- Follow the existing code style
- Write tests for new features

### API Design Principles
- **RESTful**: Follow REST conventions
- **Consistent**: Consistent response formats
- **Documented**: Comprehensive API documentation
- **Versioned**: API versioning strategy
- **Secure**: Security-first approach

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Check the docs folder
- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub discussions
- **Email**: Contact the development team

### Common Issues
- **Database Connection**: Check PostgreSQL service and credentials
- **JWT Errors**: Verify JWT_SECRET and token format
- **File Upload**: Check file size limits and permissions
- **Email Service**: Verify SMTP configuration

## 🔄 Updates

### Version History
- **v1.0.0**: Initial release with core features
- **v1.1.0**: Added advanced analytics
- **v1.2.0**: Enhanced security features
- **v1.3.0**: Improved performance and scalability

### Roadmap
- **v2.0.0**: Advanced AI features
- **v2.1.0**: Real-time notifications
- **v2.2.0**: Enhanced reporting
- **v3.0.0**: Microservices architecture

---

**PlotVault Backend** - Robust real estate management API.
