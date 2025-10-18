import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Only import working routes
import authRoutes from './routes/auth-simple';
import simpleOAuthRoutes from './routes/simpleOAuth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Working API routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', simpleOAuthRoutes);

// API health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: ['auth', 'oauth']
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      requestId: req.headers['x-request-id'] || 'unknown',
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Vangarments backend server (minimal) running on port ${PORT}`);
  console.log(`📚 API health check available at http://localhost:${PORT}/api/health`);
  console.log(`🔐 OAuth endpoints:`);
  console.log(`   - Google: http://localhost:${PORT}/api/oauth/google`);
  console.log(`   - Facebook: http://localhost:${PORT}/api/oauth/facebook`);
});

export default app;