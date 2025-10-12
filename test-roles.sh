#!/bin/bash

# Test script for role-based access control
echo "🧪 Testing Role-Based Access Control System"
echo "=========================================="

# Base URL
BASE_URL="http://localhost:3001/api/v1"

echo ""
echo "📋 Available Test Users:"
echo "1. Admin: admin@queenhills.com / admin123"
echo "2. Sales Person 1: sales1@queenhills.com / sales123"
echo "3. Sales Person 2: sales2@queenhills.com / sales123"
echo "4. Accountant: accountant@queenhills.com / account123"
echo ""

# Function to login and get token
login_user() {
    local email=$1
    local password=$2
    local role=$3
    
    echo "🔐 Testing login for $role ($email)..."
    
    response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    token=$(echo $response | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$token" ]; then
        echo "✅ Login successful for $role"
        echo "Token: ${token:0:20}..."
        
        # Test accessing user profile
        echo "📊 Testing profile access..."
        profile_response=$(curl -s -X GET "$BASE_URL/auth/me" \
            -H "Authorization: Bearer $token")
        
        if echo $profile_response | grep -q "email"; then
            echo "✅ Profile access successful"
        else
            echo "❌ Profile access failed"
        fi
        
        # Test role-specific endpoints
        if [ "$role" = "Admin" ]; then
            echo "🔧 Testing admin endpoints..."
            users_response=$(curl -s -X GET "$BASE_URL/users" \
                -H "Authorization: Bearer $token")
            
            if echo $users_response | grep -q "email"; then
                echo "✅ Admin can access users endpoint"
            else
                echo "❌ Admin cannot access users endpoint"
            fi
        fi
        
        if [ "$role" = "Sales Person" ]; then
            echo "📈 Testing sales endpoints..."
            activities_response=$(curl -s -X GET "$BASE_URL/sales-activities/my-stats" \
                -H "Authorization: Bearer $token")
            
            if echo $activities_response | grep -q "totalActivities"; then
                echo "✅ Sales person can access activities endpoint"
            else
                echo "❌ Sales person cannot access activities endpoint"
            fi
        fi
        
    else
        echo "❌ Login failed for $role"
        echo "Response: $response"
    fi
    
    echo ""
}

# Test different user roles
login_user "admin@queenhills.com" "admin123" "Admin"
login_user "sales1@queenhills.com" "sales123" "Sales Person"
login_user "accountant@queenhills.com" "account123" "Accountant"

echo "🎉 Role-based access testing completed!"
echo ""
echo "💡 Next Steps:"
echo "1. Start the backend server: cd backend && npm run start:dev"
echo "2. Start the frontend server: cd frontend && npm run dev"
echo "3. Visit http://localhost:3000 and test the different dashboards"
echo "4. Login with different roles to see role-specific interfaces"
