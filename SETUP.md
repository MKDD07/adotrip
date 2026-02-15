# Setup Guide: Pexels API Proxy on Netlify

This guide helps you secure your Pexels API integration by deploying a proxy function to Netlify.

## Prerequisites

1.  **Pexels API Key**: You need your Pexels API Key.
2.  **Netlify Account**: You need a Netlify account linked to your GitHub repository.

## Step 1: Regenerate API Key (Recommended)

Since your previous API key was exposed in the client-side code, it is highly recommended to generate a new one.

1.  Go to [Pexels API Dashboard](https://www.pexels.com/api/manage/).
2.  Generate a new API key.
3.  **Do not paste this key into any file in your code.**

## Step 2: Push Changes to GitHub

Commit and push the new files created in this task:
- `netlify/functions/pexels-proxy.js`
- `netlify.toml`
- Modified `assets/js/index-location.js`

```bash
git add .
git commit -m "Secure Pexels API with Netlify Functions"
git push origin main
```

## Step 3: Configure Environment Variable on Netlify

1.  Log in to your [Netlify Dashboard](https://app.netlify.com/).
2.  Select your site.
3.  Go to **Site configuration** > **Environment variables**.
4.  Click **Add a variable**.
5.  Key: `PEXELS_API_KEY`
6.  Value: `[Paste your NEW Pexels API Key here]`
7.  Click **Create variable**.

## Step 4: Deploy

If your site is connected to GitHub, pushing your changes (Step 2) should automatically trigger a new deployment.

1.  Go to the **Deploys** tab in Netlify to verify the deployment is successful.

## Step 5: Verify

1.  Open your live website.
2.  Check if the images are loading correctly.
3.  Open the Browser Developer Tools (F12) -> **Network** tab.
4.  Filter by "pexels-proxy".
5.  You should see requests to `pexels-proxy` instead of `api.pexels.com`.
6.  The response should contain the image data.

## Local Development (Optional)

To run this locally, you need the Netlify CLI.

1.  Install Netlify CLI: `npm install netlify-cli -g`
2.  Login: `netlify login`
3.  Link your site: `netlify link`
4.  Run dev server: `netlify dev` (This will inject the environment variables from your Netlify dashboard).
