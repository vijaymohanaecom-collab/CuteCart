# Environment Setup Guide

## Isolated Development and Production Environments

Your CuteCart app now has completely isolated dev and prod environments that won't interfere with each other.

## Quick Start

### Development Mode (for coding/testing)
```bash
start-dev.bat
```
- **Backend Port:** 3001
- **Frontend Port:** 4201
- **Database:** `database.dev.db`
- **Hot Reload:** ✓ Enabled (auto-refresh on code changes)
- **API URL:** http://localhost:3001/api
- **Access:** http://localhost:4201

### Production Mode (for actual business use)
```bash
start-prod.bat
```
- **Backend Port:** 3000
- **Frontend Port:** 4200
- **Database:** `database.db`
- **Hot Reload:** ✗ Disabled (stable production)
- **API URL:** http://localhost:3000/api
- **Network Access:** Available on LAN
- **Access:** http://localhost:4200

## Key Differences

| Feature | Development | Production |
|---------|------------|------------|
| Database | `database.dev.db` | `database.db` |
| Backend Port | 3001 | 3000 |
| Frontend Port | 4201 | 4200 |
| Auto-reload | Yes (nodemon) | No |
| Data | Test/dummy data | Real business data |
| Network Access | Local only | LAN enabled |

## Environment Files

### Backend
- `.env.development` - Dev environment variables (port 3001, dev database)
- `.env.production` - Prod environment variables (port 3000, prod database)

### Frontend
- `environment.ts` - Development config (points to port 3001)
- `environment.prod.ts` - Production config (points to port 3000)
- `environment.network.ts` - Network config (for LAN access)

## First Time Setup

1. **Initialize Development Database:**
```bash
cd backend
npm run init-db:dev
```

2. **Initialize Production Database:**
```bash
cd backend
npm run init-db
```

## Workflow

### During Development
1. Run `start-dev.bat`
2. Make code changes
3. Changes auto-reload in browser
4. Test with dev database (safe to break)
5. Production remains untouched

### For Production Use
1. Run `start-prod.bat`
2. Use for actual business operations
3. Real customer data stays safe
4. No interference from dev work

## Important Notes

- **Never mix environments** - Don't run both simultaneously on same machine
- **Separate databases** - Dev and prod data are completely isolated
- **Different ports** - Backend uses 3001 (dev) vs 3000 (prod)
- **Environment variables** - Each mode loads its own config file

## Troubleshooting

**Port already in use?**
- Check if other instance is running
- Kill process: `netstat -ano | findstr :3000` or `netstat -ano | findstr :3001`

**Database not found?**
- Run `npm run init-db:dev` for development
- Run `npm run init-db` for production

**Wrong API endpoint?**
- Check frontend environment file matches backend port
- Dev should use port 3001, prod uses port 3000
