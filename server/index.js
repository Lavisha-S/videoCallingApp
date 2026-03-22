require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const twilio = require("twilio");

const app = express();

/* =========================
   🔒 MIDDLEWARE
========================= */
app.use(cors({ origin: "http://localhost:3000", methods: ["GET", "POST"] }));
app.use(express.json());

// Rate limiting to prevent abuse
app.use("/generate-token", rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: "Too many requests, try again later"
}));

/* =========================
   ✅ HEALTH CHECK
========================= */
app.get("/", (req, res) => res.send("✅ Backend running"));

/* =========================
   🎯 TOKEN GENERATION
========================= */
app.post("/generate-token", (req, res) => {
  try {
    let { identity, roomName } = req.body;

    // Validate roomName
    if (!roomName || typeof roomName !== "string") {
      return res.status(400).json({ error: "Valid roomName required" });
    }
    roomName = roomName.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    if (roomName.length < 3) return res.status(400).json({ error: "Room name must be ≥ 3 chars" });

    // Validate identity
    if (!identity || typeof identity !== "string") {
      return res.status(400).json({ error: "Username required" });
    }
    identity = identity.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    if (identity.length < 2) return res.status(400).json({ error: "Username must be ≥ 2 chars" });

    // Env check
    const { TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY || !TWILIO_API_SECRET) {
      return res.status(500).json({ error: "Server misconfigured" });
    }

    // Generate token
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;
    const token = new AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET, {
      identity, ttl: 3600
    });
    token.addGrant(new VideoGrant({ room: roomName }));

    return res.json({ token: token.toJwt(), identity });

  } catch (err) {
    console.error("❌ Token generation error:", err);
    return res.status(500).json({ error: "Token generation failed" });
  }
});

/* =========================
   🚀 START SERVER
========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));