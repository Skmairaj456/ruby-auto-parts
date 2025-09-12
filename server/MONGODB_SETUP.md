# 🚀 Quick MongoDB Setup Guide

## Option 1: Use MongoDB Atlas (Recommended - No Installation Required)

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Create a free account** if you don't have one
3. **Create a new cluster** (free tier)
4. **Get your connection string** from the "Connect" button
5. **Update the connection string** in the code

## Option 2: Install MongoDB Locally (Windows)

### Quick Install with Chocolatey:
```powershell
# Install Chocolatey if you don't have it
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install MongoDB
choco install mongodb
```

### Manual Install:
1. **Download MongoDB Community Server**: https://www.mongodb.com/try/download/community
2. **Run the installer** and follow the setup wizard
3. **Start MongoDB service**:
   ```powershell
   net start MongoDB
   ```

## Option 3: Use MongoDB Compass (GUI + Local Server)

1. **Download MongoDB Compass**: https://www.mongodb.com/products/compass
2. **Install and run Compass**
3. **Connect to localhost:27017**
4. **Create database**: `ruby_auto_parts`

## 🎯 Quick Fix for Your Current Issue

The easiest solution is to use the new startup script I created:

```bash
# Stop the current server (Ctrl+C)
# Then run:
node start-local.js
```

This will try multiple local MongoDB connections and give you clear error messages.

## 🔧 If You Want to Use Atlas

1. **Get your Atlas connection string**
2. **Replace the connection in server.js**:
   ```javascript
   mongoose.connect("YOUR_ATLAS_CONNECTION_STRING_HERE", { useNewUrlParser: true, useUnifiedTopology: true })
   ```

## ✅ Test Your Setup

After setting up MongoDB, test with:
```bash
node test-login.js
```

This will verify your database connection and user seeding.
