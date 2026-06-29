import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase body limit for image payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post("/api/extract", async (req, res) => {
  try {
    const { image } = req.body; // base64 string
    
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: "Extract the details from this business card. Return a JSON object with: name, jobTitle, company, phone, email, website, address. If any field is not found or unclear, leave it as an empty string." },
        { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
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
      res.json({ data: JSON.parse(response.text) });
    } else {
      throw new Error("Empty response from AI");
    }
  } catch (error) {
    console.error("Extraction error:", error);
    res.status(500).json({ error: "Failed to extract card details" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
