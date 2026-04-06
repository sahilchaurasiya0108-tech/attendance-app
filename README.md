# 🏢 Office Attendance Management System

A production-ready Progressive Web App (PWA) for daily office attendance tracking — replacing WhatsApp "Good Morning" attendance with a professional system.

---

## 🚀 Features

### Employee
- ✅ One-click Check-in / Check-out
- 📍 GPS location verification (Haversine formula, 200m radius)
- ⏱ Live working hours timer
- 📊 Monthly attendance stats & streak counter
- 🗓 Attendance history with month filter
- 👤 Profile management & password change

### Admin
- 📈 Real-time dashboard (present/late/absent counts)
- 👥 Employee management (add/edit/activate/deactivate)
- 📋 Attendance records with filters & CSV export
- 📉 Monthly reports with bar charts
- 🔴 Live check-in feed

### Smart Automations
- Auto-detect Late status (after 10:30 AM weekdays, 11:00 AM Saturday)
- Auto-checkout at 8 PM if employee forgets
- PWA installable on Android/iOS/Desktop

---

## 🗂 Project Structure

```
attendance-app/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── office.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── attendanceController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   └── Attendance.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── attendance.js
│   │   ├── admin.js
│   │   └── users.js
│   ├── services/
│   │   ├── attendanceService.js
│   │   ├── locationService.js
│   │   └── cronJobs.js
│   ├── utils/
│   │   ├── jwt.js
│   │   └── seed.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   ├── favicon.svg
    │   └── offline.html
    ├── src/
    │   ├── components/common/
    │   │   ├── LoadingScreen.jsx
    │   │   ├── StatusBadge.jsx
    │   │   └── Spinner.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── hooks/
    │   │   └── useGeolocation.js
    │   ├── layouts/
    │   │   ├── EmployeeLayout.jsx
    │   │   └── AdminLayout.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── employee/
    │   │   │   ├── Dashboard.jsx
    │   │   │   ├── History.jsx
    │   │   │   └── Profile.jsx
    │   │   └── admin/
    │   │       ├── Dashboard.jsx
    │   │       ├── Employees.jsx
    │   │       ├── Attendance.jsx
    │   │       └── Reports.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── package.json
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)
- Git

---

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd attendance-app
```

---

### 2. Backend Setup

```bash
cd backend
npm install

# Copy env file and fill in values
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/attendance_db
JWT_SECRET=your_super_secret_key_here_min_32_chars
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

OFFICE_LATITUDE=23.2310465
OFFICE_LONGITUDE=77.442858
OFFICE_RADIUS_METERS=200
```

Seed initial users:
```bash
npm run seed
```

Start backend:
```bash
npm run dev       # development (nodemon)
npm start         # production
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install

# Copy env file
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

Start frontend:
```bash
npm run dev       # development
npm run build     # production build
npm run preview   # preview production build
```

---

### 4. Demo Credentials (after seed)

| Role     | Email                    | Password      |
|----------|--------------------------|---------------|
| Admin    | admin@company.com        | Admin@123     |
| Employee | employee@company.com     | Employee@123  |

---

## 🏭 Deployment

### Database → MongoDB Atlas
1. Create free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user with read/write access
3. Whitelist IP: `0.0.0.0/0` (or your server IP)
4. Copy the connection string to `MONGODB_URI`

---

### Backend → Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add all environment variables from `.env`
6. Deploy → copy the service URL (e.g., `https://attendance-api.onrender.com`)

---

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Set:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   - `VITE_API_URL` = `https://attendance-api.onrender.com/api`
5. Deploy → your PWA is live!

---

## 📱 PWA Installation

### Android (Chrome)
- Open the app URL in Chrome
- Tap the "Install" banner or ⋮ menu → "Add to Home Screen"

### iOS (Safari)
- Open in Safari
- Tap Share → "Add to Home Screen"

### Desktop (Chrome/Edge)
- Click the install icon in the address bar

---

## 🔒 Security Features

- JWT authentication with 7-day expiry
- bcrypt password hashing (12 salt rounds)
- Role-based access control (employee / admin)
- GPS location verified on backend with Haversine formula
- Input validation on all endpoints
- Duplicate check-in prevention
- Global error handler

---

## 🛠 Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Frontend  | React 18 + Vite               |
| Styling   | TailwindCSS                   |
| Routing   | React Router v6               |
| HTTP      | Axios                         |
| Charts    | Recharts                      |
| PWA       | vite-plugin-pwa + Workbox     |
| Backend   | Node.js + Express             |
| Auth      | JWT + bcryptjs                |
| Database  | MongoDB + Mongoose            |
| Cron Jobs | node-cron                     |
| Hosting   | Vercel (FE) + Render (BE)     |
| DB Cloud  | MongoDB Atlas                 |

---

## 📋 API Reference

### Auth
| Method | Endpoint              | Access  |
|--------|-----------------------|---------|
| POST   | /api/auth/login       | Public  |
| GET    | /api/auth/me          | Private |
| PUT    | /api/auth/profile     | Private |
| PUT    | /api/auth/change-password | Private |

### Attendance
| Method | Endpoint                    | Access  |
|--------|-----------------------------|---------|
| POST   | /api/attendance/checkin     | Private |
| POST   | /api/attendance/checkout    | Private |
| GET    | /api/attendance/today       | Private |
| GET    | /api/attendance/history     | Private |
| GET    | /api/attendance/stats       | Private |

### Admin
| Method | Endpoint                         | Access |
|--------|----------------------------------|--------|
| GET    | /api/admin/dashboard             | Admin  |
| GET    | /api/admin/employees             | Admin  |
| POST   | /api/admin/employees             | Admin  |
| PUT    | /api/admin/employees/:id         | Admin  |
| PATCH  | /api/admin/employees/:id/toggle  | Admin  |
| GET    | /api/admin/attendance            | Admin  |
| GET    | /api/admin/attendance/export     | Admin  |
| GET    | /api/admin/reports/monthly       | Admin  |

---

## 📍 Office Location Config

Located in `backend/config/office.js` and `.env`:

```env
OFFICE_LATITUDE=23.2310465
OFFICE_LONGITUDE=77.442858
OFFICE_RADIUS_METERS=200
```

To change the office location:
1. Update the `.env` values
2. Redeploy backend

---

## 🕐 Office Timing Rules

- **Weekdays (Mon–Fri)**: On-time if check-in ≤ 10:30 AM, else Late
- **Saturday**: On-time if check-in ≤ 11:00 AM, else Late
- **Auto-checkout**: Runs at 8 PM IST if employee forgot to check out
t e s t  
 