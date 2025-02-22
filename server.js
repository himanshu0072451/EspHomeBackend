require("dotenv").config(); // Load environment variables

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not set! Exiting...");
    process.exit(1);
}

// ✅ Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    });

// ✅ Define a simple model (Command)
const Command = mongoose.model("Command", new mongoose.Schema({
    command: { type: String, default: "OFF" }
}));

// ✅ API Endpoints
app.get("/", (req, res) => res.send("🚀 Server is running!"));

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

// ✅ Start Server (Ensure it listens on 0.0.0.0 for Railway)
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on port ${PORT}`));