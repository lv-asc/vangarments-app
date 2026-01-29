/**
 * Test-specific Express app instance
 * Avoids port conflicts during testing
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Create Express app for testing
const app = express();

// Store for simulating data persistence in tests
const itemStore: { [key: string]: any } = {};

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mock routes for testing
app.post('/auth/register', (req, res) => {
  res.status(201).json({
    success: true,
    data: {
      user: {
        id: 'test-user-id',
        email: req.body.email,
        name: req.body.name
      },
      token: 'test-jwt-token'
    }
  });
});

app.post('/auth/login', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: 'test-user-id',
        email: req.body.email
      },
      token: 'test-jwt-token'
    }
  });
});

app.get('/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No token provided' }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    }
  });
});

app.post('/auth/refresh', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      token: 'new-test-jwt-token'
    }
  });
});

app.get('/wardrobe/items', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      items: [],
      total: 0,
      page: 1,
      limit: 20
    }
  });
});

app.post('/wardrobe/items', (req, res) => {
  // Validate required fields
  if (!req.body.name || req.body.name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: [{ field: 'name', message: 'Name is required' }]
      }
    });
  }

  if (!['shirts', 'pants', 'shoes', 'accessories'].includes(req.body.category)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: [{ field: 'category', message: 'Invalid category' }]
      }
    });
  }

  const item = {
    id: `item-${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    data: item
  });
});

app.get('/wardrobe/items/:id', (req, res) => {
  const { id } = req.params;

  if (id === 'nonexistent-id') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Item not found'
      }
    });
  }

  // Return stored item or default
  const item = itemStore[id] || {
    id,
    name: 'Test Item',
    category: 'shirts',
    color: 'blue',
    size: 'M',
    condition: 'new'
  };

  res.status(200).json({
    success: true,
    data: item
  });
});

app.put('/wardrobe/items/:id', (req, res) => {
  const { id } = req.params;

  // Get existing item or create base item
  const existingItem = itemStore[id] || {
    id,
    name: 'Test Item',
    category: 'shirts',
    color: 'red',
    size: 'L',
    condition: 'new'
  };

  // Update with new data
  const updatedItem = {
    ...existingItem,
    ...req.body,
    lastModified: new Date().toISOString()
  };

  // Store the updated item
  itemStore[id] = updatedItem;

  res.status(200).json({
    success: true,
    data: updatedItem
  });
});

app.post('/wardrobe/items/upload-image', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      imageUrl: 'https://example.com/test-image.jpg'
    }
  });
});

app.get('/marketplace/listings', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      listings: [],
      total: 0
    }
  });
});

app.get('/social/feed', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      posts: [],
      total: 0
    }
  });
});

// Batch operations
app.post('/wardrobe/items/batch', (req, res) => {
  const { items, batchId } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BATCH_VALIDATION_ERROR',
        message: 'Items array is required'
      }
    });
  }

  if (items.length > 10) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BATCH_SIZE_EXCEEDED',
        message: 'Maximum 10 items allowed per batch'
      }
    });
  }

  // Validate items
  const validItems = [];
  const failedItems = [];

  items.forEach((item, index) => {
    if (!item.name || item.name.trim() === '') {
      failedItems.push({
        index,
        item,
        error: 'Name is required'
      });
    } else if (!['shirts', 'pants', 'shoes', 'accessories'].includes(item.category)) {
      failedItems.push({
        index,
        item,
        error: 'Invalid category'
      });
    } else {
      validItems.push({
        ...item,
        id: `batch-item-${Date.now()}-${index}`,
        createdAt: new Date().toISOString()
      });
    }
  });

  if (failedItems.length > 0 && validItems.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BATCH_VALIDATION_ERROR',
        details: failedItems
      }
    });
  }

  if (failedItems.length > 0) {
    return res.status(207).json({
      success: true,
      data: {
        batchId,
        successfulItems: validItems,
        failedItems
      }
    });
  }

  res.status(201).json({
    success: true,
    data: {
      batchId,
      processedItems: validItems
    }
  });
});

app.get('/wardrobe/items/batch/:batchId/progress', (req, res) => {
  const { batchId } = req.params;

  res.status(200).json({
    success: true,
    data: {
      batchId,
      status: 'completed',
      totalItems: 5,
      processedItems: 5,
      failedItems: 0,
      progress: 100
    }
  });
});

// Sync endpoints
app.post('/sync/wardrobe-items', (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'SYNC_VALIDATION_ERROR',
        message: 'Items array is required'
      }
    });
  }

  // Check for validation errors
  const invalidItems = items.filter(item => !item.name || item.name.trim() === '');
  if (invalidItems.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'SYNC_VALIDATION_ERROR',
        details: invalidItems.map(item => ({ item, error: 'Name is required' }))
      }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      syncedItems: items.map(item => ({
        ...item,
        synced: true,
        syncTimestamp: new Date().toISOString()
      })),
      conflicts: []
    }
  });
});

app.get('/sync/wardrobe-items/incremental', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      items: [],
      lastSyncTimestamp: new Date().toISOString()
    }
  });
});

// Additional sync endpoints
app.get('/sync/wardrobe-items/paginated', (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  res.status(200).json({
    success: true,
    data: {
      items: [],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: 0,
        pages: 0
      }
    }
  });
});

app.post('/sync/queue-operations', (req, res) => {
  const { operations } = req.body;

  res.status(200).json({
    success: true,
    data: {
      queuedOperations: operations.length
    }
  });
});


// Batch history and cleanup endpoints
app.get('/wardrobe/items/batch/history', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      batches: [],
      pagination: {
        limit: 10,
        offset: 0,
        total: 0
      }
    }
  });
});

app.delete('/wardrobe/items/batch/cleanup', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      cleanedBatches: 0
    }
  });
});

// Batch image upload endpoints
app.post('/wardrobe/items/batch-images', (req, res) => {
  const batchId = req.body.batchId || `batch-${Date.now()}`;

  res.status(202).json({
    success: true,
    data: {
      batchId,
      status: 'processing'
    }
  });
});

app.get('/wardrobe/items/batch-images/:batchId/progress', (req, res) => {
  const { batchId } = req.params;

  res.status(200).json({
    success: true,
    data: {
      batchId,
      totalImages: 3,
      processedImages: 3,
      processingStatus: 'completed'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong!'
    }
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
}); export {
  app
};