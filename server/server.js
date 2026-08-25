// patched copy: apply modifications here
try {
  require("dotenv").config();
} catch (e) {
  
}
const express = require("express");
const cors = require("cors");
const path = require("path");

// Import individual route modules
const bookingRoutes = require("./routes/bookingRoutes");
const contactRoutes = require("./routes/contactRoutes");
const priceRoutes = require("./routes/priceRoutes");
const carRoutes = require("./routes/carRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

// ===== Chatbot dependencies and helpers =====
const fs = require('fs');
const db = require('./config/db'); // Import DB to sync chatbot with real-time inventory

// Load OpenRouter credentials from the chatbot's .env file if available. This
// function is called before processing chat requests so that API keys can be
// stored in one place (./autozone-chatbot/.env) instead of duplicating them.
function loadChatbotEnv() {
  const chatbotEnvPath = path.join(__dirname, '../autoNest-chatbot/.env');
  try {
    if (fs.existsSync(chatbotEnvPath)) {
      require('dotenv').config({ path: chatbotEnvPath });
    }
  } catch (err) {
    console.warn('[Chatbot] Unable to load chatbot .env file:', err);
  }
}

// System prompt replicated from autozone-chatbot/server/server.js. This
// instructs the AI on how to respond based on business rules and pricing.
const CHATBOT_SYSTEM_PROMPT = `You are "AutoZone Assist", the official AI booking assistant for AutoZone Car Rental.

CRITICAL INSTRUCTIONS FOR ALL RESPONSES:
1. EXTREME BREVITY: Keep answers incredibly short, simple, and direct. Use only 1 or 2 short sentences.
2. NO HALLUCINATION: NEVER invent or add details that are not in the LIVE DATABASE INVENTORY below. If a user asks for "car details", ONLY provide the price, seats, and AC status.
3. NO TABLES/LISTS: NEVER output Markdown tables or long bulleted lists. Reply with plain conversational text.
4. DO NOT MENTION: Do not talk about Engine size, Exterior/Interior specs, Included Benefits, or Insurance unless explicitly mentioned in the database below.

COMMUNICATION STYLE:
- Be polite and match the user's language (English or Roman Urdu).
- Only provide the exact information requested. Do not volunteer extra steps unless asked.

BUSINESS INFORMATION:
- Name: AutoZone / Auto Rent
- Phone: +923265937742
- Email: hamzaking0838@gmail.com
- Address: 646 E-Gulshan Ravi, Lahore, Pakistan

RULES:
- If a requested car or route is not listed, say: "Please contact +923265937742 for this information."
- CNIC/Passport is mandatory for booking.

SERVICES OFFERED:
Economical rentals, luxury fleets, wedding cars, airport pickups, and guided tours.

ONE-WAY DROP (Lahore -> Other Cities) Economy / Premium
Islamabad: 28k / 32k, Multan: 27k / 30k, Faisalabad: 18k / 20k, Sialkot: 13k / 16k, Gujranwala: 11k / 14k, Peshawar: 39k / 43k.

OPENING MESSAGE:
"Welcome to AutoZone Assist! How can I help you today?"`;

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const staticDir = path.join(__dirname, "..");
app.use(express.static(staticDir));

// Mount API routes
app.use("/api", bookingRoutes);
app.use("/api", contactRoutes);
app.use("/api", priceRoutes);
app.use("/api", carRoutes);
// Payment routes (Stripe integration)
app.use("/api", paymentRoutes);

// Admin routes
app.use("/api/admin", adminRoutes);

// User authentication routes
app.use("/api/user", userRoutes);

// Settings routes
app.use("/api", settingsRoutes);

// ===== Chatbot route =====
// Handles POST requests from the front-end widget. It loads environment
// variables for OpenRouter if necessary and forwards the conversation
// history to OpenRouter's API. Any errors will return a JSON error
// response instead of crashing the server.
app.post("/api/chat", async (req, res) => {
  loadChatbotEnv();
  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages format" });
  }
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b:free";
  if (!apiKey) {
    return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
  }
  try {
    // Fetch ALL cars with their REAL-TIME booking status from the database
    const getCarsWithStatus = () => new Promise(resolve => {
      if (!db || !db.query) return resolve([]);
      const sql = `
        SELECT c.id, c.name, c.brand, c.model_year, c.price_per_day, c.seats, c.ac, c.transmission,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM booking b 
              WHERE b.car_id = c.id 
                AND b.status IN ('Pending', 'Confirmed')
                AND b.pickup_date <= CURRENT_DATE()
                AND DATE_ADD(b.pickup_date, INTERVAL b.duration_days DAY) > CURRENT_DATE()
            ) THEN 'BOOKED'
            ELSE 'AVAILABLE'
          END AS availability_status
        FROM cars c
        ORDER BY c.name ASC
      `;
      db.query(sql, (err, rows) => {
        if (err) resolve([]);
        else resolve(rows);
      });
    });
    
    const getSiteSettings = () => new Promise(resolve => {
      const sql = "SELECT setting_value FROM site_settings WHERE setting_key = 'chatbot_system_prompt'";
      db.query(sql, (err, rows) => {
        if (err || !rows || rows.length === 0 || !rows[0].setting_value) resolve(CHATBOT_SYSTEM_PROMPT);
        else resolve(rows[0].setting_value);
      });
    });

    const cars = await getCarsWithStatus();
    const systemPromptText = await getSiteSettings();

    let liveInventoryText = cars.length > 0
      ? cars.map(c =>
          `- ${c.name} (${c.brand || 'Auto'}, ${c.model_year || 'N/A'}): ${c.price_per_day} PKR/day | Status TODAY: ${c.availability_status} | Seats: ${c.seats || '4'}, AC: ${c.ac || 'Yes'}, Trans: ${c.transmission || 'Auto'}`
        ).join("\n")
      : "Contact +923265937742 for availability.";

    const dynamicSystemPrompt = `${systemPromptText}\n\n[LIVE DATABASE - ALL CARS WITH TODAY'S STATUS]\nIMPORTANT: The 'Status TODAY' field is 100% accurate from the booking database. If a car shows BOOKED, always say it is NOT available today.\n${liveInventoryText}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AutoZone Chatbot",
      },
      body: JSON.stringify({
        model: model,
        messages: [ { role: "system", content: dynamicSystemPrompt }, ...messages ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });
    if (!response.ok) {
      let errorData = null;
      try { errorData = await response.json(); } catch (err) {}
      console.error("[Chatbot] API error:", errorData || response.statusText);
      return res.status(response.status).json({ error: "API error", details: errorData || {} });
    }
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I could not process your request.";
    return res.json({ reply });
  } catch (err) {
    console.error("[Chatbot] Internal error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Simple health check
app.get("/", (req, res) => {
  res.send("Backend working");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});