/**
 * Comprehensive API Integration Tests
 *
 * Tests all API endpoints (except Naver-related) with:
 * - Success and failure cases
 * - JWT authentication flow
 * - Bot detection and duplicate click prevention
 * - Zod input validation
 * - Proper HTTP status codes
 *
 * Prerequisites:
 *   - Running PostgreSQL database with test data
 *   - Environment variables (DATABASE_URL, JWT_SECRET, etc.)
 *   - At least one Admin record in DB (seeded via prisma/seed.ts)
 *   - At least one Mechanic record in DB
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import type { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { CacheService } from '../src/common/services/cache.service';
import * as bcrypt from 'bcrypt';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Realistic browser User-Agent for non-bot requests */
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** A known bot User-Agent string */
const BOT_USER_AGENT = 'Googlebot/2.1 (+http://www.google.com/bot.html)';

/** Timeout for the full test suite (ms) */
const SUITE_TIMEOUT = 120_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generates a valid mechanic creation payload that conforms to the
 * CreateMechanicSchema Zod schema.
 */
function validMechanicPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Test Mechanic',
    location: '강남구',
    phone: '02-1234-5678',
    description: 'Integration test mechanic',
    address: '서울시 강남구 역삼동 123-45',
    mapLat: 37.4979,
    mapLng: 127.0276,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('API Integration Tests', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let cacheService: CacheService;

  // Shared state across tests
  let accessToken: string;
  let testAdminId: number;
  let testMechanicId: number;
  let createdMechanicId: number;

  // -------------------------------------------------------------------------
  // Setup & Teardown
  // -------------------------------------------------------------------------

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Mirror production bootstrap configuration
    app.use(cookieParser());

    await app.init();

    prisma = app.get(PrismaService);
    cacheService = app.get(CacheService);

    // Seed a test admin (idempotent)
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    const admin = await prisma.admin.upsert({
      where: { email: 'test-integration@dreaming-mech.com' },
      update: { password: hashedPassword },
      create: {
        email: 'test-integration@dreaming-mech.com',
        password: hashedPassword,
        name: 'Integration Test Admin',
      },
    });
    testAdminId = admin.id;

    // Ensure at least one active mechanic exists for read-only tests
    const mechanic = await prisma.mechanic.create({
      data: {
        name: 'Seed Mechanic for Tests',
        location: '서초구',
        phone: '02-9876-5432',
        address: '서울시 서초구 서초동 100',
        mapLat: 37.4833,
        mapLng: 127.0122,
        isActive: true,
      },
    });
    testMechanicId = mechanic.id;
  }, SUITE_TIMEOUT);

  afterAll(async () => {
    // Cleanup test data in reverse dependency order
    if (createdMechanicId) {
      await prisma.clickLog.deleteMany({ where: { mechanicId: createdMechanicId } });
      await prisma.mechanic.deleteMany({ where: { id: createdMechanicId } });
    }
    if (testMechanicId) {
      await prisma.clickLog.deleteMany({ where: { mechanicId: testMechanicId } });
      await prisma.mechanic.deleteMany({ where: { id: testMechanicId } });
    }
    await prisma.admin.deleteMany({
      where: { email: 'test-integration@dreaming-mech.com' },
    });

    // Clean up pageView records created by tests
    await prisma.pageView.deleteMany({
      where: { ipAddress: '127.0.0.1' },
    });

    await cacheService.reset();
    await app.close();
  }, SUITE_TIMEOUT);

  // Reset cache before each test to avoid cross-contamination
  beforeEach(async () => {
    await cacheService.reset();
  });

  // =========================================================================
  // 1. AUTH SYSTEM
  // =========================================================================

  describe('Auth System', () => {
    // -----------------------------------------------------------------------
    // POST /auth/login
    // -----------------------------------------------------------------------
    describe('POST /auth/login', () => {
      it('should login successfully with valid credentials and return admin info', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'test-integration@dreaming-mech.com',
            password: 'TestPassword123!',
          })
          .expect(201);

        // Response body should contain admin info
        expect(res.body).toHaveProperty('admin');
        expect(res.body.admin).toHaveProperty('id');
        expect(res.body.admin).toHaveProperty('email', 'test-integration@dreaming-mech.com');
        expect(res.body.admin).toHaveProperty('name', 'Integration Test Admin');

        // Should NOT return the token in body (it is in HttpOnly cookie)
        expect(res.body).not.toHaveProperty('access_token');

        // Extract token from Set-Cookie header for subsequent requests
        const cookies = res.headers['set-cookie'] as unknown as string | string[];
        expect(cookies).toBeDefined();

        const cookieArray: string[] = Array.isArray(cookies) ? cookies : [cookies];
        const accessTokenCookie = cookieArray.find(
          (c: string) => c.startsWith('access_token='),
        );
        expect(accessTokenCookie).toBeDefined();

        // Parse token value from cookie
        accessToken = accessTokenCookie!.split(';')[0].split('=')[1];
        expect(accessToken).toBeTruthy();
      });

      it('should reject login with wrong password (401)', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'test-integration@dreaming-mech.com',
            password: 'WrongPassword999!',
          })
          .expect(401);

        expect(res.body).toHaveProperty('statusCode', 401);
      });

      it('should reject login with non-existent email (401)', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'nonexistent@dreaming-mech.com',
            password: 'SomePassword123!',
          })
          .expect(401);
      });

      // Zod validation tests
      it('should reject login with invalid email format (400 Zod)', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'not-an-email',
            password: 'TestPassword123!',
          })
          .expect(400);

        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
          ]),
        );
      });

      it('should reject login with too short password (400 Zod)', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'test@example.com',
            password: 'short',
          })
          .expect(400);

        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'password' }),
          ]),
        );
      });

      it('should reject login with empty body (400 Zod)', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({})
          .expect(400);
      });

      it('should reject login with missing fields (400 Zod)', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'test@example.com' })
          .expect(400);
      });
    });

    // -----------------------------------------------------------------------
    // GET /auth/profile
    // -----------------------------------------------------------------------
    describe('GET /auth/profile', () => {
      it('should return admin profile with valid JWT cookie', async () => {
        const res = await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Cookie', [`access_token=${accessToken}`])
          .expect(200);

        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('email', 'test-integration@dreaming-mech.com');
        expect(res.body).toHaveProperty('name');
        // Should not expose password
        expect(res.body).not.toHaveProperty('password');
      });

      it('should return admin profile with Bearer token in Authorization header', async () => {
        const res = await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(res.body).toHaveProperty('email', 'test-integration@dreaming-mech.com');
      });

      it('should reject request without authentication (401)', async () => {
        await request(app.getHttpServer())
          .get('/auth/profile')
          .expect(401);
      });

      it('should reject request with invalid/expired token (401)', async () => {
        await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Cookie', ['access_token=invalid.jwt.token'])
          .expect(401);
      });

      it('should reject request with malformed Bearer token (401)', async () => {
        await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', 'Bearer totally-not-a-jwt')
          .expect(401);
      });
    });

    // -----------------------------------------------------------------------
    // POST /auth/logout
    // -----------------------------------------------------------------------
    describe('POST /auth/logout', () => {
      it('should clear the access_token cookie and return success message', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/logout')
          .expect(201);

        expect(res.body).toEqual({ message: 'Logged out successfully' });

        // Verify the cookie is cleared
        const cookies = res.headers['set-cookie'] as unknown as string | string[];
        if (cookies) {
          const cookieArray: string[] = Array.isArray(cookies) ? cookies : [cookies];
          const clearCookie = cookieArray.find(
            (c: string) => c.startsWith('access_token='),
          );
          if (clearCookie) {
            // Cookie value should be empty or expired
            expect(
              clearCookie.includes('access_token=;') ||
              clearCookie.includes('Expires=Thu, 01 Jan 1970'),
            ).toBe(true);
          }
        }
      });

      it('should succeed even without an active session', async () => {
        await request(app.getHttpServer())
          .post('/auth/logout')
          .expect(201);
      });
    });
  });

  // =========================================================================
  // 2. MECHANIC CRUD
  // =========================================================================

  describe('Mechanic CRUD', () => {
    // -----------------------------------------------------------------------
    // GET /mechanics
    // -----------------------------------------------------------------------
    describe('GET /mechanics', () => {
      it('should return a list of active mechanics (public, no auth)', async () => {
        const res = await request(app.getHttpServer())
          .get('/mechanics')
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        // At least the seeded mechanic should be present
        expect(res.body.length).toBeGreaterThanOrEqual(1);

        // Verify response shape
        const mechanic = res.body.find((m: any) => m.id === testMechanicId);
        expect(mechanic).toBeDefined();
        expect(mechanic).toHaveProperty('name');
        expect(mechanic).toHaveProperty('location');
        expect(mechanic).toHaveProperty('phone');
        expect(mechanic).toHaveProperty('address');
        expect(typeof mechanic.mapLat).toBe('number');
        expect(typeof mechanic.mapLng).toBe('number');
      });
    });

    // -----------------------------------------------------------------------
    // GET /mechanics/:id
    // -----------------------------------------------------------------------
    describe('GET /mechanics/:id', () => {
      it('should return a specific mechanic by ID', async () => {
        const res = await request(app.getHttpServer())
          .get(`/mechanics/${testMechanicId}`)
          .expect(200);

        expect(res.body).toHaveProperty('id', testMechanicId);
        expect(res.body).toHaveProperty('name', 'Seed Mechanic for Tests');
        expect(typeof res.body.mapLat).toBe('number');
        expect(typeof res.body.mapLng).toBe('number');
        // Should include recent clickLogs (relation include)
        expect(res.body).toHaveProperty('clickLogs');
        expect(Array.isArray(res.body.clickLogs)).toBe(true);
      });

      it('should return 404 for non-existent mechanic', async () => {
        const res = await request(app.getHttpServer())
          .get('/mechanics/999999')
          .expect(404);

        expect(res.body).toHaveProperty('statusCode', 404);
      });

      it('should return 400 for non-numeric id parameter', async () => {
        await request(app.getHttpServer())
          .get('/mechanics/not-a-number')
          .expect(400);
      });
    });

    // -----------------------------------------------------------------------
    // POST /mechanics (requires JWT)
    // -----------------------------------------------------------------------
    describe('POST /mechanics', () => {
      it('should create a mechanic with valid data and JWT', async () => {
        const payload = validMechanicPayload();

        const res = await request(app.getHttpServer())
          .post('/mechanics')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(payload)
          .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('name', payload.name);
        expect(res.body).toHaveProperty('location', payload.location);
        expect(res.body).toHaveProperty('phone', payload.phone);
        expect(typeof res.body.mapLat).toBe('number');
        expect(typeof res.body.mapLng).toBe('number');
        expect(res.body).toHaveProperty('isActive', true);

        createdMechanicId = res.body.id;
      });

      it('should reject creation without authentication (401)', async () => {
        await request(app.getHttpServer())
          .post('/mechanics')
          .send(validMechanicPayload())
          .expect(401);
      });

      // Zod validation: required fields
      it('should reject creation with missing required fields (400 Zod)', async () => {
        const res = await request(app.getHttpServer())
          .post('/mechanics')
          .set('Cookie', [`access_token=${accessToken}`])
          .send({ name: 'Only Name' })
          .expect(400);

        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors.length).toBeGreaterThanOrEqual(1);
      });

      // Zod validation: name too long
      it('should reject creation with name exceeding 100 chars (400 Zod)', async () => {
        const res = await request(app.getHttpServer())
          .post('/mechanics')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(validMechanicPayload({ name: 'A'.repeat(101) }))
          .expect(400);

        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'name' }),
          ]),
        );
      });

      // Zod validation: invalid phone format
      it('should reject creation with invalid phone number format (400 Zod)', async () => {
        const res = await request(app.getHttpServer())
          .post('/mechanics')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(validMechanicPayload({ phone: '123-abc-defg' }))
          .expect(400);

        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'phone' }),
          ]),
        );
      });

      // Zod validation: latitude out of range
      it('should reject creation with out-of-range latitude (400 Zod)', async () => {
        const res = await request(app.getHttpServer())
          .post('/mechanics')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(validMechanicPayload({ mapLat: 91 }))
          .expect(400);

        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'mapLat' }),
          ]),
        );
      });

      // Zod validation: longitude out of range
      it('should reject creation with out-of-range longitude (400 Zod)', async () => {
        const res = await request(app.getHttpServer())
          .post('/mechanics')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(validMechanicPayload({ mapLng: -181 }))
          .expect(400);

        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'mapLng' }),
          ]),
        );
      });

      // Zod validation: invalid YouTube URL
      it('should reject creation with invalid YouTube URL (400 Zod)', async () => {
        const res = await request(app.getHttpServer())
          .post('/mechanics')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(validMechanicPayload({ youtubeUrl: 'https://vimeo.com/123' }))
          .expect(400);

        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'youtubeUrl' }),
          ]),
        );
      });

      // Zod validation: invalid mainImageUrl
      it('should reject creation with invalid mainImageUrl (400 Zod)', async () => {
        const res = await request(app.getHttpServer())
          .post('/mechanics')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(validMechanicPayload({ mainImageUrl: 'not-a-url' }))
          .expect(400);

        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'mainImageUrl' }),
          ]),
        );
      });

      // Zod validation: too many gallery images
      it('should reject creation with more than 10 gallery images (400 Zod)', async () => {
        const tooManyImages = Array.from(
          { length: 11 },
          (_, i) => `https://example.com/img${i}.jpg`,
        );

        const res = await request(app.getHttpServer())
          .post('/mechanics')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(validMechanicPayload({ galleryImages: tooManyImages }))
          .expect(400);

        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'galleryImages' }),
          ]),
        );
      });

      // Zod validation: gallery images contain non-URL strings
      it('should reject creation with non-URL gallery images (400 Zod)', async () => {
        const res = await request(app.getHttpServer())
          .post('/mechanics')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(validMechanicPayload({ galleryImages: ['not-a-url'] }))
          .expect(400);

        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: expect.stringContaining('galleryImages') }),
          ]),
        );
      });

      // Valid optional fields
      it('should create a mechanic with valid optional fields', async () => {
        const payload = validMechanicPayload({
          name: 'Mechanic With Extras',
          mainImageUrl: 'https://example.com/main.jpg',
          galleryImages: ['https://example.com/g1.jpg', 'https://example.com/g2.jpg'],
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        });

        const res = await request(app.getHttpServer())
          .post('/mechanics')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(payload)
          .expect(201);

        expect(res.body).toHaveProperty('mainImageUrl', 'https://example.com/main.jpg');
        expect(res.body).toHaveProperty('youtubeUrl', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

        // Cleanup
        await prisma.mechanic.delete({ where: { id: res.body.id } });
      });
    });

    // -----------------------------------------------------------------------
    // PATCH /mechanics/:id (requires JWT)
    // -----------------------------------------------------------------------
    describe('PATCH /mechanics/:id', () => {
      it('should update a mechanic with valid partial data', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/mechanics/${testMechanicId}`)
          .set('Cookie', [`access_token=${accessToken}`])
          .send({ name: 'Updated Name' })
          .expect(200);

        expect(res.body).toHaveProperty('id', testMechanicId);
        expect(res.body).toHaveProperty('name', 'Updated Name');
      });

      it('should reject update without authentication (401)', async () => {
        await request(app.getHttpServer())
          .patch(`/mechanics/${testMechanicId}`)
          .send({ name: 'Should Not Work' })
          .expect(401);
      });

      it('should return 404 for updating non-existent mechanic', async () => {
        await request(app.getHttpServer())
          .patch('/mechanics/999999')
          .set('Cookie', [`access_token=${accessToken}`])
          .send({ name: 'Ghost' })
          .expect(404);
      });

      it('should reject update with invalid data (400 Zod)', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/mechanics/${testMechanicId}`)
          .set('Cookie', [`access_token=${accessToken}`])
          .send({ mapLat: 999 })
          .expect(400);

        expect(res.body.message).toBe('Validation failed');
      });
    });

    // -----------------------------------------------------------------------
    // DELETE /mechanics/:id (requires JWT, soft delete)
    // -----------------------------------------------------------------------
    describe('DELETE /mechanics/:id', () => {
      let deletableMechanicId: number;

      beforeAll(async () => {
        const m = await prisma.mechanic.create({
          data: {
            name: 'To Be Deleted',
            location: '마포구',
            phone: '02-1111-2222',
            address: '서울시 마포구 합정동 1',
            mapLat: 37.5496,
            mapLng: 126.9139,
            isActive: true,
          },
        });
        deletableMechanicId = m.id;
      });

      afterAll(async () => {
        // Ensure cleanup regardless of test outcome
        await prisma.mechanic.deleteMany({ where: { id: deletableMechanicId } });
      });

      it('should soft-delete a mechanic (204 No Content)', async () => {
        await request(app.getHttpServer())
          .delete(`/mechanics/${deletableMechanicId}`)
          .set('Cookie', [`access_token=${accessToken}`])
          .expect(204);

        // Verify the mechanic is soft-deleted (isActive = false)
        const deleted = await prisma.mechanic.findUnique({
          where: { id: deletableMechanicId },
        });
        expect(deleted).not.toBeNull();
        expect(deleted!.isActive).toBe(false);
      });

      it('should reject delete without authentication (401)', async () => {
        await request(app.getHttpServer())
          .delete(`/mechanics/${testMechanicId}`)
          .expect(401);
      });

      it('should return 404 for deleting non-existent mechanic', async () => {
        await request(app.getHttpServer())
          .delete('/mechanics/999999')
          .set('Cookie', [`access_token=${accessToken}`])
          .expect(404);
      });
    });

    // -----------------------------------------------------------------------
    // POST /mechanics/:id/click (rate-limited, bot detection)
    // -----------------------------------------------------------------------
    describe('POST /mechanics/:id/click', () => {
      it('should increment click count for a valid mechanic with browser UA', async () => {
        const res = await request(app.getHttpServer())
          .post(`/mechanics/${testMechanicId}/click`)
          .set('User-Agent', BROWSER_USER_AGENT)
          .expect(201);

        expect(res.body).toHaveProperty('id', testMechanicId);
        expect(typeof res.body.clickCount).toBe('number');
      });

      it('should detect bot User-Agent and log but NOT increment clickCount', async () => {
        // First, get current click count
        const before = await prisma.mechanic.findUnique({
          where: { id: testMechanicId },
        });
        const countBefore = before!.clickCount;

        await request(app.getHttpServer())
          .post(`/mechanics/${testMechanicId}/click`)
          .set('User-Agent', BOT_USER_AGENT)
          .expect(201);

        // clickCount should NOT have incremented
        const after = await prisma.mechanic.findUnique({
          where: { id: testMechanicId },
        });
        expect(after!.clickCount).toBe(countBefore);

        // But a ClickLog record should exist with isBot=true
        const botLog = await prisma.clickLog.findFirst({
          where: {
            mechanicId: testMechanicId,
            isBot: true,
          },
          orderBy: { clickedAt: 'desc' },
        });
        expect(botLog).not.toBeNull();
        expect(botLog!.isBot).toBe(true);
      });

      it('should reject request without User-Agent header (400)', async () => {
        const res = await request(app.getHttpServer())
          .post(`/mechanics/${testMechanicId}/click`)
          .unset('User-Agent')
          .expect(400);

        expect(res.body).toHaveProperty('statusCode', 400);
        expect(res.body.message).toContain('User-Agent');
      });

      it('should detect duplicate click within 10 seconds (400)', async () => {
        // First click should succeed
        await request(app.getHttpServer())
          .post(`/mechanics/${testMechanicId}/click`)
          .set('User-Agent', BROWSER_USER_AGENT)
          .expect(201);

        // Second click from same IP within 10s should be rejected
        const res = await request(app.getHttpServer())
          .post(`/mechanics/${testMechanicId}/click`)
          .set('User-Agent', BROWSER_USER_AGENT)
          .expect(400);

        expect(res.body.message).toContain('Duplicate click');
      });

      it('should return 404 for clicking non-existent mechanic', async () => {
        await request(app.getHttpServer())
          .post('/mechanics/999999/click')
          .set('User-Agent', BROWSER_USER_AGENT)
          .expect(404);
      });

      it('should detect various bot User-Agent patterns', async () => {
        const botAgents = [
          'Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)',
          'curl/7.68.0',
          'Python-urllib/3.8',
          'Wget/1.20.3',
          'AhrefsBot/7.0',
          'SemrushBot/7~bl',
          'axios/0.21.1',
          'node-fetch/2.6.1',
        ];

        for (const agent of botAgents) {
          // Reset cache to avoid duplicate click rejection
          await cacheService.reset();

          const res = await request(app.getHttpServer())
            .post(`/mechanics/${testMechanicId}/click`)
            .set('User-Agent', agent)
            .expect(201);

          // The response should succeed but the click should be marked as bot
          // Verify the latest log entry
          const latestLog = await prisma.clickLog.findFirst({
            where: { mechanicId: testMechanicId },
            orderBy: { clickedAt: 'desc' },
          });
          expect(latestLog!.isBot).toBe(true);
        }
      });
    });
  });

  // =========================================================================
  // 3. FILE UPLOAD
  // =========================================================================

  describe('File Upload', () => {
    describe('POST /upload/image', () => {
      it('should reject upload without authentication (401)', async () => {
        await request(app.getHttpServer())
          .post('/upload/image')
          .attach('file', Buffer.from('fake-image'), {
            filename: 'test.jpg',
            contentType: 'image/jpeg',
          })
          .expect(401);
      });

      it('should reject upload with invalid file type (422)', async () => {
        await request(app.getHttpServer())
          .post('/upload/image')
          .set('Cookie', [`access_token=${accessToken}`])
          .attach('file', Buffer.from('not-an-image'), {
            filename: 'test.txt',
            contentType: 'text/plain',
          })
          .expect(422);
      });

      it('should reject upload without file (422)', async () => {
        await request(app.getHttpServer())
          .post('/upload/image')
          .set('Cookie', [`access_token=${accessToken}`])
          .expect(422);
      });

      it('should reject upload exceeding 5MB size limit (422)', async () => {
        // Create a buffer slightly over 5MB
        const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 0xff);

        await request(app.getHttpServer())
          .post('/upload/image')
          .set('Cookie', [`access_token=${accessToken}`])
          .attach('file', largeBuffer, {
            filename: 'huge.jpg',
            contentType: 'image/jpeg',
          })
          .expect(422);
      });

      /**
       * Note: Actual S3 upload success test is skipped unless AWS credentials
       * are configured. The upload service will return 500 if S3 is not set up.
       * This test verifies the error path when S3 is not configured.
       */
      it('should handle S3 not configured gracefully (500 or success depending on config)', async () => {
        // Create a minimal valid JPEG (smallest valid JPEG is 107 bytes)
        // This is the JFIF minimal JPEG header
        const jpegHeader = Buffer.from([
          0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
          0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
          0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
        ]);

        const res = await request(app.getHttpServer())
          .post('/upload/image')
          .set('Cookie', [`access_token=${accessToken}`])
          .attach('file', jpegHeader, {
            filename: 'test-image.jpg',
            contentType: 'image/jpeg',
          });

        // Either succeeds (S3 configured), file validation fails (422), or S3 not configured (500)
        if (res.status === 201) {
          expect(res.body).toHaveProperty('url');
          expect(typeof res.body.url).toBe('string');
        } else {
          // ParseFilePipeBuilder validation failure (422) or S3 not configured (500)
          expect([422, 500]).toContain(res.status);
        }
      });
    });
  });

  // =========================================================================
  // 4. CLICK LOGS
  // =========================================================================

  describe('Click Logs', () => {
    describe('GET /click-logs/stats/:mechanicId', () => {
      it('should return click statistics for a mechanic', async () => {
        const res = await request(app.getHttpServer())
          .get(`/click-logs/stats/${testMechanicId}`)
          .expect(200);

        expect(res.body).toHaveProperty('totalClicks');
        expect(typeof res.body.totalClicks).toBe('number');
        expect(res.body).toHaveProperty('dailyStats');
        expect(typeof res.body.dailyStats).toBe('object');
        expect(res.body).toHaveProperty('recentLogs');
        expect(Array.isArray(res.body.recentLogs)).toBe(true);
        // recentLogs should be at most 10
        expect(res.body.recentLogs.length).toBeLessThanOrEqual(10);
      });

      it('should return empty stats for a mechanic with no clicks', async () => {
        // Create a fresh mechanic with no clicks
        const freshMechanic = await prisma.mechanic.create({
          data: {
            name: 'No Clicks Mechanic',
            location: '용산구',
            phone: '02-3333-4444',
            address: '서울시 용산구 한남동 1',
            mapLat: 37.5340,
            mapLng: 126.9973,
            isActive: true,
          },
        });

        try {
          const res = await request(app.getHttpServer())
            .get(`/click-logs/stats/${freshMechanic.id}`)
            .expect(200);

          expect(res.body.totalClicks).toBe(0);
          expect(res.body.recentLogs).toEqual([]);
          expect(res.body.dailyStats).toEqual({});
        } finally {
          await prisma.mechanic.delete({ where: { id: freshMechanic.id } });
        }
      });

      it('should return 400 for non-numeric mechanicId', async () => {
        await request(app.getHttpServer())
          .get('/click-logs/stats/not-a-number')
          .expect(400);
      });
    });
  });

  // =========================================================================
  // 5. ANALYTICS API
  // =========================================================================

  describe('Analytics API', () => {
    // -----------------------------------------------------------------------
    // POST /analytics/pageview (public, bot detection)
    // -----------------------------------------------------------------------
    describe('POST /analytics/pageview', () => {
      it('should track a pageview with browser UA', async () => {
        const res = await request(app.getHttpServer())
          .post('/analytics/pageview')
          .set('User-Agent', BROWSER_USER_AGENT)
          .send({ path: '/test-page', referer: 'https://google.com' })
          .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('path', '/test-page');
        expect(res.body).toHaveProperty('isBot', false);
        expect(res.body).toHaveProperty('referer', 'https://google.com');
      });

      it('should mark bot pageview correctly', async () => {
        const res = await request(app.getHttpServer())
          .post('/analytics/pageview')
          .set('User-Agent', BOT_USER_AGENT)
          .send({ path: '/bot-visited' })
          .expect(201);

        expect(res.body).toHaveProperty('isBot', true);
      });

      it('should reject pageview without User-Agent (400)', async () => {
        await request(app.getHttpServer())
          .post('/analytics/pageview')
          .unset('User-Agent')
          .send({ path: '/no-ua' })
          .expect(400);
      });

      it('should track pageview without referer', async () => {
        const res = await request(app.getHttpServer())
          .post('/analytics/pageview')
          .set('User-Agent', BROWSER_USER_AGENT)
          .send({ path: '/no-referer' })
          .expect(201);

        expect(res.body).toHaveProperty('path', '/no-referer');
        // referer should be null or undefined
        expect(res.body.referer).toBeFalsy();
      });
    });

    // -----------------------------------------------------------------------
    // GET /analytics/site-stats (JWT required)
    // -----------------------------------------------------------------------
    describe('GET /analytics/site-stats', () => {
      it('should return site stats with valid JWT', async () => {
        const res = await request(app.getHttpServer())
          .get('/analytics/site-stats')
          .set('Cookie', [`access_token=${accessToken}`])
          .expect(200);

        expect(res.body).toHaveProperty('totalPageViews');
        expect(typeof res.body.totalPageViews).toBe('number');
        expect(res.body).toHaveProperty('uniqueVisitors');
        expect(typeof res.body.uniqueVisitors).toBe('number');
        expect(res.body).toHaveProperty('avgViewsPerDay');
        expect(res.body).toHaveProperty('dailyStats');
        expect(Array.isArray(res.body.dailyStats)).toBe(true);
        expect(res.body).toHaveProperty('topPages');
        expect(Array.isArray(res.body.topPages)).toBe(true);
      });

      it('should accept optional days query parameter', async () => {
        const res = await request(app.getHttpServer())
          .get('/analytics/site-stats?days=7')
          .set('Cookie', [`access_token=${accessToken}`])
          .expect(200);

        expect(res.body).toHaveProperty('totalPageViews');
      });

      it('should reject request without authentication (401)', async () => {
        await request(app.getHttpServer())
          .get('/analytics/site-stats')
          .expect(401);
      });
    });

    // -----------------------------------------------------------------------
    // GET /analytics/mechanic/:id/monthly (JWT required)
    // -----------------------------------------------------------------------
    describe('GET /analytics/mechanic/:id/monthly', () => {
      it('should return monthly click data for a mechanic', async () => {
        const res = await request(app.getHttpServer())
          .get(`/analytics/mechanic/${testMechanicId}/monthly`)
          .set('Cookie', [`access_token=${accessToken}`])
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        // Each entry should have month and clicks
        for (const entry of res.body) {
          expect(entry).toHaveProperty('month');
          expect(entry).toHaveProperty('clicks');
          expect(typeof entry.clicks).toBe('number');
          // month format: YYYY-MM
          expect(entry.month).toMatch(/^\d{4}-\d{2}$/);
        }
      });

      it('should accept optional months query parameter', async () => {
        const res = await request(app.getHttpServer())
          .get(`/analytics/mechanic/${testMechanicId}/monthly?months=3`)
          .set('Cookie', [`access_token=${accessToken}`])
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
      });

      it('should reject request without authentication (401)', async () => {
        await request(app.getHttpServer())
          .get(`/analytics/mechanic/${testMechanicId}/monthly`)
          .expect(401);
      });

      it('should return 400 for non-numeric mechanic id', async () => {
        await request(app.getHttpServer())
          .get('/analytics/mechanic/abc/monthly')
          .set('Cookie', [`access_token=${accessToken}`])
          .expect(400);
      });
    });

    // -----------------------------------------------------------------------
    // GET /analytics/all-mechanics-monthly (JWT required)
    // -----------------------------------------------------------------------
    describe('GET /analytics/all-mechanics-monthly', () => {
      it('should return monthly click data for all mechanics', async () => {
        const res = await request(app.getHttpServer())
          .get('/analytics/all-mechanics-monthly')
          .set('Cookie', [`access_token=${accessToken}`])
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        // Each entry should have mechanicId, mechanicName, and monthlyClicks
        for (const entry of res.body) {
          expect(entry).toHaveProperty('mechanicId');
          expect(entry).toHaveProperty('mechanicName');
          expect(entry).toHaveProperty('monthlyClicks');
          expect(Array.isArray(entry.monthlyClicks)).toBe(true);
        }
      });

      it('should accept optional months query parameter', async () => {
        await request(app.getHttpServer())
          .get('/analytics/all-mechanics-monthly?months=12')
          .set('Cookie', [`access_token=${accessToken}`])
          .expect(200);
      });

      it('should reject request without authentication (401)', async () => {
        await request(app.getHttpServer())
          .get('/analytics/all-mechanics-monthly')
          .expect(401);
      });
    });

    // -----------------------------------------------------------------------
    // GET /analytics/top-mechanics (JWT required)
    // -----------------------------------------------------------------------
    describe('GET /analytics/top-mechanics', () => {
      it('should return top mechanics by realtime (default period)', async () => {
        const res = await request(app.getHttpServer())
          .get('/analytics/top-mechanics')
          .set('Cookie', [`access_token=${accessToken}`])
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        // Each entry should have mechanic info
        for (const entry of res.body) {
          expect(entry).toHaveProperty('id');
          expect(entry).toHaveProperty('name');
          expect(entry).toHaveProperty('clickCount');
        }
      });

      it('should return top mechanics by daily period', async () => {
        const res = await request(app.getHttpServer())
          .get('/analytics/top-mechanics?period=daily&limit=3&days=30')
          .set('Cookie', [`access_token=${accessToken}`])
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeLessThanOrEqual(3);
      });

      it('should return top mechanics by monthly period', async () => {
        const res = await request(app.getHttpServer())
          .get('/analytics/top-mechanics?period=monthly&limit=5&months=6')
          .set('Cookie', [`access_token=${accessToken}`])
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
      });

      it('should reject request without authentication (401)', async () => {
        await request(app.getHttpServer())
          .get('/analytics/top-mechanics')
          .expect(401);
      });

      it('should handle limit and days parameters correctly', async () => {
        // limit should be clamped between 1 and 100
        const res = await request(app.getHttpServer())
          .get('/analytics/top-mechanics?period=realtime&limit=200')
          .set('Cookie', [`access_token=${accessToken}`])
          .expect(200);

        // Result should have at most 100 entries (clamped)
        expect(res.body.length).toBeLessThanOrEqual(100);
      });
    });
  });

  // =========================================================================
  // 6. CROSS-CUTTING CONCERNS
  // =========================================================================

  describe('Cross-Cutting Concerns', () => {
    describe('Bot Detection Guard', () => {
      it('should detect bots with no browser/OS info in UA', async () => {
        // UA string that has no recognizable browser or OS
        await cacheService.reset();

        const res = await request(app.getHttpServer())
          .post(`/mechanics/${testMechanicId}/click`)
          .set('User-Agent', 'CustomHttpClient/1.0')
          .expect(201);

        const latestLog = await prisma.clickLog.findFirst({
          where: { mechanicId: testMechanicId },
          orderBy: { clickedAt: 'desc' },
        });
        expect(latestLog!.isBot).toBe(true);
      });
    });

    describe('ParseIntPipe validation', () => {
      it('should reject float values as id parameters', async () => {
        await request(app.getHttpServer())
          .get('/mechanics/3.14')
          .expect(400);
      });

      it('should reject negative values as id parameters', async () => {
        // Negative values may pass ParseIntPipe but result in 404
        const res = await request(app.getHttpServer())
          .get('/mechanics/-1');

        // Either 400 (parse fails) or 404 (not found) is acceptable
        expect([400, 404]).toContain(res.status);
      });
    });

    describe('Cookie-based authentication', () => {
      it('should accept JWT from cookie over Authorization header', async () => {
        // If both cookie and header are provided, cookie should take precedence
        const res = await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Cookie', [`access_token=${accessToken}`])
          .set('Authorization', 'Bearer invalid-token')
          .expect(200);

        expect(res.body).toHaveProperty('email', 'test-integration@dreaming-mech.com');
      });
    });

    describe('CORS and general API behavior', () => {
      it('should return proper response for health check (GET /)', async () => {
        const res = await request(app.getHttpServer())
          .get('/')
          .expect(200);

        // AppController returns 'Hello World!'
        expect(res.text).toBe('Hello World!');
      });
    });
  });
}, SUITE_TIMEOUT);
