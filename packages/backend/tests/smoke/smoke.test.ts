import request from 'supertest';
import app from '../../src/index';

describe('Smoke Tests', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  const testApp = process.env.BASE_URL ? undefined : app;

  describe('Basic API Health', () => {
    it('should respond to health check', async () => {
      const response = testApp
        ? await request(testApp).get('/health')
        : await request(baseUrl).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should respond to API info endpoint', async () => {
      const response = testApp
        ? await request(testApp).get('/api/info')
        : await request(baseUrl).get('/api/info');

      if (response.status === 200) {
        expect(response.body).toHaveProperty('name', 'Vangarments API');
        expect(response.body).toHaveProperty('version');
      }
    });
  });

  describe('Authentication', () => {
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

      expect([400, 401]).toContain(response.status);
    });
  });

  describe('Headers', () => {
    it('should include security headers', async () => {
      const response = testApp
        ? await request(testApp).get('/health')
        : await request(baseUrl).get('/health');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('x-content-type-options');
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
      expect(responseTime).toBeLessThan(5000);
    });
  });
});