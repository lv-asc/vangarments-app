import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

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

// API health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: ['auth', 'social', 'wardrobe']
  });
});

// WORKING SOCIAL ENDPOINTS
app.get('/api/social/feed', (req, res) => {
  const { feedType = 'discover', limit = 20 } = req.query;
  
  // Return sample posts for now
  const samplePosts = [
    {
      id: '1',
      userId: 'user1',
      postType: 'outfit',
      content: {
        title: 'Perfect Weekend Look',
        description: 'Loving this casual but put-together outfit for weekend errands.',
        imageUrls: ['/api/placeholder/400/600'],
        tags: ['weekend', 'casual', 'denim']
      },
      engagementStats: { likes: 24, comments: 8, shares: 3 },
      user: {
        id: 'user1',
        profile: { name: 'Maria Silva', profilePicture: '/api/placeholder/40/40' }
      },
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      userId: 'user2',
      postType: 'item',
      content: {
        title: 'Vintage Blazer Find',
        description: 'Found this incredible vintage blazer at a thrift store!',
        imageUrls: ['/api/placeholder/400/500'],
        tags: ['vintage', 'blazer', 'thrift']
      },
      engagementStats: { likes: 45, comments: 12, shares: 7 },
      user: {
        id: 'user2',
        profile: { name: 'Ana Costa', profilePicture: '/api/placeholder/40/40' }
      },
      createdAt: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  res.json({
    success: true,
    data: {
      posts: samplePosts,
      hasMore: false,
      pagination: { page: 1, limit: parseInt(limit as string) }
    }
  });
});

app.post('/api/social/posts', (req, res) => {
  const { postType, content, visibility = 'public' } = req.body;
  
  if (!postType || !content || !content.imageUrls || content.imageUrls.length === 0) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'Post type, content, and at least one image are required'
      }
    });
  }

  // Simulate creating a post
  const newPost = {
    id: Date.now().toString(),
    userId: 'current-user',
    postType,
    content,
    engagementStats: { likes: 0, comments: 0, shares: 0 },
    visibility,
    createdAt: new Date().toISOString(),
    user: {
      id: 'current-user',
      profile: { name: 'You', profilePicture: '/api/placeholder/40/40' }
    }
  };

  console.log('📝 Created new post:', newPost);

  res.status(201).json({
    success: true,
    data: { post: newPost }
  });
});

app.post('/api/social/posts/:postId/like', (req, res) => {
  const { postId } = req.params;
  
  const like = {
    id: Date.now().toString(),
    postId,
    userId: 'current-user',
    createdAt: new Date().toISOString()
  };

  console.log('❤️ Liked post:', postId);

  res.status(201).json({
    success: true,
    data: { like }
  });
});

app.delete('/api/social/posts/:postId/like', (req, res) => {
  const { postId } = req.params;
  
  console.log('💔 Unliked post:', postId);

  res.json({
    success: true,
    message: 'Successfully unliked post'
  });
});

// WORKING WARDROBE ENDPOINTS
app.get('/api/wardrobe/items', (req, res) => {
  const sampleItems = [
    {
      id: '1',
      vufsCode: 'VG-001',
      ownerId: 'current-user',
      category: {
        page: 'APPAREL',
        blueSubcategory: 'TOPS',
        whiteSubcategory: 'SHIRTS',
        graySubcategory: 'CASUAL_SHIRTS'
      },
      brand: { brand: 'Zara', line: 'Basic' },
      metadata: {
        name: 'Blusa Branca Básica',
        composition: [{ name: 'Algodão', percentage: 100 }],
        colors: [{ name: 'Branco', hex: '#FFFFFF' }],
        careInstructions: ['Lavar à máquina']
      },
      condition: { status: 'excellent', description: 'Excelente estado' },
      images: [{ url: '/api/placeholder/300/400', type: 'front', isPrimary: true }],
      createdAt: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    data: { items: sampleItems }
  });
});

// WORKING AUTH ENDPOINTS
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email && password) {
    const token = 'fake-jwt-token-' + Date.now();
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: 'current-user',
          email,
          profile: { name: 'Test User' }
        }
      }
    });
  } else {
    res.status(400).json({
      error: { code: 'INVALID_CREDENTIALS', message: 'Email and password required' }
    });
  }
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
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Vangarments backend server (WORKING) running on port ${PORT}`);
  console.log(`📚 API health check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Social feed: http://localhost:${PORT}/api/social/feed`);
  console.log(`👕 Wardrobe: http://localhost:${PORT}/api/wardrobe/items`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth/login`);
});

export default app;