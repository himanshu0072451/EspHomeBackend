require("dotenv").config(); // Load environment variables

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not set! Exiting...");
    process.exit(1);
}

// ✅ MongoDB Connection with Auto-Reconnect
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

mongoose.connection.on("disconnected", () => {
    console.error("❌ MongoDB Disconnected! Reconnecting...");
    mongoose.connect(MONGO_URI);
});

// ✅ Define Command Model
const commandSchema = new mongoose.Schema({
    command: { type: String, enum: ["ON", "OFF"], default: "OFF" }
});
const Command = mongoose.model("Command", commandSchema);

// ✅ Health Check (Prevents Railway from Stopping the Container)
app.get("/health", (req, res) => {
    res.status(200).send("OK");
});

// ✅ Log All Requests (Debugging)
app.use((req, res, next) => {
    console.log(`📥 Incoming request: ${req.method} ${req.url}`);
    next();
});

// ✅ API Endpoints
app.get("/command", async (req, res) => {
    try {
        const lastCommand = await Command.findOne() || { command: "OFF" };
        res.json({ command: lastCommand.command });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/command", async (req, res) => {
    try {
        const { command } = req.body;
        if (!["ON", "OFF"].includes(command)) {
            return res.status(400).json({ error: "Invalid command" });
        }
        await Command.findOneAndUpdate({}, { command }, { upsert: true });
        console.log(`📤 New Command: ${command}`);
        res.json({ success: true, command });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Root Route
app.get("/", (req, res) => {
    res.send("🚀 ESP Backend Server is Running!");
});

// ✅ Keep App Alive by Pinging Itself Every 5s
setInterval(() => {
    http.get("https://esphomebackend-production.up.railway.app/health", (res) => {
        console.log(`✅ Keep-alive ping: ${res.statusCode}`);
    }).on("error", (err) => {
        console.error("❌ Keep-alive error:", err);
    });
}, 5000);

// ✅ Handle SIGTERM Gracefully (Prevents Railway from Stopping)
process.on("SIGTERM", () => {
    console.log("🛑 SIGTERM received! Cleaning up...");
    process.exit(0);
});

// ✅ Handle Unexpected Errors to Prevent Crashes
process.on("uncaughtException", (err) => {
    console.error("🔥 Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("🔥 Unhandled Rejection at:", promise, "reason:", reason);
});

// ✅ Start Server (Uses Correct Port)
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));