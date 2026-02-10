# Frontend-Backend Integration Guide

This guide explains how to integrate the Next.js frontend with the microservices backend.

## Quick Start

1. **Start the backend services:**
   ```bash
   docker-compose up -d
   ```

2. **Seed the databases:**
   ```bash
   ./scripts/seed-all.sh
   ```

3. **Start the frontend:**
   ```bash
   npm install
   npm run dev
   ```

4. **Login with demo credentials:**
   - Email: `student@university.edu`
   - Password: `password123`

## API Configuration

The frontend is configured to use the API Gateway at:
- Development: `http://localhost:3001/api`
- Production: Set `NEXT_PUBLIC_API_URL` environment variable

## Authentication Flow

1. User submits login form
2. Frontend calls `POST /api/auth/login`
3. Backend returns JWT token
4. Token stored in `localStorage`
5. Token included in all subsequent requests via `Authorization` header

## API Client Usage

The frontend includes an API client (`lib/api.ts`) that handles:
- Token management
- Request/response formatting
- Error handling

Example usage:
```typescript
import { authApi } from '@/lib/api';

// Login
const response = await authApi.login(email, password);
if (response.data) {
  // Token automatically stored
  router.push('/student');
}

// Get current user
const userResponse = await authApi.getMe();
```

## Updating Frontend Pages

To connect frontend pages to the backend:

1. **Import the API client:**
   ```typescript
   import { apiClient } from '@/lib/api';
   ```

2. **Make API calls:**
   ```typescript
   const response = await apiClient.get('/marketplace/products');
   if (response.data) {
     setProducts(response.data);
   }
   ```

3. **Handle errors:**
   ```typescript
   if (response.error) {
     setError(response.error);
   }
   ```

## Example: Marketplace Page Integration

```typescript
'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export default function MarketplacePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await apiClient.get('/marketplace/products');
      if (response.data) {
        setProducts(response.data);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const addToCart = async (productId: string, quantity: number) => {
    const response = await apiClient.post('/marketplace/cart/items', {
      productId,
      quantity,
    });
    if (response.error) {
      alert(response.error);
    } else {
      alert('Added to cart!');
    }
  };

  // ... render products
}
```

## CORS Configuration

The API Gateway is configured to accept requests from:
- `http://localhost:3000` (default Next.js dev server)

To change this, update `FRONTEND_URL` in `docker-compose.yml` or `.env`.

## Error Handling

The API client automatically handles:
- Network errors
- HTTP errors
- JSON parsing errors

All errors are returned in the format:
```typescript
{
  error: string;
}
```

## Token Refresh

Currently, tokens don't expire (24h default). To implement refresh:
1. Add refresh token endpoint
2. Intercept 401 responses
3. Refresh token automatically
4. Retry original request

## Testing

### Test Authentication
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@university.edu",
    "password": "password123",
    "role": "student",
    "tenantId": "tenant-1"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@university.edu",
    "password": "password123"
  }'
```

### Test Protected Endpoint
```bash
# Get products (requires token)
curl -X GET http://localhost:3001/api/marketplace/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Next Steps

1. **Update all frontend pages** to use the API client
2. **Add loading states** for async operations
3. **Implement error boundaries** for better UX
4. **Add form validation** on frontend
5. **Implement optimistic updates** where appropriate
6. **Add request caching** for frequently accessed data

## Common Issues

### CORS Errors
- Ensure `FRONTEND_URL` in API Gateway matches your frontend URL
- Check browser console for specific CORS error

### 401 Unauthorized
- Token may be expired or invalid
- Check token in `localStorage`
- Re-login if needed

### 403 Forbidden
- User role doesn't have permission
- Check user role in JWT token

### Connection Refused
- Ensure backend services are running: `docker-compose ps`
- Check service logs: `docker-compose logs <service-name>`

## Production Deployment

1. **Set environment variables:**
   - `NEXT_PUBLIC_API_URL`: Production API Gateway URL
   - `JWT_SECRET`: Strong random secret
   - Database passwords
   - RabbitMQ credentials

2. **Enable HTTPS:**
   - Use reverse proxy (nginx/traefik)
   - Configure SSL certificates

3. **Monitor services:**
   - Set up health check endpoints
   - Configure logging and monitoring
   - Set up alerts

4. **Scale services:**
   - Use Docker Swarm or Kubernetes
   - Configure load balancing
   - Set up service discovery





