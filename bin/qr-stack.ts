#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { QrStack } from '../lib/qr-stack'

const app = new cdk.App()
new QrStack(app, 'QrStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
})
