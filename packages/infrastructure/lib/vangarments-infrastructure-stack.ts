import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export interface VangarmentsInfrastructureStackProps extends cdk.StackProps {
  environment: string;
}

export class VangarmentsInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VangarmentsInfrastructureStackProps) {
    super(scope, id, props);

    const { environment } = props;
    const isProd = environment === 'production';

    // VPC Configuration
    const vpc = new ec2.Vpc(this, 'VangarmentsVPC', {
      maxAzs: isProd ? 3 : 2,
      natGateways: isProd ? 2 : 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS');

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      vpc,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });
    ecsSecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(3001), 'ALB to ECS');

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });
    dbSecurityGroup.addIngressRule(ecsSecurityGroup, ec2.Port.tcp(5432), 'ECS to Database');

    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc,
      description: 'Security group for Redis cache',
      allowAllOutbound: false,
    });
    redisSecurityGroup.addIngressRule(ecsSecurityGroup, ec2.Port.tcp(6379), 'ECS to Redis');

    // Database Secrets
    const dbSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      description: 'RDS PostgreSQL credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'vangarments_admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    // RDS PostgreSQL Database
    const database = new rds.DatabaseInstance(this, 'VangarmentsDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_3,
      }),
      instanceType: isProd 
        ? ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM)
        : ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromSecret(dbSecret),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      databaseName: 'vangarments',
      backupRetention: isProd ? cdk.Duration.days(7) : cdk.Duration.days(1),
      deletionProtection: isProd,
      multiAz: isProd,
      storageEncrypted: true,
      monitoringInterval: isProd ? cdk.Duration.seconds(60) : undefined,
      enablePerformanceInsights: isProd,
    });

    // ElastiCache Redis
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis cache',
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
    });

    const redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      cacheNodeType: isProd ? 'cache.t3.medium' : 'cache.t3.micro',
      engine: 'redis',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      cacheSubnetGroupName: redisSubnetGroup.ref,
      transitEncryptionEnabled: isProd,
      atRestEncryptionEnabled: isProd,
    });

    // S3 Buckets
    const imagesBucket = new s3.Bucket(this, 'ImagesBucket', {
      bucketName: `vangarments-images-${environment}-${this.account}`,
      versioned: isProd,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    const backupsBucket = new s3.Bucket(this, 'BackupsBucket', {
      bucketName: `vangarments-backups-${environment}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldBackups',
          expiration: cdk.Duration.days(isProd ? 90 : 30),
        },
      ],
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'VangarmentsCluster', {
      vpc,
      containerInsights: isProd,
    });

    // Application Load Balancer with Fargate Service
    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'VangarmentsService', {
      cluster,
      memoryLimitMiB: isProd ? 2048 : 1024,
      cpu: isProd ? 1024 : 512,
      desiredCount: isProd ? 3 : 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('vangarments/backend:latest'),
        containerPort: 3001,
        environment: {
          NODE_ENV: environment,
          PORT: '3001',
          REDIS_HOST: redisCluster.attrRedisEndpointAddress,
          REDIS_PORT: redisCluster.attrRedisEndpointPort,
          S3_IMAGES_BUCKET: imagesBucket.bucketName,
          S3_BACKUPS_BUCKET: backupsBucket.bucketName,
        },
        secrets: {
          DATABASE_URL: ecs.Secret.fromSecretsManager(dbSecret, 'connectionString'),
          JWT_SECRET: ecs.Secret.fromSecretsManager(dbSecret, 'jwtSecret'),
        },
        logDriver: ecs.LogDrivers.awsLogs({
          streamPrefix: 'vangarments-backend',
          logRetention: isProd ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
        }),
      },
      publicLoadBalancer: true,
      securityGroups: [ecsSecurityGroup],
    });

    // Auto Scaling
    const scalableTarget = fargateService.service.autoScaleTaskCount({
      minCapacity: isProd ? 2 : 1,
      maxCapacity: isProd ? 10 : 3,
    });

    scalableTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(2),
    });

    scalableTarget.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(2),
    });

    // Grant S3 permissions to ECS tasks
    imagesBucket.grantReadWrite(fargateService.taskDefinition.taskRole);
    backupsBucket.grantReadWrite(fargateService.taskDefinition.taskRole);

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'VangarmentsDistribution', {
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(fargateService.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // API responses shouldn't be cached
      },
      additionalBehaviors: {
        '/static/*': {
          origin: new origins.S3Origin(imagesBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
      },
      priceClass: isProd ? cloudfront.PriceClass.PRICE_CLASS_ALL : cloudfront.PriceClass.PRICE_CLASS_100,
      geoRestriction: cloudfront.GeoRestriction.allowlist('BR', 'US'), // Brazil and US initially
    });

    // CloudWatch Alarms and Monitoring
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: 'Vangarments Alerts',
    });

    // Add email subscription for production
    if (isProd) {
      alertTopic.addSubscription(
        new snsSubscriptions.EmailSubscription('alerts@vangarments.com')
      );
    }

    // Database CPU Alarm
    new cloudwatch.Alarm(this, 'DatabaseCPUAlarm', {
      metric: database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // ECS CPU Alarm
    new cloudwatch.Alarm(this, 'ECSCPUAlarm', {
      metric: fargateService.service.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // ECS Memory Alarm
    new cloudwatch.Alarm(this, 'ECSMemoryAlarm', {
      metric: fargateService.service.metricMemoryUtilization(),
      threshold: 85,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // Application Load Balancer Target Response Time
    new cloudwatch.Alarm(this, 'ALBResponseTimeAlarm', {
      metric: fargateService.loadBalancer.metricTargetResponseTime(),
      threshold: 2, // 2 seconds
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // Lambda function for database backups
    const backupFunction = new lambda.Function(this, 'DatabaseBackupFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import boto3
import os
from datetime import datetime

def handler(event, context):
    rds = boto3.client('rds')
    
    # Create manual snapshot
    snapshot_id = f"vangarments-manual-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    
    try:
        response = rds.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=os.environ['DB_INSTANCE_ID']
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Backup initiated successfully',
                'snapshotId': snapshot_id
            })
        }
    except Exception as e:
        print(f"Error creating backup: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Backup failed',
                'error': str(e)
            })
        }
      `),
      environment: {
        DB_INSTANCE_ID: database.instanceIdentifier,
      },
      timeout: cdk.Duration.minutes(5),
    });

    // Grant RDS permissions to backup function
    database.grantConnect(backupFunction);
    backupFunction.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['rds:CreateDBSnapshot', 'rds:DescribeDBSnapshots'],
      resources: ['*'],
    }));

    // Schedule daily backups for production
    if (isProd) {
      new cdk.aws_events.Rule(this, 'DailyBackupRule', {
        schedule: cdk.aws_events.Schedule.cron({ hour: '2', minute: '0' }), // 2 AM UTC
        targets: [new cdk.aws_events_targets.LambdaFunction(backupFunction)],
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: redisCluster.attrRedisEndpointAddress,
      description: 'Redis cache endpoint',
    });

    new cdk.CfnOutput(this, 'ImagesBucketName', {
      value: imagesBucket.bucketName,
      description: 'S3 bucket for images',
    });

    new cdk.CfnOutput(this, 'BackupsBucketName', {
      value: backupsBucket.bucketName,
      description: 'S3 bucket for backups',
    });
  }
}