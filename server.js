// 1. IMPORTS
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import User from "./models/User.js";
import Message from "./models/Message.js";

// 2. Load env
dotenv.config();

// 3. Create express app
const app = express();

// 4. Middlewares
app.use(cors());
app.use(express.json());

// 5. Create HTTP server + Socket.IO server
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

// Test socket.io connection
io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

// 6. Routes
app.get("/", (req, res) => {
  res.send("Backend is running with Socket.IO!");
});

// Create user
app.post("/api/users", async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.create({ username, email });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create message (also emit via socket)
app.post("/api/messages", async (req, res) => {
  try {
    const { sender, text } = req.body;

    // Step 1: Save raw message
    const message = await Message.create({ sender, text });

    // Step 2: Populate sender (convert ObjectId → full user object)
    const fullMessage = await Message.findById(message._id).populate("sender");

    // Step 3: Emit populated message in real-time
    io.emit("new_message", fullMessage);

    // Step 4: Return populated message
    res.json({ success: true, message: fullMessage });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Connect database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("DB error:", err));

// 8. Start server
httpServer.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
