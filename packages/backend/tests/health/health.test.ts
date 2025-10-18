import request from 'supertest';
import { app } from '../../src/index-minimal';

describe('Health Check Tests', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  const testApp = process.env.BASE_URL ? undefined : app;

  describe('Application Health', () => {
    it('should return comprehensive health status', async () => {
      const response = testApp
        ? await request(testApp).get('/health/detailed')
        : await request(baseUrl).get('/health/detailed');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: expect.stringMatching(/^(ok|degraded|error)$/),
        timestamp: expect.any(String),
        environment: expect.any(String),
        version: expect.any(String),
        uptime: expect.any(Number),
        checks: expect.objectContaining({
          database: expect.objectContaining({
            status: expect.stringMatching(/^(ok|error)$/),
            responseTime: expect.any(Number)
          }),
          redis: expect.objectContaining({
            status: expect.stringMatching(/^(ok|error)$/),
            responseTime: expect.any(Number)
          }),
          memory: expect.objectContaining({
            status: expect.stringMatching(/^(ok|warning|error)$/),
            usage: expect.any(Number),
            limit: expect.any(Number)
          }),
          disk: expect.objectContaining({
            status: expect.stringMatching(/^(ok|warning|error)$/),
            usage: expect.any(Number)
          })
        })
      });
    });

    it('should check database connection health', async () => {
      const response = testApp
        ? await request(testApp).get('/health/database')
        : await request(baseUrl).get('/health/database');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        database: 'connected',
        responseTime: expect.any(Number),
        activeConnections: expect.any(Number),
        maxConnections: expect.any(Number)
      });
    });

    it('should check Redis connection health', async () => {
      const response = testApp
        ? await request(testApp).get('/health/redis')
        : await request(baseUrl).get('/health/redis');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        redis: 'connected',
        responseTime: expect.any(Number),
        memory: expect.any(String),
        connectedClients: expect.any(Number)
      });
    });
  });

  describe('External Dependencies', () => {
    it('should check AWS S3 connectivity', async () => {
      const response = testApp
        ? await request(testApp).get('/health/s3')
        : await request(baseUrl).get('/health/s3');
      
      expect([200, 503]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toMatchObject({
          s3: 'connected',
          buckets: expect.objectContaining({
            images: expect.any(String),
            backups: expect.any(String)
          })
        });
      }
    });

    it('should check AI services availability', async () => {
      const response = testApp
        ? await request(testApp).get('/health/ai')
        : await request(baseUrl).get('/health/ai');
      
      expect([200, 503]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toMatchObject({
          rekognition: expect.stringMatching(/^(available|unavailable)$/),
          sagemaker: expect.stringMatching(/^(available|unavailable)$/)
        });
      }
    });
  });

  describe('System Resources', () => {
    it('should monitor memory usage', async () => {
      const response = testApp
        ? await request(testApp).get('/health/memory')
        : await request(baseUrl).get('/health/memory');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        memory: expect.objectContaining({
          used: expect.any(Number),
          total: expect.any(Number),
          percentage: expect.any(Number),
          status: expect.stringMatching(/^(ok|warning|critical)$/)
        }),
        heap: expect.objectContaining({
          used: expect.any(Number),
          total: expect.any(Number),
          percentage: expect.any(Number)
        })
      });
    });

    it('should monitor CPU usage', async () => {
      const response = testApp
        ? await request(testApp).get('/health/cpu')
        : await request(baseUrl).get('/health/cpu');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        cpu: expect.objectContaining({
          usage: expect.any(Number),
          loadAverage: expect.any(Array),
          status: expect.stringMatching(/^(ok|warning|critical)$/)
        })
      });
    });
  });

  describe('Application Metrics', () => {
    it('should provide request metrics', async () => {
      const response = testApp
        ? await request(testApp).get('/health/metrics')
        : await request(baseUrl).get('/health/metrics');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        requests: expect.objectContaining({
          total: expect.any(Number),
          successful: expect.any(Number),
          failed: expect.any(Number),
          averageResponseTime: expect.any(Number)
        }),
        errors: expect.objectContaining({
          total: expect.any(Number),
          rate: expect.any(Number)
        })
      });
    });

    it('should provide feature flags status', async () => {
      const response = testApp
        ? await request(testApp).get('/health/features')
        : await request(baseUrl).get('/health/features');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        features: expect.objectContaining({
          aiProcessing: expect.any(Boolean),
          marketplace: expect.any(Boolean),
          socialFeatures: expect.any(Boolean),
          betaFeatures: expect.any(Boolean)
        })
      });
    });
  });

  describe('Security Health', () => {
    it('should check security configurations', async () => {
      const response = testApp
        ? await request(testApp).get('/health/security')
        : await request(baseUrl).get('/health/security');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        security: expect.objectContaining({
          https: expect.any(Boolean),
          helmet: expect.any(Boolean),
          cors: expect.any(Boolean),
          rateLimiting: expect.any(Boolean),
          authentication: expect.any(Boolean)
        }),
        compliance: expect.objectContaining({
          lgpd: expect.any(Boolean),
          dataEncryption: expect.any(Boolean),
          auditLogging: expect.any(Boolean)
        })
      });
    });
  });

  describe('Readiness Checks', () => {
    it('should indicate when application is ready', async () => {
      const response = testApp
        ? await request(testApp).get('/ready')
        : await request(baseUrl).get('/ready');
      
      expect([200, 503]).toContain(response.status);
      
      expect(response.body).toMatchObject({
        ready: expect.any(Boolean),
        checks: expect.objectContaining({
          database: expect.any(Boolean),
          migrations: expect.any(Boolean),
          cache: expect.any(Boolean)
        })
      });
    });

    it('should indicate liveness', async () => {
      const response = testApp
        ? await request(testApp).get('/live')
        : await request(baseUrl).get('/live');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        alive: true,
        timestamp: expect.any(String)
      });
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet response time requirements', async () => {
      const iterations = 10;
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = testApp
          ? await request(testApp).get('/health')
          : await request(baseUrl).get('/health');
        
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
        
        expect(response.status).toBe(200);
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      // Performance requirements
      expect(averageResponseTime).toBeLessThan(500); // 500ms average
      expect(maxResponseTime).toBeLessThan(2000); // 2s max
    });

    it('should handle concurrent requests', async () => {
      const concurrentRequests = 20;
      const requests = Array(concurrentRequests).fill(null).map(() =>
        testApp
          ? request(testApp).get('/health')
          : request(baseUrl).get('/health')
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should handle concurrent load efficiently
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 20 concurrent requests
    });
  });
});