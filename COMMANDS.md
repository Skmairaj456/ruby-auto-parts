# Ruby Auto Parts - Commands Reference

## Development Commands

### Local Development (Run both client and server)
```bash
# Install all dependencies
npm run install:all

# Start both client and server in development mode
npm run dev
```

### Individual Services

#### Client (Frontend) Commands
```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

#### Server (Backend) Commands
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start development server (with nodemon)
npm run dev

# Start production server
npm start

# Test MongoDB connection
node test-mongo-connection.js

# Test login functionality
node test-login.js

# Debug login
node debug-login.js
```

## Deployment Commands

### Vercel Deployment

#### First Time Setup
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel (from project root)
vercel

# Deploy to production
vercel --prod
```

#### Environment Variables
```bash
# Add environment variable
vercel env add MONGODB_URI

# Add environment variable for production
vercel env add MONGODB_URI production

# List all environment variables
vercel env ls

# Pull environment variables to local .env file
vercel env pull .env.local
```

#### Project Management
```bash
# Link to existing Vercel project
vercel link

# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Remove deployment
vercel remove
```

### Manual Deployment Steps

#### 1. Prepare for Deployment
```bash
# Install all dependencies
npm run install:all

# Build the client
npm run build

# Test the build locally
cd client && npm run preview
```

#### 2. Deploy to Vercel
```bash
# Deploy (first time)
vercel

# Subsequent deployments
vercel --prod
```

## Database Commands

### MongoDB Setup
```bash
# Test MongoDB connection
cd server
node test-mongo-connection.js

# Seed the database
node -e "require('./utils/seed')()"

# Test login
node test-login.js
```

### Database Migration (if needed)
```bash
# Run migration scripts
cd server
node utils/migrateSalesData.js
node utils/updateDeletedItemNames.js
```

## Utility Commands

### Development Utilities
```bash
# Start with specific port
cd server && PORT=3001 npm start

# Start client on different port
cd client && npm run dev -- --port 3000

# Check for linting errors
cd client && npm run lint

# Fix linting errors automatically
cd client && npm run lint -- --fix
```

### Production Testing
```bash
# Test production build locally
npm run build
cd server && npm start

# Test API endpoints
curl http://localhost:5001/api/test-users
curl http://localhost:5001/api/test-activeitems
```

## Troubleshooting Commands

### Debug Commands
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Vercel CLI version
vercel --version

# Check if MongoDB is running (if local)
mongod --version

# Check environment variables
vercel env ls
```

### Log Commands
```bash
# View Vercel function logs
vercel logs

# View specific deployment logs
vercel logs [deployment-url]

# View real-time logs
vercel logs --follow
```

### Clean Commands
```bash
# Clean node_modules and reinstall
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json
rm -rf server/node_modules server/package-lock.json
npm run install:all

# Clean Vercel cache
vercel --force
```

## Quick Start Commands

### For New Developers
```bash
# Clone repository
git clone [your-repo-url]
cd ruby-auto-parts

# Install all dependencies
npm run install:all

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your values

# Start development
npm run dev
```

### For Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Then deploy to production
vercel --prod
```

## Environment-Specific Commands

### Development Environment
```bash
# Start with development environment
NODE_ENV=development npm run dev

# Start server with debug mode
cd server && DEBUG=* npm run dev
```

### Production Environment
```bash
# Build and start production
NODE_ENV=production npm run build
NODE_ENV=production npm start

# Deploy to production
vercel --prod
```

## Monitoring Commands

### Check Application Status
```bash
# Check if server is running
curl http://localhost:5001

# Check API health
curl http://localhost:5001/api/test-users

# Check client build
curl http://localhost:5173
```

### Performance Monitoring
```bash
# Check bundle size
cd client && npm run build
ls -la client/dist

# Check server performance
cd server && npm start
# Monitor in another terminal
top -p $(pgrep node)
```

## Git Integration Commands

### Pre-deployment
```bash
# Commit changes
git add .
git commit -m "Prepare for Vercel deployment"

# Push to repository
git push origin main

# Deploy from Git
vercel --prod
```

### Post-deployment
```bash
# Check deployment status
vercel ls

# Get deployment URL
vercel inspect

# Open deployment in browser
vercel open
```
