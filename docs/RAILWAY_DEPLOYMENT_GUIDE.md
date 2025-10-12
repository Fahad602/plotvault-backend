# Railway Deployment Guide - Queen Hills Backend

This guide will help you deploy your NestJS backend to Railway, a modern platform that supports persistent connections and background jobs.

## 🎯 Why Railway for Your Backend?

Railway is perfect for your Queen Hills backend because it supports:
- ✅ **Persistent Connections**: WebSockets, real-time features
- ✅ **Background Jobs**: Cron jobs, scheduled tasks
- ✅ **File System Access**: File uploads, document storage
- ✅ **Managed PostgreSQL**: Built-in database
- ✅ **Automatic SSL**: HTTPS out of the box
- ✅ **Easy Deployments**: Git-based deployments
- ✅ **Cost Effective**: $5-20/month vs $20-40/month VPS

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code pushed to GitHub
3. **Domain Name**: For custom domain (optional)

## 🚀 Step 1: Prepare Backend for Railway

### 1.1 Create Railway Configuration

Create `railway.json` in your backend directory:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 1.2 Update Dockerfile for Railway

```dockerfile
# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

### 1.3 Create Health Check

Create `healthcheck.js`:

```javascript
const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3001,
  path: '/api/v1/health',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
```

## 🔧 Step 2: Deploy to Railway

### 2.1 Connect GitHub Repository

1. **Go to Railway Dashboard**:
   - Visit [railway.app/dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"

2. **Select Repository**:
   - Choose your housing-society repository
   - Select the `backend` folder as root directory

3. **Configure Deployment**:
   - Railway will automatically detect the Dockerfile
   - Click "Deploy"

### 2.2 Set Environment Variables

Go to your project settings → Variables and add:

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

## 🗄️ Step 3: Set Up Database

### 3.1 Add PostgreSQL Service

1. **Add Database**:
   - In your Railway project dashboard
   - Click "New Service" → "Database" → "Postgres"

2. **Get Connection String**:
   - Click on the Postgres service
   - Go to "Connect" tab
   - Copy the connection string
   - Set it as `DATABASE_URL` in your environment variables

### 3.2 Database Configuration

Railway will automatically set the `DATABASE_URL` environment variable. Your NestJS app will use this for database connections.

## 🌐 Step 4: Configure Domain

### 4.1 Get Railway URL

Railway provides a default URL like:
`https://your-app-name.railway.app`

### 4.2 Custom Domain (Optional)

1. **Add Domain**:
   - Go to project settings
   - Navigate to "Domains"
   - Add your custom domain (e.g., `api.yourdomain.com`)

2. **Configure DNS**:
   - Add CNAME record pointing to your Railway deployment
   - Railway will automatically provision SSL certificate

## ✅ Step 5: Test Deployment

### 5.1 Health Check

```bash
curl https://your-app-name.railway.app/api/v1/health
```

### 5.2 API Documentation

Visit: `https://your-app-name.railway.app/api/docs`

### 5.3 Test Authentication

```bash
curl -X POST https://your-app-name.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@queenhills.com","password":"admin123"}'
```

## 🔗 Step 6: Connect Frontend

### 6.1 Update Frontend Environment

In your Vercel dashboard, update the environment variable:

```
NEXT_PUBLIC_API_URL=https://your-app-name.railway.app/api/v1
```

### 6.2 Test Integration

1. **Deploy Frontend**:
   ```bash
   cd frontend
   vercel --prod
   ```

2. **Test API Calls**:
   - Visit your frontend
   - Check if API calls are working
   - Test authentication flow

## 🔒 Step 7: Security Configuration

### 7.1 Environment Variables

Make sure these are set in Railway:

```env
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 7.2 CORS Configuration

Your NestJS app should have CORS configured in `main.ts`:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
```

## 📊 Step 8: Monitoring and Maintenance

### 8.1 Railway Monitoring

Railway provides built-in monitoring:
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, and network usage
- **Alerts**: Custom alert configurations

### 8.2 Health Checks

Railway automatically monitors your health check endpoint:
- **Interval**: Every 30 seconds
- **Timeout**: 3 seconds
- **Retries**: 3 attempts

### 8.3 Database Backups

Railway automatically backs up your PostgreSQL database:
- **Frequency**: Daily backups
- **Retention**: 7 days
- **Restore**: Available in dashboard

## 💰 Cost Comparison

### Railway Pricing

- **Hobby Plan**: Free (500 hours/month)
- **Pro Plan**: $5/month (unlimited hours)
- **Database**: Included with Pro plan

### VPS Pricing

- **DigitalOcean**: $20-40/month
- **Linode**: $20-40/month
- **AWS EC2**: $15-50/month

### Total Cost

- **Railway**: $5-20/month
- **VPS**: $20-40/month
- **Savings**: $15-20/month

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Dockerfile syntax
   - Verify all dependencies are in package.json
   - Check for TypeScript errors

2. **Database Connection**:
   - Verify DATABASE_URL is set
   - Check database service is running
   - Ensure network connectivity

3. **CORS Issues**:
   - Verify FRONTEND_URL is correct
   - Check CORS configuration in main.ts

4. **Health Check Failures**:
   - Verify health check endpoint exists
   - Check application is starting correctly

### Debug Commands

```bash
# Check Railway logs
railway logs

# Check environment variables
railway variables

# Restart service
railway up --detach
```

## 🎉 Success Checklist

- [ ] Backend deployed to Railway
- [ ] PostgreSQL database connected
- [ ] Environment variables configured
- [ ] Health checks passing
- [ ] API documentation accessible
- [ ] Frontend connected to backend
- [ ] Authentication working
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up

## 🔄 Next Steps

1. **Deploy Backend**: Follow Step 2
2. **Set Up Database**: Follow Step 3
3. **Configure Domain**: Follow Step 4
4. **Test Deployment**: Follow Step 5
5. **Connect Frontend**: Follow Step 6
6. **Monitor**: Set up monitoring and alerts

## 📞 Support

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **NestJS Deployment**: [docs.nestjs.com](https://docs.nestjs.com)

---

**🎯 Railway is the perfect choice for your Queen Hills backend!**

Railway provides:
- ✅ Persistent connections and WebSockets
- ✅ Background jobs and cron
- ✅ File system access
- ✅ Managed PostgreSQL
- ✅ Automatic SSL
- ✅ Easy deployments
- ✅ Cost-effective hosting
- ✅ Built-in monitoring
- ✅ Automatic backups
