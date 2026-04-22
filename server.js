/**
 * Server Entry Point
 * Production Ready Version for:
 * Frontend -> Netlify
 * Backend -> Render
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

// ===============================
// Initialize App
// ===============================
const app = express();
const server = http.createServer(app);

// ===============================
// Allowed Origins
// ===============================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://bloodmanagement-frontend-taffy-82911d.netlify.app"
];

// ===============================
// Middleware
// ===============================
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("CORS Not Allowed"));
      }
    },
    credentials: true
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static Upload Folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===============================
// Socket.IO Setup
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
// Root Route
// ===============================
app.get("/", (req, res) => {
  res.send("Blood Donation Backend Running 🚀");
});

// ===============================
// Health Check
// ===============================
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Blood Donation API Running 🩸"
  });
});

// ===============================
// 404 Handler
// ===============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found"
  });
});

// ===============================
// Global Error Handler
// ===============================
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// ===============================
// Optional Seed Blood Banks
// Run once only if needed
// ===============================
const addBloodBank = async () => {
  try {
    await BloodBank.create([
      {
        name: "ABC Blood Bank",
        address: "123 Main St",
        city: "Mumbai",
        state: "Maharashtra",
        phone: "1234567890",
        email: "abc@gmail.com",
        latitude: 19.0760,
        longitude: 72.8777,
        availableGroups: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
        operatingHours: "24/7",
        type: "blood_bank",
        isActive: true
      },
      {
        name: "Jane Hospital",
        address: "4546 Oak Ave",
        city: "Pune",
        state: "Maharashtra",
        phone: "0987654321",
        email: "jane@gmail.com",
        latitude: 18.5204,
        longitude: 73.8567,
        availableGroups: ["A+", "B+", "O+", "AB+"],
        operatingHours: "24/7",
        type: "hospital",
        isActive: true
      }
    ]);

    console.log("Blood Banks Added");
  } catch (error) {
    console.log("Seed Error:", error.message);
  }
};

// ===============================
// Start Server
// ===============================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Uncomment once if you want sample data
    // await addBloodBank();

    server.listen(PORT, () => {
      console.log(`🚀 Server Running on Port ${PORT}`);
      console.log(`🌍 Render URL: https://blood-management-1.onrender.com`);
    });
  } catch (error) {
    console.error("Failed To Start:", error.message);
    process.exit(1);
  }
};

startServer();