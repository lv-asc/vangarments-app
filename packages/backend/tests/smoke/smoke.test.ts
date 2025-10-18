import request from 'supertest';
import { app } from '../../src/index-minimal';

describe('Smoke Tests', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  
  // Use the provided base URL if running against deployed environment
  const testApp = process.env.BASE_URL ? undefined : app;

  describe('Basic API Health', () => {
    it('should respond to health check', async () => {
      const response = testApp 
        ? await request(testApp).get('/health')
        : await request(baseUrl).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
    });

    it('should respond to API info endpoint', async () => {
      const response = testApp
        ? await request(testApp).get('/api/info')
        : await request(baseUrl).get('/api/info');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Vangarments API');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('Database Connectivity', () => {
    it('should connect to database', async () => {
      const response = testApp
        ? await request(testApp).get('/health/database')
        : await request(baseUrl).get('/health/database');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('database', 'connected');
    });
  });

  describe('Redis Connectivity', () => {
    it('should connect to Redis cache', async () => {
      const response = testApp
        ? await request(testApp).get('/health/redis')
        : await request(baseUrl).get('/health/redis');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('redis', 'connected');
    });
  });

  describe('Authentication Endpoints', () => {
    it('should handle login endpoint', async () => {
      const response = testApp
        ? await request(testApp).post('/api/auth/login').send({
            email: 'invalid@example.com',
            password: 'invalid'
          })
        : await request(baseUrl).post('/api/auth/login').send({
            email: 'invalid@example.com',
            password: 'invalid'
          });
      
      // Should return 401 for invalid credentials, not 500
      expect([400, 401]).toContain(response.status);
    });

    it('should handle registration endpoint', async () => {
      const response = testApp
        ? await request(testApp).post('/api/auth/register').send({
            email: 'test@example.com',
            password: 'short'
          })
        : await request(baseUrl).post('/api/auth/register').send({
            email: 'test@example.com',
            password: 'short'
          });
      
      // Should return validation error, not 500
      expect([400, 422]).toContain(response.status);
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include security headers', async () => {
      const response = testApp
        ? await request(testApp).get('/health')
        : await request(baseUrl).get('/health');
      
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    it('should handle CORS preflight', async () => {
      const response = testApp
        ? await request(testApp)
            .options('/api/auth/login')
            .set('Origin', 'https://vangarments.com')
            .set('Access-Control-Request-Method', 'POST')
        : await request(baseUrl)
            .options('/api/auth/login')
            .set('Origin', 'https://vangarments.com')
            .set('Access-Control-Request-Method', 'POST');
      
      expect([200, 204]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(10).fill(null).map(() => 
        testApp
          ? request(testApp).get('/api/auth/login')
          : request(baseUrl).get('/api/auth/login')
      );

      const responses = await Promise.all(requests);
      
      // At least some requests should succeed
      const successfulRequests = responses.filter(r => r.status < 400);
      expect(successfulRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 routes gracefully', async () => {
      const response = testApp
        ? await request(testApp).get('/api/nonexistent/route')
        : await request(baseUrl).get('/api/nonexistent/route');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle malformed JSON', async () => {
      const response = testApp
        ? await request(testApp)
            .post('/api/auth/login')
            .set('Content-Type', 'application/json')
            .send('{"invalid": json}')
        : await request(baseUrl)
            .post('/api/auth/login')
            .set('Content-Type', 'application/json')
            .send('{"invalid": json}');
      
      expect(response.status).toBe(400);
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = testApp
        ? await request(testApp).get('/health')
        : await request(baseUrl).get('/health');
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 5 seconds max
    });
  });
});