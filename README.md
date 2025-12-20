# V App - Vangarments Fashion Platform

A comprehensive fashion platform built with modern web technologies, featuring the VUFS (Vangarments Universal Fashion System) for standardized fashion item categorization.

## 🌟 Features

- **VUFS System**: Universal fashion categorization and standardization
- **Digital Wardrobe**: Organize and manage your clothing items with real data persistence
- **Marketplace**: Buy and sell fashion items with integrated payment processing
- **Social Platform**: Share outfits and connect with fashion enthusiasts
- **AI-Powered Features**: Smart recommendations and Google Cloud Vision AI analysis
- **Cross-Platform**: Web, iOS, Android, and Expo mobile apps
- **Real-time Sync**: Data synchronization across all platforms
- **Admin Dashboard**: Configuration management and system administration

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Cloud SQL) with real data persistence
- **Mobile**: React Native (iOS/Android), Expo
- **GCP Services**: Cloud Run, Cloud Storage, Vision AI, Vertex AI
- **Infrastructure**: Docker, Google Artifact Registry
- **Testing**: Jest, Integration tests, Real usage validation

## 📱 Platforms

- **Web Application**: Full-featured web interface
- **iOS App**: Native Swift implementation
- **Android App**: Native Kotlin implementation  
- **Expo App**: Cross-platform React Native
- **Admin Panel**: Configuration and management interface

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (local installation for development)
- Google Cloud SDK (for deployment and cloud services)
- npm or yarn
- Git

### Quick Setup

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/vangarments-v-app.git
cd vangarments-v-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up local database**
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb vangarments_local
```

4. **Configure environment**
```bash
cp packages/backend/.env.example packages/backend/.env
cp packages/web/.env.example packages/web/.env.local
```

5. **Start development**
```bash
# Backend (Terminal 1)
cd packages/backend
npm run dev

# Frontend (Terminal 2)  
cd packages/web
npm run dev
```

6. **Access the application**
- Web: http://localhost:3000
- API: http://localhost:8000
- Admin: http://localhost:3000/admin

## 📁 Project Structure

```
├── packages/
│   ├── backend/          # Node.js API server with real data persistence
│   ├── web/             # Next.js web application
│   ├── mobile-expo/     # Expo cross-platform app
│   ├── mobile-ios/      # Native iOS Swift app
│   ├── mobile-android/  # Native Android Kotlin app
│   ├── shared/          # Shared types and utilities
│   └── infrastructure/  # Deployment infrastructure
├── .kiro/              # AI development specifications
│   └── specs/          # Feature specifications and tasks
├── monitoring/         # Performance monitoring configs
└── scripts/           # Deployment and utility scripts
```

## 🔧 Development Features

### Implemented Systems

- ✅ **Authentication System**: JWT-based auth with admin user "lv"
- ✅ **Real Database**: PostgreSQL with actual data persistence
- ✅ **Wardrobe Management**: Full CRUD operations for clothing items
- ✅ **Marketplace**: Item listing, search, and transaction system
- ✅ **Social Platform**: Posts, likes, comments, following system
- ✅ **VUFS Integration**: Complete fashion categorization system
- ✅ **AI Processing**: Google Cloud Vision AI for image analysis
- ✅ **Cloud Storage**: GCS-backed file storage and backups
- ✅ **GCP Deployment**: Automated Cloud Run deployment pipeline

### Key Commands

```bash
# Development
npm run dev              # Start all development servers
npm run build           # Build all packages
npm test               # Run test suites

# Database
npm run migrate        # Run database migrations
npm run seed          # Seed development data

# GCP Deployment
./scripts/gcp-deploy.sh staging    # Deploy to GCP Staging
./scripts/gcp-deploy.sh production # Deploy to GCP Production
```

## 🧪 Testing

The project includes comprehensive testing:

```bash
# Run all tests
npm test

# Backend tests
cd packages/backend && npm test

# Frontend tests  
cd packages/web && npm test

# Integration tests
npm run test:integration
```

## 📊 Current Status

All major systems are implemented and functional:

- **Backend**: 100% operational with real data persistence
- **Frontend**: Full UI with working navigation and interactions
- **Database**: Local PostgreSQL with complete schema
- **Authentication**: Working JWT system with admin access
- **File Storage**: Local image storage and processing
- **API Integration**: All endpoints connected and tested

## 🚀 Deployment

The application is configured for local development with production-ready architecture:

```bash
# Local development (current setup)
npm run dev

# Production deployment (when ready)
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Documentation

- [Development Guide](DEVELOPMENT_GUIDE.md)
- [GCP Deployment Guide](GCP_DEPLOYMENT.md)
- [GCP Setup Guide](GCP_SETUP_GUIDE.md)
- [API Documentation](packages/backend/docs/)
- [Frontend Components](packages/web/src/components/)
- [VUFS System](packages/shared/src/constants/vufs.ts)

## 🔐 Security

- JWT-based authentication
- Input validation and sanitization
- CORS protection
- Rate limiting
- Secure file upload handling

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For questions, issues, or contributions:

- Open an issue on GitHub
- Check existing documentation
- Review the development guides

---

**Built with ❤️ for the fashion community**