require("dotenv").config(); // Only needed for local development

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not set! Exiting...");
    process.exit(1); // Stop the server if MongoDB URI is missing
}

// ✅ MongoDB Connection
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// ✅ API for ESP8266
app.get("/command", async (req, res) => {
    const lastCommand = await Command.findOne() || { command: "OFF" };
    res.json({ command: lastCommand.command });
});

app.post("/command", async (req, res) => {
    const { command } = req.body;
    if (!["ON", "OFF"].includes(command)) {
        return res.status(400).json({ error: "Invalid command" });
    }
    await Command.findOneAndUpdate({}, { command }, { upsert: true });
    console.log(`📤 New Command: ${command}`);
    res.json({ success: true, command });
});

// ✅ Root Route
app.get("/", (req, res) => {
    res.send("🚀 ESP Backend Server is Running!");
});

// ✅ Start Server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));