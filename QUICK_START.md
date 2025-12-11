# Quick Start Guide - Vangarments App

## Prerequisites

- **Backend**: Real Node.js/Express server (Mocked mode disabled)
- **Database**: PostgreSQL (Required)
- **Frontend**: Next.js 14
- **Mobile**: React Native / Expo

## Step 1: Install Dependencies

From the root directory:

```bash
npm install
```

This will install dependencies for all packages (backend, web, shared, etc.)

## Step 2: Set Up Database

### Option A: Local PostgreSQL

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create database**:
   ```bash
   createdb vangarments_local
   ```

3. **Run migrations** (from backend directory):
   ```bash
   cd packages/backend
   npm run migrate
   ```

### Option B: Use Supabase (Cloud PostgreSQL)

If you have a Supabase project, you can use that instead. Just set the `DATABASE_URL` in your environment variables.

## Step 3: Configure Environment Variables

### Backend Configuration

Create `packages/backend/.env`:

```env
# Database
DATABASE_URL=postgresql://localhost:5432/vangarments_local
# Or use your Supabase connection string

# Server
PORT=3001
NODE_ENV=development

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS
CORS_ORIGIN=http://localhost:3000

# File Upload (local storage for development)
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

### Frontend Configuration

Create `packages/web/.env.local`:

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Environment
NODE_ENV=development
```

## Step 4: Run the Application

### Option A: Run Both Together (Recommended)

From the root directory:

```bash
npm run dev
```

This will start both backend (port 3001) and frontend (port 3000) simultaneously.

### Option B: Run Separately

**Terminal 1 - Backend:**
```bash
cd packages/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd packages/web
npm run dev
```

## Step 5: Access the Application

- **Web App**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/v1/health

## Step 6: Create Your First User

### Option A: Register via Web UI

1. Go to http://localhost:3000/register
2. Fill in the registration form
3. You'll be automatically logged in

### Option B: Create Admin User (via script)

```bash
cd packages/backend
npm run create-admin:init
```

## Troubleshooting

### Database Connection Issues

If you get database connection errors:

1. **Check PostgreSQL is running**:
   ```bash
   # macOS/Linux
   pg_isready
   
   # Or check service status
   brew services list  # macOS
   sudo systemctl status postgresql  # Linux
   ```

2. **Verify database exists**:
   ```bash
   psql -l | grep vangarments_local
   ```

3. **Check connection string** in `packages/backend/.env`

### Port Already in Use

If port 3000 or 3001 is already in use:

1. **Change backend port** in `packages/backend/.env`:
   ```env
   PORT=3002
   ```

2. **Update frontend** in `packages/web/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
   ```

### Module Not Found Errors

If you get module not found errors:

1. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   rm -rf packages/*/node_modules packages/*/package-lock.json
   npm install
   ```

### TypeScript Errors

If you see TypeScript errors:

1. **Run type check**:
   ```bash
   cd packages/web
   npm run type-check
   ```

2. **Check if types are installed**:
   ```bash
   npm install --save-dev @types/node @types/react @types/react-dom
   ```

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- Frontend: Changes to React components will auto-reload
- Backend: Changes to TypeScript files will auto-restart the server

### API Testing

You can test the API directly:

```bash
# Health check
curl http://localhost:3001/api/v1/health

# With authentication (after login)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/v1/wardrobe/items
```

### Database Migrations

To run new migrations:

```bash
cd packages/backend
npm run migrate
```

To check migration status:

```bash
npm run migrate:status
```

## Next Steps

1. **Explore the app**: Navigate to different pages (wardrobe, social, marketplace)
2. **Add items**: Try adding items to your wardrobe
3. **Create posts**: Share outfits on the social feed
4. **Browse marketplace**: Check out the marketplace listings

## Need Help?

- Check the main `README.md` for more detailed documentation
- Review `DEVELOPMENT_GUIDE.md` for development workflows
- Check backend logs in Terminal 1
- Check browser console for frontend errors

