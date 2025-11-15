# Deployment Guide for Net-Cards

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `net-cards` (or any name you prefer)
3. Description: "PWA for networking through contact exchange"
4. Keep it **Public** (required for free GitHub Pages)
5. **Do NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Push to GitHub

GitHub will show you commands. Use these:

```bash
git remote add origin https://github.com/YOUR_USERNAME/net-cards.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Enable GitHub Pages

1. In your GitHub repository, go to **Settings** tab
2. In the left sidebar, click **Pages**
3. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**
5. Wait 1-2 minutes for deployment
6. Your site will be live at: `https://YOUR_USERNAME.github.io/net-cards/`

## Step 4: Configure Custom Domain (netcards.app)

### A. Update DNS Settings

Log in to your domain registrar (where you bought netcards.app) and add these DNS records:

**For apex domain (netcards.app):**
```
Type: A
Name: @
Value: 185.199.108.153

Type: A
Name: @
Value: 185.199.109.153

Type: A
Name: @
Value: 185.199.110.153

Type: A
Name: @
Value: 185.199.111.153
```

**For www subdomain (www.netcards.app):**
```
Type: CNAME
Name: www
Value: YOUR_USERNAME.github.io
```

Replace `YOUR_USERNAME` with your GitHub username.

### B. Configure GitHub Pages Custom Domain

1. In your GitHub repository, go to **Settings** → **Pages**
2. Under "Custom domain", enter: `netcards.app`
3. Click **Save**
4. Wait a few minutes, then check the box "Enforce HTTPS" when it becomes available

### C. Add CNAME File

Create a file named `CNAME` in the root of your repository:

```bash
echo "netcards.app" > CNAME
git add CNAME
git commit -m "Add custom domain CNAME"
git push
```

## Step 5: Verify Deployment

1. Wait 10-15 minutes for DNS propagation
2. Visit https://netcards.app
3. Test the PWA functionality
4. Install on your phone:
   - **iOS**: Safari → Share → "Add to Home Screen"
   - **Android**: Chrome → Menu → "Install app"

## Troubleshooting

### DNS not resolving
- DNS can take up to 24 hours to propagate (usually 15-30 minutes)
- Check DNS status: https://www.whatsmydns.net/
- Enter `netcards.app` and select `A` record type

### HTTPS not working
- Wait for GitHub to provision SSL certificate (can take 10-30 minutes)
- Make sure "Enforce HTTPS" is checked in GitHub Pages settings

### 404 errors
- Make sure GitHub Pages is enabled and branch is set to `main`
- Check that index.html is in the root directory
- Wait a few minutes after pushing for GitHub to rebuild

### Camera not working
- Camera requires HTTPS (won't work on http://)
- Make sure you're accessing via https://netcards.app (not http://)
- Grant camera permissions when prompted

## Alternative: Using www Subdomain

If you prefer to use `www.netcards.app`:

1. Follow the same DNS setup above
2. In GitHub Pages custom domain, enter: `www.netcards.app`
3. Create CNAME file with: `www.netcards.app`

GitHub will automatically redirect from apex to www (or vice versa).

## Future Updates

To update your deployed site:

```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push
```

GitHub Pages will automatically rebuild and deploy in 1-2 minutes.
