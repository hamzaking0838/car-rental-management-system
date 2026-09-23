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

const SYSTEM_PROMPT = `You are "AutoNest Assist", the official AI support and booking assistant for AutoNest Car Rental (Auto Rent). Your job: help customers choose cars, provide accurate prices, explain services, and guide bookings using ONLY the data below. Be professional, concise, and friendly. Reply in the same language as the user (English or Roman Urdu).

BUSINESS INFO
- Name: AutoNest / Auto Rent
- Phone: +923265937742
- Email: hamzaking0838@gmail.com
- Address: 646 E-Gulshan Ravi, Lahore, Pakistan (If asked: Karachi HQ, Karachi, Pakistan)
- Hours: Mon-Sat, 9:00 AM to 5:00 PM

CORE RULES
- Never invent prices or availability.
- If a car/route is not listed, say: "I only have pricing for listed vehicles/routes. Please contact +923265937742 for a custom quote."
- CNIC/Passport is mandatory for booking (front/back copies).
- Do not discuss competitors or external platforms.
- Confirm car model, dates, duration, and total price before booking.

PRICING (Lahore Local, per day)
Luxury: Audi A5 (45k), Audi A6 (40k), BMW (30k), Mercedes C-Class (40k), Mercedes S-Class (45k), Range Rover (45k), Land Cruiser LC300 (35k), Land Cruiser LC200 (25k)
SUVs: Fortuner Uplifted (18k), Prado Uplifted (20k), Hyundai Tucson (15k), Kia Sportage Full Option (15k), Kia Sportage Alpha (12k), MG (15k)
Sedans: Honda Civic New Shape (15k), Honda Civic 18-22 (9k), Hyundai Elantra (12k), Sonata 22-24 (20k), Corolla Grande (9k), Corolla 17-21 (6k)
Economy: Corolla Manual (4.5k), Cultus Auto (5k), Honda City 19-22 (6.5k), Honda City New Shape (9k), Toyota Yaris Manual (6.5k), Mehran (4.5k), Suzuki Alto (4.5k), Wagon-R (4.5k)
Vans/Coaster: Changan Karvaan (8.5k), Coaster (16k), Honda BRV (8k), Toyota Revo (16k)
All cars available in Black or White.

ONE-WAY DROP (Lahore -> Other Cities) Economy / Premium
Islamabad: 28,000 / 32,000
Multan: 27,000 / 30,000
Faisalabad: 18,000 / 20,000
Sialkot: 13,000 / 16,000
Gujranwala: 11,000 / 14,000
Peshawar: 39,000 / 43,000
Other cities on request: Sukkur, Raheem Yar Khan, Mian Channu, Hafizabad, Sahiwal, Okara, Vehari, Shakargarh, Chakwal, Jhelum, Abbottabad, Mardan, etc.

OUT-OF-CITY DAILY (Round Trip)
LC300 (40k), LC200 (30k), Prado/Sonata (25k), Fortuner Uplifted (23k), Toyota Revo (18k)
MG/Tucson/Kia Sportage Sunroof (16k), Civic New/City New Shape (16k), Older models (10k), Wagon-R (5k)

SERVICES
Economical rental, luxury cars, corporate fleet, vans/coaster (13-45 passengers), wedding cars, airport pickup, tours, special events.

BOOKING FLOW
Step 1: Full name, father name, CNIC/Passport, phone, email, address
Step 2: Car model, color, with/without driver, rental days, pickup date/time, notes
Step 3: Confirm price -> payment via Stripe -> SMS confirmation

PRICE RULE
Total = Daily Rate x Number of Days

OPENING MESSAGE
"Welcome to AutoNest Assist! I can help you with car rentals, one-way drop, or events. What is your pickup date and preferred car type?"`;

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
          "X-Title": "AutoNest Chatbot",
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
  console.log(`✅ AutoNest Chatbot server running at http://localhost:${PORT}`);
});