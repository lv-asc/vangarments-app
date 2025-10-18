#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VangarmentsInfrastructureStack } from '../lib/vangarments-infrastructure-stack';

const app = new cdk.App();

// Get environment configuration
const environment = app.node.tryGetContext('environment') || 'development';
const region = app.node.tryGetContext('region') || 'us-east-1';

// Create stack for the specified environment
new VangarmentsInfrastructureStack(app, `VangarmentsInfrastructure-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: region,
  },
  environment,
  tags: {
    Project: 'Vangarments',
    Environment: environment,
    ManagedBy: 'CDK',
  },
});