# PowerShell script for testing role-based access control
Write-Host "🧪 Testing Role-Based Access Control System" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Base URL
$BASE_URL = "http://localhost:3001/api/v1"

Write-Host ""
Write-Host "📋 Available Test Users:" -ForegroundColor Yellow
Write-Host "1. Admin: admin@queenhills.com / admin123"
Write-Host "2. Sales Person 1: sales1@queenhills.com / sales123"
Write-Host "3. Sales Person 2: sales2@queenhills.com / sales123"
Write-Host "4. Accountant: accountant@queenhills.com / account123"
Write-Host ""

# Function to login and get token
function Test-UserLogin {
    param(
        [string]$Email,
        [string]$Password,
        [string]$Role
    )
    
    Write-Host "🔐 Testing login for $Role ($Email)..." -ForegroundColor Blue
    
    $loginData = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginData -ContentType "application/json"
        
        if ($response.access_token) {
            Write-Host "✅ Login successful for $Role" -ForegroundColor Green
            $token = $response.access_token
            Write-Host "Token: $($token.Substring(0, [Math]::Min(20, $token.Length)))..."
            
            # Test accessing user profile
            Write-Host "📊 Testing profile access..." -ForegroundColor Blue
            $headers = @{ Authorization = "Bearer $token" }
            
            try {
                $profileResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/me" -Method Get -Headers $headers
                if ($profileResponse.email) {
                    Write-Host "✅ Profile access successful" -ForegroundColor Green
                } else {
                    Write-Host "❌ Profile access failed" -ForegroundColor Red
                }
            } catch {
                Write-Host "❌ Profile access failed: $($_.Exception.Message)" -ForegroundColor Red
            }
            
            # Test role-specific endpoints
            if ($Role -eq "Admin") {
                Write-Host "🔧 Testing admin endpoints..." -ForegroundColor Blue
                try {
                    $usersResponse = Invoke-RestMethod -Uri "$BASE_URL/users" -Method Get -Headers $headers
                    if ($usersResponse) {
                        Write-Host "✅ Admin can access users endpoint" -ForegroundColor Green
                    } else {
                        Write-Host "❌ Admin cannot access users endpoint" -ForegroundColor Red
                    }
                } catch {
                    Write-Host "❌ Admin users endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
            
            if ($Role -eq "Sales Person") {
                Write-Host "📈 Testing sales endpoints..." -ForegroundColor Blue
                try {
                    $activitiesResponse = Invoke-RestMethod -Uri "$BASE_URL/sales-activities/my-stats" -Method Get -Headers $headers
                    if ($activitiesResponse) {
                        Write-Host "✅ Sales person can access activities endpoint" -ForegroundColor Green
                    } else {
                        Write-Host "❌ Sales person cannot access activities endpoint" -ForegroundColor Red
                    }
                } catch {
                    Write-Host "❌ Sales activities endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        } else {
            Write-Host "❌ Login failed for $Role - No token received" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Login failed for $Role - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Test different user roles
Test-UserLogin -Email "admin@queenhills.com" -Password "admin123" -Role "Admin"
Test-UserLogin -Email "sales1@queenhills.com" -Password "sales123" -Role "Sales Person"
Test-UserLogin -Email "accountant@queenhills.com" -Password "account123" -Role "Accountant"

Write-Host "🎉 Role-based access testing completed!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start the backend server: cd backend && npm run start:dev"
Write-Host "2. Start the frontend server: cd frontend && npm run dev"
Write-Host "3. Visit http://localhost:3000 and test the different dashboards"
Write-Host "4. Login with different roles to see role-specific interfaces"
