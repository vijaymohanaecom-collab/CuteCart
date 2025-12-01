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
