# DevOps Assessment

### Objective

The objective of this assessment is to create a serverless AWS Lambda function that automatically compresses S3 objects to ZIP format when uploaded.

### Solution

The solution is to create a AWS SAM based Lambda function that automatically compresses S3 objects to ZIP format when uploaded.

### Architecture

### AWS SAM based Lambda Function for Object to ZIP Compressor, build with AWS SAM, NodeJS, and Docker.

### Features

- **Dockerized Lambda**: Runs as a container image for consistent builds
- **Automatic Compression**: Triggers on `.json` file uploads to S3
- **Private VPC**: Lambda runs in private subnets with no internet access
- **S3 VPC Endpoint**: Secure, private access to S3 without traversing the internet
- **Versioning & Rollback**: Automatic version publishing with alias-based rollback
- **Monitoring**: CloudWatch alarms for errors and duration
- **Lifecycle Management**: Compressed files archived to Glacier after 30 days

<!-- ### Architecture Diagram

![Architecture Diagram](./architecture.png) -->

## Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/) Need to be configured with appropriate credentials
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [Docker](https://www.docker.com/get-started)
- [Node.js](https://nodejs.org/) >= 20.x
- [pnpm](https://pnpm.io/) package manager

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build the Project

```bash
sam build
```

### 3. Deploy to AWS

```bash
sam deploy
```

### 4. Test the Function

Upload a `.json` file to the `uploads/` folder in your S3 bucket:

```bash
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name s3-zip-compressor \
  --query 'Stacks[0].Outputs[?OutputKey==`MediaBucketName`].OutputValue' \
  --output text \
  --region ca-central-1)

# Upload a test file
aws s3 cp test.json s3://$BUCKET/uploads/test.json

# Check compressed output
aws s3 ls s3://$BUCKET/compressed/
```

## Project Structure

```
.
├── src/
│   ├── handler.ts              # Lambda entry point
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── schemas/
│   │   └── s3-event.schema.ts  # Zod validation schemas
│   └── lib/
│       ├── s3-client.ts        # AWS S3 client
│       ├── download.ts         # S3 download operations
│       ├── upload.ts           # S3 upload/delete operations
│       ├── compress.ts         # ZIP compression logic
│       ├── processor.ts        # Main processing logic
│       ├── json-service.ts     # JSON-specific compression
│       ├── event-parser.ts     # S3 event parsing
│       └── errors.ts           # Custom error classes
├── template.yaml               # SAM/CloudFormation template
├── samconfig.toml              # SAM CLI configuration
├── Dockerfile                  # Lambda container definition
├── package.json
├── tsconfig.json
└── README.md
```

## Versioning & Rollback

Each deployment creates a new Lambda version. The `live` alias always points to the active version.

### List Available Versions

```bash
aws lambda list-versions-by-function \
  --function-name s3-zip-compressor-s3-compressor \
  --region ca-central-1 \
  --query 'Versions[*].[Version,LastModified]' \
  --output table
```

### Rollback to Previous Version

```bash
aws lambda update-alias \
  --function-name s3-zip-compressor-s3-compressor \
  --name live \
  --function-version <VERSION_NUMBER> \
  --region ca-central-1
```

### Check Current Version

```bash
aws lambda get-alias \
  --function-name s3-zip-compressor-s3-compressor \
  --name live \
  --region ca-central-1 \
  --query 'FunctionVersion'
```


## Security

- **No Internet Access**: Lambda runs in private subnets without NAT Gateway
- **VPC Endpoint**: S3 traffic stays within AWS network
- **Least Privilege IAM**: Lambda role has minimal required permissions
- **Encrypted Storage**: All S3 data encrypted at rest
- **Private Bucket**: No public access allowed

## Development

### Build Locally

```bash
pnpm run build

sam build
```

### Validate Template

```bash
sam validate --lint
```

### Local Testing (requires Docker)

```bash
# Invoke locally with test event
sam local invoke S3CompressorFunction --event events/test-event.json
```

## Cleanup

To delete all resources:

```bash
# Empty the S3 bucket first (required)
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name s3-zip-compressor \
  --query 'Stacks[0].Outputs[?OutputKey==`MediaBucketName`].OutputValue' \
  --output text \
  --region ca-central-1)

aws s3 rm s3://$BUCKET --recursive

# Delete the stack
sam delete --stack-name s3-zip-compressor --region ca-central-1
```



### Cost Analysis

