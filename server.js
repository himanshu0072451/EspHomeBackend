require("dotenv").config(); // Load environment variables

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not set! Exiting...");
    process.exit(1);
}

// ✅ MongoDB Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err);
    });

// ✅ Define Command Model
const commandSchema = new mongoose.Schema({
    command: { type: String, enum: ["ON", "OFF"], default: "OFF" }
});
const Command = mongoose.model("Command", commandSchema);

// ✅ API Endpoints

// Health check route (to prevent Railway from stopping container)
app.get("/health", (req, res) => {
    res.status(200).send("OK");
});

// Get the last command (default: "OFF")
app.get("/command", async (req, res) => {
    try {
        const lastCommand = await Command.findOne() || { command: "OFF" };
        res.json({ command: lastCommand.command });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Update command (only "ON" or "OFF" allowed)
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

// Root Route
app.get("/", (req, res) => {
    res.send("🚀 ESP Backend Server is Running!");
});

// ✅ Start Server (binds to 0.0.0.0 for Railway)
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on port ${PORT}`));