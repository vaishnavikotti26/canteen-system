# College Canteen Pre-Ordering System

React + Node.js + Express + MongoDB (Mongoose). Students pre-order food; the admin manages the menu and orders.

```
canteen-system/
├── backend/    Express API, Mongoose models, JWT auth, image uploads
└── frontend/   React (Vite) app
```

## 1. Prerequisites
- Node.js 18 or newer (`node -v`)
- MongoDB (local install **or** free MongoDB Atlas cloud database)

## 2. MongoDB setup (choose ONE)

### Option A - Local MongoDB Community Server
1. Download and install from https://www.mongodb.com/try/download/community (tick "Install MongoDB as a Service" on Windows, optionally MongoDB Compass).
2. Make sure the service is running:
   - Windows: open *Services* → `MongoDB Server` → Running (or run `net start MongoDB` as administrator)
   - macOS (Homebrew): `brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`
   - Ubuntu: `sudo systemctl start mongod` (and `sudo systemctl enable mongod`)
3. Your connection string is: `mongodb://127.0.0.1:27017/college_canteen`
   The database and collections (`users`, `foods`, `orders`) are created automatically on first use - you do not create them by hand.

### Option B - MongoDB Atlas (cloud, free tier)
1. Sign up at https://www.mongodb.com/cloud/atlas and create a free **M0** cluster.
2. *Database Access* → Add a database user (username + password).
3. *Network Access* → Add IP Address → "Allow access from anywhere" (0.0.0.0/0) for development.
4. *Database* → Connect → Drivers → copy the connection string and put your password and the database name in it:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/college_canteen?retryWrites=true&w=majority`
   (URL-encode special characters in the password.)

## 3. Install and run

### Backend (terminal 1)
```bash
cd backend
npm install
cp .env.example .env        # Windows CMD: copy .env.example .env
# open .env and set MONGO_URI and a long random JWT_SECRET
npm run seed                # creates the admin account + sample menu items
npm run dev                 # API on http://localhost:5000  (or: npm start)
```

### Frontend (terminal 2)
```bash
cd frontend
npm install
npm run dev                 # App on http://localhost:5173
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` and `/uploads` to the backend on port 5000, so no extra frontend configuration is needed.

## 4. Login details
| Role    | Where                       | Credentials (from `.env`)          |
|---------|-----------------------------|------------------------------------|
| Admin   | `/admin/login`              | `admin@srkr.edu` / `Admin@123`     |
| Student | Register at `/register`     | your own email + password          |

Change `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` **before** running `npm run seed` if you want different admin credentials.

## 5. How it works
- Passwords are hashed with bcrypt; sessions use JWT (Bearer token, 7 days).
- Prices are always read from the database when an order is placed (never trusted from the browser).
- Order IDs look like `ORD-20261107-A3F9C1` and are checked for uniqueness.
- A student can cancel an order only while it is **Pending**. Once the admin moves it to Preparing/Ready/Completed it is locked. Completed and Cancelled orders cannot be changed by the admin.
- Admin food images: upload a file (png/jpg/webp/gif, max 2 MB, saved in `backend/uploads/foods`) or paste an image URL.

## 6. REST API summary
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET | `/api/auth/me` | logged in |
| GET | `/api/foods` | logged in (students see only available items) |
| POST / PUT / DELETE | `/api/foods`, `/api/foods/:id` | admin |
| POST | `/api/orders` | student |
| GET | `/api/orders/my` | student |
| PUT | `/api/orders/:id/cancel` | student (Pending only) |
| GET | `/api/orders/admin/all` | admin |
| PUT | `/api/orders/admin/:id/status` | admin |
| GET | `/api/admin/stats` | admin |

## 7. Production build (optional)
```bash
cd frontend && npm run build     # output in frontend/dist
```
Serve `dist` with any static host and set `VITE_API_URL` (API base, e.g. `https://api.example.com/api`) and `VITE_FILES_URL` (backend origin for images) at build time; set `CLIENT_URL` in the backend `.env` to the frontend's URL for CORS.

## 8. Troubleshooting
- **`MongoDB connection failed`** - MongoDB service is not running, or `MONGO_URI` is wrong (Atlas: check password, IP whitelist).
- **`Missing MONGO_URI or JWT_SECRET`** - you did not create `backend/.env`.
- **Menu is empty** - run `npm run seed` in `backend`, or add items from the admin panel.
- **Port in use** - change `PORT` in `.env` and the proxy target in `frontend/vite.config.js`.
- **Cannot reach the server** (shown in the UI) - the backend is not running on port 5000.
