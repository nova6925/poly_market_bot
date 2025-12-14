# Deploying Poly Market Bot to Render

Since local network restricts Polymarket APIs, deploying to Render is the best solution.

## 1. Push to GitHub

1. Initialize Git (if not done):
   ```bash
   cd ~/Documents/polymarket/poly_market_bot
   git init
   git add .
   git commit -m "Initial commit for bot"
   ```

2. Create a new repository on GitHub named `poly_market_bot`.

3. Push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/poly_market_bot.git
   git branch -M main
   git push -u origin main
   ```

## 2. Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Cron Job** (to run periodically) OR **Background Worker** (to run continuously).
   - *Recommendation:* **Cron Job** is safer for simple scripts to avoid "while(true)" loops eating resources.
3. Connect your `poly_market_bot` repo.
4. **Settings**:
   - **Name**: `polymarket-bot`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Schedule**: `*/5 * * * *` (Every 5 minutes - adjust as needed)
   - **Command**: `npm start`
5. **Environment Variables**:
   - Add `PRIVATE_KEY` if you plan to bet.

## 3. Verify

Check the **Logs** tab in Render. You should see the weather prices printed every 5 minutes!
