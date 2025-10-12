# 🚀 Lead Automation Setup Guide

## Overview

This guide will help you set up automated lead generation from various marketing sources including Facebook Ads, Google Ads, WhatsApp Business, and website forms.

## 🎯 **What You Get**

### **Automated Lead Sources:**
1. **Facebook Lead Ads** - Capture leads directly from Facebook campaigns
2. **Google Ads Lead Forms** - Capture leads from Google Ads campaigns  
3. **WhatsApp Business** - Convert WhatsApp inquiries to leads
4. **Website Forms** - Capture leads from your website forms
5. **Third-party Integrations** - Zapier, Typeform, etc.

### **Smart Features:**
- **Auto-Assignment** - Leads automatically assigned to sales team members
- **Lead Scoring** - Prioritize leads based on budget, source, and behavior
- **Duplicate Detection** - Prevent duplicate leads from multiple sources
- **Real-time Notifications** - Instant alerts for new leads
- **Campaign Tracking** - Full attribution and source tracking

## 🛠️ **Setup Instructions**

### **1. Facebook Lead Ads Integration**

#### **Step 1: Create Facebook App**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app for "Business"
3. Add "Webhooks" and "Lead Ads" products
4. Note down your App ID and App Secret

#### **Step 2: Configure Webhook**
1. In your Facebook app, go to Webhooks
2. Create a new webhook with URL: `https://yourdomain.com/api/v1/webhooks/leads/facebook`
3. Subscribe to `leadgen` events
4. Use verify token: `your-verify-token`

#### **Step 3: Get Page Access Token**
1. Go to Graph API Explorer
2. Select your app and get a Page Access Token
3. Grant `leads_retrieval` permission

#### **Step 4: Environment Variables**
```env
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_VERIFY_TOKEN=your-verify-token
FACEBOOK_ACCESS_TOKEN=your_page_access_token
FACEBOOK_PAGE_ID=your_page_id
```

### **2. WhatsApp Business API Integration**

#### **Step 1: WhatsApp Business Account**
1. Set up WhatsApp Business API account
2. Get your Phone Number ID and Access Token
3. Configure webhook URL: `https://yourdomain.com/api/v1/webhooks/leads/whatsapp`

#### **Step 2: Environment Variables**
```env
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your-whatsapp-verify-token
WHATSAPP_WEBHOOK_SECRET=your_webhook_secret
```

### **3. Google Ads Integration**

#### **Step 1: Google Ads API Setup**
1. Enable Google Ads API in Google Cloud Console
2. Create OAuth 2.0 credentials
3. Get developer token from Google Ads account

#### **Step 2: Environment Variables**
```env
GOOGLE_ADS_CUSTOMER_ID=your_customer_id
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
```

### **4. Website Forms Integration**

#### **Step 1: Add Form Webhook**
Add this JavaScript to your website forms:

```javascript
// Example form submission
document.getElementById('leadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        message: document.getElementById('message').value,
        budget: document.getElementById('budget').value,
        utm_source: getUrlParameter('utm_source'),
        utm_medium: getUrlParameter('utm_medium'),
        utm_campaign: getUrlParameter('utm_campaign'),
        page_url: window.location.href,
        referrer: document.referrer
    };
    
    try {
        const response = await fetch('/api/v1/webhooks/leads/landing-page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            // Show success message
            alert('Thank you! We will contact you soon.');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
    }
});

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}
```

## ⚙️ **Configuration**

### **Lead Assignment Rules**

Configure automatic lead assignment in the dashboard:

1. **High Budget Leads** (Budget > 50 Lakh) → Senior Sales Agent
2. **WhatsApp Inquiries** → WhatsApp Specialist  
3. **Facebook Premium Campaigns** → Facebook Specialist
4. **Google Ads Leads** → Google Ads Specialist

### **Lead Scoring Rules**

Automatic lead scoring based on:
- **Source**: WhatsApp (+20), Referral (+40), Paid Ads (+15)
- **Budget**: >50L (+30), >1Cr (+50)
- **Keywords**: Urgent/Immediate (+25)
- **Engagement**: Multiple inquiries (+15)

### **Notification Settings**

Configure notifications for:
- **Email**: Instant email alerts for new leads
- **Slack**: Team notifications in Slack channel
- **SMS**: SMS alerts for high-priority leads

## 📊 **Usage**

### **Dashboard Access**
- Navigate to **Sales Team Management** → **Lead Automation**
- View real-time lead statistics
- Configure sources and assignment rules
- Monitor webhook status

### **Lead Processing Flow**
1. **Lead Captured** → Webhook receives lead data
2. **Duplicate Check** → System checks for existing leads
3. **Lead Scoring** → Automatic priority assignment
4. **Auto-Assignment** → Lead assigned to sales team member
5. **Notifications** → Team notified of new lead
6. **Activity Logging** → All actions tracked for reporting

### **Testing Webhooks**

Test your webhook integrations:

```bash
# Test Facebook webhook
curl -X POST https://yourdomain.com/api/v1/webhooks/leads/facebook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Test WhatsApp webhook  
curl -X POST https://yourdomain.com/api/v1/webhooks/leads/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 🔧 **Advanced Features**

### **Custom Lead Sources**

Add custom lead sources using the Zapier webhook:

```javascript
// Custom integration example
const leadData = {
    name: "John Doe",
    email: "john@example.com", 
    phone: "+92300123456",
    source: "custom_source",
    campaign_name: "Summer Campaign 2024",
    budget: "50 lakh",
    interests: "5 marla plot, Phase 1",
    notes: "Interested in corner plot"
};

fetch('/api/v1/webhooks/leads/zapier', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leadData)
});
```

### **Lead Enrichment**

Automatically enrich leads with:
- **Location Data** - IP-based location detection
- **Social Profiles** - Social media profile matching
- **Company Information** - Business lead enrichment
- **Behavioral Data** - Website interaction tracking

## 📈 **Analytics & Reporting**

### **Available Metrics**
- **Lead Volume** - Daily, weekly, monthly lead counts
- **Source Performance** - ROI by marketing source
- **Conversion Rates** - Lead to customer conversion
- **Assignment Efficiency** - Sales team performance
- **Response Times** - Average response times by source

### **Custom Reports**
- **Campaign Performance** - Lead quality by campaign
- **Sales Team Efficiency** - Individual performance metrics
- **Source ROI Analysis** - Cost per lead by source
- **Lead Lifecycle** - Time from lead to conversion

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Webhook Not Receiving Data**
   - Check webhook URL is publicly accessible
   - Verify SSL certificate is valid
   - Check firewall settings

2. **Duplicate Leads**
   - Review duplicate detection rules
   - Check email/phone matching logic
   - Verify lead source attribution

3. **Assignment Not Working**
   - Check assignment rules configuration
   - Verify sales team member IDs
   - Review rule priority order

### **Debug Mode**

Enable debug logging:
```env
LOG_LEVEL=debug
LEAD_AUTOMATION_DEBUG=true
```

## 📞 **Support**

For technical support:
- Check application logs for errors
- Review webhook delivery status
- Contact development team for custom integrations

---

**🎉 Your lead automation system is now ready to capture and convert leads automatically!**
