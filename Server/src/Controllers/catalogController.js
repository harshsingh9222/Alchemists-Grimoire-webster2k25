import { medicineCatalog } from "../DB/catalogData.js";
import OpenAI from "openai"; // optional if you want smarter matching

// If you are using OpenAI, set your API key in .env
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const getCatalogByCharacter = (req, res) => {
  try {
    const characterKey = req.user.character?.toLowerCase();

    if (!characterKey || !medicineCatalog[characterKey]) {
      return res.status(404).json({ 
        success: false, 
        message: `No catalog found for character` 
      });
    }

    return res.status(200).json({
      success: true,
      character: characterKey,
      data: medicineCatalog[characterKey],
    });
  } catch (err) {
    console.error("Error fetching catalog:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * 🤖 AI Suggestion:
 * Uses user's prompt (feeling) to suggest a medicine
 * Example: "I have headache and tiredness"
 */

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const suggestMedicineAI = async (req, res) => {
  try {
    const characterKey = req.user.character?.toLowerCase();
    const { feeling } = req.body;
    // console.log("Feeling input:", feeling);

    if (!characterKey || !medicineCatalog[characterKey]) {
      return res.status(404).json({
        success: false,
        message: "Character catalog not found.",
      });
    }

    if (!feeling || feeling.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Feeling input is required.",
      });
    }

    const catalog = medicineCatalog[characterKey];

    // 🧠 AI Prompt
    const prompt = `
You are an AI assistant for recommending medicines.

Here is the medicine catalog for the character "${characterKey}":
${JSON.stringify(catalog, null, 2)}

The user says: "${feeling}"

TASK:
1. Pick the most appropriate medicine from the above catalog for the given feeling.
2. If multiple match, pick the one most helpful for energy, focus, or comfort.
3. Return the result ONLY in JSON format like this:
{
  "medicineName": "string",
  "dosage": "string",
  "frequency": "string",
  "description": "string",
  "defaultTime": "string",
  "reason": "short explanation why this medicine fits"
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    let suggestion;
    try {
      suggestion = JSON.parse(completion.choices[0].message.content);
    } catch (err) {
      console.error("Failed to parse AI response:", err);
      suggestion = {
        medicineName: null,
        dosage: null,
        frequency: null,
        description: null,
        defaultTime: null,
        reason: "AI could not generate a proper suggestion.",
      };
    }

    return res.status(200).json({
      success: true,
      character: characterKey,
      suggestion,
    });
  } catch (err) {
    console.error("AI Suggestion Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to suggest medicine",
    });
  }
};

