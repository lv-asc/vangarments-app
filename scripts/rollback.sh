#!/bin/bash

# Vangarments Rollback Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
TARGET_VERSION=${2}
REGION=${3:-us-east-1}
AWS_PROFILE=${4:-default}

echo -e "${RED}🔄 Vangarments Rollback Procedure${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}Target Version: ${TARGET_VERSION}${NC}"
echo -e "${YELLOW}Region: ${REGION}${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo -e "${RED}❌ Invalid environment. Must be: staging or production${NC}"
    exit 1
fi

# Require target version for rollback
if [[ -z "$TARGET_VERSION" ]]; then
    echo -e "${RED}❌ Target version is required for rollback${NC}"
    echo -e "${YELLOW}Usage: ./rollback.sh <environment> <target-version> [region] [aws-profile]${NC}"
    echo -e "${YELLOW}Example: ./rollback.sh production abc123f${NC}"
    exit 1
fi

# Production rollback requires confirmation
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo -e "${RED}⚠️ WARNING: You are about to rollback PRODUCTION environment${NC}"
    echo -e "${YELLOW}This will:${NC}"
    echo -e "  - Revert application to version: ${TARGET_VERSION}"
    echo -e "  - Potentially rollback database migrations"
    echo -e "  - Cause brief service interruption"
    echo ""
    read -p "Are you sure you want to proceed? (type 'ROLLBACK' to confirm): " confirmation
    
    if [[ "$confirmation" != "ROLLBACK" ]]; then
        echo -e "${YELLOW}Rollback cancelled${NC}"
        exit 0
    fi
fi

# Set AWS profile
export AWS_PROFILE=$AWS_PROFILE

# Verify AWS credentials
echo -e "${BLUE}🔐 Verifying AWS credentials...${NC}"
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured or invalid${NC}"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/vangarments-backend"

# Verify target image exists
echo -e "${BLUE}🔍 Verifying target image exists...${NC}"
if ! aws ecr describe-images \
    --repository-name vangarments-backend \
    --image-ids imageTag=${TARGET_VERSION} \
    --region $REGION > /dev/null 2>&1; then
    echo -e "${RED}❌ Target image ${TARGET_VERSION} not found in ECR${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Target image found: ${ECR_REPOSITORY}:${TARGET_VERSION}${NC}"

# Get current deployment info
CLUSTER_NAME="vangarments-${ENVIRONMENT}-cluster"
SERVICE_NAME="vangarments-${ENVIRONMENT}-service"

echo -e "${BLUE}📊 Getting current deployment info...${NC}"
CURRENT_TASK_DEFINITION_ARN=$(aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --query 'services[0].taskDefinition' \
    --output text \
    --region $REGION)

CURRENT_IMAGE=$(aws ecs describe-task-definition \
    --task-definition $CURRENT_TASK_DEFINITION_ARN \
    --query 'taskDefinition.containerDefinitions[0].image' \
    --output text \
    --region $REGION)

echo -e "${YELLOW}Current image: ${CURRENT_IMAGE}${NC}"
echo -e "${YELLOW}Target image: ${ECR_REPOSITORY}:${TARGET_VERSION}${NC}"

# Create backup of current state
echo -e "${BLUE}💾 Creating backup of current state...${NC}"
BACKUP_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ROLLBACK_BACKUP_FILE="rollback-backup-${ENVIRONMENT}-${BACKUP_TIMESTAMP}.json"

# Save current task definition
aws ecs describe-task-definition \
    --task-definition $CURRENT_TASK_DEFINITION_ARN \
    --query 'taskDefinition' \
    --region $REGION > $ROLLBACK_BACKUP_FILE

echo -e "${GREEN}✅ Current state backed up to: ${ROLLBACK_BACKUP_FILE}${NC}"

# Database rollback check
echo -e "${BLUE}🗄️ Checking database migration status...${NC}"
cd packages/backend

# Check if database rollback is needed
echo -e "${YELLOW}⚠️ Database migrations may need to be rolled back manually${NC}"
echo -e "${YELLOW}Please review migration history and rollback if necessary${NC}"

# Show migration status
npm run migrate:status || echo "Could not retrieve migration status"

read -p "Do you need to rollback database migrations? (y/N): " rollback_db

if [[ "$rollback_db" =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🔄 Database rollback required - please run manually:${NC}"
    echo -e "${YELLOW}npm run migrate:rollback <target-migration-id>${NC}"
    read -p "Press Enter after completing database rollback..."
fi

cd ../..

# Update ECS service with target image
echo -e "${BLUE}🔄 Rolling back ECS service...${NC}"

# Get current task definition
TASK_DEFINITION=$(aws ecs describe-task-definition \
    --task-definition $CURRENT_TASK_DEFINITION_ARN \
    --query 'taskDefinition' \
    --region $REGION)

# Update image in task definition
NEW_TASK_DEFINITION=$(echo $TASK_DEFINITION | jq --arg IMAGE "$ECR_REPOSITORY:$TARGET_VERSION" \
    '.containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy)')

# Register new task definition
NEW_TASK_DEFINITION_ARN=$(aws ecs register-task-definition \
    --cli-input-json "$NEW_TASK_DEFINITION" \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text \
    --region $REGION)

echo -e "${GREEN}✅ New task definition registered: ${NEW_TASK_DEFINITION_ARN}${NC}"

# Update service
echo -e "${BLUE}🔄 Updating ECS service...${NC}"
aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --task-definition $NEW_TASK_DEFINITION_ARN \
    --region $REGION

# Wait for rollback to complete
echo -e "${BLUE}⏳ Waiting for rollback to complete...${NC}"
aws ecs wait services-stable \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $REGION

# Get load balancer DNS for health checks
STACK_NAME="VangarmentsInfrastructure-${ENVIRONMENT}"
ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
    --output text \
    --region ${REGION})

# Run health checks
echo -e "${BLUE}🏥 Running post-rollback health checks...${NC}"
HEALTH_URL="https://${ALB_DNS}/health"

MAX_ATTEMPTS=20
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo -e "${BLUE}Health check attempt ${ATTEMPT}/${MAX_ATTEMPTS}...${NC}"
    
    if curl -f -s $HEALTH_URL > /dev/null; then
        echo -e "${GREEN}✅ Service is healthy after rollback${NC}"
        break
    fi
    
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo -e "${RED}❌ Health checks failed after rollback${NC}"
        echo -e "${YELLOW}Consider rolling forward or investigating issues${NC}"
        exit 1
    fi
    
    sleep 10
    ((ATTEMPT++))
done

# Run smoke tests
echo -e "${BLUE}💨 Running post-rollback smoke tests...${NC}"
cd packages/backend
BASE_URL="https://${ALB_DNS}" npm run test:smoke || {
    echo -e "${YELLOW}⚠️ Smoke tests failed - service may have issues${NC}"
}
cd ../..

# Generate rollback report
echo -e "${BLUE}📋 Generating rollback report...${NC}"
ROLLBACK_REPORT="rollback-report-${ENVIRONMENT}-${BACKUP_TIMESTAMP}.json"

cat > $ROLLBACK_REPORT << EOF
{
  "rollback": {
    "environment": "${ENVIRONMENT}",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "targetVersion": "${TARGET_VERSION}",
    "previousImage": "${CURRENT_IMAGE}",
    "newImage": "${ECR_REPOSITORY}:${TARGET_VERSION}",
    "operator": "$(git config user.email)",
    "region": "${REGION}"
  },
  "backup": {
    "taskDefinitionBackup": "${ROLLBACK_BACKUP_FILE}",
    "previousTaskDefinition": "${CURRENT_TASK_DEFINITION_ARN}",
    "newTaskDefinition": "${NEW_TASK_DEFINITION_ARN}"
  },
  "healthChecks": {
    "postRollbackHealth": "passed",
    "smokeTests": "completed",
    "healthCheckAttempts": "${ATTEMPT}"
  },
  "timing": {
    "rollbackDuration": "${SECONDS}s",
    "completedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  }
}
EOF

# Display rollback summary
echo -e "\n${GREEN}🎉 Rollback completed successfully!${NC}\n"
echo -e "${BLUE}📋 Rollback Summary:${NC}"
echo -e "  Environment: ${ENVIRONMENT}"
echo -e "  Rolled back to: ${TARGET_VERSION}"
echo -e "  Previous image: ${CURRENT_IMAGE}"
echo -e "  New image: ${ECR_REPOSITORY}:${TARGET_VERSION}"
echo -e "  Duration: ${SECONDS}s"
echo -e "  Report: ${ROLLBACK_REPORT}"
echo -e "  Backup: ${ROLLBACK_BACKUP_FILE}"

# Post-rollback recommendations
echo -e "\n${YELLOW}📝 Post-Rollback Checklist:${NC}"
echo -e "- [ ] Verify all critical functionality works"
echo -e "- [ ] Check application logs for errors"
echo -e "- [ ] Monitor system metrics"
echo -e "- [ ] Notify stakeholders of rollback"
echo -e "- [ ] Investigate root cause of original issue"
echo -e "- [ ] Plan forward fix if needed"

if [[ "$ENVIRONMENT" == "production" ]]; then
    echo -e "\n${RED}🚨 Production Rollback Completed${NC}"
    echo -e "${YELLOW}Please ensure:${NC}"
    echo -e "- Customer support is notified"
    echo -e "- Monitoring alerts are reviewed"
    echo -e "- Incident report is created"
    
    # Send notification (if configured)
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🔄 Vangarments production rollback completed\nRolled back to: ${TARGET_VERSION}\nDuration: ${SECONDS}s\nOperator: $(git config user.email)\"}" \
            $SLACK_WEBHOOK_URL
    fi
fi

echo -e "\n${GREEN}🔄 Rollback procedure completed successfully!${NC}"