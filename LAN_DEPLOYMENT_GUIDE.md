# 🌐 CuteCart LAN Deployment Guide

Complete guide to deploy CuteCart on your local network and access it from mobile devices and other computers.

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Node.js (v18 or higher) installed
- ✅ npm installed
- ✅ Backend and frontend dependencies installed
- ✅ Windows Firewall configured to allow connections
- ✅ All devices connected to the same WiFi/LAN network

---

## 🚀 Quick Start (Automated)

### Step 1: Get Your IP Address
```bash
get-my-ip.bat
```
This will display your computer's IP address (e.g., `192.168.1.100`)

### Step 2: Configure Network Settings
```bash
configure-network.bat
```
This will automatically update the frontend configuration with your IP address.

### Step 3: Start CuteCart
```bash
start-cutecart.bat
```
This will start both backend and frontend servers.

### Step 4: Access from Other Devices
- **On this computer**: `http://localhost:4200`
- **From mobile/other devices**: `http://YOUR_IP:4200` (e.g., `http://192.168.1.100:4200`)

---

## 🔧 Manual Setup (Detailed Steps)

### Step 1: Find Your Computer's IP Address

#### Method 1: Using Command Prompt
1. Press `Win + R`, type `cmd`, press Enter
2. Type `ipconfig` and press Enter
3. Look for "IPv4 Address" under your active network adapter
4. Note down the IP (e.g., `192.168.1.100` or `192.168.0.105`)

#### Method 2: Using PowerShell
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}
```

#### Method 3: Using the provided script
```bash
get-my-ip.bat
```

---

### Step 2: Configure Windows Firewall

#### Option A: Allow Node.js through Firewall (Recommended)
1. Open **Windows Defender Firewall with Advanced Security**
   - Press `Win + R`, type `wf.msc`, press Enter
2. Click **Inbound Rules** → **New Rule**
3. Select **Program** → Next
4. Browse to your Node.js executable:
   - Usually: `C:\Program Files\nodejs\node.exe`
5. Select **Allow the connection** → Next
6. Check all profiles (Domain, Private, Public) → Next
7. Name it "Node.js CuteCart" → Finish
8. Repeat for **Outbound Rules**

#### Option B: Allow Specific Ports (Alternative)
Run PowerShell as Administrator and execute:
```powershell
# Allow port 3000 (Backend)
New-NetFirewallRule -DisplayName "CuteCart Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Allow port 4200 (Frontend)
New-NetFirewallRule -DisplayName "CuteCart Frontend" -Direction Inbound -LocalPort 4200 -Protocol TCP -Action Allow
```

#### Option C: Quick Test (Temporary - Not Recommended for Production)
```powershell
# Temporarily disable firewall for testing
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# Re-enable after testing
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

---

### Step 3: Update Backend CORS Configuration

The backend needs to allow requests from your network IP.

**File**: `backend\src\server.js`

Update the CORS configuration to allow your network IP:

```javascript
app.use(cors({
  origin: [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'http://YOUR_IP:4200'  // Replace with your actual IP
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Or allow all origins (for development only):**
```javascript
app.use(cors({
  origin: '*',  // Allow all origins - USE ONLY FOR DEVELOPMENT
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### Step 4: Update Frontend Environment Configuration

**File**: `frontend\src\environments\environment.network.ts`

Update with your IP address:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://YOUR_IP:3000/api'  // Replace YOUR_IP with actual IP
};
```

Example:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://192.168.1.100:3000/api'
};
```

---

### Step 5: Initialize Database (First Time Only)

```bash
cd backend
npm install
npm run init-db
```

You should see:
```
✓ Database initialized successfully
✓ Default users created
```

---

### Step 6: Start Backend Server

Open a terminal/command prompt:
```bash
cd backend
npm start
```

You should see:
```
✓ Server running on http://0.0.0.0:3000
✓ Access from network: http://<your-ip>:3000
```

**Keep this terminal open!**

---

### Step 7: Start Frontend Server

Open a **new** terminal/command prompt:
```bash
cd frontend
npm run start:network
```

You should see:
```
** Angular Live Development Server is listening on 0.0.0.0:4200 **
```

**Keep this terminal open!**

---

### Step 8: Test Local Access

Open a browser on your computer:
- Navigate to: `http://localhost:4200`
- Login with default credentials:
  - Username: `admin`
  - Password: `admin123`

---

### Step 9: Access from Mobile/Other Devices

#### On Mobile Device (Android/iOS):
1. Connect to the **same WiFi network** as your computer
2. Open any browser (Chrome, Safari, Firefox)
3. Navigate to: `http://YOUR_IP:4200`
   - Example: `http://192.168.1.100:4200`
4. Login with the same credentials

#### On Another Computer:
1. Connect to the **same network**
2. Open browser
3. Navigate to: `http://YOUR_IP:4200`
4. Login

---

## 🔍 Troubleshooting

### Issue 1: Cannot Access from Mobile

**Check 1: Verify IP Address**
```bash
ipconfig
```
Make sure you're using the correct IPv4 address.

**Check 2: Ping Test**
From mobile device, use a network tool app to ping your computer's IP.

**Check 3: Firewall**
Temporarily disable Windows Firewall to test:
```powershell
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
```
If it works, the issue is firewall. Re-enable and configure properly.

**Check 4: Network Type**
Ensure both devices are on the same network (not guest network).

---

### Issue 2: CORS Errors

**Symptom**: Browser console shows CORS errors

**Solution 1**: Update backend CORS configuration (see Step 3)

**Solution 2**: Check that backend is running and accessible:
- Test: `http://YOUR_IP:3000/api/health`
- Should return: `{"status":"ok","message":"Server is running"}`

---

### Issue 3: Backend Not Accessible

**Check 1: Backend is running**
```bash
cd backend
npm start
```

**Check 2: Port is not blocked**
```powershell
Test-NetConnection -ComputerName YOUR_IP -Port 3000
```

**Check 3: Backend is listening on all interfaces**
Verify in `backend\src\server.js`:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  // ...
});
```

---

### Issue 4: Frontend Not Accessible

**Check 1: Frontend is running**
```bash
cd frontend
npm run start:network
```

**Check 2: Correct configuration**
Verify you're using `start:network` not just `start`.

**Check 3: Port 4200 is open**
```powershell
Test-NetConnection -ComputerName YOUR_IP -Port 4200
```

---

### Issue 5: IP Address Changed

If your computer's IP changes (common with DHCP):

**Quick Fix**:
```bash
configure-network.bat
```

**Manual Fix**:
1. Get new IP: `ipconfig`
2. Update `frontend\src\environments\environment.network.ts`
3. Update `backend\src\server.js` CORS configuration
4. Restart both servers

---

### Issue 6: Slow Performance on Mobile

**Possible Causes**:
- Weak WiFi signal
- Network congestion
- Large database

**Solutions**:
- Move closer to WiFi router
- Use 5GHz WiFi if available
- Reduce number of products/invoices for testing

---

## 🔒 Security Considerations

### For Development/Testing:
- ✅ Current setup is fine for local network testing
- ✅ Change default passwords immediately
- ✅ Keep firewall enabled with specific rules

### For Production Deployment:
- 🔐 Use HTTPS (SSL/TLS certificates)
- 🔐 Implement rate limiting
- 🔐 Use environment variables for sensitive data
- 🔐 Set up proper authentication
- 🔐 Regular database backups
- 🔐 Update CORS to specific origins only
- 🔐 Use strong passwords
- 🔐 Consider VPN for remote access

---

## 📱 Mobile Browser Compatibility

### Tested Browsers:
- ✅ Chrome (Android/iOS)
- ✅ Safari (iOS)
- ✅ Firefox (Android)
- ✅ Edge (Android)

### Tips for Mobile Use:
1. **Add to Home Screen** (iOS/Android):
   - Chrome: Menu → "Add to Home Screen"
   - Safari: Share → "Add to Home Screen"
2. **Landscape Mode**: Better for billing and product management
3. **Zoom**: Use pinch-to-zoom for small text

---

## 🎯 Quick Reference

### URLs to Remember:
- **Local Access**: `http://localhost:4200`
- **Network Access**: `http://YOUR_IP:4200`
- **Backend API**: `http://YOUR_IP:3000/api`
- **Health Check**: `http://YOUR_IP:3000/api/health`

### Default Credentials:
| Role    | Username | Password   |
|---------|----------|------------|
| Admin   | admin    | admin123   |
| Manager | Manager  | manager123 |
| Sales   | Sales    | sales123   |

### Important Commands:
```bash
# Get IP address
get-my-ip.bat

# Configure network
configure-network.bat

# Start everything
start-cutecart.bat

# Initialize database
cd backend && npm run init-db

# Start backend only
cd backend && npm start

# Start frontend for network
cd frontend && npm run start:network
```

---

## 🔄 Daily Usage

### Starting CuteCart:
1. Double-click `start-cutecart.bat`
2. Wait for both servers to start
3. Access from any device: `http://YOUR_IP:4200`

### Stopping CuteCart:
1. Close both terminal windows
2. Or press `Ctrl+C` in each terminal

---

## 📊 Network Requirements

### Minimum:
- **Network**: WiFi or Ethernet LAN
- **Speed**: 10 Mbps
- **Devices**: Same subnet (e.g., 192.168.1.x)

### Recommended:
- **Network**: 5GHz WiFi or Gigabit Ethernet
- **Speed**: 100 Mbps+
- **Router**: Modern router with good coverage

---

## 🆘 Getting Help

### Check Logs:
- **Backend**: Terminal running `npm start` in backend folder
- **Frontend**: Terminal running `npm run start:network` in frontend folder
- **Browser Console**: F12 → Console tab

### Common Error Messages:

**"Failed to fetch"**
- Backend not running or not accessible
- Check firewall settings

**"CORS error"**
- Update backend CORS configuration
- Restart backend server

**"Cannot GET /"**
- Frontend not running
- Wrong URL

---

## ✅ Verification Checklist

Before accessing from mobile:
- [ ] IP address identified
- [ ] Firewall configured
- [ ] Backend CORS updated
- [ ] Frontend environment.network.ts updated
- [ ] Database initialized
- [ ] Backend running (port 3000)
- [ ] Frontend running (port 4200)
- [ ] Local access works (http://localhost:4200)
- [ ] Backend health check works (http://YOUR_IP:3000/api/health)
- [ ] Mobile device on same network

---

## 🎉 Success!

If you can access CuteCart from your mobile device, you're all set! 

**Next Steps**:
1. Change default passwords in Settings
2. Add your products
3. Configure store information
4. Start billing!

---

**Need more help?** Check `TROUBLESHOOTING.md` or open an issue on GitHub.

**Made with ❤️ for small businesses**
