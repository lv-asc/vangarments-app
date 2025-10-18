# Vangarments Deployment Guide

This document provides comprehensive instructions for deploying and managing the Vangarments platform across different environments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Deployment Process](#deployment-process)
- [Database Management](#database-management)
- [Backup and Recovery](#backup-and-recovery)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Troubleshooting](#troubleshooting)

## Overview

The Vangarments platform uses a comprehensive DevOps pipeline that includes:

- **Infrastructure as Code** using AWS CDK
- **Containerized Applications** with Docker and ECS
- **Database Migrations** with automated versioning
- **Automated Backups** with S3 storage
- **Comprehensive Monitoring** with CloudWatch
- **Blue-Green Deployments** for zero-downtime updates

## Prerequisites

### Required Tools

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install AWS CDK
npm install -g aws-cdk

# Install Docker
# Follow instructions at https://docs.docker.com/get-docker/

# Verify installations
aws --version
cdk --version
docker --version
node --version
npm --version
```

### AWS Configuration

```bash
# Configure AWS credentials
aws configure --profile vangarments-prod
aws configure --profile vangarments-staging

# Verify access
aws sts get-caller-identity --profile vangarments-prod
```

### Environment Variables

Create environment-specific configuration files:

```bash
# Copy example files
cp packages/backend/.env.example packages/backend/.env.staging
cp packages/backend/.env.example packages/backend/.env.production

# Edit with environment-specific values
vim packages/backend/.env.staging
vim packages/backend/.env.production
```

## Environment Configuration

### Staging Environment

```bash
# Deploy to staging
./scripts/deploy.sh staging us-east-1 vangarments-staging

# Environment characteristics:
# - Single AZ deployment
# - Smaller instance sizes
# - Reduced backup retention
# - Development features enabled
```

### Production Environment

```bash
# Deploy to production (requires confirmation)
./scripts/deploy.sh production us-east-1 vangarments-prod

# Environment characteristics:
# - Multi-AZ deployment
# - Production-grade instances
# - Extended backup retention
# - Enhanced security measures
```

## Deployment Process

### Automated Deployment (Recommended)

The complete deployment process is automated through GitHub Actions:

1. **Push to `develop` branch** → Triggers staging deployment
2. **Push to `main` branch** → Triggers production deployment

### Manual Deployment

For manual deployments or troubleshooting:

```bash
# Full deployment
./scripts/deploy.sh <environment> [region] [aws-profile]

# Skip tests (for hotfixes)
SKIP_TESTS=true ./scripts/deploy.sh production

# Skip backup (for staging)
SKIP_BACKUP=true ./scripts/deploy.sh staging
```

### Deployment Steps

1. **Pre-deployment Checks**
   - Verify AWS credentials
   - Run test suite
   - Security audit
   - Build applications

2. **Infrastructure Deployment**
   - Deploy/update AWS infrastructure
   - Configure networking and security
   - Set up monitoring and alerting

3. **Application Deployment**
   - Build and push Docker images
   - Run database migrations
   - Update ECS services
   - Perform health checks

4. **Post-deployment Validation**
   - Run smoke tests
   - Verify monitoring
   - Generate deployment report

## Database Management

### Migrations

```bash
# Run migrations
npm run migrate --workspace=@vangarments/backend

# Environment-specific migrations
npm run migrate:staging
npm run migrate:production

# Check migration status
npm run migrate:status

# Rollback migrations
npm run migrate:rollback [target-migration-id]
```

### Seeding

```bash
# Seed with sample data (development/staging)
npm run seed:sample --workspace=@vangarments/backend

# Run all seed files
npm run seed all --workspace=@vangarments/backend

# Force re-seed
npm run seed all --force --workspace=@vangarments/backend
```

### Migration Best Practices

1. **Always test migrations in staging first**
2. **Create rollback scripts for destructive changes**
3. **Use transactions for complex migrations**
4. **Backup database before production migrations**

## Backup and Recovery

### Automated Backups

```bash
# Create full backup
npm run backup:create full --workspace=@vangarments/backend

# Create encrypted backup
npm run backup:create full --encrypt --workspace=@vangarments/backend

# List available backups
npm run backup list --workspace=@vangarments/backend

# Cleanup old backups
npm run backup cleanup 30 --workspace=@vangarments/backend
```

### Disaster Recovery

```bash
# Rollback application
./scripts/rollback.sh <environment> <target-version>

# Restore database backup
npm run backup:restore <backup-file> --workspace=@vangarments/backend

# Example rollback procedure
./scripts/rollback.sh production abc123f us-east-1 vangarments-prod
```

### Backup Schedule

- **Production**: Daily automated backups at 2 AM UTC
- **Staging**: Weekly automated backups
- **Retention**: 90 days for production, 30 days for staging

## Monitoring and Alerting

### CloudWatch Dashboards

- **Production**: `Vangarments-production`
- **Staging**: `Vangarments-staging`

### Key Metrics Monitored

1. **Application Performance**
   - Response times
   - Error rates
   - Request volume
   - CPU/Memory usage

2. **Infrastructure Health**
   - Database performance
   - Cache hit rates
   - Storage usage
   - Network throughput

3. **Business Metrics**
   - User registrations
   - Item uploads
   - Marketplace transactions
   - Active users

### Alerts Configuration

Critical alerts are sent to:
- Slack channel: `#vangarments-alerts`
- Email: `alerts@vangarments.com`
- PagerDuty (production only)

### Health Checks

```bash
# Application health
curl https://api.vangarments.com/health

# Detailed health check
curl https://api.vangarments.com/health/detailed

# Database connectivity
curl https://api.vangarments.com/health/database

# Run health tests
npm run test:health --workspace=@vangarments/backend
```

## Troubleshooting

### Common Issues

#### Deployment Failures

```bash
# Check ECS service status
aws ecs describe-services --cluster vangarments-production-cluster --services vangarments-production-service

# View ECS logs
aws logs tail /aws/ecs/vangarments-production --follow

# Check task definition
aws ecs describe-task-definition --task-definition vangarments-production:latest
```

#### Database Connection Issues

```bash
# Test database connectivity
npm run migrate:status --workspace=@vangarments/backend

# Check RDS status
aws rds describe-db-instances --db-instance-identifier vangarments-production-db

# View database logs
aws rds describe-db-log-files --db-instance-identifier vangarments-production-db
```

#### Performance Issues

```bash
# Check CloudWatch metrics
aws cloudwatch get-metric-statistics --namespace AWS/ECS --metric-name CPUUtilization

# View application logs
aws logs filter-log-events --log-group-name /aws/ecs/vangarments-production --filter-pattern "ERROR"

# Run performance tests
npm run test:performance --workspace=@vangarments/backend
```

### Emergency Procedures

#### Service Outage

1. **Immediate Response**
   ```bash
   # Check service health
   curl -I https://api.vangarments.com/health
   
   # Scale up service if needed
   aws ecs update-service --cluster vangarments-production-cluster --service vangarments-production-service --desired-count 5
   ```

2. **Rollback if Necessary**
   ```bash
   # Quick rollback to previous version
   ./scripts/rollback.sh production <previous-version>
   ```

3. **Communication**
   - Update status page
   - Notify stakeholders
   - Post in incident channel

#### Database Issues

1. **Read Replica Failover**
   ```bash
   # Promote read replica (if configured)
   aws rds promote-read-replica --db-instance-identifier vangarments-production-replica
   ```

2. **Point-in-Time Recovery**
   ```bash
   # Restore to specific time
   aws rds restore-db-instance-to-point-in-time --source-db-instance-identifier vangarments-production-db --target-db-instance-identifier vangarments-recovery --restore-time 2024-01-01T12:00:00Z
   ```

### Support Contacts

- **DevOps Team**: devops@vangarments.com
- **On-call Engineer**: +55 11 99999-9999
- **AWS Support**: Enterprise Support Plan
- **Emergency Escalation**: CTO@vangarments.com

## Security Considerations

### Access Control

- All production access requires MFA
- Deployment permissions are role-based
- Database access is restricted to specific IPs
- All actions are logged and audited

### Compliance

- LGPD compliance measures are automated
- Data encryption at rest and in transit
- Regular security scans and updates
- Audit logs retained for 7 years

### Best Practices

1. **Never deploy directly to production**
2. **Always test in staging first**
3. **Use least privilege access**
4. **Rotate credentials regularly**
5. **Monitor for security events**

## Performance Optimization

### Scaling Strategies

```bash
# Auto-scaling configuration
aws application-autoscaling register-scalable-target --service-namespace ecs --resource-id service/vangarments-production-cluster/vangarments-production-service --scalable-dimension ecs:service:DesiredCount --min-capacity 2 --max-capacity 10

# Manual scaling
aws ecs update-service --cluster vangarments-production-cluster --service vangarments-production-service --desired-count 5
```

### Cache Optimization

- Redis cache for session data
- CloudFront CDN for static assets
- Application-level caching for API responses
- Database query optimization

### Cost Optimization

- Use Spot instances for non-critical workloads
- Implement lifecycle policies for S3 storage
- Monitor and optimize resource usage
- Regular cost reviews and optimization

---

For additional support or questions, please contact the DevOps team or refer to the internal documentation wiki.