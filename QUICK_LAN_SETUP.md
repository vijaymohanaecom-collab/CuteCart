# 🚀 Quick LAN Setup - CuteCart

## 3-Minute Setup Guide

### Step 1: Run Deployment Wizard
```bash
deploy-lan.bat
```
This will:
- ✅ Detect your IP address
- ✅ Install dependencies
- ✅ Configure network settings
- ✅ Initialize database

### Step 2: Configure Firewall
**Right-click** on `setup-firewall.bat` → **Run as Administrator**

### Step 3: Start CuteCart
```bash
start-cutecart.bat
```

### Step 4: Access from Mobile
Open browser on your mobile device:
```
http://YOUR_IP:4200
```
(Replace YOUR_IP with the IP shown in Step 1)

---

## Default Login
- **Username**: `admin`
- **Password**: `admin123`

---

## Troubleshooting

### Can't access from mobile?
1. Check both devices are on same WiFi
2. Run `setup-firewall.bat` as Administrator
3. Verify IP address with `get-my-ip.bat`

### CORS errors?
Backend is already configured for LAN access. Just restart:
```bash
cd backend
npm start
```

---

## Need More Help?
See detailed guide: **LAN_DEPLOYMENT_GUIDE.md**
