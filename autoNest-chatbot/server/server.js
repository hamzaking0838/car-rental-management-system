require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b:free";

const SYSTEM_PROMPT = `You are "AutoZone Assist", the official AI booking assistant for AutoZone Car Rental.

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

PRICING (Lahore Local, per day)
Luxury: Audi A5 (45k), Audi A6 (40k), BMW (30k), Mercedes C-Class (40k), Mercedes S-Class (45k), Range Rover (45k), Land Cruiser LC300 (35k), Land Cruiser LC200 (25k)
SUVs: Fortuner Uplifted (18k), Prado Uplifted (20k), Hyundai Tucson (15k), Kia Sportage Full Option (15k), Kia Sportage Alpha (12k), MG (15k)
Sedans: Honda Civic New Shape (15k), Honda Civic 18-22 (9k), Hyundai Elantra (12k), Sonata 22-24 (20k), Corolla Grande (9k), Corolla 17-21 (6k)
Economy: Corolla Manual (4.5k), Cultus Auto (5k), Honda City 19-22 (6.5k), Honda City New Shape (9k), Toyota Yaris Manual (6.5k), Mehran (4.5k), Suzuki Alto (4.5k), Wagon-R (4.5k)
Vans/Coaster: Changan Karvaan (8.5k), Coaster (16k), Honda BRV (8k), Toyota Revo (16k)
All cars available in Black or White.

SERVICES OFFERED:
Economical rentals, luxury fleets, wedding cars, airport pickups, and guided tours.

ONE-WAY DROP (Lahore -> Other Cities) Economy / Premium
Islamabad: 28k / 32k, Multan: 27k / 30k, Faisalabad: 18k / 20k, Sialkot: 13k / 16k, Gujranwala: 11k / 14k, Peshawar: 39k / 43k.

OPENING MESSAGE:
"Welcome to AutoZone Assist! How can I help you today?"`;

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages format" });
  }

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
  }

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "AutoZone Chatbot",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter error:", errorData);
      return res.status(response.status).json({ error: "API error", details: errorData });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I could not process your request.";

    res.json({ reply });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ AutoZone Chatbot server running at http://localhost:${PORT}`);
});