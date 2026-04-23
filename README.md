# 🩸 BloodConnect — Community Blood Donation & Emergency Support System

A professional, full-stack MERN web application that connects blood donors with those in need through community groups, real-time chat, urgent blood requests, and donation tracking.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO |
| Auth | JWT + bcrypt |
| Charts | Chart.js |
| Styling | Custom CSS (Dark Theme) |

## 📁 Project Structure

```
Blood_M/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route handlers (9 controllers)
│   ├── middleware/       # Auth & upload middleware
│   ├── models/          # Mongoose schemas (8 models)
│   ├── routes/          # API route definitions (9 route files)
│   ├── socket/          # Socket.IO event handlers
│   ├── seed/            # Database seeder with dummy data
│   ├── uploads/         # Certificate uploads
│   ├── server.js        # Entry point
│   └── .env             # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── api/         # Axios configuration
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # Auth & Socket providers
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Page components
│   │   ├── styles/      # CSS stylesheets
│   │   ├── utils/       # Constants & helpers
│   │   ├── App.jsx      # Root component
│   │   └── main.jsx     # Entry point
│   └── index.html
│
└── README.md
```

## ✨ Features

### 🔐 Authentication
- User registration & login
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes

### 👥 Community Groups
- Create & manage groups
- Join/leave communities
- Search groups
- Leader controls (pin, delete, remove members)

### 💬 Telegram-Style Chat
- Real-time messaging (Socket.IO)
- Message types: text, blood request, emergency, system
- Typing indicators
- Pin/delete messages
- Context menu actions

### 🩸 Blood Request System
- Create urgent blood requests
- Urgency levels: Critical, Urgent, Normal
- Quick reply buttons (I can donate, Contact me, etc.)
- Request status tracking (Open → Accepted → Completed)
- Community-wide emergency alerts

### 📜 Certificate System
- Upload donation certificates (images/PDF)
- Donation history tracking
- Verified donor badge (3+ donations)

### 🏥 Blood Bank Directory
- Search blood banks by city
- Filter by type (Hospital, Blood Bank, Donation Center)
- Available blood groups display

### 📊 Analytics Dashboard
- Platform-wide statistics
- Blood group distribution chart
- Top communities chart
- Recent blood requests

### 🎨 UI Design
- Dark mode with crimson healthcare theme
- Telegram/Discord-inspired 3-panel layout
- Responsive design (mobile + desktop)
- Smooth animations & micro-interactions
- Glassmorphism effects

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** v18+ ([download](https://nodejs.org))
- **MongoDB** running locally or [MongoDB Atlas](https://www.mongodb.com/atlas) account
- **Git** (optional)

### Step 1: Clone / Navigate to Project
```bash
cd Blood_M
```

### Step 2: Backend Setup
```bash
cd backend
npm install
```

Edit `.env` file if needed:
```env
MONGO_URI=mongodb://localhost:27017/blood_donation
JWT_SECRET=blood_donation_super_secret_key_2024_community
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_EXPIRE=7d
```

### Step 3: Seed Database (Dummy Data)
```bash
npm run seed
```

This creates:
- 10 test users
- 5 communities
- Sample messages, blood requests, replies
- 8 blood banks
- Certificates & notifications

**Test credentials:** `rahul@example.com` / `password123`

### Step 4: Start Backend Server
```bash
npm run dev
```
Server runs on: `http://localhost:5000`

### Step 5: Frontend Setup (New Terminal)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:5173`

### Step 6: Open in Browser
Navigate to `http://localhost:5173` and login!

## 📡 API Endpoints

| Group | Endpoints | Description |
|-------|-----------|-------------|
| Auth | POST /api/auth/register, /login, /logout, GET /me | Authentication |
| Users | GET /:id, PUT /profile, GET /search | User management |
| Communities | POST /, GET /, /my, /:id, /join, /leave | Group CRUD |
| Messages | POST /, GET /:communityId, PUT /pin, DELETE | Chat messages |
| Blood Requests | POST /, GET /, /:id, PUT /status | Donation requests |
| Replies | POST /, GET /:requestId | Quick replies |
| Certificates | POST /upload, GET /my, /user/:userId | Certificates |
| Blood Banks | GET /, /search, /:id | Blood bank directory |
| Dashboard | GET /stats, /notifications | Analytics |

## 🗄️ Database Models

8 MongoDB models: **User**, **Community**, **Message**, **BloodRequest**, **Reply**, **Certificate**, **BloodBank**, **Notification**

## 🌐 Deployment Guide

### Backend (Render / Railway)
1. Push backend to GitHub
2. Connect to Render/Railway
3. Set environment variables
4. Deploy

### Frontend (Vercel / Netlify)
1. Push frontend to GitHub
2. Connect to Vercel/Netlify
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `VITE_API_URL=<your-backend-url>`

### MongoDB Atlas
1. Create free cluster on MongoDB Atlas
2. Get connection string
3. Update `MONGO_URI` in backend `.env`

## 📝 License

This project is for educational purposes. Built as a Major Project.

---

**Built with ❤️ using MERN Stack**
