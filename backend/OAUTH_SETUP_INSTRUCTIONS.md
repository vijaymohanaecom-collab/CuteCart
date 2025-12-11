# Google Drive OAuth Setup - Step by Step

## ⚠️ IMPORTANT: Update Google Cloud Console First

Before running the token generator, you MUST add the redirect URI to your Google Cloud Project.

### Step 1: Add Redirect URI in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **cutecart-backup**
3. Navigate to: **APIs & Services** > **Credentials**
4. Find your OAuth 2.0 Client ID: `27920329424-g65iehpbk1g4p4t2ga0t5526as2pmgbn.apps.googleusercontent.com`
5. Click on it to edit
6. Under **Authorized redirect URIs**, click **+ ADD URI**
7. Add this exact URI:
   ```
   http://localhost:3001/oauth2callback
   ```
8. Click **SAVE**

**Wait 1-2 minutes** for the changes to propagate.

---

## Step 2: Install Required Package

```bash
cd d:\CuteCart-dev\backend
npm install open
```

---

## Step 3: Run the Token Generator

```bash
node get-refresh-token.js
```

**What happens:**
1. A local server starts on port 3001
2. Your browser opens automatically (or you copy the URL)
3. You sign in with your Google account
4. You authorize the app to access Google Drive
5. Google redirects back to localhost:3001
6. The script displays your refresh token
7. The server closes automatically

---

## Step 4: Copy the Refresh Token

The script will display something like:

```
===========================================
✓ SUCCESS! Authorization complete
===========================================

Copy this REFRESH TOKEN to your .env file:

1//0gXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

===========================================

Update your .env file:
GOOGLE_REFRESH_TOKEN=1//0gXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

===========================================
```

Copy the entire refresh token.

---

## Step 5: Update .env File

1. Open: `d:\CuteCart-dev\backend\.env`
2. Find the line: `GOOGLE_REFRESH_TOKEN=YOUR_REFRESH_TOKEN_HERE`
3. Replace with your actual token:
   ```
   GOOGLE_REFRESH_TOKEN=1//0gXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
4. Save the file

---

## Step 6: Test the Setup

Start your backend server:

```bash
npm run dev
```

Look for this message in the console:
```
✓ Google Drive initialized successfully
```

If you see this, you're all set! ✅

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Cause:** The redirect URI is not added in Google Cloud Console  
**Solution:** Complete Step 1 above and wait 1-2 minutes

### Error: "access_denied" or "Error 403"
**Cause:** Using deprecated redirect URI  
**Solution:** Make sure you're using the updated script with `http://localhost:3001/oauth2callback`

### Error: "Cannot find module 'open'"
**Cause:** Package not installed  
**Solution:** Run `npm install open` in the backend directory

### Browser doesn't open automatically
**Solution:** Copy the URL from the terminal and paste it into your browser manually

### Port 3001 already in use
**Solution:** 
1. Close any application using port 3001
2. Or edit `get-refresh-token.js` and change `3001` to another port (e.g., `3002`)
3. Also update the redirect URI in Google Cloud Console to match

---

## Summary Checklist

- [ ] Add `http://localhost:3001/oauth2callback` to Google Cloud Console
- [ ] Wait 1-2 minutes for changes to propagate
- [ ] Install `open` package: `npm install open`
- [ ] Run: `node get-refresh-token.js`
- [ ] Authorize in browser
- [ ] Copy refresh token from terminal
- [ ] Update `.env` file with refresh token
- [ ] Start server: `npm run dev`
- [ ] Verify: See "✓ Google Drive initialized successfully"

---

## Next Steps

Once setup is complete:
- Automatic backups will run daily at 2:00 AM
- Backups are saved locally AND uploaded to Google Drive
- You can create manual backups via the API
- Old backups are automatically cleaned up

**Your Google Drive backup system is now ready!** 🎉
