# 🛒 CuteCart - Modern POS System

A full-stack Point of Sale (POS) system built with Angular and Node.js, designed for retail stores and small businesses.

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 📊 Dashboard
- Real-time sales statistics
- Revenue tracking
- Low stock alerts
- Recent transactions overview

### 🛍️ Billing & Sales
- Fast product search with barcode support
- Multiple payment methods (Cash, Card, UPI)
- Tax calculation
- Discount management
- Invoice generation and preview
- Print-ready invoices

### 📦 Product Management
- CRUD operations for products
- CSV import/export functionality
- Category management
- Stock tracking
- Purchase price and selling price
- Barcode support

### 🧾 Invoice Management
- View all invoices
- Edit customer information and payment method
- Invoice search and filtering
- Print invoices
- Invoice statistics

### 👥 User Management
- Role-based access control (Admin, Manager, Sales)
- User authentication with JWT
- Session management with auto-logout
- Password reset functionality

### ⚙️ Settings
- Store information management
- Tax rate configuration
- Invoice customization
- Database backup
- Currency settings

## 🚀 Tech Stack

### Frontend
- **Framework**: Angular 18
- **Language**: TypeScript
- **Styling**: CSS3
- **HTTP Client**: Angular HttpClient
- **State Management**: RxJS

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **CORS**: cors middleware

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Git

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/vijaymohanaecom-collab/CuteCart.git
cd CuteCart
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run init-db
npm start
```

The backend server will start on `http://localhost:3000`

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

The frontend will start on `http://localhost:4200`

## 🔐 Default Credentials

After database initialization, use these credentials:

| Role    | Username | Password    |
|---------|----------|-------------|
| Admin   | admin    | admin123    |
| Manager | Manager  | manager123  |
| Sales   | Sales    | sales123    |

**⚠️ Important**: Change these passwords in production!

## 📁 Project Structure

```
CuteCart/
├── frontend/                 # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── billing/     # Billing component
│   │   │   ├── dashboard/   # Dashboard component
│   │   │   ├── invoices/    # Invoice management
│   │   │   ├── products/    # Product management
│   │   │   ├── users/       # User management
│   │   │   ├── settings/    # Settings component
│   │   │   ├── services/    # API services
│   │   │   ├── guards/      # Route guards
│   │   │   └── models/      # TypeScript models
│   │   └── environments/    # Environment configs
│   └── package.json
│
├── backend/                  # Express backend
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth middleware
│   │   ├── config/          # Database config
│   │   ├── database/        # DB initialization
│   │   └── server.js        # Main server file
│   └── package.json
│
├── .gitignore
├── README.md
├── CHANGELOG.md
├── TROUBLESHOOTING.md
└── CSV_IMPORT_EXPORT_GUIDE.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/reset-password` - Password reset

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/export/csv` - Export to CSV
- `POST /api/products/import/csv` - Import from CSV

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `GET /api/invoices/stats/summary` - Get statistics

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings
- `GET /api/settings/backup` - Backup database

## 📊 CSV Import/Export

### CSV Format
```csv
ID,Name,Description,Price,Purchase Price,Stock,Category,Barcode
101,Product 1,Description here,99.99,50.00,100,Electronics,1234567890
```

See [CSV_IMPORT_EXPORT_GUIDE.md](CSV_IMPORT_EXPORT_GUIDE.md) for detailed instructions.

## 🐛 Troubleshooting

Common issues and solutions are documented in [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Quick Fixes

**Backend not starting?**
```bash
cd backend
npm install
npm run init-db
```

**Frontend errors?**
```bash
cd frontend
rm -rf node_modules
npm install
```

**CORS errors?**
- Ensure backend is running on port 3000
- Check `frontend/src/environments/environment.ts`

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Role-based access control
- Session timeout (3 hours)
- CORS protection
- SQL injection prevention

## 🎨 Screenshots

*(Add screenshots of your application here)*

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@vijaymohanaecom-collab](https://github.com/YOUR_USERNAME)
- Email: vijaymohanaecom@gmail.com

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email your.email@example.com or open an issue on GitHub.

## 🗺️ Roadmap

- [ ] Multi-store support
- [ ] Advanced reporting and analytics
- [ ] Mobile app
- [ ] Inventory management
- [ ] Supplier management
- [ ] Customer loyalty program
- [ ] Email notifications
- [ ] Cloud backup

## 🙏 Acknowledgments

- Angular Team
- Express.js Team
- SQLite Team
- All contributors

---

**Made with ❤️ for small businesses**
