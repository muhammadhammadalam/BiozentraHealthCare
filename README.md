# BIOZENTRA Healthcare Dashboard

A professional, full-stack healthcare management dashboard built with React, TypeScript, and FastAPI. Manage products, inventory, orders, invoices, customers, and suppliers — all in one place.

---

## Features

- **Dashboard & Analytics** — Live KPIs, revenue charts, and low-stock alerts
- **Orders & Invoices** — Full CRUD with PDF export (Biozentra-watermarked)
- **Products & Stock** — Inventory tracking with batch, expiry, and status management
- **Customers & Suppliers** — Contact management with spending history
- **Settings** — Persistent app configuration (dark mode, notifications, currency)
- **PWA Ready** — Installable on mobile and desktop, works offline
- **JWT Authentication** — Secure login with access + refresh tokens
- **Backend API** — FastAPI + PostgreSQL (SQLite for local dev)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, ShadCN UI |
| State | TanStack Query, React Context, localStorage |
| Backend | FastAPI, SQLAlchemy, Pydantic v2 |
| Database | PostgreSQL (prod) / SQLite (local) |
| Auth | JWT (access + refresh tokens), bcrypt |
| PDF | jsPDF + jspdf-autotable |
| PWA | vite-plugin-pwa (Workbox) |
| Deploy | Vercel (frontend) + Render (backend) |

---

## Getting Started (Local — No Docker)

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/biozentra-health-insights.git
cd biozentra-health-insights
```

### 2. Frontend setup

```bash
npm install
```

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
# App runs at http://localhost:8080
```

### 3. Backend setup

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:

```env
SECRET_KEY=your-random-secret-key-here
DATABASE_URL=sqlite:///./biozentra.db
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

Start the API:

```bash
uvicorn app.main:app --reload --port 8000
# API runs at http://localhost:8000
# Docs at http://localhost:8000/docs
```

---

## Production Deployment

### Frontend → Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`
4. Deploy

### Backend → Render

1. Go to [render.com](https://render.com) → New Web Service → Connect your repo
2. Set root directory to `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables: `SECRET_KEY`, `DATABASE_URL`, etc.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Frontend | Backend API base URL |
| `SECRET_KEY` | Backend | JWT signing key (keep secret!) |
| `DATABASE_URL` | Backend | Postgres or SQLite connection string |
| `ALGORITHM` | Backend | JWT algorithm (default: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Backend | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Backend | Refresh token lifetime |

---

## Project Structure

```
biozentra-health-insights/
├── src/
│   ├── assets/          # Logo and static images
│   ├── components/      # Reusable UI components
│   │   └── layout/      # AppSidebar, DashboardLayout
│   ├── contexts/        # AuthContext, DataContext
│   ├── lib/             # api.ts (typed API client)
│   ├── pages/           # Dashboard, Products, Orders, etc.
│   └── utils/           # pdfExport.ts
├── backend/
│   ├── app/
│   │   ├── main.py      # FastAPI app + CORS + routers
│   │   ├── models/      # SQLAlchemy models
│   │   ├── routers/     # API endpoints
│   │   ├── schemas/     # Pydantic schemas
│   │   └── core/        # Config, security, JWT
│   └── requirements.txt
├── public/              # PWA icons, offline.html
├── .env.example
└── vite.config.ts
```

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

## Author

**Hammad Alam** — BIOZENTRA Healthcare
