# Vangarments Platform

Comprehensive fashion platform with wardrobe cataloging, social features, and marketplace functionality.

## Features

- **Digital Wardrobe Cataloging**: AI-powered item recognition and organization using VUFS (Vangarments Universal Fashion Standard)
- **Social Platform**: Pinterest-like content discovery and outfit sharing
- **Marketplace**: Peer-to-peer trading with secure payments
- **Brand Integration**: Official brand partnerships and catalogs
- **Cross-Platform**: iOS, Android, and Web applications

## Architecture

This is a monorepo containing:

- `packages/backend` - Node.js/Express API server
- `packages/web` - Next.js web application
- `packages/shared` - Shared types and utilities
- `packages/mobile` - React Native mobile apps (coming soon)

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- AWS CLI (for production deployment)

### Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd vangarments-platform
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Start development services:
```bash
docker-compose up -d
```

5. Run the development servers:
```bash
npm run dev
```

This will start:
- Backend API on http://localhost:3001
- Web application on http://localhost:3000
- PostgreSQL on localhost:5432
- Redis on localhost:6379
- LocalStack (AWS services) on localhost:4566

### Project Structure

```
vangarments-platform/
├── packages/
│   ├── backend/          # API server
│   │   ├── src/
│   │   ├── database/
│   │   └── package.json
│   ├── web/              # Next.js web app
│   │   ├── src/
│   │   └── package.json
│   └── shared/           # Shared types and utilities
│       ├── src/
│       └── package.json
├── .github/workflows/    # CI/CD pipelines
├── docker-compose.yml    # Development services
└── package.json          # Root package.json
```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific package
npm run test --workspace=@vangarments/backend
npm run test --workspace=@vangarments/web
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=@vangarments/backend
```

## Deployment

The platform is designed to run on AWS infrastructure:

- **Compute**: ECS/EKS for containerized services
- **Database**: RDS PostgreSQL
- **Cache**: ElastiCache Redis
- **Storage**: S3 for images and files
- **AI/ML**: SageMaker, Rekognition, Lambda
- **CDN**: CloudFront

### Environment Variables

See `.env.example` for required environment variables.

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass and code is formatted
5. Submit a pull request

## License

Private - All rights reserved