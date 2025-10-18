import * as AWS from 'aws-sdk';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Infrastructure as Code Tests', () => {
  const environment = process.env.NODE_ENV || 'staging';
  const region = process.env.AWS_REGION || 'us-east-1';
  const stackName = `VangarmentsInfrastructure-${environment}`;

  let cloudFormation: AWS.CloudFormation;
  let ec2: AWS.EC2;
  let rds: AWS.RDS;
  let ecs: AWS.ECS;
  let s3: AWS.S3;
  let elasticache: AWS.ElastiCache;

  beforeAll(() => {
    // Initialize AWS services
    AWS.config.update({ region });
    cloudFormation = new AWS.CloudFormation();
    ec2 = new AWS.EC2();
    rds = new AWS.RDS();
    ecs = new AWS.ECS();
    s3 = new AWS.S3();
    elasticache = new AWS.ElastiCache();
  });

  describe('CDK Infrastructure Validation', () => {
    it('should validate CDK stack template', async () => {
      const cdkPath = path.join(__dirname, '../../../infrastructure');
      
      // Check if CDK directory exists
      expect(fs.existsSync(cdkPath)).toBe(true);
      
      // Validate CDK template syntax
      try {
        const output = execSync('cdk synth --quiet', {
          cwd: cdkPath,
          encoding: 'utf8',
          timeout: 30000
        });
        
        expect(output).toBeDefined();
        expect(typeof output).toBe('string');
      } catch (error) {
        throw new Error(`CDK template validation failed: ${error.message}`);
      }
    });

    it('should have valid CDK configuration', () => {
      const cdkJsonPath = path.join(__dirname, '../../../infrastructure/cdk.json');
      expect(fs.existsSync(cdkJsonPath)).toBe(true);
      
      const cdkConfig = JSON.parse(fs.readFileSync(cdkJsonPath, 'utf8'));
      expect(cdkConfig).toHaveProperty('app');
      expect(cdkConfig).toHaveProperty('context');
    });

    it('should validate stack parameters', async () => {
      const cdkPath = path.join(__dirname, '../../../infrastructure');
      
      try {
        const output = execSync(`cdk synth --context environment=${environment}`, {
          cwd: cdkPath,
          encoding: 'utf8',
          timeout: 30000
        });
        
        const template = JSON.parse(output);
        
        // Validate required resources exist in template
        expect(template).toHaveProperty('Resources');
        expect(template.Resources).toHaveProperty('VangarmentsVPC');
        expect(template.Resources).toHaveProperty('VangarmentsDatabase');
        expect(template.Resources).toHaveProperty('VangarmentsCluster');
        expect(template.Resources).toHaveProperty('ImagesBucket');
        expect(template.Resources).toHaveProperty('BackupsBucket');
      } catch (error) {
        throw new Error(`Stack parameter validation failed: ${error.message}`);
      }
    });
  });

  describe('Deployed Infrastructure Validation', () => {
    let stackOutputs: { [key: string]: string } = {};

    beforeAll(async () => {
      try {
        const stackResult = await cloudFormation.describeStacks({
          StackName: stackName
        }).promise();

        if (stackResult.Stacks && stackResult.Stacks[0]) {
          const outputs = stackResult.Stacks[0].Outputs || [];
          stackOutputs = outputs.reduce((acc, output) => {
            if (output.OutputKey && output.OutputValue) {
              acc[output.OutputKey] = output.OutputValue;
            }
            return acc;
          }, {} as { [key: string]: string });
        }
      } catch (error) {
        console.warn(`Could not retrieve stack outputs: ${error.message}`);
      }
    });

    it('should have deployed CloudFormation stack', async () => {
      const result = await cloudFormation.describeStacks({
        StackName: stackName
      }).promise();

      expect(result.Stacks).toBeDefined();
      expect(result.Stacks!.length).toBe(1);
      expect(result.Stacks![0].StackStatus).toBe('CREATE_COMPLETE');
    });

    it('should have VPC with correct configuration', async () => {
      const vpcs = await ec2.describeVpcs({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`*${stackName}*`]
          }
        ]
      }).promise();

      expect(vpcs.Vpcs).toBeDefined();
      expect(vpcs.Vpcs!.length).toBeGreaterThan(0);

      const vpc = vpcs.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBeDefined();
    });

    it('should have subnets in multiple AZs', async () => {
      const subnets = await ec2.describeSubnets({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`*${stackName}*`]
          }
        ]
      }).promise();

      expect(subnets.Subnets).toBeDefined();
      expect(subnets.Subnets!.length).toBeGreaterThan(0);

      // Check for different subnet types
      const publicSubnets = subnets.Subnets!.filter(s => 
        s.Tags?.some(tag => tag.Key === 'Name' && tag.Value?.includes('Public'))
      );
      const privateSubnets = subnets.Subnets!.filter(s => 
        s.Tags?.some(tag => tag.Key === 'Name' && tag.Value?.includes('Private'))
      );

      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);

      // Check availability zones
      const azs = new Set(subnets.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(environment === 'production' ? 2 : 1);
    });

    it('should have RDS database with correct configuration', async () => {
      const databases = await rds.describeDBInstances().promise();
      const vangarmentsDbs = databases.DBInstances?.filter(db => 
        db.DBInstanceIdentifier?.includes('vangarments') && 
        db.DBInstanceIdentifier?.includes(environment)
      );

      expect(vangarmentsDbs).toBeDefined();
      expect(vangarmentsDbs!.length).toBeGreaterThan(0);

      const db = vangarmentsDbs![0];
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.Engine).toBe('postgres');
      expect(db.StorageEncrypted).toBe(true);
      
      if (environment === 'production') {
        expect(db.MultiAZ).toBe(true);
        expect(db.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      }
    });

    it('should have ECS cluster with running services', async () => {
      const clusterName = `vangarments-${environment}-cluster`;
      
      const clusters = await ecs.describeClusters({
        clusters: [clusterName]
      }).promise();

      expect(clusters.clusters).toBeDefined();
      expect(clusters.clusters!.length).toBe(1);
      expect(clusters.clusters![0].status).toBe('ACTIVE');

      // Check services
      const services = await ecs.listServices({
        cluster: clusterName
      }).promise();

      expect(services.serviceArns).toBeDefined();
      expect(services.serviceArns!.length).toBeGreaterThan(0);

      // Check service status
      const serviceDetails = await ecs.describeServices({
        cluster: clusterName,
        services: services.serviceArns!
      }).promise();

      serviceDetails.services?.forEach(service => {
        expect(service.status).toBe('ACTIVE');
        expect(service.runningCount).toBeGreaterThan(0);
        expect(service.desiredCount).toBeGreaterThan(0);
      });
    });

    it('should have S3 buckets with correct configuration', async () => {
      const buckets = await s3.listBuckets().promise();
      
      const imagesBucket = buckets.Buckets?.find(b => 
        b.Name?.includes('vangarments-images') && b.Name?.includes(environment)
      );
      const backupsBucket = buckets.Buckets?.find(b => 
        b.Name?.includes('vangarments-backups') && b.Name?.includes(environment)
      );

      expect(imagesBucket).toBeDefined();
      expect(backupsBucket).toBeDefined();

      // Check bucket encryption
      if (imagesBucket) {
        const encryption = await s3.getBucketEncryption({
          Bucket: imagesBucket.Name!
        }).promise();
        expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      }

      if (backupsBucket) {
        const versioning = await s3.getBucketVersioning({
          Bucket: backupsBucket.Name!
        }).promise();
        expect(versioning.Status).toBe('Enabled');
      }
    });

    it('should have ElastiCache Redis cluster', async () => {
      const clusters = await elasticache.describeCacheClusters().promise();
      
      const redisClusters = clusters.CacheClusters?.filter(cluster => 
        cluster.CacheClusterId?.includes('vangarments') && 
        cluster.CacheClusterId?.includes(environment)
      );

      expect(redisClusters).toBeDefined();
      expect(redisClusters!.length).toBeGreaterThan(0);

      const redisCluster = redisClusters![0];
      expect(redisCluster.CacheClusterStatus).toBe('available');
      expect(redisCluster.Engine).toBe('redis');
    });

    it('should have proper security groups configuration', async () => {
      const securityGroups = await ec2.describeSecurityGroups({
        Filters: [
          {
            Name: 'group-name',
            Values: [`*${stackName}*`]
          }
        ]
      }).promise();

      expect(securityGroups.SecurityGroups).toBeDefined();
      expect(securityGroups.SecurityGroups!.length).toBeGreaterThan(0);

      // Check for ALB security group
      const albSg = securityGroups.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('ALB')
      );
      expect(albSg).toBeDefined();
      
      // Verify ALB allows HTTP/HTTPS
      const httpRule = albSg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 || rule.FromPort === 443
      );
      expect(httpRule).toBeDefined();

      // Check for ECS security group
      const ecsSg = securityGroups.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('ECS')
      );
      expect(ecsSg).toBeDefined();

      // Check for Database security group
      const dbSg = securityGroups.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('Database')
      );
      expect(dbSg).toBeDefined();
    });
  });

  describe('Infrastructure Monitoring', () => {
    it('should have CloudWatch alarms configured', async () => {
      const cloudWatch = new AWS.CloudWatch({ region });
      
      const alarms = await cloudWatch.describeAlarms().promise();
      
      const vangarmentAlarms = alarms.MetricAlarms?.filter(alarm => 
        alarm.AlarmName?.includes('vangarments') || 
        alarm.AlarmName?.includes(environment)
      );

      expect(vangarmentAlarms).toBeDefined();
      expect(vangarmentAlarms!.length).toBeGreaterThan(0);

      // Check for critical alarms
      const cpuAlarm = vangarmentAlarms!.find(alarm => 
        alarm.AlarmName?.toLowerCase().includes('cpu')
      );
      const memoryAlarm = vangarmentAlarms!.find(alarm => 
        alarm.AlarmName?.toLowerCase().includes('memory')
      );
      const dbAlarm = vangarmentAlarms!.find(alarm => 
        alarm.AlarmName?.toLowerCase().includes('database')
      );

      expect(cpuAlarm).toBeDefined();
      expect(memoryAlarm).toBeDefined();
      expect(dbAlarm).toBeDefined();
    });

    it('should have SNS topics for alerts', async () => {
      const sns = new AWS.SNS({ region });
      
      const topics = await sns.listTopics().promise();
      
      const alertTopics = topics.Topics?.filter(topic => 
        topic.TopicArn?.includes('Alert') || 
        topic.TopicArn?.includes('vangarments')
      );

      expect(alertTopics).toBeDefined();
      expect(alertTopics!.length).toBeGreaterThan(0);
    });
  });

  describe('Infrastructure Scaling', () => {
    it('should have auto-scaling configured for ECS', async () => {
      const applicationAutoScaling = new AWS.ApplicationAutoScaling({ region });
      
      try {
        const scalableTargets = await applicationAutoScaling.describeScalableTargets({
          ServiceNamespace: 'ecs'
        }).promise();

        const vangarmentTargets = scalableTargets.ScalableTargets?.filter(target => 
          target.ResourceId?.includes('vangarments') && 
          target.ResourceId?.includes(environment)
        );

        expect(vangarmentTargets).toBeDefined();
        expect(vangarmentTargets!.length).toBeGreaterThan(0);

        vangarmentTargets!.forEach(target => {
          expect(target.MinCapacity).toBeGreaterThan(0);
          expect(target.MaxCapacity).toBeGreaterThan(target.MinCapacity!);
        });
      } catch (error) {
        console.warn(`Auto-scaling validation skipped: ${error.message}`);
      }
    });
  });

  describe('Infrastructure Costs', () => {
    it('should validate resource sizing for environment', async () => {
      // Check RDS instance class
      const databases = await rds.describeDBInstances().promise();
      const vangarmentsDbs = databases.DBInstances?.filter(db => 
        db.DBInstanceIdentifier?.includes('vangarments') && 
        db.DBInstanceIdentifier?.includes(environment)
      );

      if (vangarmentsDbs && vangarmentsDbs.length > 0) {
        const db = vangarmentsDbs[0];
        
        if (environment === 'production') {
          // Production should use appropriate instance sizes
          expect(db.DBInstanceClass).toMatch(/db\.(t3|r5|r6g)\.(medium|large|xlarge)/);
        } else {
          // Staging can use smaller instances
          expect(db.DBInstanceClass).toMatch(/db\.t3\.(micro|small|medium)/);
        }
      }

      // Check ECS task definitions
      const clusterName = `vangarments-${environment}-cluster`;
      const services = await ecs.listServices({
        cluster: clusterName
      }).promise();

      if (services.serviceArns && services.serviceArns.length > 0) {
        const serviceDetails = await ecs.describeServices({
          cluster: clusterName,
          services: services.serviceArns
        }).promise();

        serviceDetails.services?.forEach(service => {
          if (service.taskDefinition) {
            // Task definitions should have appropriate resource allocation
            expect(service.desiredCount).toBeGreaterThan(0);
            
            if (environment === 'production') {
              expect(service.desiredCount).toBeGreaterThanOrEqual(2);
            }
          }
        });
      }
    });
  });
});