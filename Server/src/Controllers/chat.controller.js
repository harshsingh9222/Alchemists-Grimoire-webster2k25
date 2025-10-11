import OpenAI from "openai";
import { getUserDoseData } from "./dose.Controller.js";
import Chat from "../Models/chatModel.js";
import WellnessScore from "../Models/wellnessScoreModel.js"; // <-- import wellness model

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// 🩺 1️⃣ Fetch recent wellness data
const getUserWellnessData = async (userId) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14); // last 14 days

    const scores = await WellnessScore.find({
      userId,
      date: { $gte: startDate },
    })
      .sort({ date: -1 })
      .lean();

    if (!scores.length) {
      return {
        message: "No recent wellness data found for this user.",
        recent: [],
        trend: { trend: 0, improvement: "stable" },
      };
    }

    const recent = scores.slice(0, 7).map((s) => ({
      date: s.date.toISOString().split("T")[0],
      overallScore: s.overallScore,
      adherenceRate: s.adherenceRate,
      mood: s.metrics?.mood,
      sleep: s.metrics?.sleep,
      energy: s.metrics?.energy,
      focus: s.metrics?.focus,
      vitality: s.metrics?.vitality,
      balance: s.metrics?.balance,
      factors: s.factors,
      notes: s.notes,
    }));

    // Trend analysis using static method
    const trend = await WellnessScore.getWellnessTrend(userId, 7);

    console.log("Trend and the recent data->",trend,recent);
    return { recent, trend };
  } catch (error) {
    console.error("Error fetching wellness data:", error);
    return { message: "Error retrieving wellness data" };
  }
};


export const sendChatMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { message, chatId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // --- Fetch both datasets ---
    const [doses, wellness] = await Promise.all([
      getUserDoseData(userId),
      getUserWellnessData(userId),
    ]);

    // --- Construct prompt ---
    const prompt = `
You are a friendly and knowledgeable AI health assistant.
Use only the following data to give meaningful, safe, and concise answers.

🩹 USER MEDICATION DATA:
${JSON.stringify(doses, null, 2)}

💮 USER WELLNESS DATA:
${JSON.stringify(wellness, null, 2)}

USER’S QUESTION:
"${message}"

TASK:
1. Base your reply only on these data.
2. If wellness data shows trends (improving/declining), reference them meaningfully.
3. If adherence is low or missed doses exist, give a gentle reminder.
4. Keep tone empathetic and supportive, not clinical.
`;

    // --- Call OpenAI ---
    const primaryModel = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
    const fallbackModel = process.env.OPENAI_CHAT_MODEL_FALLBACK || "gpt-4o-mini-translate";
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: primaryModel,
        messages: [{ role: "user", content: prompt }],
      });
    } catch (err) {
      // Handle rate limit: try fallback model once
      const status = err?.status || err?.response?.status;
      if (status === 429) {
        const retryAfter = err?.headers?.get?.("retry-after") || err?.headers?.get?.("retry-after-ms");
        console.warn(`OpenAI rate limited on ${primaryModel}. Retrying with fallback ${fallbackModel}. Retry-After:`, retryAfter);
        try {
          completion = await openai.chat.completions.create({
            model: fallbackModel,
            messages: [{ role: "user", content: prompt }],
          });
        } catch (fallbackErr) {
          console.error("OpenAI fallback model also failed:", fallbackErr?.message || fallbackErr);
          const humanMsg = retryAfter
            ? `AI is busy. Please retry after ${retryAfter} seconds.`
            : "AI is busy right now. Please try again in a bit.";
          return res.status(429).json({ error: humanMsg });
        }
      } else {
        throw err;
      }
    }

    const reply =
      completion.choices?.[0]?.message?.content ||
      "I'm here to help you with your health updates.";

    // --- Save to chat history ---
    let chat;

    if (chatId) {
      chat = await Chat.findById(chatId);
      if (!chat) return res.status(404).json({ error: "Chat not found" });
    } else {
      // 🆕 Create a new chat with auto-generated title
      const title = message.length > 30 ? message.slice(0, 30) + "..." : message;

      chat = new Chat({
        userId,
        title: title || "New Chat",
        messages: [],
      });
    }

    // --- Append messages ---
    chat.messages.push({ sender: "user", text: message });
    chat.messages.push({ sender: "bot", text: reply });

    await chat.save();

    res.json({
      reply,
      chatId: chat._id,
      title: chat.title,
    });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Failed to process chat message." });
  }
};



// 🕒 3️⃣ Fetch chat history
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const chatId = req.params.id;
    const chat = await Chat.findOne({ _id: chatId, userId });
    res.json(chat?.messages || []);
  } catch (err) {
    console.error("Fetch history error:", err);
    res.status(500).json({ error: "Failed to fetch chat history." });
  }
};


// 📚 4️⃣ Get all chats
export const getAllChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.find({ userId })
      .sort({ updatedAt: -1 })
      .select("_id createdAt updatedAt messages");

    const summaries = chats.map((chat) => ({
      _id: chat._id,
      title: chat.messages[0]?.text?.slice(0, 40) || "Untitled Chat",
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }));

    res.json(summaries);
  } catch (err) {
    console.error("Get all chats error:", err);
    res.status(500).json({ error: "Failed to fetch chat list." });
  }
};


// 🧹 5️⃣ Clear all chats
export const clearAllChats = async (req, res) => {
  try {
    const userId = req.user._id;
    await Chat.deleteMany({ userId });
    res.json({ message: "All chats cleared successfully." });
  } catch (err) {
    console.error("Clear all error:", err);
    res.status(500).json({ error: "Failed to clear chats." });
  }
};


// 🗑️ 6️⃣ Delete a single chat
export const deleteChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    await Chat.deleteOne({ _id: id, userId });
    res.json({ message: "Chat deleted successfully." });
  } catch (err) {
    console.error("Delete chat error:", err);
    res.status(500).json({ error: "Failed to delete chat." });
  }
};
