# 🔐 NestJS Authentication API - Complete Explanation

## 📋 Overview

This is a **production-ready authentication and authorization API** built with **NestJS** that implements:

- **JWT (JSON Web Token) Authentication** with Access Tokens and Refresh Tokens
- **Role-Based Access Control (RBAC)** - Admin and User roles
- **Email Verification** - Required before login
- **Password Reset** - Secure token-based password reset
- **Rate Limiting** - Protection against brute force attacks
- **Security Best Practices** - Password hashing, token rotation, soft deletes

---

## 🔑 Authentication Method: **JWT (JSON Web Token)**

### What is JWT?

JWT is a **stateless authentication method** that uses **signed tokens** to verify user identity. Instead of storing sessions on the server, the client holds a token that proves their identity.

### Why JWT?

✅ **Stateless** - No server-side session storage needed  
✅ **Scalable** - Works across multiple servers  
✅ **Secure** - Tokens are cryptographically signed  
✅ **Flexible** - Can contain user data (payload)  

### Token Types in This System:

1. **Access Token** (Short-lived: 15 minutes)
   - Used for API requests
   - Contains: `{ sub: userId, email: userEmail }`
   - Sent in `Authorization: Bearer <token>` header

2. **Refresh Token** (Long-lived: 7 days)
   - Used to get new access tokens
   - Stored in database for security
   - Rotated on each use (old one deleted, new one created)

---

## 🏗️ Project Architecture

```
src/
├── auth/                    # Authentication module
│   ├── auth.controller.ts   # API endpoints (register, login, etc.)
│   ├── auth.service.ts      # Business logic (password hashing, token generation)
│   ├── strategies/          # JWT validation strategies
│   │   ├── jwt.strategy.ts  # Validates access tokens
│   │   └── refresh-jwt.strategy.ts  # Validates refresh tokens
│   └── dto/                 # Data validation (RegisterDto, LoginDto)
│
├── common/                  # Shared utilities
│   ├── guards/              # Route protection
│   │   ├── jwt-auth.guard.ts    # Protects routes with JWT
│   │   └── roles.guard.ts       # Checks user roles
│   └── decorators/          # Custom decorators
│       ├── @Public()        # Bypass authentication
│       ├── @Roles()         # Require specific roles
│       └── @GetUser()       # Get current user from request
│
├── users/                   # User management
├── mail/                    # Email service (verification, password reset)
├── prisma/                  # Database service (Prisma ORM)
└── main.ts                  # Application entry point
```

---

## 🔄 Complete Authentication Flow

### **1. USER REGISTRATION FLOW**

#### Step-by-Step Process:

```
User → POST /api/auth/register → AuthController → AuthService → Database → Email Service
```

#### Detailed Code Flow:

**Step 1: User sends registration request**
```typescript
POST /api/auth/register
Body: {
  email: "user@example.com",
  password: "SecurePass123!",
  firstName: "John",
  lastName: "Doe"
}
```

**Step 2: Request hits `AuthController.register()`**
```34:44:src/auth/auth.controller.ts
@Post('register')
@UseGuards(ThrottlerGuard)
@ApiOperation({ summary: 'Register a new user' })
@ApiResponse({
  status: 201,
  description: 'User registered successfully',
})
@ApiResponse({ status: 409, description: 'User already exists' })
@ApiResponse({ status: 400, description: 'Validation error' })
async register(@Body() registerDto: RegisterDto) {
  return this.authService.register(registerDto);
}
```

**Step 3: Validation happens automatically**
- `RegisterDto` validates:
  - Email format
  - Password: min 8 chars, uppercase, lowercase, number, special char
  - First/Last name: 2-50 characters

**Step 4: `AuthService.register()` processes the request**
```45:94:src/auth/auth.service.ts
async register(registerDto: RegisterDto): Promise<RegisterResponse> {
  const { email, password, firstName, lastName } = registerDto;

  // Check if user already exists
  const existingUser = await this.prisma.user.findUnique({
    where: { email },
  });

  if (existingUser && !existingUser.deletedAt) {
    throw new ConflictException(AUTH_CONSTANTS.ERRORS.USER_ALREADY_EXISTS);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, AUTH_CONSTANTS.PASSWORD.SALT_ROUNDS);

  // Generate email verification token
  const emailVerificationToken = crypto.randomBytes(AUTH_CONSTANTS.TOKEN.EMAIL_VERIFICATION_LENGTH).toString('hex');

  // Create user
  const user = await this.prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      emailVerificationToken,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });

  // Send verification email
  await this.mailService.sendEmailVerification(
    email,
    emailVerificationToken,
    firstName,
  );

  return {
    message: AUTH_CONSTANTS.MESSAGES.REGISTER_SUCCESS,
    user,
  };
}
```

**What happens:**
1. ✅ Checks if email already exists
2. ✅ Hashes password with bcrypt (12 salt rounds)
3. ✅ Generates random email verification token (32 bytes hex)
4. ✅ Creates user in database with `isEmailVerified: false`
5. ✅ Sends verification email with link

**Step 5: Email sent via `MailService`**
```44:73:src/mail/mail.service.ts
async sendEmailVerification(email: string, token: string, firstName: string) {
  const appUrl = this.configService.get<string>('app.url');
  const verificationLink = `${appUrl}/api/auth/verify-email?token=${token}`;
  console.log("verificationLink", verificationLink);

  const mailOptions = {
    from: this.configService.get<string>('smtp.from'),
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome ${firstName}!</h2>
        <p>Thank you for registering with us. Please verify your email address by clicking the link below:</p>
        <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await this.transporter.sendMail(mailOptions);
    this.logger.log(`Email verification sent to ${email}`);
  } catch (error) {
    this.logger.error(`Failed to send email verification to ${email}:`, error);
    throw error;
  }
}
```

**Step 6: User clicks email verification link**
```
GET /api/auth/verify-email?token=<verification-token>
```

**Step 7: Email verification processed**
```180:205:src/auth/auth.service.ts
async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<VerifyEmailResponse> {
  const { token } = verifyEmailDto;

  const user = await this.prisma.user.findUnique({
    where: { emailVerificationToken: token },
  });

  if (!user) {
    throw new BadRequestException(AUTH_CONSTANTS.ERRORS.INVALID_VERIFICATION_TOKEN);
  }

  if (user.isEmailVerified) {
    throw new BadRequestException(AUTH_CONSTANTS.ERRORS.EMAIL_ALREADY_VERIFIED);
  }

  // Update user
  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
    },
  });

  return { message: AUTH_CONSTANTS.MESSAGES.EMAIL_VERIFIED_SUCCESS };
}
```

**Result:** User's `isEmailVerified` is set to `true`, now they can login!

---

### **2. USER LOGIN FLOW**

#### Step-by-Step Process:

```
User → POST /api/auth/login → AuthController → AuthService → JWT Generation → Response
```

#### Detailed Code Flow:

**Step 1: User sends login request**
```typescript
POST /api/auth/login
Body: {
  email: "user@example.com",
  password: "SecurePass123!"
}
```

**Step 2: Request hits `AuthController.login()`**
```47:59:src/auth/auth.controller.ts
@Post('login')
@UseGuards(ThrottlerGuard)
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Login user' })
@ApiResponse({
  status: 200,
  description: 'Login successful',
})
@ApiResponse({ status: 401, description: 'Invalid credentials' })
@ApiResponse({ status: 400, description: 'Validation error' })
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

**Step 3: `AuthService.login()` validates credentials**
```96:134:src/auth/auth.service.ts
async login(loginDto: LoginDto): Promise<LoginResponse> {
  const { email, password } = loginDto;

  // Find user
  const user = await this.prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.deletedAt || !user.isActive) {
    throw new UnauthorizedException(AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException(AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS);
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    throw new UnauthorizedException(AUTH_CONSTANTS.ERRORS.EMAIL_NOT_VERIFIED);
  }

  // Generate tokens
  const tokens = await this.generateTokens(user.id, user.email);

  return {
    message: AUTH_CONSTANTS.MESSAGES.LOGIN_SUCCESS,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
    ...tokens,
  };
}
```

**What happens:**
1. ✅ Finds user by email
2. ✅ Checks if user exists, is active, and not deleted
3. ✅ Compares password with bcrypt
4. ✅ Verifies email is verified
5. ✅ Generates JWT tokens (access + refresh)

**Step 4: Token Generation (`generateTokens()`)**
```268:297:src/auth/auth.service.ts
private async generateTokens(userId: string, email: string): Promise<AuthTokens> {
  const payload: JwtPayload = { sub: userId, email };
  const refreshPayload: JwtRefreshPayload = { 
    ...payload, 
    token: crypto.randomBytes(AUTH_CONSTANTS.TOKEN.REFRESH_TOKEN_LENGTH).toString('hex') 
  };

  const refreshSecret = this.configService.get<string>(AUTH_CONSTANTS.JWT.REFRESH_SECRET_KEY) || process.env.JWT_REFRESH_SECRET || AUTH_CONSTANTS.JWT.DEFAULT_REFRESH_SECRET;
  const refreshExpiresIn = this.configService.get<string>(AUTH_CONSTANTS.JWT.REFRESH_EXPIRES_IN_KEY) || AUTH_CONSTANTS.JWT.DEFAULT_REFRESH_EXPIRES_IN;

  const accessToken = await this.jwtService.signAsync(payload);
  const refreshToken = await this.jwtService.signAsync(refreshPayload as any, {
    secret: refreshSecret,
    expiresIn: refreshExpiresIn as any,
  });

  // Store refresh token in database
  const refreshTokenRecord = await this.prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + AUTH_CONSTANTS.EXPIRATION.REFRESH_TOKEN),
    },
  });

  return {
    accessToken,
    refreshToken,
  };
}
```

**What happens:**
1. ✅ Creates JWT payload: `{ sub: userId, email }`
2. ✅ Signs access token (15 min expiry, default secret)
3. ✅ Signs refresh token (7 days expiry, separate secret)
4. ✅ Stores refresh token in database with expiration
5. ✅ Returns both tokens

**Step 5: Response sent to client**
```json
{
  "message": "Login successful",
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "isEmailVerified": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### **3. PROTECTED ROUTE ACCESS FLOW**

#### How Protected Routes Work:

**Step 1: Client makes authenticated request**
```typescript
GET /api/users/me
Headers: {
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Step 2: `JwtAuthGuard` intercepts request**
```1:22:src/common/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
```

**Step 3: `JwtStrategy` validates token**
```22:49:src/auth/strategies/jwt.strategy.ts
async validate(payload: JwtPayload) {
  const user = await this.prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isEmailVerified: true,
      isActive: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt || !user.isActive) {
    throw new UnauthorizedException(AUTH_CONSTANTS.ERRORS.USER_NOT_FOUND);
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  };
}
```

**What happens:**
1. ✅ Extracts token from `Authorization` header
2. ✅ Verifies token signature with secret
3. ✅ Checks token expiration
4. ✅ Extracts payload (`userId`, `email`)
5. ✅ Fetches user from database
6. ✅ Validates user is active and not deleted
7. ✅ Attaches user object to request

**Step 4: Controller receives authenticated request**
```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
async getProfile(@GetUser() user: User) {
  // user is automatically injected from JWT payload
  return user;
}
```

---

### **4. TOKEN REFRESH FLOW**

When access token expires (15 minutes), client uses refresh token to get a new one:

**Step 1: Client requests new tokens**
```typescript
POST /api/auth/refresh
Body: {
  refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Step 2: `AuthService.refreshToken()` processes request**
```136:169:src/auth/auth.service.ts
async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponse> {
  const { refreshToken } = refreshTokenDto;

  // Find refresh token
  const tokenRecord = await this.prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.user.deletedAt || !tokenRecord.user.isActive) {
    throw new UnauthorizedException(AUTH_CONSTANTS.ERRORS.INVALID_REFRESH_TOKEN);
  }

  if (tokenRecord.expiresAt < new Date()) {
    // Clean up expired token
    await this.prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });
    throw new UnauthorizedException(AUTH_CONSTANTS.ERRORS.REFRESH_TOKEN_EXPIRED);
  }

  // Generate new tokens
  const tokens = await this.generateTokens(tokenRecord.user.id, tokenRecord.user.email);

  // Delete old refresh token
  await this.prisma.refreshToken.delete({
    where: { id: tokenRecord.id },
  });

  return {
    message: AUTH_CONSTANTS.MESSAGES.TOKEN_REFRESH_SUCCESS,
    ...tokens,
  };
}
```

**What happens:**
1. ✅ Finds refresh token in database
2. ✅ Validates token exists and user is active
3. ✅ Checks token expiration
4. ✅ **Token Rotation**: Deletes old refresh token
5. ✅ Generates new access + refresh tokens
6. ✅ Returns new tokens

**Security Feature: Refresh Token Rotation**
- Old refresh token is deleted immediately
- New refresh token is issued
- Prevents token reuse if stolen

---

## 🗄️ Database Schema

### User Model
```prisma
model User {
  id                      String    @id @default(cuid())
  email                   String    @unique
  password                String    // Hashed with bcrypt
  firstName               String
  lastName                String
  role                    Role      @default(USER)  // ADMIN or USER
  isEmailVerified         Boolean   @default(false)
  emailVerificationToken  String?   @unique
  resetPasswordToken      String?   @unique
  resetPasswordExpires    DateTime?
  isActive                Boolean   @default(true)
  deletedAt               DateTime?  // Soft delete
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

---

## 🔒 Security Features

### 1. **Password Security**
- ✅ Hashed with **bcrypt** (12 salt rounds)
- ✅ Never stored in plain text
- ✅ Password complexity requirements

### 2. **Token Security**
- ✅ Access tokens: Short-lived (15 min)
- ✅ Refresh tokens: Long-lived (7 days) but stored in DB
- ✅ Token rotation on refresh
- ✅ Separate secrets for access/refresh tokens

### 3. **Rate Limiting**
- ✅ 10 requests per minute on auth endpoints
- ✅ Prevents brute force attacks

### 4. **Email Verification**
- ✅ Required before login
- ✅ Random token (32 bytes)
- ✅ Prevents fake accounts

### 5. **Account Protection**
- ✅ Soft delete (not permanently deleted)
- ✅ Account activation/deactivation
- ✅ Email verification required

### 6. **Input Validation**
- ✅ All inputs validated with `class-validator`
- ✅ SQL injection protection (Prisma)
- ✅ XSS protection via validation

---

## 📊 Flow Diagram Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW                        │
└─────────────────────────────────────────────────────────────┘

User → POST /auth/register
  ↓
AuthController.register()
  ↓
AuthService.register()
  ├─ Check email exists
  ├─ Hash password (bcrypt)
  ├─ Generate verification token
  ├─ Create user in DB
  └─ Send verification email
      ↓
User clicks email link
  ↓
GET /auth/verify-email?token=xxx
  ↓
AuthService.verifyEmail()
  └─ Set isEmailVerified = true
      ↓
✅ User can now login!


┌─────────────────────────────────────────────────────────────┐
│                       LOGIN FLOW                             │
└─────────────────────────────────────────────────────────────┘

User → POST /auth/login
  ↓
AuthController.login()
  ↓
AuthService.login()
  ├─ Find user by email
  ├─ Verify password (bcrypt.compare)
  ├─ Check email verified
  └─ Generate tokens
      ├─ Access Token (15 min)
      └─ Refresh Token (7 days, stored in DB)
          ↓
✅ Returns tokens + user info


┌─────────────────────────────────────────────────────────────┐
│                  PROTECTED ROUTE FLOW                       │
└─────────────────────────────────────────────────────────────┘

Client → GET /users/me
  Headers: Authorization: Bearer <accessToken>
    ↓
JwtAuthGuard intercepts
  ↓
JwtStrategy.validate()
  ├─ Extract token from header
  ├─ Verify signature
  ├─ Check expiration
  ├─ Fetch user from DB
  └─ Attach user to request
      ↓
Controller receives authenticated request
  ↓
✅ Returns user data


┌─────────────────────────────────────────────────────────────┐
│                    TOKEN REFRESH FLOW                       │
└─────────────────────────────────────────────────────────────┘

Client → POST /auth/refresh
  Body: { refreshToken: "..." }
    ↓
AuthService.refreshToken()
  ├─ Find token in DB
  ├─ Validate token & user
  ├─ Delete old refresh token (rotation)
  └─ Generate new tokens
      ↓
✅ Returns new access + refresh tokens
```

---

## 🎯 Key Takeaways

1. **Authentication Method**: **JWT (JSON Web Token)** - Stateless, scalable, secure
2. **Two-Token System**: Access token (short) + Refresh token (long)
3. **Security**: Password hashing, token rotation, email verification, rate limiting
4. **Flow**: Register → Verify Email → Login → Get Tokens → Use Tokens → Refresh When Expired
5. **Architecture**: Modular NestJS structure with guards, strategies, and services

---

## 📚 Additional Resources

- **JWT.io**: https://jwt.io (Decode and test JWT tokens)
- **NestJS Docs**: https://docs.nestjs.com
- **Prisma Docs**: https://www.prisma.io/docs
- **Passport.js**: http://www.passportjs.org

---

**Happy Coding! 🚀**

