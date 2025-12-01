# 🚀 Quick Start - Upload to GitHub in 5 Minutes

## 1️⃣ Create GitHub Repository

1. Go to https://github.com/new
2. Name: `CuteCart`
3. Don't initialize with anything
4. Click "Create repository"
5. Copy the URL shown

## 2️⃣ Open PowerShell in CuteCart Folder

```powershell
cd D:\CuteCart
```

## 3️⃣ Run These Commands

```powershell
# Initialize Git
git init

# Configure Git (first time only)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: CuteCart POS System"

# Connect to GitHub (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/CuteCart.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 4️⃣ Enter Credentials

When prompted:
- **Username**: Your GitHub username
- **Password**: Use Personal Access Token (not your password!)

### Get Personal Access Token:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Select `repo` scope
4. Copy token and use as password

## 5️⃣ Done! ✅

Visit: `https://github.com/YOUR_USERNAME/CuteCart`

---

## 📝 Before Making Public

Update `README.md`:
- Replace `YOUR_USERNAME` with your GitHub username
- Replace `your.email@example.com` with your email
- Add your name

---

## 🔄 Future Updates

```powershell
git add .
git commit -m "Description of changes"
git push
```

---

**Full Guide**: See [GITHUB_SETUP.md](GITHUB_SETUP.md) for detailed instructions.
