# CuteCart POS System

A modern Point of Sale (POS) system built with Angular and Node.js, designed for small to medium-sized retail businesses.

## Features

- Product Management - Add, edit, and manage products with categories
- Billing System - Create invoices with barcode scanning support
- Customer Management - Track customer information and purchase history
- Inventory Tracking - Monitor stock levels and low stock alerts
- Sales Analytics - View sales statistics and reports with charts
- User Management - Role-based access control (Admin, Manager, Cashier)
- Backup System - Automated backups with Google Drive integration
- Responsive Design - Works on desktop, tablet, and mobile devices

## Quick Start

### Prerequisites
- Node.js (v18+)
- npm (v11+)

### Installation & Running

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd CuteCart-dev
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Start the application**
   ```bash
   # Production mode (recommended)
   start-cutecart.bat
   
   # Development mode (with hot-reload)
   start-dev.bat
   ```

3. **Access the application**
   - Production: http://localhost:4200
   - Development: http://localhost:4201
   - Default login: `admin` / `admin123`

## Documentation

- **[Setup Guide](SETUP.md)** - Detailed installation and configuration
- **[LAN Deployment](LAN_DEPLOYMENT_GUIDE.md)** - Network deployment guide
- **[Google Drive Backup](GOOGLE_DRIVE_BACKUP_SETUP.md)** - Cloud backup setup
- **[CSV Import/Export](CSV_IMPORT_EXPORT_GUIDE.md)** - Product data management
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

## Tech Stack

**Frontend:** Angular 21, TypeScript, Chart.js  
**Backend:** Node.js, Express, SQLite, JWT  
**Tools:** Google Drive API, HTML2Canvas, jsPDF

## Project Structure

```
CuteCart-dev/
├── backend/              # Node.js/Express API
│   ├── src/             # Source code
│   ├── .env             # Configuration
│   └── database.db      # SQLite database
├── frontend/            # Angular application
│   ├── src/            # Source code
│   └── dist/           # Production build
├── start-cutecart.bat  # Production startup
└── start-dev.bat       # Development startup
```

## Configuration

### Backend (.env)
```env
PORT=3000
JWT_SECRET=your-secret-key
AUTO_BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
```

### Startup Scripts
- `start-cutecart.bat` - Production mode (ports 3000/4200)
- `start-prod.bat` - Same as above
- `start-dev.bat` - Development mode (ports 3001/4201)

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

For issues and questions, please create an issue in the repository.
