import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req: any, res: any) {
  // CORS Headers for safety
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const mimeTypeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: "Extract the details from this business card. Return a JSON object with: name, jobTitle, company, phone, email, website, address. If any field is not found or unclear, leave it as an empty string." },
        { inlineData: { data: base64Data, mimeType } }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            jobTitle: { type: Type.STRING },
            company: { type: Type.STRING },
            phone: { type: Type.STRING },
            email: { type: Type.STRING },
            website: { type: Type.STRING },
            address: { type: Type.STRING },
          },
          required: ["name", "jobTitle", "company", "phone", "email", "website", "address"]
        }
      }
    });

    if (response.text) {
      res.status(200).json({ data: JSON.parse(response.text) });
    } else {
      throw new Error("Empty response from AI");
    }
  } catch (error: any) {
    console.error("Extraction error:", error);
    res.status(500).json({ error: error.message || "Failed to extract card details" });
  }
}
