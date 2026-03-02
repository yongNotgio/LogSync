# LogSync AI - Setup Guide

## Prerequisites
- Node.js 18+ installed
- GitHub account
- Google AI Studio account (for Gemini API key)

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Set Up GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: LogSync AI (Dev)
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:5173/auth/callback`
4. Click "Register application"
5. Copy the **Client ID**
6. Generate a new **Client Secret** and copy it

## Step 3: Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the API key

## Step 4: Configure Convex

1. Log in to Convex (if first time):
   ```bash
   npx convex login
   ```

2. Create a new project:
   ```bash
   npx convex dev
   ```

3. Copy your Convex deployment URL (shown in terminal)

4. Go to [Convex Dashboard](https://dashboard.convex.dev)
5. Select your project → Settings → Environment Variables
6. Add these variables:
   - `GITHUB_CLIENT_ID`: Your GitHub OAuth Client ID
   - `GITHUB_CLIENT_SECRET`: Your GitHub OAuth Client Secret
   - `GEMINI_API_KEY`: Your Gemini API key

## Step 5: Configure Frontend

Create `.env.local` in the project root:

```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

Replace:
- `your-deployment.convex.cloud` with your actual Convex URL
- `your_github_client_id` with your GitHub OAuth Client ID

## Step 6: Run the App

Open **two terminals**:

**Terminal 1 - Convex Backend:**
```bash
npx convex dev
```

**Terminal 2 - Vite Frontend:**
```bash
npm run dev
```

## Step 7: Access the App

Open your browser and navigate to:
```
http://localhost:5173
```

## Usage Flow

1. **Sign in** with GitHub OAuth
2. Navigate to **Dashboard**
3. Click **"Create Today's Journal"**
4. Click **"Generate Journal"** to:
   - Fetch your GitHub commits for the day
   - Use AI to create a structured work journal
   - Map commits to an 8-hour workday (08:00-17:00)
5. **Edit blocks** by clicking on them
6. **Finalize** when ready to lock the journal

## Features

- ✅ GitHub OAuth authentication
- ✅ Automatic commit fetching
- ✅ AI-powered journal generation (Gemini 1.5 Flash)
- ✅ Interactive timeline editor
- ✅ Journal history with filtering
- ✅ Dark mode support
- ✅ Responsive design

## Tech Stack

**Frontend:**
- Vite + React 18 + TypeScript
- Tailwind CSS v4
- React Router v7
- Convex React client

**Backend:**
- Convex (serverless)
- GitHub API integration
- Google Gemini API

## Troubleshooting

### "Authentication Required" on all pages
- Ensure `.env.local` has correct `VITE_GITHUB_CLIENT_ID`
- Check GitHub OAuth callback URL is `http://localhost:5173/auth/callback`

### "Failed to fetch commits"
- Verify GitHub OAuth token has repo access
- Check Convex environment variables are set correctly

### "Gemini API error"
- Verify `GEMINI_API_KEY` is set in Convex dashboard
- Check API key is valid and has quota remaining

### TypeScript errors
- Run `npm install` to ensure all dependencies are installed
- Convex functions will auto-generate types on `npx convex dev`

## Project Structure

```
LogSync/
├── convex/              # Convex backend
│   ├── schema.ts        # Database schema
│   ├── auth.ts          # GitHub OAuth
│   ├── users.ts         # User management
│   ├── commits.ts       # Commit fetching
│   ├── journals.ts      # Journal CRUD
│   └── ai.ts            # AI generation
├── src/
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities
│   └── types/           # TypeScript types
├── .env.local           # Frontend environment variables
└── convex.json          # Convex configuration
```

## Next Steps

- Set up production deployment on Convex
- Configure production GitHub OAuth app
- Add data export functionality
- Implement team collaboration features
