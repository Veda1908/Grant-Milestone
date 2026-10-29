1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key (if needed)
3. Run the app:
   `npm run dev`

## Deploy to Vercel

### Method 1: Deploy via GitHub / GitLab / Bitbucket (Recommended)

1. Push this project to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **"Add New..."** → **"Project"**.
4. Import your GitHub repository.
5. Vercel will automatically detect the settings from `vercel.json`:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. (Optional) In **Environment Variables**, add `GEMINI_API_KEY` if you plan to use server-side Gemini features.
7. Click **"Deploy"**.

### Method 2: Deploy via Vercel CLI

1. Install the Vercel CLI globally (or run with `npx`):
   ```bash
   npm i -g vercel
   ```
2. In the project directory, run:
   ```bash
   vercel
   ```
3. Follow the CLI prompts to link and deploy to preview.
4. For production deployment, run:
   ```bash
   vercel --prod
   ```
