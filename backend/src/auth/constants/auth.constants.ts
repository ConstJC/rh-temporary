/**
 * Authentication constants
 */
export const AUTH_CONSTANTS = {
  // JWT Configuration
  JWT: {
    ACCESS_SECRET_KEY: 'jwt.accessSecret',
    REFRESH_SECRET_KEY: 'jwt.refreshSecret',
    ACCESS_EXPIRES_IN_KEY: 'jwt.accessExpiresIn',
    REFRESH_EXPIRES_IN_KEY: 'jwt.refreshExpiresIn',
    DEFAULT_ACCESS_EXPIRES_IN: '15m',
    DEFAULT_REFRESH_EXPIRES_IN: '7d',
    DEFAULT_ACCESS_SECRET: 'default-secret',
    DEFAULT_REFRESH_SECRET: 'default-refresh-secret',
  },

  // Password Configuration
  PASSWORD: {
    SALT_ROUNDS: 12,
  },

  // Token Configuration
  TOKEN: {
    EMAIL_VERIFICATION_LENGTH: 32,
    PASSWORD_RESET_LENGTH: 32,
    REFRESH_TOKEN_LENGTH: 32,
  },

  // Expiration Times (in milliseconds)
  EXPIRATION: {
    PASSWORD_RESET: 60 * 60 * 1000, // 1 hour
    REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days
    EMAIL_VERIFICATION: 24 * 60 * 60 * 1000, // 24 hours
    LOCKOUT: 15 * 60 * 1000, // 15 minutes
  },
  MAX_FAILED_LOGIN_ATTEMPTS: 5,

  // Error Messages
  ERRORS: {
    USER_NOT_FOUND: 'User not found or inactive',
    INVALID_CREDENTIALS: 'Invalid credentials',
    ACCOUNT_LOCKED: 'Account temporarily locked. Try again later.',
    EMAIL_NOT_VERIFIED: 'Please verify your email before logging in',
    USER_ALREADY_EXISTS: 'User with this email already exists',
    INVALID_REFRESH_TOKEN: 'Invalid refresh token',
    REFRESH_TOKEN_EXPIRED: 'Refresh token expired',
    INVALID_VERIFICATION_TOKEN: 'Invalid verification token',
    EMAIL_ALREADY_VERIFIED: 'Email already verified',
    INVALID_RESET_TOKEN: 'Invalid or expired reset token',
  },

  // Success Messages
  MESSAGES: {
    REGISTER_SUCCESS:
      'User registered successfully. Please check your email for verification.',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    TOKEN_REFRESH_SUCCESS: 'Tokens refreshed successfully',
    EMAIL_VERIFIED_SUCCESS: 'Email verified successfully',
    PASSWORD_RESET_REQUEST_SUCCESS:
      'If the email exists, a password reset link has been sent',
    PASSWORD_RESET_SUCCESS: 'Password reset successfully',
  },
} as const;
