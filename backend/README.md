# NestJS Authentication & Authorization API

A comprehensive, production-ready authentication and authorization backend API built with NestJS, featuring JWT tokens, refresh tokens, role-based access control (RBAC), email verification, password reset, and more.

## 🚀 Features

### Core Authentication
- ✅ JWT access tokens (short-lived, 15 minutes)
- ✅ Refresh tokens (long-lived, 7 days) with rotation
- ✅ Secure password hashing with bcrypt
- ✅ Email verification on registration
- ✅ Password reset functionality
- ✅ Account activation/deactivation

### Authorization & Security
- ✅ Role-based access control (Admin/User)
- ✅ Soft delete functionality
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Security headers with Helmet
- ✅ Global exception handling

### Additional Features
- ✅ Auto-generated Swagger API documentation
- ✅ Docker containerization
- ✅ PostgreSQL database with Prisma ORM
- ✅ Email service with HTML templates
- ✅ Environment-based configuration
- ✅ Health check endpoints
- ✅ Pagination support

## 🛠️ Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + Passport
- **Email**: Nodemailer
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker & Docker Compose
- **Validation**: class-validator
- **Security**: bcrypt, helmet, throttler

## 📁 Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── decorators/         # Custom decorators
│   ├── guards/            # Auth guards
│   ├── strategies/        # JWT strategies
│   ├── dto/              # Data transfer objects
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/                 # User management module
│   ├── dto/
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── common/               # Shared utilities
│   ├── decorators/       # @Public, @Roles, @GetUser
│   ├── guards/          # JwtAuthGuard, RolesGuard
│   ├── interceptors/
│   └── filters/         # Exception filters
├── mail/                # Email service
│   ├── mail.service.ts
│   └── mail.module.ts
├── prisma/              # Database service
│   └── prisma.service.ts
├── config/              # Configuration
│   └── configuration.ts
├── app.controller.ts
├── app.service.ts
├── app.module.ts
└── main.ts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 17+ (or use Docker)
- Docker & Docker Compose (optional)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd nestjs-auth-api
   npm install
   ```

2. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Quick Setup (Recommended)**
   ```bash
   # Complete setup with database, migrations, and seed data
   npm run setup
   ```

4. **Start the application**
   ```bash
   # Development
   npm run start:dev
   
   # Production
   npm run build
   npm run start:prod
   ```

### Using Docker

1. **Quick Database Setup**
   ```bash
   # Setup with Docker database only
   npm run setup:db
   ```

2. **Development with Docker Database**
   ```bash
   # Start database in Docker, run app locally
   npm run dev:full
   ```

3. **Database Management**
   ```bash
   # Start only PostgreSQL
   npm run db:start
   
   # Stop PostgreSQL
   npm run db:stop
   
   # Clean up database volumes
   npm run db:clean
   ```

## 📚 API Documentation

Once the application is running, visit:
- **Swagger UI**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

## 🔐 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /auth/verify-email` - Verify email address
- `POST /auth/request-password-reset` - Request password reset
- `POST /auth/reset-password` - Reset password

### Users (Protected)
- `GET /users` - Get all users (Admin only)
- `GET /users/me` - Get current user profile
- `GET /users/:id` - Get user by ID (Admin only)
- `PATCH /users/me` - Update current user profile
- `PATCH /users/:id/role` - Update user role (Admin only)
- `PATCH /users/:id/deactivate` - Deactivate user (Admin only)
- `PATCH /users/:id/activate` - Activate user (Admin only)
- `DELETE /users/:id` - Soft delete user (Admin only)
- `PATCH /users/:id/restore` - Restore soft deleted user (Admin only)

## 🔒 Security Features

### Authentication
- JWT access tokens with 15-minute expiry
- Refresh tokens with 7-day expiry and rotation
- Secure password hashing with bcrypt (12 salt rounds)
- Email verification required before login

### Authorization
- Role-based access control (Admin/User)
- Protected routes with JWT authentication
- Role-based endpoint protection
- Public route decorator for open endpoints

### Security Measures
- Rate limiting on auth endpoints (10 requests/minute)
- Input validation and sanitization
- CORS configuration
- Security headers with Helmet
- SQL injection protection (Prisma)
- XSS protection via validation

### Data Management
- Soft delete for user accounts
- Account activation/deactivation
- Refresh token cleanup on logout
- Automatic cleanup of expired tokens

## 🗄️ Database Schema

### User Model
```prisma
model User {
  id                      String    @id @default(cuid())
  email                   String    @unique
  password                String
  firstName               String
  lastName                String
  role                    Role      @default(USER)
  isEmailVerified         Boolean   @default(false)
  emailVerificationToken  String?   @unique
  resetPasswordToken      String?   @unique
  resetPasswordExpires    DateTime?
  isActive                Boolean   @default(true)
  deletedAt               DateTime?
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  refreshTokens           RefreshToken[]
}
```

### RefreshToken Model
```prisma
model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## 🔧 Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/nestjs_auth_db?schema=public"

# JWT Secrets
JWT_ACCESS_SECRET="your-super-secret-access-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Application
NODE_ENV="development"
PORT=3000
APP_URL="http://localhost:3000"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Deployment

### Docker Production
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Manual Production
```bash
# Build application
npm run build

# Start production server
npm run start:prod
```

## 📜 Available Scripts

### Development
- `npm run start:dev` - Start development server with hot reload
- `npm run start:debug` - Start with debugging enabled
- `npm run dev:full` - Start database in Docker + run app locally

### Database
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Create and apply migrations
- `npm run prisma:migrate:deploy` - Apply migrations (production)
- `npm run prisma:migrate:reset` - Reset database and apply migrations
- `npm run prisma:seed` - Run database seeding
- `npm run prisma:studio` - Open Prisma Studio

### Database Only (Docker)
- `npm run db:start` - Start only PostgreSQL in Docker
- `npm run db:stop` - Stop PostgreSQL container
- `npm run db:clean` - Clean up database volumes

### Setup & Deployment
- `npm run setup` - Complete local setup (generate + migrate + seed)
- `npm run setup:db` - Setup with Docker database only
- `npm run build` - Build for production
- `npm run start:prod` - Start production server

### Testing
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests

## 🔄 Database Migrations

```bash
# Create migration
npm run prisma:migrate

# Apply migrations (production)
npm run prisma:migrate:deploy

# Reset database
npm run prisma:migrate:reset

# Seed database
npm run prisma:seed
```

## 🚀 What's Next?

### Recommended Additions
1. **2FA/MFA**: Time-based OTP for additional security
2. **OAuth Integration**: Google, GitHub, Facebook login
3. **Audit Logging**: Track user actions and auth events
4. **Session Management**: View and revoke active sessions
5. **Password Policies**: Complexity requirements, expiration
6. **Account Lockout**: After failed login attempts
7. **API Versioning**: `/api/v1/` prefix structure
8. **Caching**: Redis for refresh tokens and rate limiting
9. **Testing**: Unit tests and E2E tests
10. **CI/CD Pipeline**: GitHub Actions or similar
11. **Monitoring**: Logging service (Winston) + APM
12. **File Upload**: Profile pictures with cloud storage
13. **Permissions System**: Granular permissions beyond roles

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you have any questions or need help, please open an issue or contact the maintainers.

---

**Happy Coding! 🎉**