/**
 * Server Entry Point
 * Clean Version
 */

require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const connectDB = require("./config/db");
const setupSocket = require("./socket/socketHandler");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const communityRoutes = require("./routes/communityRoutes");
const messageRoutes = require("./routes/messageRoutes");
const bloodRequestRoutes = require("./routes/bloodRequestRoutes");
const replyRoutes = require("./routes/replyRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const bloodBankRoutes = require("./routes/bloodBankRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const BloodBank = require("./models/BloodBank");

// Initialize app
const app = express();
const server = http.createServer(app);

// ===============================
// Allowed Frontend URLs
// ===============================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174"
];

// ===============================
// Middleware
// ===============================
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===============================
// Socket.IO
// ===============================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

setupSocket(io);

// ===============================
// Routes
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/blood-requests", bloodRequestRoutes);
app.use("/api/replies", replyRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/blood-banks", bloodBankRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ===============================
// Health Check
// ===============================
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Blood Donation API is running 🩸"
  });
});

// ===============================
// 404 Handler
// ===============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// ===============================
// Global Error Handler
// ===============================
app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// ===============================
// Start Server
// ===============================
const PORT = process.env.PORT || 5000;

const addbloodbank=async()=>{
  await BloodBank.create([
    {
      name: "ABC Blood Bank",
      address: "123 Main St",
      city: "Mumbai",
      state: "Maharashtra",
      phone: "1234567890",
      email:"[EMAIL_ADDRESS]",
      latitude: 19.0760,   // Mumbai latitude
      longitude: 72.8777,  // Mumbai longitude
      availableGroups: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
      operatingHours: "24/7",
      type: "blood_bank",
      isActive: true
    },
    {
      name: "jane Hospital",
      address: "4546 Oak Ave",
      city: "Pune",
      state: "Maharashtra",
      phone: "0987654321",
      email:"[EMAIL_ADDRESS]",
      latitude: 19.0760,
      longitude: 72.8777,
      availableGroups: ["A+", "B+", "O+", "AB+"],
      operatingHours: "24/7",
      type: "hospital",
      isActive: true
    }
  ]);
}



const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api/health`);
      console.log(`🔌 Socket.IO: ws://localhost:${PORT}`);
      console.log(`📁 Uploads: http://localhost:${PORT}/uploads\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();