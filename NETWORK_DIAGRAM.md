# 🌐 CuteCart Network Architecture

## Visual Network Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Your WiFi Network                        │
│                   (e.g., 192.168.1.x)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │  Your   │          │ Mobile  │          │ Tablet  │
   │Computer │          │  Phone  │          │ Device  │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                    │                     │
        │                    │                     │
        │              Access via:            Access via:
        │         http://192.168.1.100:4200  http://192.168.1.100:4200
        │
        │
   ┌────▼─────────────────────────────────────────┐
   │        CuteCart Application                  │
   │                                              │
   │  ┌──────────────────────────────────────┐   │
   │  │  Frontend (Angular)                  │   │
   │  │  Port: 4200                          │   │
   │  │  Access: http://0.0.0.0:4200        │   │
   │  └──────────────┬───────────────────────┘   │
   │                 │                            │
   │                 │ API Calls                  │
   │                 │                            │
   │  ┌──────────────▼───────────────────────┐   │
   │  │  Backend (Express.js)                │   │
   │  │  Port: 3000                          │   │
   │  │  Access: http://0.0.0.0:3000        │   │
   │  └──────────────┬───────────────────────┘   │
   │                 │                            │
   │                 │ Database Queries           │
   │                 │                            │
   │  ┌──────────────▼───────────────────────┐   │
   │  │  Database (SQLite)                   │   │
   │  │  File: backend/database.sqlite       │   │
   │  └──────────────────────────────────────┘   │
   │                                              │
   └──────────────────────────────────────────────┘
```

---

## How It Works

### 1. Your Computer (Server)
```
IP Address: 192.168.1.100 (example)
Role: Hosts the application
Runs: Backend + Frontend + Database
```

### 2. Frontend Server
```
Technology: Angular 18
Port: 4200
Listens on: 0.0.0.0 (all network interfaces)
Accessible from: 
  - localhost:4200 (this computer)
  - 192.168.1.100:4200 (network)
```

### 3. Backend Server
```
Technology: Node.js + Express
Port: 3000
Listens on: 0.0.0.0 (all network interfaces)
API Endpoint: http://192.168.1.100:3000/api
CORS: Configured for local network access
```

### 4. Database
```
Technology: SQLite3
Location: backend/database.sqlite
Access: Only via Backend API (secure)
```

---

## Request Flow

### When you access from mobile:

```
1. Mobile Browser
   │
   │ HTTP Request: http://192.168.1.100:4200
   │
   ▼
2. Frontend Server (Port 4200)
   │
   │ Serves: HTML, CSS, JavaScript
   │
   ▼
3. Browser Renders Page
   │
   │ User Action (e.g., click "Products")
   │
   ▼
4. JavaScript makes API call
   │
   │ HTTP Request: http://192.168.1.100:3000/api/products
   │
   ▼
5. Backend Server (Port 3000)
   │
   │ Validates JWT token
   │ Checks permissions
   │
   ▼
6. Database Query
   │
   │ SELECT * FROM products
   │
   ▼
7. Backend Response
   │
   │ JSON: [{id: 1, name: "Product 1", ...}, ...]
   │
   ▼
8. Frontend Updates UI
   │
   │ Displays products in table
   │
   ▼
9. User sees products on mobile
```

---

## Port Configuration

### Port 3000 (Backend)
```
Protocol: HTTP
Purpose: API endpoints
Firewall: Must be open for network access
Used by: Frontend to fetch/send data
```

### Port 4200 (Frontend)
```
Protocol: HTTP
Purpose: Web interface
Firewall: Must be open for network access
Used by: Browsers to access application
```

---

## Network Security

### Firewall Rules Created

```
Rule 1: CuteCart Backend
  - Direction: Inbound
  - Port: 3000
  - Protocol: TCP
  - Action: Allow
  - Profiles: Domain, Private, Public

Rule 2: CuteCart Frontend
  - Direction: Inbound
  - Port: 4200
  - Protocol: TCP
  - Action: Allow
  - Profiles: Domain, Private, Public
```

### CORS Configuration

```javascript
// Backend allows requests from:
- http://localhost:4200
- http://127.0.0.1:4200
- http://192.168.x.x:4200 (any local IP)
- http://10.x.x.x:4200 (any local IP)
- http://172.16-31.x.x:4200 (any local IP)
```

---

## Data Flow Example: Creating an Invoice

```
┌─────────────┐
│   Mobile    │
│   Browser   │
└──────┬──────┘
       │
       │ 1. User fills invoice form
       │    Customer: John Doe
       │    Items: Product A, Product B
       │    Total: $100
       │
       ▼
┌──────────────────┐
│    Frontend      │
│  (Port 4200)     │
└──────┬───────────┘
       │
       │ 2. POST /api/invoices
       │    Headers: Authorization: Bearer <token>
       │    Body: {customer: "John Doe", items: [...], total: 100}
       │
       ▼
┌──────────────────┐
│    Backend       │
│  (Port 3000)     │
└──────┬───────────┘
       │
       │ 3. Validate token
       │    Check user permissions
       │    Validate invoice data
       │
       ▼
┌──────────────────┐
│    Database      │
│   (SQLite)       │
└──────┬───────────┘
       │
       │ 4. INSERT INTO invoices (...)
       │    UPDATE products SET stock = stock - qty
       │
       ▼
┌──────────────────┐
│    Backend       │
└──────┬───────────┘
       │
       │ 5. Response: {id: 123, status: "success"}
       │
       ▼
┌──────────────────┐
│    Frontend      │
└──────┬───────────┘
       │
       │ 6. Show success message
       │    Update UI
       │    Generate invoice preview
       │
       ▼
┌─────────────┐
│   Mobile    │
│   Shows     │
│   Invoice   │
└─────────────┘
```

---

## IP Address Ranges

### Private Network Ranges (LAN)
```
Class A: 10.0.0.0 to 10.255.255.255
Class B: 172.16.0.0 to 172.31.255.255
Class C: 192.168.0.0 to 192.168.255.255
```

### Common Home Router IPs
```
Router:    192.168.1.1 or 192.168.0.1
Computer:  192.168.1.100 (example)
Mobile:    192.168.1.101 (example)
Tablet:    192.168.1.102 (example)
```

---

## Authentication Flow

```
┌─────────────┐
│   Login     │
│   Page      │
└──────┬──────┘
       │
       │ 1. User enters: admin / admin123
       │
       ▼
┌──────────────────┐
│  POST /api/auth/ │
│      login       │
└──────┬───────────┘
       │
       │ 2. Backend validates credentials
       │    - Hash password with bcrypt
       │    - Compare with database
       │
       ▼
┌──────────────────┐
│   Generate JWT   │
│     Token        │
└──────┬───────────┘
       │
       │ 3. Token contains:
       │    - User ID
       │    - Username
       │    - Role
       │    - Expiry (3 hours)
       │
       ▼
┌──────────────────┐
│  Return Token    │
│  to Frontend     │
└──────┬───────────┘
       │
       │ 4. Frontend stores token
       │    - In memory
       │    - Sent with every API request
       │
       ▼
┌──────────────────┐
│  All Future      │
│  Requests        │
│  Include Token   │
└──────────────────┘
```

---

## File Structure on Your Computer

```
d:\CuteCart\
│
├── backend\
│   ├── src\
│   │   ├── server.js          ← Runs on port 3000
│   │   ├── routes\             ← API endpoints
│   │   ├── middleware\         ← Authentication
│   │   └── config\             ← Database config
│   ├── database.sqlite         ← Your data stored here
│   └── package.json
│
├── frontend\
│   ├── src\
│   │   ├── app\                ← Angular components
│   │   └── environments\
│   │       ├── environment.ts           ← Local config
│   │       └── environment.network.ts   ← Network config
│   └── package.json
│
├── deploy-lan.bat              ← Setup wizard
├── setup-firewall.bat          ← Firewall config
├── start-cutecart.bat          ← Start servers
└── get-my-ip.bat               ← Find IP address
```

---

## Multiple Device Access

### Scenario: 3 devices using CuteCart simultaneously

```
┌──────────────────────────────────────────────────────┐
│                  Database (SQLite)                   │
│              Single source of truth                  │
└──────────────────┬───────────────────────────────────┘
                   │
         ┌─────────┼─────────┐
         │         │         │
    ┌────▼───┐ ┌──▼────┐ ┌──▼────┐
    │Computer│ │Mobile │ │Tablet │
    │        │ │       │ │       │
    │User A  │ │User B │ │User C │
    │Billing │ │Prods  │ │Invoic │
    └────────┘ └───────┘ └───────┘

All users see same data in real-time
Changes by one user visible to all
```

---

## Troubleshooting Network Issues

### Test 1: Can computer access itself?
```
Browser: http://localhost:4200
Expected: ✅ CuteCart loads
```

### Test 2: Is backend running?
```
Browser: http://localhost:3000/api/health
Expected: ✅ {"status":"ok","message":"Server is running"}
```

### Test 3: Can mobile reach computer?
```
Mobile browser: http://192.168.1.100:3000/api/health
Expected: ✅ Same JSON response
```

### Test 4: Is firewall blocking?
```
PowerShell: Test-NetConnection -ComputerName 192.168.1.100 -Port 4200
Expected: ✅ TcpTestSucceeded : True
```

---

## Performance Considerations

### Network Speed Impact
```
Fast WiFi (5GHz, 100+ Mbps):
  - Page load: < 1 second
  - API calls: < 100ms
  - Smooth experience

Slow WiFi (2.4GHz, < 10 Mbps):
  - Page load: 2-3 seconds
  - API calls: 200-500ms
  - Still usable
```

### Database Size Impact
```
Small (< 1000 products, < 5000 invoices):
  - Very fast
  - No noticeable delay

Medium (1000-10000 products):
  - Fast
  - Slight delay on large queries

Large (> 10000 products):
  - Consider pagination
  - Index optimization needed
```

---

**Understanding this architecture helps you troubleshoot issues and optimize performance!**
