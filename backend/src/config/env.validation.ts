/**
 * Environment Variable Validation
 *
 * This module validates critical environment variables at application startup
 * to prevent runtime errors and security vulnerabilities.
 */

interface EnvironmentConfig {
  // Database
  DATABASE_URL: string;

  // JWT
  JWT_SECRET: string;

  // Naver Maps API
  NAVER_MAP_CLIENT_ID: string;
  NAVER_MAP_CLIENT_SECRET: string;

  // AWS S3 (Optional when USE_S3=false)
  USE_S3?: string;
  AWS_S3_BUCKET?: string;
  AWS_REGION?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_CLOUDFRONT_URL?: string;
}

class EnvironmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * Validates that a required environment variable is set and not empty
 */
function requireEnv(key: string): string {
  const value = process.env[key];

  if (!value || value.trim() === '') {
    throw new EnvironmentValidationError(
      `Missing required environment variable: ${key}\n` +
      `Please check your .env file and ensure ${key} is set.`
    );
  }

  return value;
}

/**
 * Validates JWT secret strength
 */
function validateJWTSecret(secret: string): void {
  const MIN_LENGTH = 32;
  const WEAK_SECRETS = [
    'secret',
    'your-super-secret-jwt-key-change-this-in-production',
    'change-me',
    'jwt-secret',
    'supersecret',
  ];

  if (secret.length < MIN_LENGTH) {
    throw new EnvironmentValidationError(
      `JWT_SECRET is too short. Minimum length: ${MIN_LENGTH} characters.\n` +
      `Current length: ${secret.length} characters.\n` +
      `Generate a secure secret with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
    );
  }

  if (WEAK_SECRETS.some(weak => secret.toLowerCase().includes(weak))) {
    throw new EnvironmentValidationError(
      `JWT_SECRET appears to be using a weak/default value.\n` +
      `Please generate a secure secret with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
    );
  }
}

/**
 * Validates database URL format
 */
function validateDatabaseURL(url: string): void {
  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    throw new EnvironmentValidationError(
      `DATABASE_URL must be a valid PostgreSQL connection string.\n` +
      `Expected format: postgresql://user:password@host:port/database`
    );
  }
}

/**
 * Validates AWS S3 configuration when S3 is enabled
 */
function validateAWSConfig(): void {
  const useS3 = process.env.USE_S3?.toLowerCase();

  // Skip validation if S3 is explicitly disabled
  if (useS3 === 'false' || useS3 === '0') {
    console.log('ℹ️  S3 is disabled. Skipping AWS configuration validation.');
    return;
  }

  // If USE_S3 is not set or is true, require AWS credentials
  const requiredAWSVars = [
    'AWS_S3_BUCKET',
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
  ];

  const missingVars = requiredAWSVars.filter(
    key => !process.env[key] || process.env[key]!.trim() === ''
  );

  if (missingVars.length > 0) {
    throw new EnvironmentValidationError(
      `AWS S3 is enabled but missing required variables:\n` +
      `  ${missingVars.join('\n  ')}\n\n` +
      `Either:\n` +
      `  1. Set USE_S3=false to disable S3, OR\n` +
      `  2. Configure all required AWS variables in .env file`
    );
  }

  // Validate AWS region format
  const region = process.env.AWS_REGION!;
  const validRegionPattern = /^[a-z]{2}-[a-z]+-\d{1}$/;
  if (!validRegionPattern.test(region)) {
    throw new EnvironmentValidationError(
      `AWS_REGION has invalid format: ${region}\n` +
      `Expected format: us-east-1, ap-northeast-2, etc.`
    );
  }
}

/**
 * Validates all environment variables at application startup
 */
export function validateEnvironment(): EnvironmentConfig {
  try {
    console.log('🔍 Validating environment variables...');

    // Validate required variables
    const DATABASE_URL = requireEnv('DATABASE_URL');
    const JWT_SECRET = requireEnv('JWT_SECRET');
    const NAVER_MAP_CLIENT_ID = requireEnv('NAVER_MAP_CLIENT_ID');
    const NAVER_MAP_CLIENT_SECRET = requireEnv('NAVER_MAP_CLIENT_SECRET');

    // Validate formats and security
    validateDatabaseURL(DATABASE_URL);
    validateJWTSecret(JWT_SECRET);
    validateAWSConfig();

    console.log('✅ Environment validation passed');

    return {
      DATABASE_URL,
      JWT_SECRET,
      NAVER_MAP_CLIENT_ID,
      NAVER_MAP_CLIENT_SECRET,
      USE_S3: process.env.USE_S3,
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_CLOUDFRONT_URL: process.env.AWS_CLOUDFRONT_URL,
    };
  } catch (error) {
    if (error instanceof EnvironmentValidationError) {
      console.error('\n❌ Environment Validation Failed:\n');
      console.error(error.message);
      console.error('\n');
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Export for testing
 */
export const _testing = {
  requireEnv,
  validateJWTSecret,
  validateDatabaseURL,
  validateAWSConfig,
};
