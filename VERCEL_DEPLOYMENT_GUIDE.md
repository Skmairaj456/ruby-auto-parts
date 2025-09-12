# Vercel Deployment Guide for Ruby Auto Parts

This guide will help you deploy your Ruby Auto Parts application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas Account**: For production database (recommended)
3. **GitHub Repository**: Your code should be in a GitHub repository

## Step 1: Prepare Your Environment

### 1.1 Set up MongoDB Atlas (Recommended for Production)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Whitelist all IP addresses (0.0.0.0/0) for Vercel deployment
5. Get your connection string

### 1.2 Environment Variables

Copy the `env.example` file and create a `.env.local` file for local development:

```bash
cp env.example .env.local
```

Update the values in `.env.local` with your actual configuration.

## Step 2: Deploy to Vercel

### 2.1 Connect Your Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect the configuration

### 2.2 Configure Build Settings

Vercel should automatically detect:
- **Framework Preset**: Vite (for client)
- **Root Directory**: Leave as root (since we have both client and server)
- **Build Command**: `cd client && npm run build`
- **Output Directory**: `client/dist`

### 2.3 Set Environment Variables

In the Vercel dashboard, go to your project settings and add these environment variables:

#### Required Variables:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ruby_auto_parts?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
NODE_ENV=production
VITE_API_BASE_URL=https://your-app-name.vercel.app/api
CORS_ORIGIN=https://your-app-name.vercel.app
```

#### Optional Variables (if using Cloudinary):
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 2.4 Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your app will be available at `https://your-app-name.vercel.app`

## Step 3: Post-Deployment Configuration

### 3.1 Update CORS and API URLs

After deployment, update your environment variables with the actual Vercel URL:

1. Go to Project Settings → Environment Variables
2. Update `VITE_API_BASE_URL` to: `https://your-actual-app-name.vercel.app/api`
3. Update `CORS_ORIGIN` to: `https://your-actual-app-name.vercel.app`
4. Redeploy your application

### 3.2 Test Your Application

1. Visit your Vercel URL
2. Test the login functionality
3. Verify that API calls are working
4. Check the browser console for any errors

## Step 4: Domain Configuration (Optional)

### 4.1 Custom Domain

1. In Vercel dashboard, go to your project
2. Click on "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure `CORS_ORIGIN` is set to your Vercel URL
2. **API Not Found**: Check that your API routes are properly configured in `vercel.json`
3. **Database Connection**: Verify your MongoDB Atlas connection string and IP whitelist
4. **Build Failures**: Check the build logs in Vercel dashboard

### Debug Commands:

```bash
# Test local build
npm run build

# Test server locally
cd server && npm start

# Check environment variables
vercel env ls
```

## File Structure for Vercel

The following files are essential for Vercel deployment:

- `vercel.json` - Vercel configuration
- `client/package.json` - Frontend dependencies and build scripts
- `server/package.json` - Backend dependencies
- `server/server.js` - Main server file (configured for Vercel)
- `env.example` - Environment variables template

## Production Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] Environment variables set in Vercel
- [ ] CORS origin updated to production URL
- [ ] API base URL updated to production URL
- [ ] JWT secret is secure and random
- [ ] All dependencies are in package.json files
- [ ] Build process completes successfully
- [ ] Application is accessible and functional

## Support

If you encounter issues:

1. Check the Vercel build logs
2. Verify all environment variables are set correctly
3. Test the API endpoints directly
4. Check MongoDB Atlas connection and permissions

For more help, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
