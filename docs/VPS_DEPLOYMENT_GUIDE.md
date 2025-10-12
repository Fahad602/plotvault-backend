# VPS Deployment Guide - Queen Hills Backend

This guide will help you deploy your NestJS backend to a VPS (Virtual Private Server) using Docker and Docker Compose.

## 🎯 Deployment Overview

- **Backend**: NestJS → VPS with Docker
- **Database**: PostgreSQL (containerized)
- **Reverse Proxy**: Nginx with SSL
- **Frontend**: Next.js → Vercel (separate deployment)

## 📋 Prerequisites

1. **VPS Provider**: DigitalOcean, Linode, AWS EC2, etc.
2. **Domain Name**: For SSL certificates
3. **SSH Access**: To your VPS
4. **Docker & Docker Compose**: Installed on VPS

## 🚀 Step 1: VPS Setup

### 1.1 Create VPS Instance

**Recommended Specifications:**
- **CPU**: 2 cores minimum
- **RAM**: 4GB minimum
- **Storage**: 50GB SSD
- **OS**: Ubuntu 20.04 LTS or newer

### 1.2 Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Install additional tools
sudo apt install -y git curl wget unzip
```

### 1.3 Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 🔧 Step 2: Deploy Backend

### 2.1 Clone Repository

```bash
# Clone your repository
git clone https://github.com/yourusername/housing-society.git
cd housing-society/backend
```

### 2.2 Configure Environment

```bash
# Copy environment template
cp .env.example .env.production

# Edit environment variables
nano .env.production
```

**Required Environment Variables:**
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:password@db:5432/queenhills
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 2.3 Deploy with Docker Compose

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

**Manual Deployment:**
```bash
# Build and start services
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

## 🌐 Step 3: Configure Domain and SSL

### 3.1 Domain Configuration

1. **Point Domain to VPS**:
   - Add A record: `yourdomain.com` → `your-vps-ip`
   - Add A record: `api.yourdomain.com` → `your-vps-ip`

### 3.2 SSL Certificate Setup

**Option A: Let's Encrypt (Recommended)**

```bash
# Install Certbot
sudo apt install certbot

# Generate SSL certificate
sudo certbot certonly --standalone -d api.yourdomain.com

# Copy certificates to project
sudo cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem ./ssl/key.pem
sudo chown $USER:$USER ./ssl/*.pem
```

**Option B: Self-Signed Certificate (Development)**

```bash
# Create SSL directory
mkdir -p ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=api.yourdomain.com"
```

### 3.3 Update Nginx Configuration

```bash
# Edit nginx configuration
nano nginx.conf

# Update server_name
server_name api.yourdomain.com;

# Restart nginx
docker-compose restart nginx
```

## 🔒 Step 4: Security Configuration

### 4.1 Firewall Rules

```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 3001   # Block direct access to app
sudo ufw enable
```

### 4.2 SSH Security

```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Disable root login
PermitRootLogin no

# Use key-based authentication
PasswordAuthentication no

# Restart SSH service
sudo systemctl restart ssh
```

### 4.3 Docker Security

```bash
# Create docker network
docker network create queen-hills-network

# Update docker-compose.yml to use network
# Add to each service:
networks:
  - queen-hills-network

networks:
  queen-hills-network:
    external: true
```

## 📊 Step 5: Monitoring and Maintenance

### 5.1 Log Management

```bash
# View application logs
docker-compose logs -f app

# View nginx logs
docker-compose logs -f nginx

# View database logs
docker-compose logs -f db

# Log rotation
sudo nano /etc/logrotate.d/docker
```

### 5.2 Backup Strategy

```bash
# Create backup script
nano backup.sh
```

```bash
#!/bin/bash
# Database backup
docker-compose exec -T db pg_dump -U postgres queenhills > backup_$(date +%Y%m%d_%H%M%S).sql

# Upload to cloud storage (optional)
# aws s3 cp backup_*.sql s3://your-backup-bucket/
```

### 5.3 Health Monitoring

```bash
# Create health check script
nano health-check.sh
```

```bash
#!/bin/bash
# Check if services are running
if ! docker-compose ps | grep -q "Up"; then
    echo "Services are down, restarting..."
    docker-compose restart
fi

# Check API health
if ! curl -f http://localhost:3001/api/v1/health > /dev/null 2>&1; then
    echo "API is not responding, restarting..."
    docker-compose restart app
fi
```

## 🔄 Step 6: Updates and Maintenance

### 6.1 Application Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run migrations
docker-compose exec app npm run db:migrate
```

### 6.2 SSL Certificate Renewal

```bash
# Set up automatic renewal
sudo crontab -e

# Add this line for monthly renewal
0 2 1 * * certbot renew --quiet && docker-compose restart nginx
```

### 6.3 System Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker
sudo apt install docker-ce docker-ce-cli containerd.io

# Restart services
sudo systemctl restart docker
docker-compose restart
```

## 🚨 Troubleshooting

### Common Issues

1. **Services Won't Start**:
   ```bash
   # Check logs
   docker-compose logs
   
   # Check disk space
   df -h
   
   # Check memory
   free -h
   ```

2. **Database Connection Issues**:
   ```bash
   # Check database logs
   docker-compose logs db
   
   # Test connection
   docker-compose exec db psql -U postgres -d queenhills
   ```

3. **SSL Certificate Issues**:
   ```bash
   # Check certificate validity
   openssl x509 -in ssl/cert.pem -text -noout
   
   # Test SSL
   openssl s_client -connect api.yourdomain.com:443
   ```

4. **Nginx Configuration Issues**:
   ```bash
   # Test nginx configuration
   docker-compose exec nginx nginx -t
   
   # Reload nginx
   docker-compose exec nginx nginx -s reload
   ```

### Debug Commands

```bash
# Check service status
docker-compose ps

# View resource usage
docker stats

# Check network connectivity
docker-compose exec app ping db

# Check file permissions
ls -la ssl/
```

## 💰 Cost Considerations

### VPS Providers

- **DigitalOcean**: $20-40/month
- **Linode**: $20-40/month
- **AWS EC2**: $15-50/month
- **Vultr**: $20-40/month

### Additional Costs

- **Domain**: $10-15/year
- **SSL Certificate**: Free (Let's Encrypt)
- **Backup Storage**: $5-10/month
- **Monitoring**: $10-20/month

## 📝 Environment Variables Reference

### Production Environment

```env
# Application
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://postgres:password@db:5432/queenhills

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
BCRYPT_ROUNDS=12

# CORS
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS
SMS_API_KEY=your-sms-api-key
SMS_SENDER_ID=QueenHills

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

## 🎉 Success Checklist

- [ ] VPS provisioned and configured
- [ ] Docker and Docker Compose installed
- [ ] Repository cloned and configured
- [ ] Environment variables set
- [ ] Services deployed and running
- [ ] Domain configured and pointing to VPS
- [ ] SSL certificate installed
- [ ] Nginx reverse proxy configured
- [ ] Firewall rules applied
- [ ] Health checks working
- [ ] Backup strategy implemented
- [ ] Monitoring set up

## 🔄 Next Steps

1. **Deploy Backend**: Follow Step 2
2. **Configure Domain**: Follow Step 3
3. **Set Up Security**: Follow Step 4
4. **Implement Monitoring**: Follow Step 5
5. **Test Integration**: Test with frontend
6. **Set Up Backups**: Implement backup strategy

## 📞 Support

- **Docker Documentation**: [docs.docker.com](https://docs.docker.com)
- **Nginx Documentation**: [nginx.org/en/docs](https://nginx.org/en/docs)
- **Let's Encrypt**: [letsencrypt.org](https://letsencrypt.org)
- **NestJS Deployment**: [docs.nestjs.com](https://docs.nestjs.com)

---

**🎯 Your Queen Hills Backend is now ready for VPS deployment!**

This setup provides:
- ✅ Full control over server resources
- ✅ Persistent connections and WebSockets
- ✅ Background job processing
- ✅ Custom SSL certificates
- ✅ Advanced security configurations
- ✅ Scalable architecture
- ✅ Cost-effective hosting
