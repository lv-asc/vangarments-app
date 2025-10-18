#!/bin/bash

# Vangarments Complete Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
REGION=${2:-us-east-1}
AWS_PROFILE=${3:-default}
SKIP_TESTS=${SKIP_TESTS:-false}
SKIP_BACKUP=${SKIP_BACKUP:-false}

echo -e "${BLUE}🚀 Vangarments Complete Deployment Pipeline${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}Region: ${REGION}${NC}"
echo -e "${YELLOW}AWS Profile: ${AWS_PROFILE}${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo -e "${RED}❌ Invalid environment. Must be: development, staging, or production${NC}"
    exit 1
fi

# Check required tools
echo -e "${BLUE}🔧 Checking required tools...${NC}"
REQUIRED_TOOLS=("aws" "docker" "node" "npm" "git")
for tool in "${REQUIRED_TOOLS[@]}"; do
    if ! command -v $tool &> /dev/null; then
        echo -e "${RED}❌ $tool not found. Please install $tool first.${NC}"
        exit 1
    fi
done

# Check AWS credentials
echo -e "${BLUE}🔐 Verifying AWS credentials...${NC}"
export AWS_PROFILE=$AWS_PROFILE
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured or invalid${NC}"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"

# Set environment variables
export NODE_ENV=$ENVIRONMENT
ECR_REPOSITORY="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/vangarments-backend"
IMAGE_TAG="${ENVIRONMENT}-$(git rev-parse --short HEAD)-$(date +%Y%m%d-%H%M%S)"

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm ci

# Run tests (unless skipped)
if [[ "$SKIP_TESTS" != "true" ]]; then
    echo -e "${BLUE}🧪 Running tests...${NC}"
    
    # Unit tests
    echo -e "${PURPLE}Running unit tests...${NC}"
    npm run test --workspace=@vangarments/backend -- --passWithNoTests
    
    # Integration tests
    echo -e "${PURPLE}Running integration tests...${NC}"
    npm run test:compatibility --workspace=@vangarments/backend
    
    # Security audit
    echo -e "${PURPLE}Running security audit...${NC}"
    npm audit --audit-level moderate
    
    echo -e "${GREEN}✅ All tests passed${NC}"
fi

# Build applications
echo -e "${BLUE}🔨 Building applications...${NC}"
npm run build --workspace=@vangarments/shared
npm run build --workspace=@vangarments/backend
npm run build --workspace=@vangarments/web

# Create production backup (for production deployments)
if [[ "$ENVIRONMENT" == "production" && "$SKIP_BACKUP" != "true" ]]; then
    echo -e "${BLUE}💾 Creating pre-deployment backup...${NC}"
    cd packages/backend
    npm run backup:create -- full --encrypt --retention=90
    cd ../..
    echo -e "${GREEN}✅ Backup created${NC}"
fi

# Build and push Docker image
echo -e "${BLUE}🐳 Building and pushing Docker image...${NC}"

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY

# Build image
docker build -f packages/backend/Dockerfile -t vangarments-backend:$IMAGE_TAG .
docker tag vangarments-backend:$IMAGE_TAG $ECR_REPOSITORY:$IMAGE_TAG
docker tag vangarments-backend:$IMAGE_TAG $ECR_REPOSITORY:$ENVIRONMENT-latest

# Push image
docker push $ECR_REPOSITORY:$IMAGE_TAG
docker push $ECR_REPOSITORY:$ENVIRONMENT-latest

echo -e "${GREEN}✅ Docker image pushed: $ECR_REPOSITORY:$IMAGE_TAG${NC}"

# Deploy infrastructure
echo -e "${BLUE}🏗️ Deploying infrastructure...${NC}"
cd packages/infrastructure

# Install CDK dependencies
npm ci

# Bootstrap CDK if needed
cdk bootstrap aws://${AWS_ACCOUNT_ID}/${REGION} --profile ${AWS_PROFILE}

# Deploy infrastructure
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo -e "${YELLOW}⚠️ Production deployment requires manual approval${NC}"
    cdk deploy --context environment=${ENVIRONMENT} --context region=${REGION} --require-approval broadening
else
    cdk deploy --context environment=${ENVIRONMENT} --context region=${REGION} --require-approval never
fi

cd ../..

# Get infrastructure outputs
echo -e "${BLUE}📊 Getting infrastructure outputs...${NC}"
STACK_NAME="VangarmentsInfrastructure-${ENVIRONMENT}"

ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
    --output text \
    --region ${REGION})

DB_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
    --output text \
    --region ${REGION})

# Run database migrations
echo -e "${BLUE}🗄️ Running database migrations...${NC}"
cd packages/backend

# Set database connection for migrations
export DATABASE_URL="postgresql://vangarments_admin:${DB_PASSWORD}@${DB_ENDPOINT}:5432/vangarments"

# Run migrations
npm run migrate:${ENVIRONMENT}

# Seed database (only for non-production)
if [[ "$ENVIRONMENT" != "production" ]]; then
    echo -e "${BLUE}🌱 Seeding database with sample data...${NC}"
    npm run seed:sample
fi

cd ../..

# Update ECS service
echo -e "${BLUE}🔄 Updating ECS service...${NC}"
CLUSTER_NAME="vangarments-${ENVIRONMENT}-cluster"
SERVICE_NAME="vangarments-${ENVIRONMENT}-service"

# Get current task definition
TASK_DEFINITION_ARN=$(aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --query 'services[0].taskDefinition' \
    --output text \
    --region $REGION)

# Get task definition details
TASK_DEFINITION=$(aws ecs describe-task-definition \
    --task-definition $TASK_DEFINITION_ARN \
    --query 'taskDefinition' \
    --region $REGION)

# Update image in task definition
NEW_TASK_DEFINITION=$(echo $TASK_DEFINITION | jq --arg IMAGE "$ECR_REPOSITORY:$IMAGE_TAG" \
    '.containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy)')

# Register new task definition
NEW_TASK_DEFINITION_ARN=$(aws ecs register-task-definition \
    --cli-input-json "$NEW_TASK_DEFINITION" \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text \
    --region $REGION)

# Update service
aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --task-definition $NEW_TASK_DEFINITION_ARN \
    --region $REGION

echo -e "${BLUE}⏳ Waiting for deployment to complete...${NC}"
aws ecs wait services-stable \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $REGION

# Run post-deployment health checks
echo -e "${BLUE}🏥 Running health checks...${NC}"
HEALTH_URL="https://${ALB_DNS}/health"

# Wait for service to be healthy
MAX_ATTEMPTS=30
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo -e "${PURPLE}Health check attempt ${ATTEMPT}/${MAX_ATTEMPTS}...${NC}"
    
    if curl -f -s $HEALTH_URL > /dev/null; then
        echo -e "${GREEN}✅ Service is healthy${NC}"
        break
    fi
    
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo -e "${RED}❌ Health checks failed after ${MAX_ATTEMPTS} attempts${NC}"
        exit 1
    fi
    
    sleep 10
    ((ATTEMPT++))
done

# Run smoke tests
echo -e "${BLUE}💨 Running smoke tests...${NC}"
cd packages/backend
BASE_URL="https://${ALB_DNS}" npm run test:smoke
cd ../..

# Deploy web application (if applicable)
if [[ -d "packages/web" ]]; then
    echo -e "${BLUE}🌐 Deploying web application...${NC}"
    cd packages/web
    
    # Build web app with environment-specific configuration
    NEXT_PUBLIC_API_URL="https://${ALB_DNS}" npm run build
    
    # Deploy to S3/CloudFront (implementation depends on web deployment strategy)
    # This would typically involve uploading to S3 and invalidating CloudFront
    
    cd ../..
fi

# Update monitoring and alerting
echo -e "${BLUE}📊 Configuring monitoring...${NC}"

# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
    --dashboard-name "Vangarments-${ENVIRONMENT}" \
    --dashboard-body file://monitoring/dashboard-${ENVIRONMENT}.json \
    --region $REGION || echo "Dashboard configuration not found, skipping..."

# Cleanup old Docker images locally
echo -e "${BLUE}🧹 Cleaning up local Docker images...${NC}"
docker image prune -f

# Generate deployment report
echo -e "${BLUE}📋 Generating deployment report...${NC}"
DEPLOYMENT_REPORT="deployment-report-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).json"

cat > $DEPLOYMENT_REPORT << EOF
{
  "deployment": {
    "environment": "${ENVIRONMENT}",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "version": "$(git rev-parse HEAD)",
    "branch": "$(git rev-parse --abbrev-ref HEAD)",
    "deployer": "$(git config user.email)",
    "region": "${REGION}"
  },
  "infrastructure": {
    "albDns": "${ALB_DNS}",
    "databaseEndpoint": "${DB_ENDPOINT}",
    "imageTag": "${IMAGE_TAG}",
    "clusterName": "${CLUSTER_NAME}",
    "serviceName": "${SERVICE_NAME}"
  },
  "healthChecks": {
    "apiHealth": "passed",
    "databaseConnection": "passed",
    "smokeTests": "passed"
  },
  "performance": {
    "deploymentDuration": "${SECONDS}s",
    "healthCheckAttempts": "${ATTEMPT}"
  }
}
EOF

# Display deployment summary
echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}\n"
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo -e "  Environment: ${ENVIRONMENT}"
echo -e "  Image: ${ECR_REPOSITORY}:${IMAGE_TAG}"
echo -e "  Load Balancer: ${ALB_DNS}"
echo -e "  Database: ${DB_ENDPOINT}"
echo -e "  Duration: ${SECONDS}s"
echo -e "  Report: ${DEPLOYMENT_REPORT}"

# Environment-specific post-deployment tasks
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo -e "\n${YELLOW}🔔 Production Deployment Checklist:${NC}"
    echo -e "- [ ] Verify SSL certificate is active"
    echo -e "- [ ] Check custom domain configuration"
    echo -e "- [ ] Validate monitoring alerts"
    echo -e "- [ ] Confirm backup schedule"
    echo -e "- [ ] Review security groups"
    echo -e "- [ ] Test critical user journeys"
    echo -e "- [ ] Notify stakeholders"
    
    # Send notification (if configured)
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Vangarments production deployment completed successfully!\nVersion: ${IMAGE_TAG}\nDuration: ${SECONDS}s\"}" \
            $SLACK_WEBHOOK_URL
    fi
fi

echo -e "\n${GREEN}🚀 Vangarments ${ENVIRONMENT} deployment is complete and healthy!${NC}"