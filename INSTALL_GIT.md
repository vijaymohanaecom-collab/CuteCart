# 📥 Installing Git on Windows

## Option 1: Download Git for Windows (Recommended)

### Step 1: Download
1. Go to: https://git-scm.com/download/win
2. Download will start automatically (64-bit version)
3. Or click "Click here to download manually"

### Step 2: Install
1. Run the downloaded `.exe` file
2. **Important Settings During Installation:**
   - ✅ Use default installation path
   - ✅ Select: "Git from the command line and also from 3rd-party software"
   - ✅ Use bundled OpenSSH
   - ✅ Use the OpenSSL library
   - ✅ Checkout Windows-style, commit Unix-style line endings
   - ✅ Use MinTTY (default terminal)
   - ✅ Default (fast-forward or merge)
   - ✅ Git Credential Manager
   - ✅ Enable file system caching
3. Click "Install"
4. Click "Finish"

### Step 3: Verify Installation
1. **Close and reopen PowerShell** (important!)
2. Run:
```powershell
git --version
```
3. You should see something like: `git version 2.43.0.windows.1`

---

## Option 2: Using Winget (Windows Package Manager)

If you have Windows 11 or Windows 10 with winget:

```powershell
winget install --id Git.Git -e --source winget
```

Then close and reopen PowerShell.

---

## Option 3: Using Chocolatey

If you have Chocolatey installed:

```powershell
choco install git
```

Then close and reopen PowerShell.

---

## ✅ After Installation

### 1. Verify Git is Working
```powershell
git --version
```

### 2. Configure Git (First Time)
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. Continue with GitHub Setup
Now you can follow the steps in `QUICK_START.md` or `GITHUB_SETUP.md`

---

## 🆘 Troubleshooting

### "git is not recognized" after installation
**Solution**: Close and reopen PowerShell/Command Prompt

### Still not working?
1. Restart your computer
2. Check if Git is in PATH:
   - Search "Environment Variables" in Windows
   - Check System Variables → Path
   - Should contain: `C:\Program Files\Git\cmd`

### Alternative: Use GitHub Desktop
If you prefer a GUI instead of command line:
1. Download from: https://desktop.github.com
2. Install and sign in with GitHub account
3. Use the GUI to manage your repository

---

## 🎯 Next Steps

After Git is installed, return to `QUICK_START.md` and start from Step 3:

```powershell
cd D:\CuteCart
git init
```

---

**Download Link**: https://git-scm.com/download/win
