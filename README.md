# SCAN&GOO — Smart Supermarket Management System

A full-stack web application that enables shoppers to scan and purchase products in supermarkets, while giving supermarket admins and platform owners real-time dashboards to monitor activity.

- **Live Demo:** https://sumative-scan-goo-project-2.onrender.com
- **Youtube Link:** https://youtu.be/fBl1lAlc1L8
- **SRC Document:** https://docs.google.com/document/d/1InbPerpz0U9scq47MXQ311XIAM8gi7mXe5doTWsXFqY/edit?tab=t.0
- **You can access the frontend here:** https://scanndgo.netlify.app/

---

## Features

### Shopper
- Register and log in
- Browse available supermarkets
- Add products to the cart and manage quantities
- Checkout with MTN Mobile Money, Airtel Money, or Cash
- Forgot password / reset password with a 6-digit code

### Supermarket Admin
- Log in to a dedicated dashboard
- View live shopper sessions in real time
- See completed orders for today
- Monitor items being purchased and revenue
- Receive alerts for completed orders

### Platform Owner (Super Admin)
- Register new supermarkets with admin credentials
- View all supermarkets and their status
- Suspend or activate supermarkets
- Reset admin passwords
- View platform-wide revenue and transaction stats

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, Tailwind CSS, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| Deployment | Render (backend), static file (frontend) |

---

## Project Structure

```
sumative_scan-Goo_project/
├── frontend/
│   └── index.html          # Single-page frontend app
├── models/
│   ├── User.js
│   ├── Session.js
│   ├── Product.js
│   ├── Supermarket.js
│   └── Alert.js
├── routes/
│   ├── auth.js             # Login, register, forgot/reset password
│   ├── sessions.js         # Shopping sessions, cart, checkout
│   ├── products.js         # Product catalog
│   ├── supermarkets.js     # Supermarket management
│   └── alerts.js           # Admin alerts
├── middleware/
│   └── auth.js             # JWT authentication middleware
├── server.js               # Express app entry point
├── package.json
└── .env                    # Environment variables (not committed)
```

---

## Getting Started (Local Setup)

### Prerequisites
- Node.js v18+
- A MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository
```bash
git clone https://github.com/innocent-gift/sumative_scan-Goo_project.git
cd sumative_scan-Goo_project
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create a `.env` file in the root
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_key
JWT_EXPIRES_IN=7d
PORT=3000
```

### 4. Start the server
```bash
node server.js
```

### 5. Open the frontend
Open `frontend/index.html` in your browser. Make sure `API_BASE` in the script points to `http://localhost:3000`.

---

## User Roles & Test Credentials

| Role | How to access |
|---|---|
| Shopper | Register a new account on the login screen |
| Supermarket Admin | Use credentials created by the Platform Owner |
| Platform Owner | Contact the system owner for superadmin credentials |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a shopper |
| POST | `/api/auth/login` | Login (all roles) |
| POST | `/api/auth/register-admin` | Register supermarket admin (superadmin only) |
| POST | `/api/auth/forgot-password` | Generate a 6-digit reset code |
| POST | `/api/auth/reset-password` | Reset password using the code |

### Sessions
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/sessions/start` | Start a shopping session |
| GET | `/api/sessions/mine` | Get current active session |
| POST | `/api/sessions/:id/scan` | Add a product to session |
| PATCH | `/api/sessions/:id/item` | Update item quantity |
| DELETE | `/api/sessions/:id/cart` | Clear cart |
| POST | `/api/sessions/:id/checkout` | Initiate checkout |
| POST | `/api/sessions/:id/confirm` | Confirm payment |
| GET | `/api/sessions/admin/kpis` | Dashboard KPIs |
| GET | `/api/sessions/admin/live` | Live active sessions |
| GET | `/api/sessions/admin/completed` | Completed sessions today |
| GET | `/api/sessions/admin/inventory` | Items being purchased |

### Supermarkets
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/supermarkets` | List all supermarkets |
| POST | `/api/supermarkets` | Create supermarket (superadmin only) |
| PATCH | `/api/supermarkets/:id/status` | Update status |
| DELETE | `/api/supermarkets/:id` | Delete supermarket |

---

## Known Limitations

- Password reset codes are returned directly in the API response (no email service). In production, these would be sent via email using a service like Nodemailer + SendGrid.
- Camera barcode scanning is not yet implemented — products are added by tapping from a list or entering a barcode manually.
- Products are shared across all supermarkets (not scoped per supermarket).

---

## Author

Developed by **Innocent Gift** as a summative project.
