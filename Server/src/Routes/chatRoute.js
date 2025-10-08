import express from "express";
import OpenAI from "openai";
import { getUserDoseData } from "../Controllers/dose.Controller.js";
import { verifyJWT } from "../Middlewares/auth.middleware.js";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /chat
router.post("/", verifyJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    const { message } = req.body;
    if (!message || !userId) {
      return res.status(400).json({ error: "Message and userId required" });
    }
    console.log("Chat message received:",userId );
    
    // Fetch user data from DB
    const doses = await getUserDoseData(userId);

    const prompt = `
      You are a friendly AI health assistant.
      Here is the user's medication data: ${JSON.stringify(doses, null, 2)}.
      User's question: "${message}".
      Reply clearly using only the provided data.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    console.log("OpenAI response:", completion.choices[0].message.content);
    

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chatbot error" });
  }
});

export default router;
