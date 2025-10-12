#!/bin/bash

echo "🧪 Testing Queen Hills Murree API..."

BASE_URL="http://localhost:3001/api/v1"

echo ""
echo "1. Testing Health Check..."
curl -s "$BASE_URL/health" | jq '.'

echo ""
echo "2. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@queenhills.com", "password": "admin123"}')

echo "$LOGIN_RESPONSE" | jq '.'

# Extract token from login response
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')

if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
  echo ""
  echo "3. Testing Dashboard Stats..."
  curl -s "$BASE_URL/dashboard/stats" \
    -H "Authorization: Bearer $TOKEN" | jq '.'

  echo ""
  echo "4. Testing Plots API..."
  curl -s "$BASE_URL/plots" \
    -H "Authorization: Bearer $TOKEN" | jq '.'

  echo ""
  echo "5. Testing Customers API..."
  curl -s "$BASE_URL/customers" \
    -H "Authorization: Bearer $TOKEN" | jq '.'

  echo ""
  echo "6. Testing Bookings API..."
  curl -s "$BASE_URL/bookings" \
    -H "Authorization: Bearer $TOKEN" | jq '.'

  echo ""
  echo "7. Testing Finance API..."
  curl -s "$BASE_URL/finance/overview" \
    -H "Authorization: Bearer $TOKEN" | jq '.'

  echo ""
  echo "✅ All API tests completed!"
else
  echo ""
  echo "❌ Login failed. Please check your credentials and server status."
fi 