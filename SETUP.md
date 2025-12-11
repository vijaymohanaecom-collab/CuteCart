# CuteCart POS - Setup Guide

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm (v11 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CuteCart-dev
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Configure environment**
   - Backend: Copy `.env.example` to `.env` and configure settings
   - Frontend: Environment files are pre-configured

### Running the Application

#### Development Mode
```bash
# From project root
start-dev.bat
```
- Backend: http://localhost:3001
- Frontend: http://localhost:4201
- Hot-reload enabled for both

#### Production Mode
```bash
# From project root
start-cutecart.bat
```
- Backend: http://localhost:3000
- Frontend: http://localhost:4200
- Serves pre-built static files

### Default Credentials
- Username: `admin`
- Password: `admin123`

## Project Structure

```
CuteCart-dev/
├── backend/              # Node.js/Express API
│   ├── src/             # Source code
│   ├── .env             # Environment config
│   └── database.db      # SQLite database
├── frontend/            # Angular application
│   ├── src/            # Source code
│   └── dist/           # Production build
├── start-dev.bat       # Development startup
├── start-cutecart.bat  # Production startup
└── start-prod.bat      # Production startup (alias)
```

## Configuration

### Backend (.env)
```env
PORT=3000
JWT_SECRET=your-secret-key
AUTO_BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
```

### Frontend Environments
- `environment.ts` - Development (port 3001)
- `environment.prod.ts` - Production (port 3000)
- `environment.network.ts` - Network access (configurable)

## Building for Production

```bash
cd frontend
npm run build:prod
```

Output: `frontend/dist/frontend/browser/`

## Troubleshooting

### Port Already in Use
- Development: Ports 3001 (backend), 4201 (frontend)
- Production: Ports 3000 (backend), 4200 (frontend)

### Database Issues
- Development DB: `backend/database.dev.db`
- Production DB: `backend/database.db`

### Frontend Not Loading
1. Delete `frontend/dist` folder
2. Run `start-cutecart.bat` to rebuild

## Additional Documentation
- [Google Drive Backup Setup](GOOGLE_DRIVE_BACKUP_SETUP.md)
- [LAN Deployment Guide](LAN_DEPLOYMENT_GUIDE.md)
- [Troubleshooting](TROUBLESHOOTING.md)
