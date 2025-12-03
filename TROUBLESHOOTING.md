# CuteCart Troubleshooting Guide

## "Saving..." Button Stuck

### Symptoms
- Click "Save Sale" button
- Button shows "⏳ Saving..." 
- Never completes or closes the dialog

### Common Causes & Solutions

#### 1. Backend Server Not Running
**Check:**
```bash
# Navigate to backend folder
cd d:\CuteCart\backend

# Check if server is running
# You should see: "✓ Server running on http://0.0.0.0:3000"
```

**Solution:**
```bash
# Start the backend server
npm start
```

#### 2. Port 3000 Already in Use
**Check:**
```bash
# On Windows
netstat -ano | findstr :3000
```

**Solution:**
- Kill the process using port 3000, OR
- Change the port in `backend/.env` and `frontend/src/environments/environment.ts`

#### 3. Database Not Initialized
**Check:**
- Look for `backend/database.db` file
- Check backend console for database errors

**Solution:**
```bash
cd d:\CuteCart\backend
npm run init-db
```

#### 4. CORS Issues
**Check Browser Console:**
- Press F12 in browser
- Look for CORS errors in Console tab
- Look for failed network requests in Network tab

**Solution:**
- Backend already has CORS enabled
- Make sure frontend is accessing `http://localhost:3000/api`

#### 5. Authentication Token Issues
**Check:**
- Open browser DevTools (F12)
- Go to Application > Local Storage
- Check if `token` exists

**Solution:**
- Logout and login again
- Clear browser cache and local storage

### Debugging Steps

1. **Open Browser Console (F12)**
   - Check Console tab for errors
   - Look for red error messages

2. **Check Network Tab**
   - Filter by "invoices"
   - Look for failed POST request
   - Check request payload and response

3. **Check Backend Console**
   - Look for error messages
   - Check if request is reaching the server

4. **Test Backend Directly**
   ```bash
   # Test if backend is responding
   curl http://localhost:3000/api/health
   
   # Should return: {"status":"ok","message":"Server is running"}
   ```

### Quick Fix Checklist

- [ ] Backend server is running (`npm start` in backend folder)
- [ ] Frontend dev server is running (`npm start` in frontend folder)
- [ ] Database is initialized (`npm run init-db` in backend folder)
- [ ] Logged in with valid credentials
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API calls

### Error Messages

#### "Cannot connect to server"
- Backend is not running
- Wrong port configuration
- Firewall blocking connection

#### "Request timed out"
- Backend is slow or hung
- Database locked
- Network issues

#### "Invalid or expired token"
- Need to login again
- Token expired (24 hours)
- Clear local storage and re-login

#### "Access denied"
- Not logged in
- Wrong user role
- Token missing

### Still Not Working?

1. **Restart Everything:**
   ```bash
   # Stop backend (Ctrl+C)
   # Stop frontend (Ctrl+C)
   
   # Clear node_modules and reinstall
   cd backend
   rm -rf node_modules
   npm install
   
   cd ../frontend
   rm -rf node_modules
   npm install
   
   # Restart both servers
   ```

2. **Check Logs:**
   - Backend console output
   - Browser console (F12)
   - Network tab in DevTools

3. **Verify Configuration:**
   - `backend/.env` - PORT=3000
   - `frontend/src/environments/environment.ts` - apiUrl: 'http://localhost:3000/api'

---

## "Access to storage is not allowed" Error

### Symptoms
- Browser console shows: "Access to storage is not allowed from this context"
- 403 Forbidden errors when accessing API endpoints
- No data displayed from backend

### Causes
1. Browser security restrictions (file:// protocol, incognito mode)
2. Strict Content Security Policy
3. Browser privacy settings blocking localStorage/sessionStorage

### Solutions

#### 1. Clear Browser Cache and Reload
```bash
# In browser:
1. Press Ctrl+Shift+Delete
2. Clear "Cached images and files" and "Cookies and other site data"
3. Hard reload: Ctrl+Shift+R
```

#### 2. Check Browser Settings
- Disable "Block third-party cookies" if enabled
- Ensure site data is allowed for localhost
- Try a different browser (Chrome, Firefox, Edge)

#### 3. Re-login to Get Fresh Token
```bash
1. Open browser DevTools (F12)
2. Go to Application > Storage
3. Click "Clear site data"
4. Refresh page and login again
```

#### 4. Verify Backend JWT Secret
The backend and any existing tokens must use the same JWT_SECRET.

**Check backend/.env:**
```bash
JWT_SECRET=your-secret-key-here
PORT=3000
```

**If .env doesn't exist, create it:**
```bash
cd backend
echo "JWT_SECRET=cutecart-secret-2024" > .env
echo "PORT=3000" >> .env
```

**Then restart backend:**
```bash
npm start
```

#### 5. Test Token Manually
```powershell
# Login and get token
$response = Invoke-RestMethod -Uri "http://192.168.1.6:3000/api/auth/login" -Method POST -Body (@{username="admin"; password="admin123"} | ConvertTo-Json) -ContentType "application/json"
$token = $response.token

# Test with token
$headers = @{Authorization = "Bearer $token"}
Invoke-RestMethod -Uri "http://192.168.1.6:3000/api/invoices/stats/summary" -Headers $headers
```

### Quick Fix for 403 Errors

1. **Logout completely:**
   - Click logout button
   - Clear browser storage (F12 > Application > Clear storage)

2. **Login again:**
   - Use valid credentials (default: admin/admin123)
   - Check browser console for successful login
   - Verify token is stored (F12 > Application > Local Storage)

3. **Verify token is sent:**
   - Open Network tab (F12)
   - Make any API request
   - Check request headers for "Authorization: Bearer <token>"

### Error: "Invalid or expired token"

**Cause:** Token was created with different JWT_SECRET or has expired (24h)

**Solution:**
1. Ensure backend/.env has JWT_SECRET set
2. Restart backend server
3. Clear all tokens and login again
4. If problem persists, recreate database:
   ```bash
   cd backend
   rm database.db
   npm run init-db
   node add-users.js
   ```

---

## Other Common Issues

### Products Not Loading
- Check if logged in as admin/manager
- Verify auth token in local storage
- Check backend console for errors

### CSV Import Failing
- Verify CSV format matches sample
- Check for special characters
- Ensure Name and Price columns are filled

### Login Not Working
- Check username/password (default: admin/admin123)
- Verify backend is running
- Check database has users table

---

**Last Updated:** December 1, 2025
