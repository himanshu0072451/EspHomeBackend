require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ✅ MongoDB Connection (Optional)
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err)); 

// ✅ Schema for Storing Last Command
const commandSchema = new mongoose.Schema({
    command: { type: String, required: true, default: "OFF" }
});
const Command = mongoose.model("Command", commandSchema);

// ✅ API for ESP8266 to Fetch Command
app.get("/command", async (req, res) => {
    const lastCommand = await Command.findOne() || { command: "OFF" };
    res.json({ command: lastCommand.command });
});

// ✅ API to Send Command from Frontend
app.post("/command", async (req, res) => {
    const { command } = req.body;
    
    if (command !== "ON" && command !== "OFF") {
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