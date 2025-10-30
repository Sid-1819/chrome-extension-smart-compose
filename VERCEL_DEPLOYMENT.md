# Vercel API Deployment Guide

This guide explains how to deploy your resume parsing API to Vercel using the Gemini API.

## Overview

Your application now supports uploading PDF and DOCX resume files. When users upload these files:

1. The frontend sends the file to your Vercel API endpoint (`/api/parse-resume`)
2. The API extracts text from the PDF/DOCX file
3. The API uses Gemini AI to clean and format the extracted text
4. The cleaned text is returned to the frontend and used for cover letter generation

## Prerequisites

- [Vercel account](https://vercel.com/signup) (free tier works!)
- [Vercel CLI](https://vercel.com/download) installed (optional but recommended)
- Google AI Studio API key (you already have this!)

## Step 1: Install Vercel CLI (Optional)

```bash
npm i -g vercel
# or
pnpm add -g vercel
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Easiest)

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Add Vercel API for resume parsing"
   git push
   ```

2. **Go to [Vercel Dashboard](https://vercel.com/new)**

3. **Import your GitHub repository**
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Vercel will auto-detect the project settings

4. **Configure Build Settings**
   - Framework Preset: **Vite** (should be auto-detected)
   - Build Command: `pnpm build` (or leave default)
   - Output Directory: `dist` (should be pre-filled)
   - Install Command: `pnpm install`

5. **Add Environment Variable**
   - In the deployment settings, find "Environment Variables"
   - Add a new variable:
     - **Name:** `GEMINI_API_KEY`
     - **Value:** Your Google AI Studio API key (the one you created)
     - **Environments:** Check all (Production, Preview, Development)

6. **Click "Deploy"**
   - Wait for the deployment to complete (usually 1-2 minutes)
   - You'll get a URL like `https://your-project.vercel.app`

### Option B: Deploy via CLI

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Link to existing project? → No (first time)
   - Project name? → Press Enter (use default)
   - Directory? → `./` (current directory)
   - Modify settings? → No

4. **Add Environment Variable**
   ```bash
   vercel env add GEMINI_API_KEY
   ```
   - Choose: Production, Preview, and Development
   - Paste your Google AI Studio API key

5. **Deploy to production**
   ```bash
   vercel --prod
   ```

## Step 3: Test Your Deployment

1. **Visit your deployed site** (e.g., `https://your-project.vercel.app`)

2. **Test the resume upload feature:**
   - Go to the "Interview Prep" tab
   - Scroll down to "Upload / Paste Resume"
   - Upload a PDF or DOCX resume file
   - You should see "✅ Successfully parsed [filename]"

3. **Check the API directly** (optional):
   ```bash
   curl -X POST https://your-project.vercel.app/api/parse-resume \
     -F "file=@/path/to/your/resume.pdf"
   ```

## Step 4: Update Environment Variables (If Needed)

If you need to update your API key later:

### Via Dashboard:
1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Environment Variables"
3. Find `GEMINI_API_KEY` and click "Edit"
4. Update the value and save
5. Redeploy your project

### Via CLI:
```bash
vercel env rm GEMINI_API_KEY production
vercel env add GEMINI_API_KEY
```

## Local Development

To test the API locally before deploying:

1. **Create a `.env.local` file** in your project root:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

2. **Install Vercel CLI** (if not already):
   ```bash
   pnpm add -g vercel
   ```

3. **Run the development server**:
   ```bash
   vercel dev
   ```
   This will start:
   - Frontend at `http://localhost:3000`
   - API at `http://localhost:3000/api/*`

4. **Test the API locally**:
   - Open the app at `http://localhost:3000`
   - Try uploading a PDF/DOCX resume

## File Structure

```
chrome-extension-smart-compose/
├── api/
│   └── parse-resume.ts       # Vercel serverless function
├── src/
│   └── App.tsx               # Frontend with upload logic
├── vercel.json               # Vercel configuration
├── package.json
└── VERCEL_DEPLOYMENT.md      # This file
```

## API Endpoint Details

### Endpoint: `/api/parse-resume`

**Method:** POST

**Content-Type:** multipart/form-data

**Request Body:**
- `file`: The resume file (PDF, DOCX, TXT, MD)

**Response (Success):**
```json
{
  "success": true,
  "text": "Extracted and cleaned resume text...",
  "originalLength": 5432,
  "cleanedLength": 5123,
  "filename": "resume.pdf"
}
```

**Response (Error):**
```json
{
  "error": "Error message describing what went wrong"
}
```

## Supported File Types

- **PDF** (`.pdf`)
- **DOCX** (`.docx`)
- **Plain Text** (`.txt`, `.md`) - handled client-side, no API call

## Cost Considerations

### Vercel Free Tier Limits:
- **Serverless Functions:** 100 GB-hours/month
- **Invocations:** 100,000/month
- **Function Duration:** Max 10 seconds (we set 30s for generous parsing time)

### Gemini API Free Tier:
- **15 requests per minute**
- **1 million tokens per day**
- **1,500 requests per day**

For a resume parsing app, the free tiers should be more than sufficient!

## Troubleshooting

### Issue: "GEMINI_API_KEY not configured"
- **Solution:** Make sure you added the environment variable in Vercel settings
- Redeploy after adding the variable

### Issue: "Failed to parse resume"
- **Check:** File size (max 10MB)
- **Check:** File format (must be PDF, DOCX, TXT, or MD)
- **Check:** Vercel function logs in the dashboard

### Issue: API timeout
- **Cause:** Large PDF files can take time to process
- **Solution:** Increase `maxDuration` in `vercel.json` (we set it to 30s)

### Issue: CORS errors in development
- **Solution:** Use `vercel dev` instead of `vite` for local development
- Or set up CORS headers in the API

## Next Steps

- ✅ Your API is deployed and ready!
- Test with different resume formats (PDF, DOCX)
- Monitor usage in [Vercel Analytics](https://vercel.com/docs/analytics)
- Check [Google AI Studio](https://aistudio.google.com/) for API usage

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Serverless Functions Guide](https://vercel.com/docs/functions/serverless-functions)

---

**Need help?** Check the Vercel logs in your dashboard or run `vercel logs` in your terminal.
