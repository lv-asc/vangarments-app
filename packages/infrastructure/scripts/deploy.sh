#!/bin/bash

# Vangarments Infrastructure Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
REGION=${2:-us-east-1}
AWS_PROFILE=${3:-default}

echo -e "${BLUE}🚀 Deploying Vangarments Infrastructure${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}Region: ${REGION}${NC}"
echo -e "${YELLOW}AWS Profile: ${AWS_PROFILE}${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo -e "${RED}❌ Invalid environment. Must be: development, staging, or production${NC}"
    exit 1
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI first.${NC}"
    exit 1
fi

# Check CDK CLI
if ! command -v cdk &> /dev/null; then
    echo -e "${RED}❌ AWS CDK not found. Installing...${NC}"
    npm install -g aws-cdk
fi

# Set AWS profile
export AWS_PROFILE=$AWS_PROFILE

# Verify AWS credentials
echo -e "${BLUE}🔐 Verifying AWS credentials...${NC}"
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured or invalid${NC}"
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"

# Bootstrap CDK (if needed)
echo -e "${BLUE}🏗️  Bootstrapping CDK...${NC}"
cdk bootstrap aws://${AWS_ACCOUNT_ID}/${REGION} --profile ${AWS_PROFILE}

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Build the project
echo -e "${BLUE}🔨 Building infrastructure...${NC}"
npm run build

# Synthesize CloudFormation template
echo -e "${BLUE}📋 Synthesizing CloudFormation template...${NC}"
cdk synth --context environment=${ENVIRONMENT} --context region=${REGION}

# Deploy infrastructure
echo -e "${BLUE}🚀 Deploying infrastructure...${NC}"
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo -e "${YELLOW}⚠️  Production deployment requires manual approval${NC}"
    cdk deploy --context environment=${ENVIRONMENT} --context region=${REGION} --require-approval broadening
else
    cdk deploy --context environment=${ENVIRONMENT} --context region=${REGION} --require-approval never
fi

# Get outputs
echo -e "${BLUE}📊 Getting deployment outputs...${NC}"
STACK_NAME="VangarmentsInfrastructure-${ENVIRONMENT}"

# Extract important outputs
ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
    --output text \
    --region ${REGION})

CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
    --output text \
    --region ${REGION})

DB_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
    --output text \
    --region ${REGION})

REDIS_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`RedisEndpoint`].OutputValue' \
    --output text \
    --region ${REGION})

IMAGES_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`ImagesBucketName`].OutputValue' \
    --output text \
    --region ${REGION})

# Display results
echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}\n"
echo -e "${BLUE}📋 Infrastructure Details:${NC}"
echo -e "  Load Balancer DNS: ${ALB_DNS}"
echo -e "  CloudFront Domain: ${CLOUDFRONT_DOMAIN}"
echo -e "  Database Endpoint: ${DB_ENDPOINT}"
echo -e "  Redis Endpoint: ${REDIS_ENDPOINT}"
echo -e "  Images S3 Bucket: ${IMAGES_BUCKET}"

# Save outputs to file
OUTPUT_FILE="outputs-${ENVIRONMENT}.json"
cat > ${OUTPUT_FILE} << EOF
{
  "environment": "${ENVIRONMENT}",
  "region": "${REGION}",
  "albDns": "${ALB_DNS}",
  "cloudfrontDomain": "${CLOUDFRONT_DOMAIN}",
  "databaseEndpoint": "${DB_ENDPOINT}",
  "redisEndpoint": "${REDIS_ENDPOINT}",
  "imagesBucket": "${IMAGES_BUCKET}",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo -e "\n${GREEN}✅ Outputs saved to ${OUTPUT_FILE}${NC}"

# Next steps
echo -e "\n${BLUE}🔄 Next Steps:${NC}"
echo -e "1. Build and push Docker image to ECR"
echo -e "2. Update ECS service with new image"
echo -e "3. Run database migrations"
echo -e "4. Configure DNS (if using custom domain)"
echo -e "5. Set up monitoring and alerting"

if [[ "$ENVIRONMENT" == "production" ]]; then
    echo -e "\n${YELLOW}⚠️  Production Checklist:${NC}"
    echo -e "- [ ] SSL certificate configured"
    echo -e "- [ ] Custom domain configured"
    echo -e "- [ ] Monitoring alerts configured"
    echo -e "- [ ] Backup strategy verified"
    echo -e "- [ ] Security groups reviewed"
    echo -e "- [ ] IAM permissions audited"
fi

echo -e "\n${GREEN}🚀 Vangarments infrastructure is ready!${NC}"