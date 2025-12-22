import request from 'supertest';
import app from '../../src/index';

describe('Health Check Tests', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  const testApp = process.env.BASE_URL ? undefined : app;


  describe('Application Health', () => {
    it('should return health status at root health endpoint', async () => {
      const response = testApp
        ? await request(testApp).get('/health')
        : await request(baseUrl).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        version: '1.0.0',
        timestamp: expect.any(String)
      });
    });
  });
});