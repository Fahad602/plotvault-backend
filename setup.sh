#!/bin/bash

echo "🚀 Setting up Queen Hills Murree Dashboard..."

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database Configuration
DATABASE_URL=queen-hills.db

# JWT Configuration
JWT_SECRET=queen-hills-super-secret-jwt-key-2024
JWT_REFRESH_SECRET=queen-hills-super-secret-refresh-key-2024

# Application Configuration
NODE_ENV=development
PORT=3001
EOF
    echo "✅ .env file created"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
fi

# Run database migrations
echo "🗄️ Running database migrations..."
npm run db:migrate

# Create users
echo "👥 Creating initial users..."
npx ts-node src/database/seeds/create-users.ts

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Login Credentials:"
echo "👑 Super Admin: admin@queenhills.com / admin123"
echo "💰 Accountant: accountant@queenhills.com / accountant123"
echo "📞 Sales Agent: sales@queenhills.com / sales123"
echo ""
echo "🚀 Start the backend: npm run start:dev"
echo "🌐 Start the frontend: cd ../frontend && npm run dev"
echo "📊 Access dashboard: http://localhost:3000/dashboard" 